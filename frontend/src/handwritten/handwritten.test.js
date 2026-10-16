import { describe, expect, it } from 'vitest';
import * as Blockly from 'blockly/core';
import { leanGenerator } from '../generator/lean';
import { loadWorkspace, buildProof, buildInto } from '../test/blocklyWorkspace';
import { generateGameLeanCode } from '../game/gameLeanCode';
import { explainLeanMessage } from '../game/leanErrors';
import { withoutIsolates } from '../game/bidi';
import { defineHandwrittenBlocks, phraseOf } from './blocks';
import { HANDWRITTEN_EXPLANATIONS } from './explanations';
import { buildMoveStatesSource, readMoveStates } from './moveStates';
import { unit0Levels } from './unit0World';
import { unit1Levels } from './unit1World';
import { unit2Levels } from './unit2World';
import { unit3Levels } from './unit3World';
import { HANDWRITTEN_UNITS } from '../../e2e/handwrittenSolutions';

defineHandwrittenBlocks();

const worlds = [unit0Levels, unit1Levels, unit2Levels, unit3Levels];

// A level's workspace with one of its solutions in place of the starting moves.
const solved = (level, steps) => {
    const workspace = loadWorkspace(level.startXml);
    workspace.getTopBlocks(true).find((b) => b.type === 'game_goal').getInputTargetBlock('PROOF')?.dispose(false);
    return { workspace, blocks: buildProof(workspace, steps) };
};

// The blocks of a solution, including those inside the parts of a move.
const usedBlocks = (steps) => new Set(steps.flatMap(([type, , parts = {}]) => [type, ...Object.values(parts).flatMap((part) => [...usedBlocks(part)])]));

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
        levelSolutions.forEach(({ steps }) => usedBlocks(steps).forEach((type) => expect(level.toolboxBlocks).toContain(type)));
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
            '  assumption',
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
        const { blocks: [backward] } = solved(unit1Levels[1], [['hw_apply_rule']]);
        const field = backward.getField('RULE');
        expect(field.getValue()).toBe('?');
        backward.setStateBefore({ assumptions: ['P', 'P → Q'], goal: 'Q' });
        expect(field.getOptions(false).map(([label, value]) => [withoutIsolates(label), value])).toEqual([
            ['?', '?'], ['P', 'P'], ['(P → Q)', 'P → Q'], ['✎ כתיבה ידנית...', '__write_own__'],
        ]);
        // A typed statement is kept even when it is not in hand: Lean will explain.
        field.setValue('R');
        expect(withoutIsolates(field.getText())).toBe('R');
    });
});

