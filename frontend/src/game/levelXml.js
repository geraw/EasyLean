import { isolateFormulas } from './bidi';
import { formatProofGoal } from './formatProofGoal';

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

// What a level shows of its statement is made from its Lean statement, as
// every formula is shown (formatProofGoal), so that the goal block, the card
// and the moves always write it alike: the goal (the contradiction ⊥ as the
// proof state names it), and the opening assumptions, the hypotheses h… of
// its parameters.
export const shownGoal = (level) => {
    const goal = formatProofGoal(level.proposition);
    return goal === '⊥' ? 'סתירה (⊥)' : goal;
};

export const shownAssumptions = (level) => {
    const groups = [];
    const params = level.params || '';
    for (let index = 0, depth = 0, start = -1; index < params.length; index += 1) {
        if (params[index] === '(') { if (depth === 0) start = index; depth += 1; }
        if (params[index] === ')') { depth -= 1; if (depth === 0) groups.push(params.slice(start + 1, index)); }
    }
    return groups.map((group) => group.match(/^\s*(h\w*)\s*:\s*([\s\S]+)$/)).filter(Boolean).map(([, , prop]) => formatProofGoal(prop.trim()));
};

// A unit's levels, each with its goal and its starting workspace: the goal
// block, with the moves of level.startProof already placed, if any.
export const prepareLevels = (levels) => levels.map((level) => ({
    ...level,
    goalLabel: shownGoal(level),
    startXml: goalXml(shownGoal(level), shownAssumptions(level).join(',  ') || undefined, level.startProof),
}));
