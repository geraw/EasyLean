import { describe, expect, it } from 'vitest';
import { LEAN_PRELUDE } from '../generator/lean';
import { findIncompleteMove, generateGameLeanCode, generateGameLeanSource, getLastProofBlockId } from './gameLeanCode';
import { unit2Levels } from './unit2World';
import { buildInto, buildProof, loadWorkspace } from '../test/blocklyWorkspace';
import { goalXml } from './levelXml';

const level = unit2Levels[0];
// Every proof starts with the lemmas of LEAN_PRELUDE; P = their number of lines.
const P = LEAN_PRELUDE.split('\n').length - 1;
const ASSUME = '  easylean_assume';
const header = `\n${LEAN_PRELUDE}set_option linter.unusedVariables false\nvariable {P : Prop}\n\ntheorem unit2_l1_identity  : P → P := by\n`;
const code = (workspace, options) => generateGameLeanCode(workspace, level, '', options);

const solvedWorkspace = () => {
    const workspace = loadWorkspace(level.startXml);
    const [intro, exact] = buildProof(workspace, [['assume'], ['exact']]);
    return { workspace, intro, exact };
};

describe('generateGameLeanCode', () => {
    it('generates the whole proof', () => {
        const { workspace } = solvedWorkspace();
        expect(code(workspace)).toBe(`${header}${ASSUME}\n  assumption\n`);
    });

    it('falls back to sorry for an empty proof, or to a hole when computing proof state', () => {
        const workspace = loadWorkspace(level.startXml);
        expect(code(workspace)).toBe(`${header}  sorry\n`);
        expect(code(workspace, { includeFallback: false })).toBe(`${header}  exact ?_\n`);
    });

    it('stops before the selected move ("before")', () => {
        const { workspace, exact } = solvedWorkspace();
        expect(code(workspace, { includeFallback: false, untilBlockId: exact.id })).toBe(`${header}${ASSUME}\n`);
    });

    it('stops after the selected move ("after")', () => {
        const { workspace, intro } = solvedWorkspace();
        expect(code(workspace, { includeFallback: false, untilBlockId: intro.id, includeUntilBlock: true })).toBe(`${header}${ASSUME}\n`);
    });

    it('uses a hole before the first move', () => {
        const { workspace, intro } = solvedWorkspace();
        expect(code(workspace, { includeFallback: false, untilBlockId: intro.id })).toBe(`${header}  exact ?_\n`);
    });

    it('uses the whole proof when the selected block is not part of it (e.g. the goal block)', () => {
        const { workspace } = solvedWorkspace();
        const goal = workspace.getTopBlocks(true).find(b => b.type === 'game_goal');
        // statementToCode adds its own indentation, which Lean accepts.
        const lines = code(workspace, { untilBlockId: goal.id }).split('\n').map(line => line.trim());
        expect(lines.slice(-3)).toEqual([ASSUME.trim(), 'assumption', '']);
    });

    it('returns an empty string without a goal block', () => {
        expect(code(null)).toBe('');
    });
});

describe('generateGameLeanSource', () => {
    it('maps each proof line to the move that produced it', () => {
        const { workspace, intro, exact } = solvedWorkspace();
        const { code, lineBlockIds } = generateGameLeanSource(workspace, level, '');
        const lines = code.split('\n');
        expect(lines[P + 5]).toBe(ASSUME); // line P + 6
        expect([...lineBlockIds]).toEqual([[P + 6, intro.id], [P + 7, exact.id]]);
    });
});

describe('getLastProofBlockId', () => {
    it('returns the last move of the proof', () => {
        const { workspace, exact } = solvedWorkspace();
        expect(getLastProofBlockId(workspace)).toBe(exact.id);
    });

    it('returns null for an empty proof', () => {
        expect(getLastProofBlockId(loadWorkspace(level.startXml))).toBeNull();
    });
});

