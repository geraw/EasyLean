import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import axios from 'axios';
import { defineBlocks } from '../blocks/logic';
import { defineGameBlocks } from '../blocks/gameBlocks';
import { formatProofGoal } from './formatProofGoal';
import { generateGameLeanSource, getLastProofBlockId } from './gameLeanCode';
import { findLeanProblem, GENERIC_PROBLEM } from './leanErrors';

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
        return chunk.split(/\*(.+?)\*/g).map((seg, j) =>
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
    // which opens a bubble with the text when clicked.
    const markBlockError = useCallback((targetWorkspace, blockId, message) => {
        const block = blockId && targetWorkspace.getBlockById(blockId);
        if (errorBlockRef.current?.block === block) {
            block.setWarningText(message);
            return;
        }
        clearBlockError();
        if (!block) return;
        errorBlockRef.current = { block, colour: block.getColour() };
        block.setColour('#d93025');
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
            blockId: (problem && source.lineBlockIds.get(problem.line)) || evaluatedBlockId || getLastProofBlockId(workspace),
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
        setProofStates({
            before: { loading: true, assumptions: [], goal: level.proposition, complete: false },
            after: evaluatedBlockId ? { loading: true, assumptions: [], goal: level.proposition, complete: false } : null,
        });

        const timeout = setTimeout(async () => {
            try {
                const sources = [generateLeanSource(evaluatedBlockId)];
                if (evaluatedBlockId) sources.push(generateLeanSource(evaluatedBlockId, true));
                const responses = [];
                for (const source of sources) {
                    responses.push(await axios.post(proofStateEndpoint, { leanCode: source.code }));
                }
                if (proofStateRequestRef.current === requestId) {
                    // Replace the backend's generic error with an explanation of the problem.
                    const states = responses.map(({ data }, index) => (data.error
                        ? { ...data, problem: locateProblem(data.output, sources[index]) }
                        : data));
                    const firstProblem = states.find((state) => state.problem)?.problem;
                    if (firstProblem) {
                        markBlockError(workspace, firstProblem.blockId, firstProblem.message);
                    } else {
                        clearBlockError();
                    }
                    setProofStates({ before: states[0], after: states[1] || null });
                }
            } catch {
                if (proofStateRequestRef.current === requestId) {
                    markBlockError(workspace, evaluatedBlockId || getLastProofBlockId(workspace), 'לא ניתן לקבל את מצב ההוכחה כרגע.');
                    setProofStates({
                        before: { loading: false, assumptions: [], goal: null, complete: false, error: 'לא ניתן לקבל את מצב ההוכחה כרגע.' },
                        after: null,
                    });
                }
            }
        }, 180);

        return () => clearTimeout(timeout);
    }, [workspace, workspaceRevision, levelIdx, proofStateEndpoint, evaluatedBlockId, clearBlockError, markBlockError]);

    const runProof = async () => {
        // A hole rather than `sorry`: Lean only warns about `sorry`, so an empty proof would pass.
        const source = generateLeanSource();
        setStatus('running');
        setOutput('מריץ בדיקה...');
        try {
            const response = await axios.post('http://localhost:3001/verify', { leanCode: source.code });
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
    const proofStatePanel = proofStateEndpoint && (
        <div role="region" aria-label="מצב ההוכחה" style={{ padding: '12px', background: '#eef4ff', border: '1px solid #b7cbea', borderRadius: '5px', flexShrink: 0 }}>
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
            {displayedProofState?.complete ? (
                // Nothing is left to prove, so there are no assumptions to list either.
                <div style={{ color: '#1e7e34', fontWeight: 'bold' }}>✓ ההוכחה הושלמה: הוכחנו את מה שהתבקשנו.</div>
            ) : displayedProofState?.error ? (
                <div role="alert" style={{ color: '#b3261e', lineHeight: 1.6 }}>
                    ⚠ {displayedProofState.problem?.message || displayedProofState.error}
                </div>
            ) : (
                <>
                    <h4 style={{ margin: '0 0 6px 0' }}>מה יש לנו ביד</h4>
                    {displayedProofState?.assumptions?.length > 0 ? (
                        displayedProofState.assumptions.map((assumption) => (
                            <div key={assumption.name} style={{ marginBottom: '4px', direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>
                                {assumption.name} : {assumption.prop}
                            </div>
                        ))
                    ) : (
                        <div style={{ color: '#555', marginBottom: '10px' }}>עדיין לא הוספנו הנחות.</div>
                    )}
                    <h4 style={{ margin: '10px 0 6px 0' }}>מה נשאר להוכיח</h4>
                    <div style={{ direction: 'ltr', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>
                        {formatProofGoal(displayedProofState?.goal || level.proposition)}
                    </div>
                </>
            )}
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
                            <div key={o.name} style={{ direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>{o.name} : {o.type}</div>
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
                                    <div style={{ fontSize: '0.9em' }}>{t.doc}</div>
                                </div>
                            ))}
                            {level.newDefinitions?.map(d => (
                                <div key={d.symbol} style={{ marginBottom: '6px' }}>
                                    <strong>הגדרה חדשה: {d.symbol}</strong>
                                    <div style={{ fontSize: '0.9em' }}>{d.doc}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ padding: '10px', background: '#f0e6ff', borderRadius: '5px' }}>
                        {hintsShown > 0 && level.hints.slice(0, hintsShown).map((h, i) => (
                            <p key={i} style={{ margin: '0 0 6px 0' }}>💡 {h}</p>
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
