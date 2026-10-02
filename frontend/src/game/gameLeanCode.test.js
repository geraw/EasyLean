import { describe, expect, it } from 'vitest';
import { generateGameLeanCode, generateGameLeanSource, getLastProofBlockId } from './gameLeanCode';
import { unit1Levels } from './unit1World';
import { buildProof, loadWorkspace } from '../test/blocklyWorkspace';

const level = unit1Levels[0];
const header = '\nset_option linter.unusedVariables false\nvariable {P : Prop}\n\ntheorem unit1_l1_identity  : P → P := by\n';
const code = (workspace, options) => generateGameLeanCode(workspace, level, '', options);

const solvedWorkspace = () => {
    const workspace = loadWorkspace(level.startXml);
    const [intro, exact] = buildProof(workspace, [['tactic_intro', { HYPOTHESIS: 'h' }], ['tactic_exact', { TERM: 'h' }]]);
    return { workspace, intro, exact };
};

describe('generateGameLeanCode', () => {
    it('generates the whole proof', () => {
        const { workspace } = solvedWorkspace();
        expect(code(workspace)).toBe(`${header}  intro h\n  exact h\n`);
    });

    it('falls back to sorry for an empty proof, or to a hole when computing proof state', () => {
        const workspace = loadWorkspace(level.startXml);
        expect(code(workspace)).toBe(`${header}  sorry\n`);
        expect(code(workspace, { includeFallback: false })).toBe(`${header}  exact ?_\n`);
    });

    it('stops before the selected move ("before")', () => {
        const { workspace, exact } = solvedWorkspace();
        expect(code(workspace, { includeFallback: false, untilBlockId: exact.id })).toBe(`${header}  intro h\n`);
    });

    it('stops after the selected move ("after")', () => {
        const { workspace, intro } = solvedWorkspace();
        expect(code(workspace, { includeFallback: false, untilBlockId: intro.id, includeUntilBlock: true })).toBe(`${header}  intro h\n`);
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
        expect(lines.slice(-3)).toEqual(['intro h', 'exact h', '']);
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
        expect(lines[5]).toBe('  intro h'); // line 6
        expect([...lineBlockIds]).toEqual([[6, intro.id], [7, exact.id]]);
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