describe('generateGameLeanSource with rules that split the proof', () => {
    const andLevel = { variableLine: 'variable {P Q : Prop}', name: 't', params: '(h1 : P) (h2 : Q)', proposition: 'P ∧ Q' };
    const andHeader = `\n${LEAN_PRELUDE}set_option linter.unusedVariables false\nvariable {P Q : Prop}\n\ntheorem t (h1 : P) (h2 : Q) : P ∧ Q := by\n`;
    const THEOREM_LINE = P + 5;

    const andProof = () => {
        const workspace = loadWorkspace(goalXml('P ∧ Q'));
        const [split] = buildProof(workspace, [['and_intro']]);
        const [left] = buildInto(split, 'LEFT', [['exact']]);
        const [right] = buildInto(split, 'RIGHT', [['exact']]);
        return { workspace, split, left, right };
    };
    const source = (workspace, options) => generateGameLeanSource(workspace, andLevel, '', { includeFallback: false, ...options });

    it('writes each part of the proof under its own bullet', () => {
        const { workspace } = andProof();
        expect(source(workspace).code).toBe(`${andHeader}  apply And.intro\n  ·\n    assumption\n  ·\n    assumption\n`);
    });

    it('maps the lines inside a part to their own moves, and a part to its last move', () => {
        const { workspace, split, left, right } = andProof();
        const { lineBlockIds, partLastBlockIds } = source(workspace);
        expect([...lineBlockIds]).toEqual([[P + 6, split.id], [P + 7, split.id], [P + 8, left.id], [P + 9, split.id], [P + 10, right.id]]);
        expect([...partLastBlockIds]).toEqual([[P + 7, left.id], [P + 9, right.id]]);
    });

    it('leaves an empty part open with skip, so Lean reports its goal', () => {
        const workspace = loadWorkspace(goalXml('P ∧ Q'));
        const [split] = buildProof(workspace, [['and_intro']]);
        expect(source(workspace).code).toBe(`${andHeader}  apply And.intro\n  ·\n    skip\n  ·\n    skip\n`);
        expect(source(workspace).lineBlockIds.get(P + 8)).toBe(split.id);
    });

    it('cut before a move inside a part: keeps the earlier parts and reads the state where the part opens', () => {
        const { workspace, right } = andProof();
        const cut = source(workspace, { untilBlockId: right.id });
        expect(cut.code).toBe(`${andHeader}  apply And.intro\n  ·\n    assumption\n  ·\n    skip\n`);
        expect(cut).toMatchObject({ stateLine: P + 9, inPart: true });
    });

    it('cut after a move inside a part: the parts after it only get a placeholder', () => {
        const { workspace, left } = andProof();
        const cut = source(workspace, { untilBlockId: left.id, includeUntilBlock: true });
        expect(cut.code).toBe(`${andHeader}  apply And.intro\n  ·\n    assumption\n  ·\n    sorry\n`);
        expect(cut).toMatchObject({ stateLine: P + 7, inPart: true });
    });

    it('cut after the rule itself: all of its parts are open, read at the top level', () => {
        const { workspace, split } = andProof();
        const cut = source(workspace, { untilBlockId: split.id, includeUntilBlock: true });
        expect(cut.code).toBe(`${andHeader}  apply And.intro\n  ·\n    skip\n  ·\n    skip\n`);
        expect(cut).toMatchObject({ stateLine: THEOREM_LINE, inPart: false });
    });

    it('opens each case of an "or", whose new assumption has no name', () => {
        const orLevel = { ...andLevel, params: '(h : P ∨ Q)', proposition: 'Q ∨ P' };
        const workspace = loadWorkspace(goalXml('Q ∨ P'));
        const [cases] = buildProof(workspace, [['or_elim', { OR: 'P ∨ Q' }]]);
        buildInto(cases, 'LEFT', [['or_intro', { SIDE: 'RIGHT' }], ['exact']]);
        buildInto(cases, 'RIGHT', [['or_intro', { SIDE: 'LEFT' }], ['exact']]);
        const proof = generateGameLeanSource(workspace, orLevel, '').code.split(':= by\n')[1];
        expect(proof).toBe('  cases ‹P ∨ Q› with\n  | inl _ =>\n    apply Or.inr\n    assumption\n  | inr _ =>\n    apply Or.inl\n    assumption\n');
    });

    it('keeps every case of an "or" when cut inside the first one', () => {
        const orLevel = { ...andLevel, params: '(h : P ∨ Q)', proposition: 'Q ∨ P' };
        const workspace = loadWorkspace(goalXml('Q ∨ P'));
        const [cases] = buildProof(workspace, [['or_elim', { OR: 'P ∨ Q' }]]);
        const [side] = buildInto(cases, 'LEFT', [['or_intro', { SIDE: 'RIGHT' }]]);
        const cut = generateGameLeanSource(workspace, orLevel, '', { untilBlockId: side.id });
        expect(cut.code.split(':= by\n')[1]).toBe('  cases ‹P ∨ Q› with\n  | inl _ =>\n    skip\n  | inr _ =>\n    sorry\n');
        expect(cut).toMatchObject({ stateLine: P + 7, inPart: true });
    });
});

describe('findIncompleteMove', () => {
    it('finds the first move, in proof order, whose field still holds the placeholder', () => {
        const workspace = loadWorkspace(goalXml('P ∧ Q'));
        const [split, last] = buildProof(workspace, [['and_intro'], ['and_elim']]);
        const [filled, empty] = buildInto(split, 'LEFT', [['and_elim', { AND: 'P ∧ Q' }], ['and_elim']]);
        expect(findIncompleteMove(workspace)?.id).toBe(empty.id);
        empty.setFieldValue('P ∧ Q', 'AND');
        expect(findIncompleteMove(workspace)?.id).toBe(last.id);
        last.setFieldValue('P ∧ Q', 'AND');
        expect(findIncompleteMove(workspace)).toBeNull();
        expect(filled).toBeTruthy();
    });
});
