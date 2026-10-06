import { describe, expect, it } from 'vitest';
import * as Blockly from 'blockly/core';
import { leanGenerator } from '../generator/lean';
import { loadWorkspace, buildProof } from '../test/blocklyWorkspace';
import { generateGameLeanCode } from '../game/gameLeanCode';
import { explainLeanMessage } from '../game/leanErrors';
import { withoutIsolates } from '../game/bidi';
import { defineHandwrittenBlocks, phraseOf } from './blocks';
import { HANDWRITTEN_EXPLANATIONS } from './explanations';
import { buildMoveStatesSource, readMoveStates } from './moveStates';
import { unit0Levels } from './unit0World';
import { unit1Levels } from './unit1World';
import { HANDWRITTEN_UNITS } from '../../e2e/handwrittenSolutions';

defineHandwrittenBlocks();

const worlds = [unit0Levels, unit1Levels];

// A level's workspace with one of its solutions in place of the starting moves.
const solved = (level, steps) => {
    const workspace = loadWorkspace(level.startXml);
    workspace.getTopBlocks(true).find((b) => b.type === 'game_goal').getInputTargetBlock('PROOF')?.dispose(false);
    return { workspace, blocks: buildProof(workspace, steps) };
};

const usedBlocks = (steps) => new Set(steps.map(([type]) => type));

describe.each(HANDWRITTEN_UNITS.map(({ unit, levels }) => [unit, levels]))('handwritten unit %i', (unit, solutions) => {
    const levels = worlds[unit];

    it('has a solution for every level', () => {
        expect(solutions).toHaveLength(levels.length);
    });

    it.each(levels.map((level, i) => [level.id, level, solutions[i]]))('%s offers only blocks that exist, generate Lean and a solution uses', (_, level, levelSolutions) => {
        const used = new Set(levelSolutions.flatMap(({ steps }) => [...usedBlocks(steps)]));
        level.toolboxBlocks.forEach((type) => {
            expect(Blockly.Blocks[type], type).toBeDefined();
            expect(leanGenerator.forBlock[type], type).toBeTypeOf('function');
        });
        expect(level.toolboxBlocks.filter((type) => !used.has(type))).toEqual([]);
        levelSolutions.forEach(({ steps }) => steps.forEach(([type]) => expect(level.toolboxBlocks).toContain(type)));
    });

    it.each(levels.map((level) => [level.id, level]))('%s never shows an assumption name', (_, level) => {
        const shown = [level.introduction, level.conclusion, ...level.hints, level.startXml].join('\n');
        expect(shown).not.toMatch(/\bh\d*\b|\bh[pq]\b/);
    });
});

describe('the moves', () => {
    it('find each assumption by its statement', () => {
        const level = unit1Levels[4];
        const { workspace } = solved(level, HANDWRITTEN_UNITS[1].levels[4][1].steps);
        expect(generateGameLeanCode(workspace, level, '', { includeFallback: false })).toContain([
            '  refine easylean_imp_intro (fun _ => ?_)',
            '  refine easylean_imp_intro (fun _ => ?_)',
            '  refine easylean_imp_intro (fun _ => ?_)',
            '  have := easylean_mp ‹P → Q› ‹P›',
            '  have := easylean_mp ‹Q → R› ‹Q›',
            '  exact (‹R› : R)',
        ].join('\n'));
    });

    it('read like a written proof, following the proof state and their fields', () => {
        const { blocks: [assume, forward, backward] } = solved(unit1Levels[4], [
            ['hw_assume'], ['hw_forward', { RULE: 'P → Q', PREMISE: 'P' }], ['hw_apply_rule', { RULE: 'Q → R' }],
        ]);
        expect(phraseOf(assume)).toBe('כדי להוכיח את הגרירה, נניח את התנאי שלה ונוכיח את המסקנה שלה');
        assume.setStateBefore({ assumptions: [], goal: '(P → Q) → (Q → R) → P → R' });
        expect(phraseOf(assume)).toBe('כדי להוכיח את הגרירה, נניח (P → Q) ונוכיח ((Q → R) → (P → R))');
        expect(phraseOf(forward)).toBe('נובע Q');
        expect(phraseOf(backward)).toBe('כדי להוכיח R די להוכיח Q');
    });

    it('offer the assumptions in hand before them, and typing one in', () => {
        const { blocks: [close] } = solved(unit0Levels[1], [['hw_exact']]);
        const field = close.getField('FACT');
        expect(field.getValue()).toBe('?');
        close.setStateBefore({ assumptions: ['P', 'P → Q'], goal: 'Q' });
        expect(field.getOptions(false).map(([label, value]) => [withoutIsolates(label), value])).toEqual([
            ['?', '?'], ['P', 'P'], ['(P → Q)', 'P → Q'], ['✎ כתיבה ידנית...', '__write_own__'],
        ]);
        // A typed statement is kept even when it is not in hand: Lean will explain.
        field.setValue('R');
        expect(withoutIsolates(field.getText())).toBe('R');
    });
});

