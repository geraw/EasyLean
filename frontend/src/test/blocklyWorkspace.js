import * as Blockly from 'blockly/core';
import { defineBlocks } from '../blocks/logic';
import { defineGameBlocks } from '../blocks/gameBlocks';

defineBlocks();
defineGameBlocks();

// Headless (non-rendered) workspace loaded from a level's XML.
export const loadWorkspace = (xml) => {
    const workspace = new Blockly.Workspace();
    Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(xml), workspace);
    return workspace;
};

// Appends tactic blocks to the goal's PROOF input. Each step is
// [type, { FIELD: value }]; returns the created blocks in order.
export const buildProof = (workspace, steps) => {
    const goal = workspace.getTopBlocks(true).find(b => b.type === 'game_goal');
    let connection = goal.getInput('PROOF').connection;
    return steps.map(([type, fields = {}]) => {
        const block = workspace.newBlock(type);
        Object.entries(fields).forEach(([name, value]) => block.setFieldValue(value, name));
        connection.connect(block.previousConnection);
        connection = block.nextConnection;
        return block;
    });
};
