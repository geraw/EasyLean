import { isolateFormulas } from './bidi';

// Starting workspace for a game level: the fixed goal block, optionally with
// moves already placed in its PROOF input (as Blockly XML). The labels are
// shown right to left, so negated formulas are isolated (see bidi.js).
export const goalXml = (goal, context = 'אין הנחות פתיחה', proofXml = '') => `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="game_goal" x="20" y="20" deletable="false" movable="false">
    <field name="GOAL_LABEL">${isolateFormulas(goal)}</field>
    <field name="CONTEXT_LABEL">${isolateFormulas(context)}</field>${proofXml ? `
    <statement name="PROOF">${proofXml}</statement>` : ''}
  </block>
</xml>`;
