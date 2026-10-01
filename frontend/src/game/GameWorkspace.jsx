import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import axios from 'axios';
import { defineBlocks } from '../blocks/logic';
import { defineGameBlocks } from '../blocks/gameBlocks';
import { leanGenerator } from '../generator/lean';
import { subsetLevels, worldName as subsetWorldName, SET_PREAMBLE } from './subsetWorld';

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

const stripOuterParentheses = (text) => {
    let result = text.trim();
    let changed = true;
    while (changed && result.startsWith('(') && result.endsWith(')')) {
        let depth = 0;
        changed = false;
        for (let index = 0; index < result.length; index += 1) {
            if (result[index] === '(') depth += 1;
            if (result[index] === ')') depth -= 1;
            if (depth === 0 && index < result.length - 1) break;
            if (index === result.length - 1 && depth === 0) {
                result = result.slice(1, -1).trim();
                changed = true;
            }
        }
    }
    return result;
};

const findTopLevelArrow = (text) => {
    let depth = 0;
    for (let index = 0; index < text.length; index += 1) {
        if (text[index] === '(') depth += 1;
        if (text[index] === ')') depth -= 1;
        if (depth === 0 && text[index] === '→') return index;
        if (depth === 0 && text.slice(index, index + 2) === '->') return index;
    }
    return -1;
};

const formatProofGoal = (text) => {
    const normalized = stripOuterParentheses(text || '');
    const arrowIndex = findTopLevelArrow(normalized);
    if (arrowIndex === -1) return normalized;
    const arrowLength = normalized[arrowIndex] === '→' ? 1 : 2;
    const left = formatProofGoal(normalized.slice(0, arrowIndex));
    const right = formatProofGoal(normalized.slice(arrowIndex + arrowLength));
    return `(${left} → ${right})`;
};

