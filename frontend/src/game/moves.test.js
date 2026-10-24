import { describe, expect, it } from 'vitest';
import * as Blockly from 'blockly/core';
import { leanGenerator } from '../generator/lean';
import { loadWorkspace, buildProof, buildInto } from '../test/blocklyWorkspace';
import { generateGameLeanCode } from './gameLeanCode';
import { explainLeanMessage } from './leanErrors';
import { withoutIsolates } from './bidi';
import { defineMoveBlocks, normalizeTyped, phraseOf, setLevelLaws } from '../blocks/moves';
import { buildMoveStatesSource, readMoveStates } from './moveStates';
import { unit2Levels } from './unit2World';
import { unit3Levels } from './unit3World';
import { unit4Levels } from './unit4World';
import { unit5Levels } from './unit5World';
import { unit6Levels } from './unit6World';
import { unit7Levels } from './unit7World';
import { unit8Levels } from './unit8World';
import { unit9Levels } from './unit9World';
import { unit10Levels } from './unit10World';
import { UNITS, unitSolutions } from '../../e2e/solutions';

defineMoveBlocks();

const worlds = { 2: unit2Levels, 3: unit3Levels, 4: unit4Levels, 5: unit5Levels, 6: unit6Levels, 7: unit7Levels, 8: unit8Levels, 9: unit9Levels, 10: unit10Levels };

// Builds the parts of the moves that split the proof ([type, fields, parts]).
const buildParts = (blocks, steps) => blocks.forEach((block, index) => Object.entries(steps[index][2] || {})
    .forEach(([input, partSteps]) => buildParts(buildInto(block, input, partSteps), partSteps)));

// A level's workspace with one of its solutions in place of the starting moves.
const solved = (level, steps) => {
    const workspace = loadWorkspace(level.startXml);
    workspace.getTopBlocks(true).find((b) => b.type === 'game_goal').getInputTargetBlock('PROOF')?.dispose(false);
    const blocks = buildProof(workspace, steps);
    buildParts(blocks, steps);
    return { workspace, blocks };
};

// The blocks of a solution, including those inside the parts of a move.
const usedBlocks = (steps) => new Set(steps.flatMap(([type, , parts = {}]) => [type, ...Object.values(parts).flatMap((part) => [...usedBlocks(part)])]));

describe.each(UNITS.map(({ unit, levels }) => [unit, levels]))('unit %i', (unit, solutions) => {
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
        // A level with drawers offers all the moves; the others only those of their solutions.
        if (!level.toolboxDrawers) expect(level.toolboxBlocks.filter((type) => !used.has(type))).toEqual([]);
        levelSolutions.forEach(({ steps }) => usedBlocks(steps).forEach((type) => expect(level.toolboxBlocks).toContain(type)));
    });

    it.each(levels.map((level) => [level.id, level]))('%s never shows an assumption name', (_, level) => {
        const shown = [level.introduction, level.conclusion, ...level.hints, level.startXml].join('\n');
        expect(shown).not.toMatch(/\bh\d*\b|\bh[pq]\b/);
    });
});