describe('the moves of unit 2', () => {
    it('open each part of the proof as in the course, finding assumptions by statement', () => {
        const level = unit2Levels[8];
        const { workspace, blocks: [, , cases] } = solved(level, [['hw_assume'], ['hw_and_elim', { AND: 'P ∧ (Q ∨ R)' }], ['hw_or_elim', { OR: 'Q ∨ R' }]]);
        buildInto(cases, 'LEFT', [['hw_or_intro', { SIDE: 'LEFT' }], ['hw_and_combine', { LEFT: 'P', RIGHT: 'Q' }], ['hw_exact']]);
        const [right] = buildInto(cases, 'RIGHT', [['hw_or_intro', { SIDE: 'RIGHT' }], ['hw_and_intro']]);
        buildInto(right.getNextBlock(), 'LEFT', [['hw_exact']]);
        buildInto(right.getNextBlock(), 'RIGHT', [['hw_exact']]);
        expect(generateGameLeanCode(workspace, level, '', { includeFallback: false })).toContain([
            '  refine easylean_imp_intro (fun _ => ?_)',
            '  have := And.left ‹P ∧ (Q ∨ R)›',
            '  have := And.right ‹P ∧ (Q ∨ R)›',
            '  cases ‹Q ∨ R› with',
            '  | inl _ =>',
            '    apply Or.inl',
            '    have := And.intro ‹P› ‹Q›',
            '    assumption',
            '  | inr _ =>',
            '    apply Or.inr',
            '    apply And.intro',
            '    ·',
            '      assumption',
            '    ·',
            '      assumption',
        ].join('\n'));
    });

    it('read like a written proof, and head each part with what is proved in it', () => {
        const { blocks: [and, or, combine, andIntro, orIntro, iffElim, iffIntro] } = solved(unit2Levels[8], [
            ['hw_and_elim', { AND: 'P ∧ (Q ∨ R)' }], ['hw_or_elim', { OR: 'Q ∨ R' }], ['hw_and_combine', { LEFT: 'P', RIGHT: 'Q' }],
            ['hw_and_intro'], ['hw_or_intro'], ['hw_iff_elim', { IFF: 'P ↔ Q' }], ['hw_iff_intro'],
        ]);
        expect(phraseOf(and)).toBe('נובע P ונובע (Q ∨ R)');
        expect([phraseOf(or, 'LEFT_TEXT'), phraseOf(or, 'RIGHT_TEXT')]).toEqual(['מקרה ראשון: נניח Q', 'מקרה שני: נניח R']);
        expect(phraseOf(combine)).toBe('נובע (P ∧ Q)');
        expect(phraseOf(iffElim)).toBe('נובע (P → Q) ונובע (Q → P)');

        expect([phraseOf(andIntro), phraseOf(andIntro, 'LEFT_TEXT')]).toEqual(['כדי להוכיח את ה"וגם", נוכיח כל צד לחוד', 'צד שמאל:']);
        andIntro.setStateBefore({ assumptions: [], goal: 'P ∧ (Q ∨ R)' });
        expect([phraseOf(andIntro), phraseOf(andIntro, 'LEFT_TEXT'), phraseOf(andIntro, 'RIGHT_TEXT')])
            .toEqual(['כדי להוכיח (P ∧ (Q ∨ R)) נוכיח כל צד לחוד', 'נוכיח P', 'נוכיח (Q ∨ R)']);
        iffIntro.setStateBefore({ assumptions: [], goal: 'P ∧ Q ↔ Q ∧ P' });
        expect([phraseOf(iffIntro, 'FORWARD_TEXT'), phraseOf(iffIntro, 'BACKWARD_TEXT')])
            .toEqual(['נוכיח ((P ∧ Q) → (Q ∧ P))', 'נוכיח ((Q ∧ P) → (P ∧ Q))']);

        // The side of an "or" is chosen by what it says, once the goal is known.
        const side = orIntro.getField('SIDE');
        expect(side.getValue()).toBe('?');
        orIntro.setStateBefore({ assumptions: [], goal: 'Q ∨ P' });
        expect(phraseOf(orIntro)).toBe('כדי להוכיח (Q ∨ P) די להוכיח');
        expect(side.getOptions(false).map(([label, value]) => [withoutIsolates(label), value])).toEqual([['?', '?'], ['Q', 'LEFT'], ['P', 'RIGHT']]);
        side.setValue('RIGHT');
        expect(withoutIsolates(side.getText())).toBe('P');
    });
});

