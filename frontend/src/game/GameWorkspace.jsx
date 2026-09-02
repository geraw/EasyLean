import React, { useEffect, useMemo, useState } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import axios from 'axios';
import { defineBlocks } from '../blocks/logic';
import { defineGameBlocks } from '../blocks/gameBlocks';
import { leanGenerator } from '../generator/lean';
import { subsetLevels, worldName, SET_PREAMBLE } from './subsetWorld';

// Same compatibility patch as the sandbox workspace (safe to re-apply).
Blockly.Workspace.prototype.getAllVariables = function () {
    return this.getVariableMap().getAllVariables();
};

defineBlocks();
defineGameBlocks();

const LEAN_SYMBOLS = {
    '\\imp': '→',
    '\\not': '¬',
    '\\and': '∧',
    '\\or': '∨',
    '\\forall': '∀',
    '\\exists': '∃',
    '\\iff': '↔',
    '\\le': '≤',
    '\\ge': '≥',
    '\\ne': '≠',
    '\\in': '∈',
    '\\mem': '∈',
    '\\sub': '⊆',
};

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

const GameWorkspace = () => {
    const [levelIdx, setLevelIdx] = useState(0);
    const [workspace, setWorkspace] = useState(null);
    const [leanCode, setLeanCode] = useState('');
    const [output, setOutput] = useState('');
    const [status, setStatus] = useState('idle'); // idle, running, success, error
    const [hintsShown, setHintsShown] = useState(0);

    const level = subsetLevels[levelIdx];

    // Handle automatic replacement of Lean commands with unicode symbols
    useEffect(() => {
        if (!workspace) return;

        const changeListener = (event) => {
            // We only care about user typing into text fields
            if (event.type === Blockly.Events.BLOCK_CHANGE && event.element === 'field') {
                const currentValue = event.newValue;
                
                if (typeof currentValue !== 'string') return;

                let updatedValue = currentValue;

                // Check if the current text contains any of our Lean commands
                Object.keys(LEAN_SYMBOLS).forEach(command => {
                    if (updatedValue.includes(command)) {
                        // Replace all instances of the command with the unicode symbol
                        updatedValue = updatedValue.replaceAll(command, LEAN_SYMBOLS[command]);
                    }
                });

                // If a replacement occurred, update the block immediately
                if (updatedValue !== currentValue) {
                    const block = workspace.getBlockById(event.blockId);
                    if (block) {
                        // Update the field with the new unicode text
                        block.setFieldValue(updatedValue, event.name);
                    }
                }
            }
        };

        workspace.addChangeListener(changeListener);

        return () => {
            workspace.removeChangeListener(changeListener);
        };
    }, [workspace]);

    const toolboxConfiguration = useMemo(() => {
        const tacticBlocks = [...new Set(subsetLevels.slice(0, levelIdx + 1).flatMap(l => l.newTacticsBlocks))];
        const theoremBlocks = [...new Set(subsetLevels.slice(0, levelIdx + 1).flatMap(l => l.newTheoremBlocks || []))];
        return {
            kind: 'categoryToolbox',
            contents: [
                {
                    kind: 'category',
                    name: 'טקטיקות',
                    colour: '#5C81A6',
                    contents: tacticBlocks.map(type => ({ kind: 'block', type })),
                },
                {
                    kind: 'category',
                    name: 'משפטים',
                    colour: '#5CA65C',
                    contents: theoremBlocks.map(type => ({ kind: 'block', type })),
                }
            ],
        };
    }, [levelIdx]);

    // (Re)load the level's starting XML whenever the level changes.
    useEffect(() => {
        if (!workspace) return;
        workspace.clear();
        try {
            const dom = Blockly.utils.xml.textToDom(level.startXml);
            Blockly.Xml.domToWorkspace(dom, workspace);
        } catch (e) {
            console.error('Error loading level XML', e);
        }
        setStatus('idle');
        setOutput('');
        setLeanCode('');
        setHintsShown(0);
    }, [workspace, levelIdx]);

    const generateLeanCode = () => {
        if (!workspace) return '';
        const goalBlock = workspace.getTopBlocks(true).find(b => b.type === 'game_goal');
        if (!goalBlock) return '';
        let proof = leanGenerator.statementToCode(goalBlock, 'PROOF');
        if (!proof.trim()) proof = '  sorry\n';
        return `${SET_PREAMBLE}\n${level.variableLine}\n\ntheorem ${level.name} ${level.params} : ${level.proposition} := by\n${proof}`;
    };

    const runProof = async () => {
        const code = generateLeanCode();
        setLeanCode(code);
        setStatus('running');
        setOutput('מריץ בדיקה...');
        try {
            const response = await axios.post('http://localhost:3001/verify', { leanCode: code });
            if (response.data.exitCode === 0 && !response.data.output.includes('warning')) {
                setStatus('success');
                setOutput(response.data.output || 'הצלחה!');
            } else {
                setStatus('error');
                setOutput(response.data.output);
            }
        } catch (error) {
            setStatus('error');
            setOutput('שגיאה בהתחברות לשרת: ' + error.message);
        }
    };

    const hasNextLevel = levelIdx + 1 < subsetLevels.length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', fontFamily: 'sans-serif', direction: 'rtl' }}>
            <h1 style={{ margin: '0 0 10px 0' }}>{worldName} — שלב {level.levelNumber}/{level.totalLevels}: {level.title}</h1>

            <div style={{ display: 'flex', flexGrow: 1, gap: '20px', minHeight: 0 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #ccc', position: 'relative' }}>
                    <div style={{ flex: 1, position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
                        <BlocklyWorkspace
                            className="width-100"
                            onInject={(ws) => setWorkspace(ws)}
                            toolboxConfiguration={toolboxConfiguration}
                            workspaceConfiguration={{
                                rtl: true,
                                grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
                            }}
                            initialXml={level.startXml}
                        />
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

                    {(level.newDefinitions?.length > 0) && (
                        <div style={{ padding: '10px', background: '#fff8e1', borderRadius: '5px' }}>
                            {level.newDefinitions?.map(d => (
                                <div key={d.symbol} style={{ marginBottom: '6px' }}>
                                    <strong>הגדרה חדשה: {d.symbol}</strong>
                                    <div style={{ fontSize: '1.1em' }}>{renderMarkdownLite(d.doc)}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ padding: '10px', background: '#f0e6ff', borderRadius: '5px' }}>
                        {hintsShown > 0 && level.hints.slice(0, hintsShown).map((h, i) => (
                            <p key={i} style={{ margin: '0 0 6px 0' }}>💡 {renderMarkdownLite(h)}</p>
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

                    <div style={{ padding: '10px', background: '#333', color: 'white', borderRadius: '5px', overflow: 'auto', textAlign: 'left', direction: 'ltr', minHeight: '80px' }}>
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