describe('the moves', () => {
    it('find each assumption by its statement', () => {
        const level = unit2Levels[5];
        const { workspace } = solved(level, unitSolutions(2).levels[5][1].steps);
        expect(generateGameLeanCode(workspace, level, '', { includeFallback: false })).toContain([
            '  easylean_assume',
            '  ·',
            '    easylean_assume',
            '    ·',
            '      easylean_assume',
            '      ·',
            '        (first | fail_if_success have : ¬ _ := ‹P → Q› | fail "easylean: forward by a negation: P → Q"); have := easylean_mp ‹P → Q› ‹P›',
            '        (first | fail_if_success have : ¬ _ := ‹Q → R› | fail "easylean: forward by a negation: Q → R"); have := easylean_mp ‹Q → R› ‹Q›',
            '        assumption',
        ].join('\n'));
    });

    it('read like a written proof, following the proof state and their fields', () => {
        const { blocks: [assume, forward, backward] } = solved(unit2Levels[5], [
            ['assume'], ['forward', { RULE: 'P → Q', PREMISE: 'P' }], ['apply_rule', { RULE: 'Q → R' }],
        ]);
        expect(phraseOf(assume)).toBe('נניח את התנאי של הגרירה. עלינו להראות את המסקנה שלה.');
        assume.setStateBefore({ assumptions: [], goal: '(P → Q) → (Q → R) → P → R' });
        // An opening line and a closing line, as the course writes them.
        expect(phraseOf(assume)).toBe('נניח (P → Q). עלינו להראות ((Q → R) → (P → R)).');
        expect(phraseOf(assume, 'CLOSE')).toBe('לכן ((P → Q) → ((Q → R) → (P → R))).');
        expect(phraseOf(forward)).toBe('נקבל Q.');
        expect(phraseOf(backward)).toBe('כדי להוכיח R די להוכיח Q.');
    });

    it('offer the assumptions in hand before them, and typing one in', () => {
        const { blocks: [backward] } = solved(unit2Levels[2], [['apply_rule']]);
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

    it('read what is typed in Lean\'s notation, a subscript after an underscore', () => {
        expect(normalizeTyped('  P x_0 -> Q  x_12 ')).toBe('P x₀ → Q x₁₂');
        expect(normalizeTyped('⊥')).toBe('False');
    });
});

describe('the moves of unit 3', () => {
    it('open each part of the proof, finding assumptions by statement', () => {
        const level = unit3Levels[8];
        const { workspace, blocks: [, , cases] } = solved(level, [['assume'], ['and_elim', { AND: 'P ∧ (Q ∨ R)' }], ['or_elim', { OR: 'Q ∨ R' }]]);
        buildInto(cases, 'LEFT', [['or_intro', { SIDE: 'LEFT' }], ['and_combine', { LEFT: 'P', RIGHT: 'Q' }], ['exact']]);
        const [, split] = buildInto(cases, 'RIGHT', [['or_intro', { SIDE: 'RIGHT' }], ['and_intro']]);
        buildInto(split, 'LEFT', [['exact']]);
        buildInto(split, 'RIGHT', [['exact']]);
        expect(generateGameLeanCode(workspace, level, '', { includeFallback: false })).toContain([
            '  easylean_assume',
            '  ·',
            '    have := And.left ‹P ∧ (Q ∨ R)›',
            '    have := And.right ‹P ∧ (Q ∨ R)›',
            '    cases ‹Q ∨ R› with',
            '    | inl _ =>',
            '      apply Or.inl',
            '      ·',
            '        have := And.intro ‹P› ‹Q›',
            '        assumption',
            '    | inr _ =>',
            '      apply Or.inr',
            '      ·',
            '        apply And.intro',
            '        ·',
            '          assumption',
            '        ·',
            '          assumption',
        ].join('\n'));
    });

    it('read like a written proof, and head each part with what is proved in it', () => {
        const { blocks: [and, combine, iffElim, or] } = solved(unit3Levels[8], [
            ['and_elim', { AND: 'P ∧ (Q ∨ R)' }], ['and_combine', { LEFT: 'P', RIGHT: 'Q' }], ['iff_elim', { IFF: 'P ↔ Q' }], ['or_elim', { OR: 'Q ∨ R' }],
        ]);
        const [andIntro] = buildInto(or, 'LEFT', [['and_intro']]);
        const [iffIntro] = buildInto(andIntro, 'LEFT', [['iff_intro']]);
        const [orIntro] = buildInto(andIntro, 'RIGHT', [['or_intro']]);
        expect(phraseOf(and)).toBe('נקבל P וגם (Q ∨ R).');
        expect([phraseOf(or, 'LEFT_TEXT'), phraseOf(or, 'RIGHT_TEXT')]).toEqual(['מקרה 1: Q', 'מקרה 2: R']);
        or.setStateBefore({ assumptions: [], goal: 'S' });
        expect(phraseOf(or, 'CLOSE')).toBe('המקרים מכסים את כל האפשרויות, ובשניהם S.');
        expect(phraseOf(combine)).toBe('נקבל (P ∧ Q).');
        expect(phraseOf(iffElim)).toBe('נקבל (P → Q) וגם (Q → P).');

        expect([phraseOf(andIntro), phraseOf(andIntro, 'LEFT_TEXT')]).toEqual(['נוכיח את שני החלקים של ה"וגם".', 'החלק הראשון:']);
        andIntro.setStateBefore({ assumptions: [], goal: 'P ∧ (Q ∨ R)' });
        expect([phraseOf(andIntro), phraseOf(andIntro, 'LEFT_TEXT'), phraseOf(andIntro, 'RIGHT_TEXT'), phraseOf(andIntro, 'CLOSE')])
            .toEqual(['נוכיח את שני החלקים של (P ∧ (Q ∨ R)).', 'החלק הראשון: P', 'החלק השני: (Q ∨ R)', 'הוכחנו את שני החלקים, ולכן (P ∧ (Q ∨ R)).']);
        iffIntro.setStateBefore({ assumptions: [], goal: 'P ∧ Q ↔ Q ∧ P' });
        expect([phraseOf(iffIntro, 'FORWARD_TEXT'), phraseOf(iffIntro, 'BACKWARD_TEXT')])
            .toEqual(['הכיוון הראשון: ((P ∧ Q) → (Q ∧ P))', 'הכיוון השני: ((Q ∧ P) → (P ∧ Q))']);

        // The side of an "or" is chosen by what it says, once the goal is known.
        const side = orIntro.getField('SIDE');
        expect(side.getValue()).toBe('?');
        orIntro.setStateBefore({ assumptions: [], goal: 'Q ∨ P' });
        expect([phraseOf(orIntro), phraseOf(orIntro, 'CLOSE')]).toEqual(['כדי להוכיח (Q ∨ P) נוכיח את', 'לכן (Q ∨ P).']);
        expect(side.getOptions(false).map(([label, value]) => [withoutIsolates(label), value])).toEqual([['?', '?'], ['Q', 'LEFT'], ['P', 'RIGHT']]);
        side.setValue('RIGHT');
        expect(withoutIsolates(side.getText())).toBe('P');
    });
});

describe('the moves of unit 4', () => {
    it('are the rules for negation, prove an "or" as the lecture does, and find assumptions by statement', () => {
        const level = unit4Levels[10];
        const { workspace } = solved(level, unitSolutions(4).levels[10][0].steps);
        const lean = generateGameLeanCode(workspace, level, '', { includeFallback: false });
        // Assume the negation of the first side, ¬¬P, and prove the second, Q.
        expect(lean).toContain(['    refine easylean_or_by_negation (fun _ => ?_)', '    ·'].join('\n'));
        // Q by P → Q, and P by contradiction with ¬¬P.
        expect(lean).toContain(['refine easylean_mp ‹P → Q› ?_', '      apply Classical.byContradiction', '      intro _', '      ·',
            '        refine (absurd ?_ ‹¬¬P› : False)', '        assumption'].join('\n'));
    });

    it('read like a written proof', () => {
        const { blocks: [notElim, exfalso, byContradiction, notIntro, contradiction] } = solved(unit4Levels[9], [
            ['not_elim', { NEGATION: '¬(P ∨ ¬P)' }], ['exfalso'], ['by_contradiction'], ['not_intro'], ['contradiction', { FACT: 'P ∨ Q' }],
        ]);
        expect(phraseOf(contradiction)).toBe('וגם ¬(P ∨ Q), בסתירה.');
        expect(phraseOf(notIntro)).toBe('נניח בשלילה את הטענה שהמטרה שוללת. עלינו להגיע לסתירה.');
        notIntro.setStateBefore({ assumptions: [], goal: '¬¬P' });
        expect([phraseOf(notIntro), phraseOf(notIntro, 'CLOSE')]).toEqual(['נניח בשלילה ¬P. עלינו להגיע לסתירה.', 'קיבלנו סתירה, ולכן ¬¬P.']);
        expect(phraseOf(notElim)).toBe('כדי להגיע לסתירה די להוכיח (P ∨ ¬P).');
        exfalso.setStateBefore({ assumptions: [], goal: 'Q' });
        expect(phraseOf(exfalso)).toBe('מסתירה נובע הכול: כדי להוכיח Q די להגיע לסתירה.');
        byContradiction.setStateBefore({ assumptions: [], goal: 'P ∨ ¬P' });
        expect([phraseOf(byContradiction), phraseOf(byContradiction, 'CLOSE')]).toEqual(['נניח בשלילה ¬(P ∨ ¬P). עלינו להגיע לסתירה.', 'קיבלנו סתירה, ולכן (P ∨ ¬P).']);
    });

    it('reach a contradiction from either a statement or its negation', () => {
        const level = unit4Levels[0];
        const { workspace, blocks: [contradiction] } = solved(level, [['contradiction', { FACT: '¬P' }]]);
        // ¬P contradicts P, unless ¬¬P is in hand.
        expect(phraseOf(contradiction)).toBe('וגם P, בסתירה.');
        contradiction.setStateBefore({ assumptions: ['¬¬P', '¬P'], goal: 'False' });
        expect(phraseOf(contradiction)).toBe('וגם ¬¬P, בסתירה.');
        expect(generateGameLeanCode(workspace, level, '', { includeFallback: false })).toContain([
            '  first',
            '  | exact (absurd ‹¬P› ‹¬(¬P)› : False)',
            '  | exact (absurd ‹P› ‹¬P› : False)',
        ].join('\n'));
    });
});

describe('the moves of unit 5', () => {
    it('name a new object after the quantified variable with a subscript, apart from the bound one, and find assumptions by statement', () => {
        const level = unit5Levels[8];
        const { workspace, blocks: [, forallIntro, existsElim] } = solved(level, unitSolutions(5).levels[8][0].steps);
        forallIntro.setStateBefore({ assumptions: ['∃ x, ∀ (y : obj), R x y'], objects: [], goal: '∀ (y : obj), ∃ x, R x y' });
        existsElim.setStateBefore({ assumptions: ['∃ x, ∀ (y : obj), R x y'], objects: ['y₀'], goal: '∃ x, R x y₀' });
        expect(generateGameLeanCode(workspace, level, '', { includeFallback: false })).toContain([
            '  easylean_assume',
            '  ·',
            '    refine easylean_forall_intro (fun y₀ => ?_)',
            '    ·',
            '      refine Exists.elim ‹∃ x, ∀ y, R x y› (fun x₀ _ => ?_)',
            '      have := easylean_forall_elim ‹∀ y, R x₀ y› (y₀)',
            '      apply Exists.intro (x₀)',
            '      ·',
            '        assumption',
        ].join('\n'));
        expect([phraseOf(forallIntro), phraseOf(forallIntro, 'CLOSE')])
            .toEqual(['יהי y₀ שרירותי. עלינו להראות ∃x (R(x,y₀)).', 'מאחר ש־ y₀ שרירותי, ∀y (∃x (R(x,y))).']);
        expect(phraseOf(existsElim)).toBe('נסמן ב־ x₀ עצם כזה, כלומר ∀y (R(x₀,y)).');
    });

    it('substitute the chosen object, and give a new object the next subscript when x₀ is taken', () => {
        const { blocks: [forallElim, existsElim, existsIntro] } = solved(unit5Levels[6], [
            ['forall_elim', { FORALL: '∀ (x : obj), P x → Q x', TERM: 'a' }], ['exists_elim', { EXISTS: '∃ x, P x' }], ['exists_intro', { TERM: 'a' }],
        ]);
        expect(phraseOf(forallElim)).toBe('ונקבל (P(a) → Q(a)).');
        expect(withoutIsolates(forallElim.getFieldValue('VARIABLE'))).toBe('x =');
        existsIntro.setStateBefore({ assumptions: [], objects: ['a'], goal: '∃ x, Q x' });
        expect([phraseOf(existsIntro), phraseOf(existsIntro, 'AFTER'), phraseOf(existsIntro, 'CLOSE')])
            .toEqual(['נבחר x =', 'עלינו להראות Q(a).', 'לכן קיים x כזה: ∃x (Q(x)).']);
        expect(existsIntro.getField('TERM').getOptions(false).map(([, value]) => value)).toEqual(['a', '__write_own__']);
        // A name already taken gets the next subscript.
        existsElim.setStateBefore({ assumptions: ['∃ x, P x'], objects: ['x₀'], goal: '∃ x, Q x' });
        expect(phraseOf(existsElim)).toBe('נסמן ב־ x₁ עצם כזה, כלומר P(x₁).');
    });
});

describe('the moves of lesson 2, on sets', () => {
    it('read like a written proof, and name the definition they use', () => {
        const { blocks: [subsetIntro, subsetElim, setEq, unfoldHyp, unfoldGoal] } = solved(unit9Levels[4], [
            ['subset_intro'], ['subset_elim', { SUBSET: 'A ⊆ B', MEMBER: 'x ∈ A' }], ['set_eq'],
            ['unfold', { STATEMENT: 'x ∈ A ∩ (B ∪ C)' }], ['unfold', { STATEMENT: 'x ∈ A ∆ B' }],
        ]);
        // An element keeps the variable's name, as in the lecture ("יהי x ∈ A").
        subsetIntro.setStateBefore({ assumptions: [], objects: [], sets: ['A', 'B', 'C'], goal: 'A ∩ (B ∪ C) ⊆ A ∩ B ∪ A ∩ C' });
        expect(phraseOf(subsetIntro)).toBe('כדי להוכיח A ∩ (B ∪ C) ⊆ (A ∩ B) ∪ (A ∩ C) יהי x ∈ (A ∩ (B ∪ C)) ונוכיח x ∈ ((A ∩ B) ∪ (A ∩ C))');
        expect(phraseOf(subsetElim)).toBe('נובע x ∈ B');
        setEq.setStateBefore({ assumptions: [], objects: [], sets: [], goal: 'A ∩ B = B ∩ A' });
        expect([phraseOf(setEq, 'FIRST_TEXT'), phraseOf(setEq, 'SECOND_TEXT')]).toEqual(['נוכיח A ∩ B ⊆ B ∩ A', 'נוכיח B ∩ A ⊆ A ∩ B']);
        expect([phraseOf(unfoldHyp, 'NAME'), phraseOf(unfoldHyp)]).toEqual(['לפי הגדרת החיתוך,', 'פירושו (x ∈ A ∧ x ∈ (B ∪ C))']);
        // The symmetric difference, as the lecture defines it.
        unfoldGoal.setStateBefore({ assumptions: [], objects: ['x'], sets: [], goal: 'x ∈ A ∆ B' });
        expect([phraseOf(unfoldGoal, 'NAME'), phraseOf(unfoldGoal)]).toEqual(['לפי הגדרת ההפרש הסימטרי, כדי להוכיח', 'די להוכיח ((x ∈ A ∧ ¬x ∈ B) ∨ (¬x ∈ A ∧ x ∈ B))']);
        // The menu offers only membership statements with a definition to use, the goal first.
        unfoldGoal.setStateBefore({ assumptions: ['A ⊆ B', 'x ∈ A', 'x ∈ A ∪ B'], objects: ['x'], sets: [], goal: 'x ∈ B ∩ A' });
        expect(unfoldGoal.getField('STATEMENT').getOptions(false).map(([, value]) => value)).toEqual(['x ∈ A ∆ B', 'x ∈ B ∩ A', 'x ∈ A ∪ B', '__write_own__']);
    });

    it('use a definition on the goal or on an assumption without waiting for the proof state', () => {
        const level = unit9Levels[1];
        const { workspace } = solved(level, unitSolutions(9).levels[1][0].steps);
        expect(generateGameLeanCode(workspace, level, '', { includeFallback: false })).toContain([
            '  first',
            '  | refine easylean_subset_intro_pair (fun x y _ => ?_)',
            '  | refine easylean_subset_intro (fun x _ => ?_)',
            '  first',
            '  | (guard_target =ₛ x ∈ A ∩ B; apply easylean_mem_inter.mpr)',
            '  | (have := easylean_mem_inter.mp ‹x ∈ A ∩ B›)',
            '  have := And.left ‹x ∈ A ∧ x ∈ B›',
        ].join('\n'));
    });

    it('name an element of a power set as a set, and a second element x₀', () => {
        const { blocks: [subsetIntro, inner] } = solved(unit10Levels[2], [['subset_intro'], ['subset_intro']]);
        subsetIntro.setStateBefore({ assumptions: ['A ⊆ B'], objects: [], sets: ['A', 'B'], goal: '𝒫 A ⊆ 𝒫 B' });
        expect(phraseOf(subsetIntro)).toBe('כדי להוכיח 𝒫(A) ⊆ 𝒫(B) יהי X ∈ 𝒫(A) ונוכיח X ∈ 𝒫(B)');
        inner.setStateBefore({ assumptions: ['x ∈ A'], objects: ['x'], sets: ['A'], goal: 'A ⊆ A' });
        expect(phraseOf(inner)).toBe('כדי להוכיח A ⊆ A יהי x₀ ∈ A ונוכיח x₀ ∈ A');
        // Nor the name of a variable bound in a statement in hand.
        inner.setStateBefore({ assumptions: ['¬∃ x, x ∈ A ∧ ¬x ∈ B'], objects: [], sets: ['A', 'B'], goal: 'A ⊆ B' });
        expect(phraseOf(inner)).toBe('כדי להוכיח A ⊆ B יהי x₀ ∈ A ונוכיח x₀ ∈ B');
    });
});

describe('the moves of unit 6', () => {
    const options = (block, field) => block.getField(field).getOptions(false).map(([label, value]) => [withoutIsolates(label), value]);

    it('replace by a law, in the goal or in a statement in hand', () => {
        const level = unit6Levels[2];
        const { workspace } = solved(level, unitSolutions(6).levels[2][0].steps);
        const code = generateGameLeanCode(workspace, level, '', { includeFallback: false });
        expect(code).toContain('theorem easylean_imp_or ');
        expect(code).toContain('  (first | rewrite (occs := .pos [1]) [easylean_imp_or] | simp only [easylean_imp_or] | fail "easylean: no part of the form (A → B)")\n');
        const inHand = solved(unit6Levels[4], unitSolutions(6).levels[4][0].steps).workspace;
        expect(generateGameLeanCode(inHand, unit6Levels[4], '', { includeFallback: false }))
            .toContain('  have := ‹¬(P ∨ Q)›; (first | rewrite (occs := .pos [1]) [easylean_not_or] at this | simp only [easylean_not_or] at this | fail "easylean: no part of the form ¬(A ∨ B)")\n');
    });

    it('keep the bound variables of the formula when a law is about a quantifier', () => {
        const level = unit6Levels[7];
        const { workspace } = solved(level, unitSolutions(6).levels[7][0].steps);
        const code = generateGameLeanCode(workspace, level, '', { includeFallback: false });
        expect(code).toContain('have easylean_law : ∀ (α : Type) (p : α → Prop), (¬∀ x, p x) ↔ ∃ x, ¬p x := fun _ _ => easylean_not_forall;');
        expect(code).toContain('have easylean_law : ∀ (α : Type) (p : α → Prop), (¬∃ y, p y) ↔ ∀ y, ¬p y := fun _ _ => easylean_not_exists;');
    });

    it("offer the level's laws, and what the chosen one replaces in the chosen place", () => {
        setLevelLaws(unit6Levels[6].laws);
        const { blocks: [, first, second] } = solved(unit6Levels[6], unitSolutions(6).levels[6][0].steps);
        expect(options(first, 'LAW')).toEqual([['?', '?'], ['¬(A ∨ B) ↔ (¬A ∧ ¬B)', 'easylean_not_or'], ['¬¬A ↔ A', 'easylean_not_not']]);
        // The place has no part of the other side's form: that direction shows the law.
        expect(options(first, 'DIRECTION')).toEqual([['את ¬(P ∨ ¬Q) ב־(¬P ∧ ¬¬Q)', 'FORWARD'], ['את (¬A ∧ ¬B) ב־¬(A ∨ B)', 'BACKWARD']]);
        // Double negation only removes one: backward, A fits any statement.
        expect(options(second, 'DIRECTION')).toEqual([['את ¬¬Q ב־Q', 'FORWARD']]);
        setLevelLaws([]);
    });
});

describe('the proof state before each move', () => {
    it('lists lists by name, and a statement about a list as an assumption', () => {
        const output = [
            'proof.lean:2:0: error: unsolved goals',
            'α : Type', 'm : List α', 'a : α', 'l : List α',
            'tail_ih✝ : List.length (l ++ m) = List.length l + List.length m',
            '⊢ List.length (l ++ m) + 1 = List.length l + 1 + List.length m',
        ].join('\n');
        const states = readMoveStates(output, { segments: [{ blockId: 'move', after: false, offset: 0, firstLine: 1, lastLine: 9, stateLine: 2 }] });
        expect(states.get('move')).toEqual({
            assumptions: ['List.length (l ++ m) = List.length l + List.length m'],
            objects: ['m', 'a', 'l'],
            sets: [],
            relations: [],
            functions: [],
            goal: 'List.length (l ++ m) + 1 = List.length l + 1 + List.length m',
        });
    });

    it('comes from one check, a theorem per move', () => {
        const level = unit2Levels[1];
        const { workspace, blocks } = solved(level, unitSolutions(2).levels[1][0].steps);
        const source = buildMoveStatesSource(workspace, level);
        expect(source.code.match(/^theorem unit2_l2_identity_before_\d/gm)).toHaveLength(2);
        expect(source.code.match(/^theorem easylean_mp /gm)).toHaveLength(1);
        // Lean's output for this code (lines 11-12, and 13-16, where the
        // inside of the assumption opens on line 15).
        const output = [
            'proof.lean:12:8: error: don\'t know how to synthesize placeholder', 'context:', 'P : Prop', '⊢ P → P',
            'proof.lean:11:50: error: unsolved goals', 'P : Prop', '⊢ P → P',
            'proof.lean:15:2: error: unsolved goals', 'P : Prop', 'x✝ : P', '⊢ P',
        ].join('\n');
        const states = readMoveStates(output, source);
        expect(states.get(blocks[0].id)).toEqual({ assumptions: [], objects: [], sets: [], relations: [], functions: [], goal: 'P → P' });
        expect(states.get(blocks[1].id)).toEqual({ assumptions: ['P'], objects: [], sets: [], relations: [], functions: [], goal: 'P' });
    });
});

describe('the explanations of the moves', () => {
    // Lean's messages for wrong moves, as the moves generate them.
    const explain = (message) => withoutIsolates(explainLeanMessage(message));

    it.each([
        ['arithmetic from the goal alone, where it is not enough',
            'easylean: arithmetic from the goal alone\nn : Nat\n⊢ n + 1 ≤ 2 ^ n * 2',
            'החשבון מהמטרה לבדה לא מספיק כדי להוכיח אותה. אולי צריך קודם לפתוח הגדרה, או להחליף לפי הנחת האינדוקציה? אם אי אפשר להחליף לפי ההנחה (למשל כשהיא אי־שוויון), משתמשים בבלוק "נכונות המטרה נובעת מחשבון פשוט ומ־ ?", ובוחרים בו את ההנחה.'],
        ['replacing by a law a side that is not there',
            'easylean: no part of the form ¬(A ∨ B)\nP Q : Prop\n⊢ Q',
            'במקום שבחרתם אין חלק מהצורה ¬(A ∨ B), ולכן אין מה להחליף. בדקו את המקום ואת כיוון ההחלפה.'],
        ['going forward from a negation as from an implication',
            'easylean: forward by a negation: ¬Q\nQ : Prop\n⊢ False',
            'ההנחה ¬Q היא שלילה, ולא גרירה. כדי להגיע לסתירה משלילה ומהטענה שהיא שוללת, משתמשים בבלוק "יש לנו ביד את ? ואת השלילה שלה, וזו סתירה."'],
        ['going back by a negation as by an implication',
            'easylean: backward by a negation: ¬Q\nQ : Prop\n⊢ False',
            'ההנחה ¬Q היא שלילה, ולא גרירה. כדי להגיע לסתירה בעזרת שלילה, משתמשים בבלוק "לפי השלילה ? שיש לנו ביד".'],
        ['assuming the condition of a goal that is a negation',
            'easylean: the goal is a negation\nP : Prop\n⊢ ¬P',
            'המטרה ¬P היא שלילה, ולא גרירה. כדי להוכיח שלילה משתמשים בבלוק "כדי להוכיח את השלילה, נניח את הטענה שהיא שוללת ונגיע לסתירה".'],
        ['assuming the condition of a goal that is a negation by a definition',
            'easylean: the goal is a negation\nA : Set U\nx₀ : U\n⊢ x₀ ∈ Aᶜ',
            'המטרה x₀ ∈ Aᶜ היא, לפי ההגדרה, שלילה, ולא גרירה. כדי להוכיח שלילה משתמשים בבלוק "כדי להוכיח את השלילה, נניח את הטענה שהיא שוללת ונגיע לסתירה".'],
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
        ['using as a "for all" an assumption that is not one',
            'Application type mismatch: The argument\n  ?m.5\nhas type\n  P a\nbut is expected to have type\n  ∀ (x : ?m.3), ?m.4 x\nin the application\n  easylean_forall_elim ?m.5',
            'ההנחה P(a) היא לא טענת "לכל", ולכן אין במה להציב עצם.'],
        ['using as a "there exists" an assumption that is not one',
            'Application type mismatch: The argument\n  ?m.5\nhas type\n  P a\nbut is expected to have type\n  ∃ x, ?m.3 x\nin the application\n  Exists.elim ?m.5',
            'ההנחה P(a) היא לא טענת "קיים", ולכן אין עצם לקבל ממנה.'],
        ['using an inclusion with a membership in another set',
            'Application type mismatch: The argument\n  hx\nhas type\n  x₀ ∈ C\nbut is expected to have type\n  ?m.14 ∈ A\nin the application\n  easylean_subset_elim h hx',
            'ההנחה x₀ ∈ C לא אומרת שהאיבר שייך ל־A, הקבוצה המוכלת בהכלה.'],
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
