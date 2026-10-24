import { describe, expect, it } from 'vitest';
import { formatProofGoal } from './formatProofGoal';
import { unit2Levels } from './unit2World';
import { unit3Levels } from './unit3World';
import { unit4Levels } from './unit4World';
import { unit5Levels } from './unit5World';
import { unit6Levels } from './unit6World';
import { unit7Levels } from './unit7World';
import { unit8Levels } from './unit8World';
import { unit9Levels } from './unit9World';
import { unit10Levels } from './unit10World';

// Every formula a student sees is written alike: the goal block and the card
// are made from the level's Lean statement (prepareLevels in levelXml.js), the
// moves write the proof state with formatProofGoal, and a formula a level's
// text writes in `…` must already be written so, which formatProofGoal leaves
// as it is (`¬A ⊆ B`, say, would be `¬(A ⊆ B)`).

const LEVELS = [unit2Levels, unit3Levels, unit4Levels, unit5Levels, unit6Levels, unit7Levels, unit8Levels, unit9Levels, unit10Levels].flat();

// A formula's outer parentheses are left out in a text (`P ∧ Q`), and written
// in the display ((P ∧ Q)).
const withoutOuter = (formula) => {
    const text = formula.trim();
    return text.startsWith('(') && text.endsWith(')') && formatProofGoal(text.slice(1, -1)) === formatProofGoal(text) ? text.slice(1, -1) : text;
};

// The formulas in `…` of a level's texts: those with a connective, quantifier
// or relation, and no Hebrew or meta-notation (≡, ⟺) around them.
const textFormulas = (level) => [level.introduction, level.conclusion, ...(level.hints || [])].join('\n').matchAll(/`([^`]+)`/g)
    .map(([, formula]) => formula).filter((formula) => /[∧∨→↔¬∀∃⊆∈=]/.test(formula) && !/[א-ת]|≡|⟺|⇔|…/.test(formula));

describe('the formulas a student sees', () => {
    it.each(LEVELS.map((level) => [level.id, level]))('%s writes the formulas of its texts as the moves show them', (_, level) => {
        textFormulas(level).forEach((formula) => expect(withoutOuter(formatProofGoal(formula)), formula).toBe(withoutOuter(formula)));
    });

    it.each(LEVELS.map((level) => [level.id, level]))('%s shows its goal as the moves do', (_, level) => {
        const goal = formatProofGoal(level.proposition);
        expect(level.goalLabel).toBe(goal === '⊥' ? 'סתירה (⊥)' : goal);
        expect(level.startXml).toContain('<block type="game_goal"');
    });
});
