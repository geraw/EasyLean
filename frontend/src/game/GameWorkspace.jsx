import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import axios from 'axios';
import { defineBlocks } from '../blocks/logic';
import { defineGameBlocks } from '../blocks/gameBlocks';
import { formatProofGoal } from './formatProofGoal';
import { findIncompleteMove, generateGameLeanSource, getLastProofBlockId } from './gameLeanCode';
import { findLeanProblem, GENERIC_PROBLEM, INCOMPLETE_MOVE } from './leanErrors';
import { goalLabel, openGoals } from './proofState';
import { isolateFormulas } from './bidi';
import { BACKEND_URL } from '../backendUrl';

// Same compatibility patch as the sandbox workspace (safe to re-apply).
Blockly.Workspace.prototype.getAllVariables = function () {
    return this.getVariableMap().getAllVariables();
};

defineBlocks();
defineGameBlocks();

// Very small markdown-ish renderer: blank-line-separated paragraphs,
// "# " headings, `code` spans and *emphasis*.
const renderInline = (text, keyPrefix) => {
    return text.split('`').map((chunk, i) => {
        if (i % 2 === 1) {
            return (
                <code key={`${keyPrefix}-c${i}`} style={{ background: '#e8e8e8', padding: '1px 5px', borderRadius: 3, direction: 'ltr', display: 'inline-block', fontSize: '0.95em' }}>
                    {chunk}
                </code>
            );
        }
        return isolateFormulas(chunk).split(/\*(.+?)\*/g).map((seg, j) =>
            j % 2 === 1
                ? <em key={`${keyPrefix}-i${i}-${j}`}>{seg}</em>
                : <React.Fragment key={`${keyPrefix}-t${i}-${j}`}>{seg}</React.Fragment>
        );
    });
};

const renderMarkdownLite = (text) => {
    return text.trim().split(/\n\s*\n/).map((block, idx) => {
        const trimmed = block.trim();
        if (trimmed.startsWith('# ')) {
            return <h3 key={idx} style={{ margin: '0 0 8px 0' }}>{renderInline(trimmed.slice(2), `h${idx}`)}</h3>;
        }
        return <p key={idx} style={{ margin: '0 0 10px 0', lineHeight: 1.6 }}>{renderInline(trimmed, `p${idx}`)}</p>;
    });
};

