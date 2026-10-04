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

describe('formatProofGoal with quantifiers', () => {
    it('writes predicates with their arguments in parentheses', () => {
        expect(formatProofGoal('P x')).toBe('P(x)');
        expect(formatProofGoal('R x y')).toBe('R(x,y)');
    });

    it('writes quantifiers in the course notation, extending to the end', () => {
        expect(formatProofGoal('∀ (x : α), P x')).toBe('∀x P(x)');
        expect(formatProofGoal('∀ (x : α), P x → Q x')).toBe('∀x (P(x) → Q(x))');
        expect(formatProofGoal('∃ x, ∀ (y : α), R x y')).toBe('∃x ∀y R(x,y)');
        expect(formatProofGoal('∀ (x y : α), R x y')).toBe('∀x ∀y R(x,y)');
    });

    it('puts a quantified formula inside a connective in parentheses', () => {
        expect(formatProofGoal('(∀ (x : α), P x) → ∀ (x : α), Q x')).toBe('((∀x P(x)) → (∀x Q(x)))');
        expect(formatProofGoal('(¬∃ x, P x ∧ Q x) → ∀ (y : α), ¬P y')).toBe('((¬∃x (P(x) ∧ Q(x))) → (∀y ¬P(y)))');
        // Without the parentheses, Lean reads the arrow as part of the ∃'s body.
        expect(formatProofGoal('¬∃ x, P x ∧ Q x → ∀ (y : α), ¬P y')).toBe('¬∃x ((P(x) ∧ Q(x)) → (∀y ¬P(y)))');
    });

    it('keeps negation of a quantified formula tight', () => {
        expect(formatProofGoal('¬∀ (x : α), P x')).toBe('¬∀x P(x)');
    });
});

describe('formatProofGoal with the functions of unit 6', () => {
    it('writes their arguments in parentheses', () => {
        expect(formatProofGoal('double (k + 1) = k + 1 + (k + 1)')).toBe('double(k + 1) = k + 1 + (k + 1)');
        expect(formatProofGoal('2 * sumTo n = n * (n + 1)')).toBe('2 · sumTo(n) = n · (n + 1)');
    });
});
