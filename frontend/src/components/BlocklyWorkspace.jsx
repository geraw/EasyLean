import React, { useEffect, useState } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import { defineBlocks } from '../blocks/logic';
import { leanGenerator } from '../generator/lean';
import axios from 'axios';
import pImpliesPXml from '../examples/p_implies_p.xml?raw';
import andCommXml from '../examples/and_comm.xml?raw';
import orCommXml from '../examples/or_comm.xml?raw';

// Monkey-patch to fix react-blockly compatibility with newer Blockly versions
// react-blockly uses getAllVariables() which is deprecated/removed in newer Blockly
Blockly.Workspace.prototype.getAllVariables = function () {
    return this.getVariableMap().getAllVariables();
};

defineBlocks();

const EasyLeanWorkspace = () => {
    const [xml, setXml] = useState('');
    const [leanCode, setLeanCode] = useState('');
    const [output, setOutput] = useState('');
    const [status, setStatus] = useState('idle'); // idle, running, success, error
    const [workspace, setWorkspace] = useState(null);

    const initialXml = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="theorem" x="20" y="20">
    <field name="NAME">hello_world</field>
    <field name="PROPOSITION">p -> p</field>
    <statement name="PROOF">
      <block type="tactic_intro">
        <field name="HYPOTHESIS">h</field>
        <next>
          <block type="tactic_exact">
            <field name="TERM">h</field>
          </block>
        </next>
      </block>
    </statement>
  </block>
</xml>
`;

    const toolboxLabels = {
        'logic': 'לוגיקה'
    };

    const toolboxConfiguration = {
        kind: 'categoryToolbox',
        contents: [
            {
                kind: 'category',
                name: 'לוגיקה',
                colour: '#5C81A6',
                contents: [
                    { kind: 'block', type: 'tactic_intro' },
                    { kind: 'block', type: 'tactic_exact' },
                    { kind: 'block', type: 'tactic_apply' },
                    { kind: 'block', type: 'tactic_and_intro' },
                    { kind: 'block', type: 'tactic_and_elim' },
                    { kind: 'block', type: 'tactic_or_intro_left' },
                    { kind: 'block', type: 'tactic_or_intro_right' },
                    { kind: 'block', type: 'tactic_or_elim' },
                    { kind: 'block', type: 'tactic_show' },
                    { kind: 'block', type: 'tactic_check_hyp' },
                ],
            },
        ],
    };

    const examples = {
        'p_implies_p': {
            name: 'P -> P',
            xml: pImpliesPXml
        },
        'and_comm': {
            name: 'P ∧ Q -> Q ∧ P',
            xml: andCommXml
        },
        'or_comm': {
            name: 'P ∨ Q -> Q ∨ P',
            xml: orCommXml
        }
    };

    const loadExample = (key) => {
        if (!workspace || !examples[key]) return;
        workspace.clear();
        try {
            // For newer blockly, might need Blockly.Xml 
            // or check if window.Blockly.Xml is available if imported differently
            // But assuming import * as Blockly works:
            const dom = Blockly.utils.xml.textToDom(examples[key].xml);
            Blockly.Xml.domToWorkspace(dom, workspace);
        } catch (e) {
            console.error("Error loading example", e);
        }
    };

    const onWorkspaceChange = (ws) => {
        // Capture workspace for loadExample usage
        if (ws && !workspace) {
            setWorkspace(ws);
        }

        const code = leanGenerator.workspaceToCode(ws);
        // Prepend common variables so users don't have to declare them for simple proofs
        const prelude = 'variable (p q r : Prop)\n\n';
        setLeanCode(prelude + code);
    };

    const downloadXml = () => {
        if (!workspace) return;
        try {
            const xmlDom = Blockly.Xml.workspaceToDom(workspace);
            const xmlText = Blockly.Xml.domToPrettyText(xmlDom);
            const blob = new Blob([xmlText], { type: 'text/xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'proof.xml';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Failed to save XML", e);
            alert("Error saving XML");
        }
    };

    const runProof = async () => {
        setStatus('running');
        setOutput('Running Lean...');
        try {
            // Check if we are checking against a local backend or remote?
            // For now assuming localhost:3001
            const response = await axios.post('http://localhost:3001/verify', { leanCode });

            if (response.data.exitCode === 0) {
                setStatus('success');
                setOutput(response.data.output || 'No output (Success!)');
            } else {
                setStatus('error');
                setOutput(response.data.output);
            }
        } catch (error) {
            setStatus('error');
            setOutput('Error connecting to backend: ' + error.message);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '20px', fontFamily: 'sans-serif', direction: 'rtl' }}>
            <h1 style={{ margin: '0 0 20px 0' }}>EasyLean - הוכחות בכיף</h1>

            <div style={{ display: 'flex', flexGrow: 1, gap: '20px', minHeight: 0 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #ccc', position: 'relative' }}>
                    <div style={{ flex: 1, position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
                        <BlocklyWorkspace
                            className="width-100"
                            onInject={(ws) => setWorkspace(ws)}
                            toolboxConfiguration={toolboxConfiguration}
                            workspaceConfiguration={{
                                rtl: true,
                                grid: {
                                    spacing: 20,
                                    length: 3,
                                    colour: '#ccc',
                                    snap: true,
                                },
                            }}
                            initialXml={initialXml}
                            onWorkspaceChange={onWorkspaceChange}
                            onXmlChange={setXml}
                        />
                    </div>
                </div>

                <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ padding: '10px', background: '#e0e0e0', borderRadius: '5px' }}>
                        <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>בחר דוגמה:</span>
                        <select onChange={(e) => loadExample(e.target.value)} style={{ padding: '5px', borderRadius: '4px' }}>
                            <option value="">-- בחר --</option>
                            {Object.entries(examples).map(([key, example]) => (
                                <option key={key} value={key}>{example.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ padding: '10px', background: '#f5f5f5', borderRadius: '5px', textAlign: 'left', direction: 'ltr' }}>
                        <h3 style={{ marginTop: 0, textAlign: 'right', direction: 'rtl' }}>קוד שנוצר (Lean 4):</h3>
                        <pre style={{ whiteSpace: 'pre-wrap', background: '#eee', padding: '10px', margin: 0 }}>{leanCode}</pre>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={runProof}
                            style={{
                                flex: 1,
                                padding: '10px',
                                fontSize: '18px',
                                background: status === 'running' ? '#ccc' : '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: status === 'running' ? 'not-allowed' : 'pointer'
                            }}
                            disabled={status === 'running'}
                        >
                            הרץ הוכחה
                        </button>
                        <button
                            onClick={downloadXml}
                            style={{
                                padding: '10px',
                                fontSize: '18px',
                                background: '#2196F3', // Blue for save
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            שמור XML
                        </button>
                    </div>

                    <div style={{ flexGrow: 1, padding: '10px', background: '#333', color: 'white', borderRadius: '5px', overflow: 'auto', textAlign: 'left', direction: 'ltr' }}>
                        <h3 style={{ marginTop: 0, textAlign: 'right', direction: 'rtl' }}>פלט (Output):</h3>
                        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{output}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EasyLeanWorkspace;