const GameWorkspace = ({
    levels,
    worldName,
    preamble = '',
    toolboxLabel = 'טקטיקות',
    newTacticsLabel = 'טקטיקה חדשה',
    hideCompilerDetails = false,
    proofStateEndpoint = null,
    // After the last level, offers moving on to the next unit (e.g. "ליחידה 1").
    nextWorldLabel = null,
    onNextWorld = null,
}) => {
    const [levelIdx, setLevelIdx] = useState(0);
    const [workspace, setWorkspace] = useState(null);
    const [workspaceRevision, setWorkspaceRevision] = useState(0);
    const [output, setOutput] = useState('');
    const [status, setStatus] = useState('idle'); // idle, running, success, error
    const [hintsShown, setHintsShown] = useState(0);
    const [proofStates, setProofStates] = useState({ before: null, after: null });
    const [proofView, setProofView] = useState('before');
    const proofStateRequestRef = useRef(0);
    const [evaluatedBlockId, setEvaluatedBlockId] = useState(null);
    const evaluatedBlockIdRef = useRef(null);
    const errorBlockRef = useRef(null);

    const clearBlockError = useCallback(() => {
        if (errorBlockRef.current) {
            const { block, colour } = errorBlockRef.current;
            if (!block.isDisposed()) {
                block.setColour(colour);
                block.setWarningText(null);
            }
            errorBlockRef.current = null;
        }
    }, []);

    // Colours the block red and attaches the explanation as a warning icon,
    // which opens a bubble with the text when clicked. A gentle mark (a field
    // still to fill in, not a mistake) keeps the block's colour.
    const markBlockError = useCallback((targetWorkspace, blockId, message, { gentle = false } = {}) => {
        const block = blockId && targetWorkspace.getBlockById(blockId);
        if (errorBlockRef.current?.block === block && errorBlockRef.current.gentle === gentle) {
            block.setWarningText(message);
            return;
        }
        clearBlockError();
        if (!block) return;
        errorBlockRef.current = { block, colour: block.getColour(), gentle };
        if (!gentle) block.setColour('#d93025');
        block.setWarningText(message);
    }, [clearBlockError]);
    const workspaceListenerRef = useRef(null);
    const loadingWorkspaceRef = useRef(false);

    const handleWorkspaceInject = useCallback((ws) => {
        const listener = (event) => {
            if (loadingWorkspaceRef.current) return;
            if (event.type === 'selected') {
                // While a field is being edited Blockly deselects its block;
                // that block is still the one being worked on, so evaluate it.
                const focusedNode = Blockly.getFocusManager().getFocusedNode();
                const editedBlockId = focusedNode instanceof Blockly.Field ? focusedNode.getSourceBlock()?.id : null;
                const nextEvaluatedBlockId = event.newElementId || editedBlockId;
                if (nextEvaluatedBlockId) {
                    evaluatedBlockIdRef.current = nextEvaluatedBlockId;
                    setEvaluatedBlockId(nextEvaluatedBlockId);
                }
                setWorkspaceRevision((revision) => revision + 1);
                return;
            }
            if (event.isUiEvent) {
                return;
            }
            if (event.type === 'delete' && event.ids?.includes(evaluatedBlockIdRef.current)) {
                evaluatedBlockIdRef.current = null;
                setEvaluatedBlockId(null);
            }
            if (['create', 'delete', 'change', 'move'].includes(event.type)) {
                clearBlockError();
                setWorkspaceRevision((revision) => revision + 1);
            }
        };
        ws.addChangeListener(listener);
        workspaceListenerRef.current = { workspace: ws, listener };
        // Lets the end-to-end tests (e2e/) build proofs without fragile mouse drags.
        if (import.meta.env.DEV) window.__easyleanWorkspace = ws;
        setWorkspace(ws);
    }, [clearBlockError]);

    const handleWorkspaceDispose = useCallback((ws) => {
        if (workspaceListenerRef.current?.workspace === ws) {
            ws.removeChangeListener(workspaceListenerRef.current.listener);
            workspaceListenerRef.current = null;
        }
    }, []);

    const level = levels[levelIdx];

    const toolboxConfiguration = useMemo(() => {
        const blocks = level.toolboxBlocks || [...new Set(levels.slice(0, levelIdx + 1).flatMap(l => l.newTacticsBlocks))];
        return {
            kind: 'categoryToolbox',
            contents: [
                {
                    kind: 'category',
                    name: toolboxLabel,
                    colour: '#5C81A6',
                    contents: blocks.map(type => ({ kind: 'block', type })),
                },
            ],
        };
    }, [levelIdx, levels, toolboxLabel]);

    // (Re)load the level's starting XML whenever the level changes.
    useEffect(() => {
        if (!workspace) return;
        loadingWorkspaceRef.current = true;
        workspace.clear();
        try {
            const dom = Blockly.utils.xml.textToDom(level.startXml);
            Blockly.Xml.domToWorkspace(dom, workspace);
        } catch (e) {
            console.error('Error loading level XML', e);
        }
        setStatus('idle');
        setOutput('');
        setHintsShown(0);
        setProofStates({ before: null, after: null });
        setProofView('before');
        evaluatedBlockIdRef.current = null;
        setEvaluatedBlockId(null);
        clearBlockError();
        loadingWorkspaceRef.current = false;
    }, [workspace, levelIdx, clearBlockError]);

    const generateLeanSource = (untilBlockId = null, includeUntilBlock = false) =>
        generateGameLeanSource(workspace, level, preamble, { includeFallback: false, untilBlockId, includeUntilBlock });

    // Where a failed check went wrong: the block whose code Lean complained
    // about (falling back to the evaluated or last move) and an explanation.
    const locateProblem = (output, source, options) => {
        const problem = findLeanProblem(output, options);
        return {
            blockId: (problem && ((problem.unsolved && source.partLastBlockIds.get(problem.line)) || source.lineBlockIds.get(problem.line)))
                || evaluatedBlockId || getLastProofBlockId(workspace),
            message: problem?.message || GENERIC_PROBLEM,
        };
    };

    // Our own marker for the evaluated block, since Blockly's selection outline
    // comes and goes with focus. Re-applied on every change in case the block's
    // SVG was rebuilt (e.g. deleted and restored by undo).
    useEffect(() => {
        const root = evaluatedBlockId && workspace?.getBlockById(evaluatedBlockId)?.getSvgRoot();
        if (!root) return undefined;
        Blockly.utils.dom.addClass(root, 'easyleanEvaluated');
        return () => Blockly.utils.dom.removeClass(root, 'easyleanEvaluated');
    }, [workspace, evaluatedBlockId, workspaceRevision]);

    useEffect(() => {
        if (!proofStateEndpoint || !workspace) return undefined;

        const requestId = proofStateRequestRef.current + 1;
        proofStateRequestRef.current = requestId;
        const loadingState = { loading: true, goals: [{ assumptions: [], goal: level.proposition }], complete: false };
        setProofStates({ before: loadingState, after: evaluatedBlockId ? loadingState : null });

        const timeout = setTimeout(async () => {
            try {
                // While a move still has a field to fill in, show the state right
                // before it: what there is to choose from.
                const incomplete = findIncompleteMove(workspace);
                const sources = incomplete
                    ? [generateLeanSource(incomplete.id)]
                    : [generateLeanSource(evaluatedBlockId)];
                if (evaluatedBlockId && !incomplete) sources.push(generateLeanSource(evaluatedBlockId, true));
                const responses = [];
                for (const source of sources) {
                    responses.push(await axios.post(proofStateEndpoint, { leanCode: source.code }));
                }
                if (proofStateRequestRef.current === requestId) {
                    // Replace the backend's generic error with an explanation of the problem,
                    // and read the open goals at the point the proof was cut.
                    const states = responses.map(({ data }, index) => {
                        // Not only data.error: the backend misses errors labelled like
                        // `error(lean.unknownIdentifier):`, where Lean goes on with `sorry`.
                        if (data.error || findLeanProblem(data.output || '')) {
                            return { ...data, error: data.error || GENERIC_PROBLEM, problem: locateProblem(data.output, sources[index]) };
                        }
                        const goals = openGoals(data.output || '', sources[index].stateLine);
                        return { goals, complete: goals.length === 0, inPart: sources[index].inPart };
                    });
                    const firstProblem = states.find((state) => state.problem)?.problem;
                    if (firstProblem) {
                        markBlockError(workspace, firstProblem.blockId, firstProblem.message);
                    } else if (incomplete) {
                        markBlockError(workspace, incomplete.id, INCOMPLETE_MOVE, { gentle: true });
                    } else {
                        clearBlockError();
                    }
                    if (incomplete) states[0] = { ...states[0], prompt: INCOMPLETE_MOVE };
                    setProofStates({ before: states[0], after: states[1] || null });
                }
            } catch {
                if (proofStateRequestRef.current === requestId) {
                    markBlockError(workspace, evaluatedBlockId || getLastProofBlockId(workspace), 'לא ניתן לקבל את מצב ההוכחה כרגע.');
                    setProofStates({
                        before: { loading: false, goals: [], complete: false, error: 'לא ניתן לקבל את מצב ההוכחה כרגע.' },
                        after: null,
                    });
                }
            }
        }, 180);

        return () => clearTimeout(timeout);
    }, [workspace, workspaceRevision, levelIdx, proofStateEndpoint, evaluatedBlockId, clearBlockError, markBlockError]);

    const runProof = async () => {
        const incomplete = findIncompleteMove(workspace);
        if (incomplete) {
            markBlockError(workspace, incomplete.id, INCOMPLETE_MOVE, { gentle: true });
            setStatus('error');
            setOutput(INCOMPLETE_MOVE);
            return;
        }
        // A hole rather than `sorry`: Lean only warns about `sorry`, so an empty proof would pass.
        const source = generateLeanSource();
        setStatus('running');
        setOutput('מריץ בדיקה...');
        try {
            const response = await axios.post(`${BACKEND_URL}/verify`, { leanCode: source.code });
            const usesSorry = /declaration uses 'sorry'/.test(response.data.output || '');
            if (response.data.exitCode === 0 && !usesSorry) {
                clearBlockError();
                setStatus('success');
                setOutput(response.data.output || 'הצלחה!');
            } else {
                const problem = locateProblem(response.data.output, source, { includeUnsolvedGoals: true });
                markBlockError(workspace, problem.blockId, problem.message);
                setStatus('error');
                setOutput(hideCompilerDetails ? problem.message : response.data.output);
            }
        } catch (error) {
            markBlockError(workspace, evaluatedBlockId || getLastProofBlockId(workspace), 'לא הצלחנו לבדוק כרגע. נסו שוב בעוד רגע.');
            setStatus('error');
            setOutput(hideCompilerDetails ? 'לא הצלחנו לבדוק כרגע. נסו שוב בעוד רגע.' : 'שגיאה בהתחברות לשרת: ' + error.message);
        }
    };

    const hasNextLevel = levelIdx + 1 < levels.length;
    const canContinue = hasNextLevel || Boolean(nextWorldLabel && onNextWorld);
    const displayedProofState = proofView === 'after'
        ? (proofStates.after || proofStates.before)
        : proofStates.before;
    // What we have and what is left to prove, for one goal. Declarations of
    // the level's vocabulary (P Q : Prop, α : Type, P : α → Prop) are not
    // assumptions, so they are left out; objects of the domain (x : α) stay.
    const isDeclaration = ({ prop }) => /^(Prop|Type|Sort)\b|→ Prop$/.test(prop.trim());
    // Objects of the domain (a : α, where α : Type is declared) are listed by
    // name apart from the assumptions: they are things we have, not claims.
    const renderGoal = ({ assumptions: all, goal }, spacing) => {
        const domains = new Set(all.filter(({ prop }) => /^(Type|Sort)\b/.test(prop.trim())).flatMap(({ name }) => name.split(/\s+/)));
        const isObject = ({ prop }) => domains.has(prop.trim());
        const objects = all.filter(isObject).flatMap(({ name }) => name.split(/\s+/));
        // Sets of objects (A : Set obj), and families of sets, are listed by name too.
        const isSet = ({ prop }) => /^Set\b/.test(prop.trim());
        const sets = all.filter(isSet).flatMap(({ name }) => name.split(/\s+/));
        const assumptions = all.filter((assumption) => !isDeclaration(assumption) && !isObject(assumption) && !isSet(assumption));
        return (
        <>
            <h4 style={{ margin: '0 0 6px 0' }}>מה יש לנו ביד</h4>
            {sets.length > 0 && (
                <div style={{ marginBottom: '6px' }}>
                    קבוצות:{' '}
                    {sets.map((set, index) => (
                        <React.Fragment key={set}>
                            {index > 0 && ', '}
                            <span style={{ direction: 'ltr', unicodeBidi: 'isolate', fontFamily: 'monospace' }}>{set}</span>
                        </React.Fragment>
                    ))}
                </div>
            )}
            {objects.length > 0 && (
                // Each name on its own, so the list reads right to left in the
                // order the objects were introduced.
                <div style={{ marginBottom: '6px' }}>
                    עצמים:{' '}
                    {objects.map((object, index) => (
                        <React.Fragment key={object}>
                            {index > 0 && ', '}
                            <span style={{ direction: 'ltr', unicodeBidi: 'isolate', fontFamily: 'monospace' }}>{object}</span>
                        </React.Fragment>
                    ))}
                </div>
            )}
            {assumptions.map((assumption) => (
                <div key={assumption.name} style={{ marginBottom: '4px', direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>
                    {/* Fully parenthesized, like the goal: (P ∧ ¬P) → ⊥ is not ambiguous. */}
                    {assumption.name} : {formatProofGoal(assumption.prop)}
                </div>
            ))}
            {objects.length === 0 && assumptions.length === 0 && (
                <div style={{ color: '#555', marginBottom: spacing }}>עדיין לא הוספנו הנחות.</div>
            )}
            <h4 style={{ margin: `${spacing} 0 6px 0` }}>מה נשאר להוכיח</h4>
            {formatProofGoal(goal || level.proposition) === '⊥' ? (
                // The contradiction goal is named in Hebrew, so it reads right to left.
                <div style={{ fontWeight: 'bold' }}>סתירה (⊥)</div>
            ) : (
                <div style={{ direction: 'ltr', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {formatProofGoal(goal || level.proposition)}
                </div>
            )}
        </>
        );
    };
    const proofStatePanel = proofStateEndpoint && (
        // Capped so the workspace above it keeps most of the height, even when a
        // rule split the proof into several parts.
        <div role="region" aria-label="מצב ההוכחה" style={{ padding: '12px', background: '#eef4ff', border: '1px solid #b7cbea', borderRadius: '5px', flexShrink: 0, maxHeight: '40%', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>מצב ההוכחה</h3>
                {evaluatedBlockId && (
                    <div
                        role="radiogroup"
                        aria-label="תצוגת מצב ההוכחה"
                        // Keep DOM focus (and with it Blockly's selection) in the workspace:
                        // no mousedown focus, and no <label>, which would focus its radio on click.
                        onMouseDownCapture={(event) => { event.preventDefault(); event.stopPropagation(); }}
                        onPointerDownCapture={(event) => event.stopPropagation()}
                        style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
                    >
                        <span
                            onClick={() => setProofView('before')}
                            style={{ cursor: 'pointer' }}
                        >
                            <input
                                type="radio"
                                name="proof-view"
                                value="before"
                                aria-label="לפני המהלך"
                                checked={proofView === 'before'}
                                onChange={() => setProofView('before')}
                            />
                            {' '}לפני המהלך
                        </span>
                        <span
                            onClick={() => proofStates.after && setProofView('after')}
                            style={{ cursor: 'pointer' }}
                        >
                            <input
                                type="radio"
                                name="proof-view"
                                value="after"
                                aria-label="אחרי המהלך"
                                checked={proofView === 'after'}
                                disabled={!proofStates.after}
                                onChange={() => setProofView('after')}
                            />
                            {' '}אחרי המהלך
                        </span>
                    </div>
                )}
            </div>
            {displayedProofState?.loading && <div style={{ marginBottom: '10px', color: '#555' }}>Lean בודק את המהלך האחרון...</div>}
            {displayedProofState?.prompt && (
                <div role="status" style={{ marginBottom: '10px', padding: '6px 8px', background: '#fff6d6', border: '1px solid #e6c65c', borderRadius: '4px' }}>
                    ✎ {displayedProofState.prompt}
                </div>
            )}
            {displayedProofState?.complete ? (
                // Nothing is left to prove, so there are no assumptions to list either.
                <div style={{ color: '#1e7e34', fontWeight: 'bold' }}>
                    {displayedProofState.inPart ? '✓ החלק הזה של ההוכחה הושלם.' : '✓ ההוכחה הושלמה: הוכחנו את מה שהתבקשנו.'}
                </div>
            ) : displayedProofState?.error ? (
                <div role="alert" style={{ color: '#b3261e', lineHeight: 1.6 }}>
                    ⚠ {displayedProofState.problem?.message || displayedProofState.error}
                </div>
            ) : (displayedProofState?.goals?.length ?? 0) > 1 ? (
                // A rule split the proof: each part, side by side, with its own assumptions and goal.
                <>
                    <div style={{ marginBottom: '8px' }}>ההוכחה מתפצלת, ונשאר להוכיח {displayedProofState.goals.length} חלקים:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {displayedProofState.goals.map((goal, index) => (
                            <div key={index} style={{ flex: '1 1 220px', background: 'white', border: '1px solid #b7cbea', borderRadius: '5px', padding: '8px' }}>
                                <h4 style={{ margin: '0 0 6px 0', color: '#1a4f9c' }}>{goalLabel(goal, index)}</h4>
                                {renderGoal(goal, '4px')}
                            </div>
                        ))}
                    </div>
                </>
            ) : renderGoal(displayedProofState?.goals?.[0] || { assumptions: [], goal: level.proposition }, '10px')}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', padding: '20px', fontFamily: 'sans-serif', direction: 'rtl' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0 }}>{worldName} — שלב {level.levelNumber}/{level.totalLevels}: {level.title}</h1>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    מעבר ישיר לשלב:
                    <select
                        value={levelIdx}
                        onChange={(event) => setLevelIdx(Number(event.target.value))}
                        aria-label="מעבר ישיר לשלב"
                        style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #aaa', background: 'white' }}
                    >
                        {levels.map((availableLevel, index) => (
                            <option key={availableLevel.id} value={index}>
                                {availableLevel.levelNumber}/{availableLevel.totalLevels} — {availableLevel.title}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div style={{ display: 'flex', flexGrow: 1, gap: '20px', minHeight: 0 }}>
                <div style={{ flex: 1, minWidth: '520px', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ flex: 1, minHeight: 0, border: '1px solid #ccc', position: 'relative', overflow: 'visible' }}>
                        <div style={{ flex: 1, position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
                        <BlocklyWorkspace
                            className="width-100"
                            onInject={handleWorkspaceInject}
                            onDispose={handleWorkspaceDispose}
                            toolboxConfiguration={toolboxConfiguration}
                            workspaceConfiguration={{
                                rtl: true,
                                // Toolbox on the left: in RTL the proof hangs from the goal block's
                                // right edge, so the open toolbox no longer covers where moves are dropped.
                                toolboxPosition: 'end',
                                grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
                                // Proofs with several parts (unit 2 on) can be wider than the
                                // workspace; zoom buttons let students fit them in.
                                zoom: { controls: true, wheel: false, startScale: 1, maxScale: 1.5, minScale: 0.5, scaleSpeed: 1.2 },
                            }}
                            initialXml={level.startXml}
                        />
                        </div>
                    </div>
                    {proofStatePanel}
                </div>

                <div style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>

                    <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '5px' }}>
                        {renderMarkdownLite(level.introduction)}
                    </div>

                    <div style={{ padding: '10px', background: '#eef4ff', borderRadius: '5px' }}>
                        <h4 style={{ margin: '0 0 6px 0' }}>עצמים</h4>
                        {level.objects.map(o => (
                            <div key={o.name} style={{ direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>{o.name}</div>
                        ))}
                        <h4 style={{ margin: '10px 0 6px 0' }}>הנחות</h4>
                        {level.assumptions.map(a => (
                            <div key={a.name} style={{ direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>{a.name} : {a.prop}</div>
                        ))}
                        <h4 style={{ margin: '10px 0 6px 0' }}>מטרה</h4>
                        <div style={{ direction: 'ltr', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{level.goalLabel}</div>
                    </div>

                    {(level.newTacticsInfo?.length > 0 || level.newDefinitions?.length > 0) && (
                        <div style={{ padding: '10px', background: '#fff8e1', borderRadius: '5px' }}>
                            {level.newTacticsInfo?.map(t => (
                                <div key={t.name} style={{ marginBottom: '6px' }}>
                                    <strong>{newTacticsLabel}: {t.name}</strong>
                                    <div style={{ fontSize: '0.9em' }}>{isolateFormulas(t.doc)}</div>
                                </div>
                            ))}
                            {level.newDefinitions?.map(d => (
                                <div key={d.symbol} style={{ marginBottom: '6px' }}>
                                    <strong>הגדרה חדשה: {d.symbol}</strong>
                                    <div style={{ fontSize: '0.9em' }}>{isolateFormulas(d.doc)}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ padding: '10px', background: '#f0e6ff', borderRadius: '5px' }}>
                        {hintsShown > 0 && level.hints.slice(0, hintsShown).map((h, i) => (
                            <p key={i} style={{ margin: '0 0 6px 0' }}>💡 {isolateFormulas(h)}</p>
                        ))}
                        {hintsShown < level.hints.length && (
                            <button onClick={() => setHintsShown(h => h + 1)} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #999', cursor: 'pointer', background: 'white' }}>
                                הצג רמז
                            </button>
                        )}
                    </div>

                    <button
                        onClick={runProof}
                        style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    >
                        בדוק הוכחה
                    </button>

                    {/* Lean's raw output reads left to right; the explanations shown instead of it are Hebrew. */}
                    <div style={{ padding: '10px', background: '#333', color: 'white', borderRadius: '5px', overflow: 'auto', textAlign: hideCompilerDetails ? 'right' : 'left', direction: hideCompilerDetails ? 'rtl' : 'ltr', maxHeight: '150px' }}>
                        <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: hideCompilerDetails ? 'inherit' : undefined }}>{output}</pre>
                    </div>

                    {status === 'success' && (
                        <div style={{ padding: '12px', background: '#e6ffed', border: '1px solid #4CAF50', borderRadius: '5px' }}>
                            {renderMarkdownLite(level.conclusion)}
                            <button
                                onClick={hasNextLevel ? () => setLevelIdx(i => i + 1) : onNextWorld}
                                disabled={!canContinue}
                                style={{
                                    marginTop: '10px',
                                    padding: '10px 20px',
                                    fontSize: '16px',
                                    backgroundColor: canContinue ? '#2196F3' : '#bbb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: canContinue ? 'pointer' : 'default',
                                }}
                            >
                                {hasNextLevel ? 'לשלב הבא' : nextWorldLabel && onNextWorld ? nextWorldLabel : 'שלבים נוספים בקרוב...'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameWorkspace;
