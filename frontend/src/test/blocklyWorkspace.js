import * as Blockly from 'blockly/core';
import { defineGameBlocks } from '../blocks/gameBlocks';
import { defineMoveBlocks } from '../blocks/moves';

defineGameBlocks();
defineMoveBlocks();

// Headless (non-rendered) workspace loaded from a level's XML.
export const loadWorkspace = (xml) => {
    const workspace = new Blockly.Workspace();
    Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(xml), workspace);
    return workspace;
};

// Appends moves to the goal's PROOF input. Each step is
// [type, { FIELD: value }]; returns the created blocks in order.
export const buildProof = (workspace, steps) => {
    const goal = workspace.getTopBlocks(true).find(b => b.type === 'game_goal');
    return buildInto(goal, 'PROOF', steps);
};

// Like buildProof, but into a statement input of any block (a part of a rule
// that splits the proof). A move that opens a structure (no next move: see
// wrap in blocks/moves.js) holds the steps after it; the blocks come back in
// the order of the steps.
export const buildInto = (parent, input, steps) => {
    const workspace = parent.workspace;
    let connection = parent.getInput(input).connection;
    const blocks = [];
    for (const [type, fields = {}] of steps) {
        const block = workspace.newBlock(type);
        Object.entries(fields).forEach(([name, value]) => block.setFieldValue(value, name));
        connection.connect(block.previousConnection);
        blocks.push(block);
        connection = block.nextConnection || block.getInput('BODY')?.connection;
    }
    return blocks;
};