describe('the moves of unit 3', () => {
    it('are the rules for negation, and find assumptions by statement', () => {
        const level = unit3Levels[9];
        const { workspace } = solved(level, HANDWRITTEN_UNITS[3].levels[9][0].steps);
        expect(generateGameLeanCode(workspace, level, '', { includeFallback: false })).toContain([
            '  apply Classical.byContradiction',
            '  intro _',
            '  refine (absurd ?_ ‹¬(P ∨ ¬P)› : False)',
            '  apply Or.inr',
            '  refine Not.intro (fun _ => ?_)',
            '  refine (absurd ?_ ‹¬(P ∨ ¬P)› : False)',
            '  apply Or.inl',
            '  assumption',
        ].join('\n'));
    });

    it('read like a written proof', () => {
        const { blocks: [contradiction, notIntro, notElim, exfalso, byContradiction] } = solved(unit3Levels[9], [
            ['hw_contradiction', { FACT: 'P ∨ Q' }], ['hw_not_intro'], ['hw_not_elim', { NEGATION: '¬(P ∨ ¬P)' }], ['hw_exfalso'], ['hw_by_contradiction'],
        ]);
        expect(phraseOf(contradiction)).toBe('ואת ¬(P ∨ Q) וזו סתירה.');
        expect(phraseOf(notIntro)).toBe('כדי להוכיח את השלילה, נניח את הטענה שהיא שוללת ונגיע לסתירה');
        notIntro.setStateBefore({ assumptions: [], goal: '¬¬P' });
        expect(phraseOf(notIntro)).toBe('כדי להוכיח ¬¬P נניח ¬P ונגיע לסתירה');
        expect(phraseOf(notElim)).toBe('כדי להגיע לסתירה די להוכיח (P ∨ ¬P)');
        exfalso.setStateBefore({ assumptions: [], goal: 'Q' });
        expect(phraseOf(exfalso)).toBe('מסתירה נובע הכול, ולכן כדי להוכיח Q די להגיע לסתירה');
        byContradiction.setStateBefore({ assumptions: [], goal: 'P ∨ ¬P' });
        expect(phraseOf(byContradiction)).toBe('נוכיח בשלילה: נניח ¬(P ∨ ¬P) ונגיע לסתירה');
    });

    it('reach a contradiction from either a statement or its negation', () => {
        const level = unit3Levels[0];
        const { workspace, blocks: [contradiction] } = solved(level, [['hw_contradiction', { FACT: '¬P' }]]);
        // ¬P contradicts P, unless ¬¬P is in hand.
        expect(phraseOf(contradiction)).toBe('ואת P וזו סתירה.');
        contradiction.setStateBefore({ assumptions: ['¬¬P', '¬P'], goal: 'False' });
        expect(phraseOf(contradiction)).toBe('ואת ¬¬P וזו סתירה.');
        expect(generateGameLeanCode(workspace, level, '', { includeFallback: false })).toContain([
            '  first',
            '  | exact (absurd ‹¬P› ‹¬(¬P)› : False)',
            '  | exact (absurd ‹P› ‹¬P› : False)',
        ].join('\n'));
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
        ['going back by an implication whose conclusion is not the goal',
            'Application type mismatch: The argument\n  h1\nhas type\n  P → Q\nbut is expected to have type\n  ?m.2 → R\nin the application\n  easylean_mp h1',
            'המסקנה של (P → Q) היא Q, אבל צריך להוכיח R. אפשר לעבור לתנאי של גרירה רק כשהמסקנה שלה היא בדיוק מה שצריך להוכיח.'],
        ['going forward from an assumption that is not the condition',
            'Application type mismatch: The argument\n  ?m.6\nhas type\n  P\nbut is expected to have type\n  Q\nin the application\n  easylean_mp ?m.5 ?m.6',
            'ההנחה P היא לא התנאי של הגרירה: התנאי שלה הוא Q.'],
        ['using an assumption that is not an implication as one',
            'Application type mismatch: The argument\n  ?m.5\nhas type\n  P\nbut is expected to have type\n  ?m.3 → ?m.4\nin the application\n  easylean_mp ?m.5',
            'ההנחה P היא לא גרירה, ולכן אין לה תנאי ומסקנה.'],
        ['closing before the goal is in hand, or a statement that is not in hand',
            'Tactic `assumption` failed\n\nP Q : Prop\nh1 : P → Q\nhp : P\n⊢ Q',
            'אין בידינו הנחה שאומרת Q. במצב ההוכחה רואים מה יש לנו ביד.'],
        ['using an "and" that the assumption is not',
            'Application type mismatch: The argument\n  ?m.5\nhas type\n  P\nbut is expected to have type\n  ?m.3 ∧ ?m.4\nin the application\n  And.left ?m.5',
            'ההנחה P היא לא טענת "וגם", ולכן אין לה שני צדדים.'],
        ['using as a negation an assumption that is not one',
            'Application type mismatch: The argument\n  ?m.7\nhas type\n  Q\nbut is expected to have type\n  ¬?m.4\nin the application\n  absurd ?m.6 ?m.7',
            'ההנחה Q היא לא שלילה, ולכן אין טענה שהיא שוללת.'],
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
