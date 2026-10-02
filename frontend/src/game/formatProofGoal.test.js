import { describe, expect, it } from 'vitest';
import { formatProofGoal } from './formatProofGoal';

describe('formatProofGoal', () => {
    it('leaves an atomic goal alone', () => {
        expect(formatProofGoal('P')).toBe('P');
    });

    it('drops redundant outer parentheses', () => {
        expect(formatProofGoal('((Q))')).toBe('Q');
    });

    it('wraps each implication in parentheses', () => {
        expect(formatProofGoal('P → P')).toBe('(P → P)');
        expect(formatProofGoal('P → (P → Q) → Q')).toBe('(P → ((P → Q) → Q))');
    });

    it('normalizes ASCII arrows', () => {
        expect(formatProofGoal('P -> Q')).toBe('(P → Q)');
    });

    it('does not split on arrows nested inside parentheses', () => {
        expect(formatProofGoal('(P → Q) → R')).toBe('((P → Q) → R)');
    });

    it('treats a missing goal as empty', () => {
        expect(formatProofGoal(undefined)).toBe('');
    });
});

describe('formatProofGoal with and, or, iff, not', () => {
    it('wraps every connective in parentheses, following Lean precedence', () => {
        expect(formatProofGoal('P ∧ Q → Q ∧ P')).toBe('((P ∧ Q) → (Q ∧ P))');
        expect(formatProofGoal('P ∨ Q ∧ R')).toBe('(P ∨ (Q ∧ R))');
        expect(formatProofGoal('P ∧ Q ↔ Q ∧ P')).toBe('((P ∧ Q) ↔ (Q ∧ P))');
        expect(formatProofGoal('P → Q ↔ R')).toBe('((P → Q) ↔ R)');
    });

    it('groups a repeated connective to the right', () => {
        expect(formatProofGoal('P ∧ Q ∧ R')).toBe('(P ∧ (Q ∧ R))');
    });

    it('keeps negation tight', () => {
        expect(formatProofGoal('¬P ∨ Q')).toBe('(¬P ∨ Q)');
        expect(formatProofGoal('¬(P ∧ Q)')).toBe('¬(P ∧ Q)');
    });

    it('does not read the ASCII iff as an implication', () => {
        expect(formatProofGoal('P <-> Q')).toBe('(P ↔ Q)');
    });
});

describe('formatProofGoal with contradiction', () => {
    it('writes Lean\'s False as ⊥', () => {
        expect(formatProofGoal('False')).toBe('⊥');
        expect(formatProofGoal('P → False')).toBe('(P → ⊥)');
    });
});