describe('the proof state before each move', () => {
    it('comes from one check, a theorem per move', () => {
        const level = unit1Levels[0];
        const { workspace, blocks } = solved(level, HANDWRITTEN_UNITS[1].levels[0][0].steps);
        const source = buildMoveStatesSource(workspace, level);
        expect(source.code.match(/^theorem hw_unit1_l1_identity_before_\d/gm)).toHaveLength(2);
        expect(source.code.match(/^theorem easylean_mp /gm)).toHaveLength(1);
        // Lean's output for this code (lines 9-10 and 11-12).
        const output = [
            'proof.lean:10:8: error: don\'t know how to synthesize placeholder', 'context:', 'P : Prop', '⊢ P → P',
            'proof.lean:9:50: error: unsolved goals', 'P : Prop', '⊢ P → P',
            'proof.lean:11:50: error: unsolved goals', 'P : Prop', 'x✝ : P', '⊢ P',
        ].join('\n');
        const states = readMoveStates(output, source);
        expect(states.get(blocks[0].id)).toEqual({ assumptions: [], goal: 'P → P' });
        expect(states.get(blocks[1].id)).toEqual({ assumptions: ['P'], goal: 'P' });
    });
});

describe('handwritten explanations', () => {
    // Lean's messages for wrong moves, as the moves generate them.
    const explain = (message) => withoutIsolates(explainLeanMessage(message, HANDWRITTEN_EXPLANATIONS));

    it.each([
        ['closing with an assumption that is not the goal',
            'Type mismatch\n  h\nhas type\n  P\nbut is expected to have type\n  Q',
            'ההנחה P היא לא מה שצריך להוכיח: צריך להוכיח Q. אפשר לסיים רק בעזרת הנחה שאומרת בדיוק את זה.'],
        ['going back by an implication whose conclusion is not the goal',
            'Application type mismatch: The argument\n  h1\nhas type\n  P → Q\nbut is expected to have type\n  ?m.2 → R\nin the application\n  easylean_mp h1',
            'המסקנה של (P → Q) היא Q, אבל צריך להוכיח R. אפשר לעבור לתנאי של גרירה רק כשהמסקנה שלה היא בדיוק מה שצריך להוכיח.'],
        ['going forward from an assumption that is not the condition',
            'Application type mismatch: The argument\n  ?m.6\nhas type\n  P\nbut is expected to have type\n  Q\nin the application\n  easylean_mp ?m.5 ?m.6',
            'ההנחה P היא לא התנאי של הגרירה: התנאי שלה הוא Q.'],
        ['using an assumption that is not an implication as one',
            'Application type mismatch: The argument\n  ?m.5\nhas type\n  P\nbut is expected to have type\n  ?m.3 → ?m.4\nin the application\n  easylean_mp ?m.5',
            'ההנחה P היא לא גרירה, ולכן אין לה תנאי ומסקנה.'],
        ['a statement that is not in hand',
            'Tactic `assumption` failed\n\nP Q : Prop\nh1 : P → Q\nhp : P\n⊢ Q',
            'אין בידינו הנחה שאומרת Q. בחרו הנחה מהרשימה, או בדקו את מה שכתבתם מול מצב ההוכחה.'],
        ['a letter that is not in the level', 'Unknown identifier `S`',
            'S לא מופיעה בשלב הזה. בדקו את מה שכתבתם מול מצב ההוכחה.'],
        ['a typed statement Lean cannot read', 'unexpected token \'›\'; expected term',
            'לא הצלחנו לקרוא את הטענה שכתבתם. כתבו אותה כמו במצב ההוכחה, למשל P → Q.'],
        ['assuming when the goal is not an implication (the course\'s explanation)',
            'Type mismatch\n  easylean_imp_intro fun x => ?m.5\nhas type\n  ?m.2 → ?m.3\nbut is expected to have type\n  Q',
            'המטרה היא Q, והיא לא גרירה, ולכן אין תנאי להניח.'],
    ])('%s', (_, message, explanation) => {
        expect(explain(message)).toBe(explanation);
    });
});