const GameWorkspace = ({
    levels = subsetLevels,
    worldName = subsetWorldName,
    preamble = SET_PREAMBLE,
    toolboxLabel = 'טקטיקות',
    newTacticsLabel = 'טקטיקה חדשה',
    hideCompilerDetails = false,
    proofStateEndpoint = null,
}) => {
    const [levelIdx, setLevelIdx] = useState(0);
    const [workspace, setWorkspace] = useState(null);
    const [workspaceRevision, setWorkspaceRevision] = useState(0);
    const [output, setOutput] = useState('');
    const [status, setStatus] = useState('idle'); // idle, running, success, error
    const [hintsShown, setHintsShown] = useState(0);
    const [proofState, setProofState] = useState(null);
    const proofStateRequestRef = useRef(0);
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const errorBlockRef = useRef(null);

    const clearBlockError = useCallback(() => {
        if (errorBlockRef.current) {
            const { block, colour } = errorBlockRef.current;
            if (!block.isDisposed()) block.setColour(colour);
            errorBlockRef.current = null;
        }
    }, []);

    const markBlockError = useCallback((targetWorkspace, blockId) => {
        clearBlockError();
        const block = blockId && targetWorkspace.getBlockById(blockId);
        if (!block) return;
        errorBlockRef.current = { block, colour: block.getColour() };
        block.setColour('#d93025');
    }, [clearBlockError]);
    const workspaceListenerRef = useRef(null);
    const loadingWorkspaceRef = useRef(false);

    const handleWorkspaceInject = useCallback((ws) => {
        const listener = (event) => {
            if (loadingWorkspaceRef.current) return;
            if (event.type === 'selected') {
                clearBlockError();
                setSelectedBlockId(event.newElementId || null);
                setWorkspaceRevision((revision) => revision + 1);
                return;
            }
            if (event.isUiEvent) return;
            if (['create', 'delete', 'change', 'move'].includes(event.type)) {
                clearBlockError();
                setWorkspaceRevision((revision) => revision + 1);
            }
        };
        ws.addChangeListener(listener);
        workspaceListenerRef.current = { workspace: ws, listener };
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
        setProofState(null);
        setSelectedBlockId(null);
        clearBlockError();
        loadingWorkspaceRef.current = false;
    }, [workspace, levelIdx, clearBlockError]);

    const generateLeanCode = (includeFallback = true, untilBlockId = null) => {
        if (!workspace) return '';
        const goalBlock = workspace.getTopBlocks(true).find(b => b.type === 'game_goal');
        if (!goalBlock) return '';
        let proof = '';
        let proofBlock = goalBlock.getInputTargetBlock('PROOF');
        let selectedBlockFound = !untilBlockId;
        while (proofBlock) {
            if (proofBlock.id === untilBlockId) {
                selectedBlockFound = true;
                break;
            }
            proof += leanGenerator.blockToCode(proofBlock, true);
            proofBlock = proofBlock.getNextBlock();
        }
        if (untilBlockId && !selectedBlockFound) proof = leanGenerator.statementToCode(goalBlock, 'PROOF');
        if (!proof.trim()) proof = includeFallback ? '  sorry\n' : '  exact ?_\n';
        return `${preamble}\n${level.variableLine}\n\ntheorem ${level.name} ${level.params} : ${level.proposition} := by\n${proof}`;
    };

    const getLastProofBlockId = () => {
        const goalBlock = workspace?.getTopBlocks(true).find(b => b.type === 'game_goal');
        let proofBlock = goalBlock?.getInputTargetBlock('PROOF');
        let lastBlockId = null;
        while (proofBlock) {
            lastBlockId = proofBlock.id;
            proofBlock = proofBlock.getNextBlock();
        }
        return lastBlockId;
    };

    useEffect(() => {
        if (!proofStateEndpoint || !workspace) return undefined;

        const requestId = proofStateRequestRef.current + 1;
        proofStateRequestRef.current = requestId;
        setProofState({ loading: true, assumptions: [], goal: level.proposition, complete: false });

        const timeout = setTimeout(async () => {
            try {
                const response = await axios.post(proofStateEndpoint, {
                    leanCode: generateLeanCode(false, selectedBlockId),
                });
                if (proofStateRequestRef.current === requestId) {
                    if (response.data.error) {
                        markBlockError(workspace, selectedBlockId || getLastProofBlockId());
                    } else {
                        clearBlockError();
                    }
                    setProofState(response.data);
                }
            } catch (error) {
                if (proofStateRequestRef.current === requestId) {
                    markBlockError(workspace, selectedBlockId || getLastProofBlockId());
                    setProofState({ loading: false, assumptions: [], goal: null, complete: false, error: 'לא ניתן לקבל את מצב ההוכחה כרגע.' });
                }
            }
        }, 180);

        return () => clearTimeout(timeout);
    }, [workspace, workspaceRevision, levelIdx, proofStateEndpoint, selectedBlockId, clearBlockError, markBlockError]);

    const runProof = async () => {
        const code = generateLeanCode();
        setStatus('running');
        setOutput('מריץ בדיקה...');
        try {
            const response = await axios.post('http://localhost:3001/verify', { leanCode: code });
            if (response.data.exitCode === 0) {
                clearBlockError();
                setStatus('success');
                setOutput(response.data.output || 'הצלחה!');
            } else {
                markBlockError(workspace, selectedBlockId || getLastProofBlockId());
                setStatus('error');
                setOutput(hideCompilerDetails ? 'עדיין לא. בדקו את סדר מהלכי ההוכחה ונסו שוב.' : response.data.output);
            }
        } catch (error) {
            markBlockError(workspace, selectedBlockId || getLastProofBlockId());
            setStatus('error');
            setOutput(hideCompilerDetails ? 'לא הצלחנו לבדוק כרגע. נסו שוב בעוד רגע.' : 'שגיאה בהתחברות לשרת: ' + error.message);
        }
    };

    const hasNextLevel = levelIdx + 1 < levels.length;
    const proofStatePanel = proofStateEndpoint && (
        <div style={{ padding: '12px', background: '#eef4ff', border: '1px solid #b7cbea', borderRadius: '5px', flexShrink: 0 }}>
            <h3 style={{ margin: '0 0 10px 0' }}>מצב ההוכחה</h3>
            {proofState?.loading && <div style={{ marginBottom: '10px', color: '#555' }}>Lean בודק את המהלך האחרון...</div>}
            <h4 style={{ margin: '0 0 6px 0' }}>מה יש לנו ביד</h4>
            {proofState?.assumptions?.length > 0 ? (
                proofState.assumptions.map((assumption) => (
                    <div key={assumption.name} style={{ marginBottom: '4px', direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>
                        {assumption.name} : {assumption.prop}
                    </div>
                ))
            ) : (
                <div style={{ color: '#555', marginBottom: '10px' }}>עדיין לא הוספנו הנחות.</div>
            )}
            <h4 style={{ margin: '10px 0 6px 0' }}>מה נשאר להוכיח</h4>
            <div style={{ direction: 'ltr', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>
                {proofState?.complete ? 'ההוכחה הושלמה' : proofState?.goal ? formatProofGoal(proofState.goal) : proofState?.error || formatProofGoal(level.proposition)}
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', fontFamily: 'sans-serif', direction: 'rtl' }}>
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
                    {proofStatePanel}
                    <div style={{ flex: 1, minHeight: 0, border: '1px solid #ccc', position: 'relative', overflow: 'visible' }}>
                        <div style={{ flex: 1, position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
                        <BlocklyWorkspace
                            className="width-100"
                            onInject={handleWorkspaceInject}
                            onDispose={handleWorkspaceDispose}
                            toolboxConfiguration={toolboxConfiguration}
                            workspaceConfiguration={{
                                rtl: true,
                                grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
                            }}
                            initialXml={level.startXml}
                        />
                        </div>
                    </div>
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

                    <div style={{ padding: '10px', background: '#333', color: 'white', borderRadius: '5px', overflow: 'auto', textAlign: 'left', direction: 'ltr', maxHeight: '150px' }}>
                        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{output}</pre>
                    </div>

                    {status === 'success' && (
                        <div style={{ padding: '12px', background: '#e6ffed', border: '1px solid #4CAF50', borderRadius: '5px' }}>
                            {renderMarkdownLite(level.conclusion)}
                            <button
                                onClick={() => setLevelIdx(i => i + 1)}
                                disabled={!hasNextLevel}
                                style={{
                                    marginTop: '10px',
                                    padding: '10px 20px',
                                    fontSize: '16px',
                                    backgroundColor: hasNextLevel ? '#2196F3' : '#bbb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: hasNextLevel ? 'pointer' : 'default',
                                }}
                            >
                                {hasNextLevel ? 'לשלב הבא' : 'שלבים נוספים בקרוב...'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameWorkspace;
