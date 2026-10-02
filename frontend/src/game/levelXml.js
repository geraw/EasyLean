// Starting workspace for a game level: the fixed goal block, optionally with
// moves already placed in its PROOF input (as Blockly XML).
export const goalXml = (goal, context = 'אין הנחות פתיחה', proofXml = '') => `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="game_goal" x="20" y="20" deletable="false" movable="false">
    <field name="GOAL_LABEL">${goal}</field>
    <field name="CONTEXT_LABEL">${context}</field>${proofXml ? `
    <statement name="PROOF">${proofXml}</statement>` : ''}
  </block>
</xml>`;
