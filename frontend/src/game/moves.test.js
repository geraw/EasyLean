import { describe, expect, it } from 'vitest';
import * as Blockly from 'blockly/core';
import { leanGenerator } from '../generator/lean';
import { loadWorkspace, buildProof, buildInto } from '../test/blocklyWorkspace';
import { generateGameLeanCode } from './gameLeanCode';
import { explainLeanMessage } from './leanErrors';
import { withoutIsolates } from './bidi';
import { defineMoveBlocks, headingOf, phraseOf, setLevelLaws, setLevelStructure } from '../blocks/moves';
import { buildMoveStatesSource, readMoveStates } from './moveStates';
import { unit0Levels } from './unit0World';
import { unit1Levels } from './unit1World';
import { unit2Levels } from './unit2World';
import { unit3Levels } from './unit3World';
import { unit4Levels } from './unit4World';
import { unit5Levels } from './unit5World';
import { unit6Levels } from './unit6World';
import { unit7Levels } from './unit7World';
import { unit8Levels } from './unit8World';
import { unit9Levels } from './unit9World';
import { unit10Levels } from './unit10World';
import { unit11Levels } from './unit11World';
import { unit12Levels } from './unit12World';
import { UNITS } from '../../e2e/solutions';

defineMoveBlocks();

const worlds = { 0: unit0Levels, 1: unit1Levels, 2: unit2Levels, 3: unit3Levels, 4: unit4Levels, 5: unit5Levels, 6: unit6Levels, 7: unit7Levels, 8: unit8Levels, 9: unit9Levels, 10: unit10Levels, 11: unit11Levels, 12: unit12Levels };

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
        const level = unit1Levels[4];
        const { workspace } = solved(level, UNITS[1].levels[4][1].steps);
        expect(generateGameLeanCode(workspace, level, '', { includeFallback: false })).toContain([
            '  easylean_assume',
            '  easylean_assume',
            '  easylean_assume',
            '  (first | fail_if_success have : ¬ _ := ‹P → Q› | fail "easylean: forward by a negation: P → Q"); have := easylean_mp ‹P → Q› ‹P›',
            '  (first | fail_if_success have : ¬ _ := ‹Q → R› | fail "easylean: forward by a negation: Q → R"); have := easylean_mp ‹Q → R› ‹Q›',
            '  assumption',
        ].join('\n'));
    });

    it('read like a written proof, following the proof state and their fields', () => {
        const { blocks: [assume, forward, backward] } = solved(unit1Levels[4], [
            ['assume'], ['forward', { RULE: 'P → Q', PREMISE: 'P' }], ['apply_rule', { RULE: 'Q → R' }],
        ]);
        expect(phraseOf(assume)).toBe('כדי להוכיח את הגרירה, נניח את התנאי שלה ונוכיח את המסקנה שלה');
        assume.setStateBefore({ assumptions: [], goal: '(P → Q) → (Q → R) → P → R' });
        expect(phraseOf(assume)).toBe('כדי להוכיח את הגרירה, נניח (P → Q) ונוכיח ((Q → R) → (P → R))');
        expect(phraseOf(forward)).toBe('נובע Q');
        expect(phraseOf(backward)).toBe('כדי להוכיח R די להוכיח Q');
    });

    it('offer the assumptions in hand before them, and typing one in', () => {
        const { blocks: [backward] } = solved(unit1Levels[1], [['apply_rule']]);
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
    it('open each part of the proof, finding assumptions by statement', () => {
        const level = unit2Levels[8];
        const { workspace, blocks: [, , cases] } = solved(level, [['assume'], ['and_elim', { AND: 'P ∧ (Q ∨ R)' }], ['or_elim', { OR: 'Q ∨ R' }]]);
        buildInto(cases, 'LEFT', [['or_intro', { SIDE: 'LEFT' }], ['and_combine', { LEFT: 'P', RIGHT: 'Q' }], ['exact']]);
        const [right] = buildInto(cases, 'RIGHT', [['or_intro', { SIDE: 'RIGHT' }], ['and_intro']]);
        buildInto(right.getNextBlock(), 'LEFT', [['exact']]);
        buildInto(right.getNextBlock(), 'RIGHT', [['exact']]);
        expect(generateGameLeanCode(workspace, level, '', { includeFallback: false })).toContain([
            '  easylean_assume',
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
            ['and_elim', { AND: 'P ∧ (Q ∨ R)' }], ['or_elim', { OR: 'Q ∨ R' }], ['and_combine', { LEFT: 'P', RIGHT: 'Q' }],
            ['and_intro'], ['or_intro'], ['iff_elim', { IFF: 'P ↔ Q' }], ['iff_intro'],
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
        const { workspace } = solved(level, UNITS[3].levels[9][0].steps);
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
            ['contradiction', { FACT: 'P ∨ Q' }], ['not_intro'], ['not_elim', { NEGATION: '¬(P ∨ ¬P)' }], ['exfalso'], ['by_contradiction'],
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
        const { workspace, blocks: [contradiction] } = solved(level, [['contradiction', { FACT: '¬P' }]]);
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

describe('the moves of unit 4', () => {
    it('name new objects after the quantified variable with a subscript, and find assumptions by statement', () => {
        const level = unit4Levels[8];
        const { workspace, blocks: [, forallIntro, existsElim] } = solved(level, UNITS[4].levels[8][0].steps);
        forallIntro.setStateBefore({ assumptions: ['∃ x, ∀ (y : obj), R x y'], objects: [], goal: '∀ (y : obj), ∃ x, R x y' });
        existsElim.setStateBefore({ assumptions: ['∃ x, ∀ (y : obj), R x y'], objects: ['y₀'], goal: '∃ x, R x y₀' });
        expect(generateGameLeanCode(workspace, level, '', { includeFallback: false })).toContain([
            '  easylean_assume',
            '  refine easylean_forall_intro (fun y₀ => ?_)',
            '  refine Exists.elim ‹∃ x, ∀ y, R x y› (fun x₀ _ => ?_)',
            '  have := easylean_forall_elim ‹∀ y, R x₀ y› (y₀)',
            '  apply Exists.intro (x₀)',
            '  assumption',
        ].join('\n'));
        expect(phraseOf(forallIntro)).toBe('כדי להוכיח ∀y (∃x (R(x,y))) יהי y₀ עצם שרירותי, ונוכיח ∃x (R(x,y₀))');
        expect(phraseOf(existsElim)).toBe('יהי x₀ עצם כך ש־ ∀y (R(x₀,y))');
    });

    it('substitute the chosen object, and pick the next subscript when a name is taken', () => {
        const { blocks: [forallElim, existsIntro, existsElim] } = solved(unit4Levels[6], [
            ['forall_elim', { FORALL: '∀ (x : obj), P x → Q x', TERM: 'a' }], ['exists_intro', { TERM: 'a' }], ['exists_elim', { EXISTS: '∃ x, P x' }],
        ]);
        expect(phraseOf(forallElim)).toBe('נובע (P(a) → Q(a))');
        existsIntro.setStateBefore({ assumptions: [], objects: ['a'], goal: '∃ x, Q x' });
        expect([phraseOf(existsIntro), phraseOf(existsIntro, 'AFTER')]).toEqual(['כדי להוכיח ∃x (Q(x)) נבחר את העצם', 'ונוכיח Q(a)']);
        expect(existsIntro.getField('TERM').getOptions(false).map(([, value]) => value)).toEqual(['a', '__write_own__']);
        existsElim.setStateBefore({ assumptions: ['∃ x, P x'], objects: ['x₀'], goal: '∃ x, Q x' });
        expect(phraseOf(existsElim)).toBe('יהי x₁ עצם כך ש־ P(x₁)');
    });
});

describe('the moves of unit 5', () => {
    const options = (block, field) => block.getField(field).getOptions(false).map(([label, value]) => [withoutIsolates(label), value]);

    it('replace by a law, in the goal or in a statement in hand', () => {
        const level = unit5Levels[5];
        const { workspace } = solved(level, UNITS[5].levels[5][0].steps);
        const code = generateGameLeanCode(workspace, level, '', { includeFallback: false });
        expect(code).toContain('theorem easylean_imp_or ');
        expect(code).toContain('  (first | rewrite (occs := .pos [1]) [easylean_imp_or] | simp only [easylean_imp_or] | fail "easylean: no part of the form (A → B)")\n');
        const inHand = solved(unit5Levels[6], UNITS[5].levels[6][0].steps).workspace;
        expect(generateGameLeanCode(inHand, unit5Levels[6], '', { includeFallback: false }))
            .toContain('  have := ‹¬(P ∨ Q)›; (first | rewrite (occs := .pos [1]) [easylean_not_or] at this | simp only [easylean_not_or] at this | fail "easylean: no part of the form ¬(A ∨ B)")\n');
    });

    it('keep the bound variables of the formula when a law is about a quantifier', () => {
        const level = unit5Levels[9];
        const { workspace } = solved(level, UNITS[5].levels[9][0].steps);
        const code = generateGameLeanCode(workspace, level, '', { includeFallback: false });
        expect(code).toContain('have easylean_law : ∀ (α : Type) (p : α → Prop), (¬∀ x, p x) ↔ ∃ x, ¬p x := fun _ _ => easylean_not_forall;');
        expect(code).toContain('have easylean_law : ∀ (α : Type) (p : α → Prop), (¬∃ y, p y) ↔ ∀ y, ¬p y := fun _ _ => easylean_not_exists;');
    });

    it("offer the level's laws, and what the chosen one replaces in the chosen place", () => {
        setLevelLaws(unit5Levels[8].laws);
        const { blocks: [, first, second] } = solved(unit5Levels[8], UNITS[5].levels[8][0].steps);
        expect(options(first, 'LAW')).toEqual([['?', '?'], ['¬(A ∨ B) ↔ (¬A ∧ ¬B)', 'easylean_not_or'], ['¬¬A ↔ A', 'easylean_not_not']]);
        // The place has no part of the other side's form: that direction shows the law.
        expect(options(first, 'DIRECTION')).toEqual([['את ¬(P ∨ ¬Q) ב־(¬P ∧ ¬¬Q)', 'FORWARD'], ['את (¬A ∧ ¬B) ב־¬(A ∨ B)', 'BACKWARD']]);
        // Double negation only removes one: backward, A fits any statement.
        expect(options(second, 'DIRECTION')).toEqual([['את ¬¬Q ב־Q', 'FORWARD']]);
        setLevelLaws([]);
    });
});

describe('the moves of unit 6', () => {
    it('read like a written proof, and name the definition they use', () => {
        const { blocks: [subsetIntro, subsetElim, setEq, unfoldHyp, unfoldGoal] } = solved(unit6Levels[6], [
            ['subset_intro'], ['subset_elim', { SUBSET: 'A ⊆ B', MEMBER: 'x₀ ∈ A' }], ['set_eq'],
            ['unfold', { STATEMENT: 'x₀ ∈ A ∩ (B ∪ C)' }], ['unfold', { STATEMENT: 'x₀ ∈ (A ∪ B)ᶜ' }],
        ]);
        subsetIntro.setStateBefore({ assumptions: [], objects: [], sets: ['A', 'B', 'C'], goal: 'A ∩ (B ∪ C) ⊆ A ∩ B ∪ A ∩ C' });
        expect(phraseOf(subsetIntro)).toBe('כדי להוכיח A ∩ (B ∪ C) ⊆ (A ∩ B) ∪ (A ∩ C) יהי x₀ ∈ (A ∩ (B ∪ C)) ונוכיח x₀ ∈ ((A ∩ B) ∪ (A ∩ C))');
        expect(phraseOf(subsetElim)).toBe('נובע x₀ ∈ B');
        setEq.setStateBefore({ assumptions: [], objects: [], sets: [], goal: 'A ∩ B = B ∩ A' });
        expect([phraseOf(setEq, 'FIRST_TEXT'), phraseOf(setEq, 'SECOND_TEXT')]).toEqual(['נוכיח A ∩ B ⊆ B ∩ A', 'נוכיח B ∩ A ⊆ A ∩ B']);
        expect([phraseOf(unfoldHyp, 'NAME'), phraseOf(unfoldHyp)]).toEqual(['לפי הגדרת החיתוך,', 'פירושו (x₀ ∈ A ∧ x₀ ∈ (B ∪ C))']);
        unfoldGoal.setStateBefore({ assumptions: [], objects: ['x₀'], sets: [], goal: 'x₀ ∈ (A ∪ B)ᶜ' });
        expect([phraseOf(unfoldGoal, 'NAME'), phraseOf(unfoldGoal)]).toEqual(['לפי הגדרת המשלים, כדי להוכיח', 'די להוכיח ¬x₀ ∈ (A ∪ B)']);
        // The menu offers only membership statements with a definition to use, the goal first.
        unfoldGoal.setStateBefore({ assumptions: ['A ⊆ B', 'x₀ ∈ A', 'x₀ ∈ A ∪ B'], objects: ['x₀'], sets: [], goal: 'x₀ ∈ Bᶜ' });
        expect(unfoldGoal.getField('STATEMENT').getOptions(false).map(([, value]) => value)).toEqual(['x₀ ∈ (A ∪ B)ᶜ', 'x₀ ∈ Bᶜ', 'x₀ ∈ A ∪ B', '__write_own__']);
    });

    it('use a definition on the goal or on an assumption without waiting for the proof state', () => {
        const level = unit6Levels[2];
        const { workspace } = solved(level, UNITS[6].levels[2][0].steps);
        expect(generateGameLeanCode(workspace, level, '', { includeFallback: false })).toContain([
            '  first',
            '  | refine easylean_subset_intro_pair (fun x₀ y₀ _ => ?_)',
            '  | refine easylean_subset_intro (fun x₀ _ => ?_)',
            '  first',
            '  | (guard_target =ₛ x₀ ∈ A ∩ B; apply easylean_mem_inter.mpr)',
            '  | (have := easylean_mem_inter.mp ‹x₀ ∈ A ∩ B›)',
            '  have := And.left ‹x₀ ∈ A ∧ x₀ ∈ B›',
        ].join('\n'));
    });

    it('name an element of a power set as a set', () => {
        const { blocks: [subsetIntro] } = solved(unit7Levels[1], [['subset_intro']]);
        subsetIntro.setStateBefore({ assumptions: ['A ⊆ B'], objects: [], sets: ['A', 'B'], goal: '𝒫 A ⊆ 𝒫 B' });
        expect(phraseOf(subsetIntro)).toBe('כדי להוכיח 𝒫(A) ⊆ 𝒫(B) יהי X₀ ∈ 𝒫(A) ונוכיח X₀ ∈ 𝒫(B)');
    });
});

describe('the moves of units 8 and 10', () => {
    it('substitute by an equality, shown as the replacement it makes', () => {
        const level = unit8Levels[1];
        const { workspace, blocks: [rewrite] } = solved(level, UNITS[8].levels[1][0].steps);
        expect(rewrite.getField('DIRECTION').getOptions(false).map(([label, value]) => [withoutIsolates(label), value]))
            .toEqual([['את a ב־b', 'FORWARD'], ['את b ב־a', 'BACKWARD']]);
        expect(withoutIsolates(rewrite.getField('DIRECTION').getText())).toBe('את a ב־b');
        expect(generateGameLeanCode(workspace, level, '', { includeFallback: false })).toContain([
            '  have := ‹(a, c) ∈ R›',
            '  rewrite [‹a = b›] at this',
            '  assumption',
        ].join('\n'));
    });

    it('head the parts of an induction by what is proved in them, keeping the variable', () => {
        const level = unit10Levels[1];
        const { workspace, blocks: [induction] } = solved(level, UNITS.find(({ unit }) => unit === 10).levels[1][0].steps);
        induction.setStateBefore({ assumptions: [], objects: ['n'], sets: [], goal: 'double n = n + n' });
        expect([headingOf(induction, 'BASE'), headingOf(induction, 'STEP')])
            .toEqual(['בסיס: נוכיח double(0) = 0 + 0', 'צעד: נניח double(n) = n + n ונוכיח double(n + 1) = (n + 1) + (n + 1)']);
        expect(generateGameLeanCode(workspace, level, '', { includeFallback: false })).toContain([
            '  induction n with',
            '  | zero =>',
            '    rewrite [double]',
            '    rfl',
            '  | succ n _ =>',
            '    rewrite [double]',
            '    rewrite [‹double n = n + n›]',
            '    easylean_goal_only; first | omega | fail "easylean: arithmetic from the goal alone"',
        ].join('\n'));
    });
});

describe('arithmetic and algebra with chosen assumptions', () => {
    it('take one more field for each assumption chosen, and use only those', () => {
        const { blocks: [calc] } = solved(unit10Levels[6], [['calc_hyps', { FACT: 'n = 2 * j₀', AND1: 'm = 1' }]]);
        expect(calc.getFieldValue('AND2')).toBe('__none__');
        expect(calc.getField('AND3')).toBeNull();
        expect(leanGenerator.blockToCode(calc)).toBe('  have easylean_fact1 := ‹n = 2 * j₀›; have easylean_fact2 := ‹m = 1›; revert easylean_fact1 easylean_fact2; easylean_goal_only; intros; first | omega | fail "easylean: arithmetic from the chosen assumptions"\n');
        // Stopping earlier drops the fields after it.
        calc.setFieldValue('__none__', 'AND1');
        expect(calc.getField('AND2')).toBeNull();
        expect(leanGenerator.blockToCode(calc)).toBe('  have easylean_fact1 := ‹n = 2 * j₀›; revert easylean_fact1; easylean_goal_only; intros; first | omega | fail "easylean: arithmetic from the chosen assumptions"\n');
    });
});

describe('the moves of unit 11', () => {
    const inStructure = (level, steps) => {
        setLevelStructure(level.structure);
        try {
            return solved(level, steps);
        } finally {
            setLevelStructure();
        }
    };

    it('open a part for each way the structure is built, with a hypothesis for each part like it', () => {
        const level = unit11Levels[3];
        const { workspace, blocks: [induction] } = inStructure(level, UNITS.find(({ unit }) => unit === 11).levels[3][0].steps);
        induction.setStateBefore({ assumptions: [], objects: ['t'], sets: [], goal: 'leaves t = nodes t + 1' });
        expect(headingOf(induction, 'LEAF')).toBe('בסיס: נוכיח leaves(leaf) = nodes(leaf) + 1');
        expect(headingOf(induction, 'NODE')).toBe('צעד: נניח leaves(l) = nodes(l) + 1 ו־ leaves(r) = nodes(r) + 1 ונוכיח leaves(node(l,r)) = nodes(node(l,r)) + 1');
        const code = generateGameLeanCode(workspace, level, '', { includeFallback: false });
        expect(code).toContain('inductive Tree where');
        expect(code).toContain('  induction t with\n  | leaf =>\n');
        expect(code).toContain('  | node l r _ _ =>\n');
    });

    it('keep the name of the part like the structure, as in unit 8', () => {
        const lists = inStructure(unit11Levels[0], UNITS.find(({ unit }) => unit === 11).levels[0][0].steps);
        expect(generateGameLeanCode(lists.workspace, unit11Levels[0], '', { includeFallback: false })).toContain('  | cons a l _ =>\n');
        const formulas = inStructure(unit11Levels[8], UNITS.find(({ unit }) => unit === 11).levels[8][0].steps);
        const code = generateGameLeanCode(formulas.workspace, unit11Levels[8], '', { includeFallback: false });
        ['  | atom i =>', '  | neg φ _ =>', '  | conj φ ψ _ _ =>'].forEach((header) => expect(code).toContain(header));
    });

    it('offer to unfold the functions of the structure', () => {
        const { blocks: [unfold] } = inStructure(unit11Levels[5], [['unfold_function']]);
        setLevelStructure('Tree');
        expect(unfold.getField('FUNCTION').getOptions(false).map(([, value]) => value)).toEqual(['?', 'leaves', 'nodes', 'height', 'mirror']);
        setLevelStructure();
        expect(leanGenerator.blockToCode(inStructure(unit11Levels[0], [['unfold_function', { FUNCTION: 'append' }]]).blocks[0]))
            .toBe('  first | rewrite [List.nil_append] | rewrite [List.cons_append]\n');
        // In a statement in hand, on a copy of it, which joins the assumptions.
        expect(leanGenerator.blockToCode(inStructure(unit11Levels[3], [['unfold_function', { FUNCTION: 'leaves', TARGET: 'leaves t = 3' }]]).blocks[0]))
            .toBe('  have := ‹leaves t = 3›\n  rewrite [leaves] at this\n');
        // One part: Lean finds what it unfolds to, in an equation of its own.
        expect(leanGenerator.blockToCode(inStructure(unit11Levels[5], [['unfold_function', { FUNCTION: 'mirror', PART: 'mirror (node l r)' }]]).blocks[0]))
            .toBe('  have easylean_eq : mirror (node l r) = _ := (by (rewrite [mirror]); rfl)\n  rewrite [easylean_eq]; clear easylean_eq\n');
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
        const level = unit1Levels[0];
        const { workspace, blocks } = solved(level, UNITS[1].levels[0][0].steps);
        const source = buildMoveStatesSource(workspace, level);
        expect(source.code.match(/^theorem unit1_l1_identity_before_\d/gm)).toHaveLength(2);
        expect(source.code.match(/^theorem easylean_mp /gm)).toHaveLength(1);
        // Lean's output for this code (lines 11-12 and 13-14).
        const output = [
            'proof.lean:12:8: error: don\'t know how to synthesize placeholder', 'context:', 'P : Prop', '⊢ P → P',
            'proof.lean:11:50: error: unsolved goals', 'P : Prop', '⊢ P → P',
            'proof.lean:13:50: error: unsolved goals', 'P : Prop', 'x✝ : P', '⊢ P',
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
