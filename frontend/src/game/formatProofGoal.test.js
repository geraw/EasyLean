import { describe, expect, it } from 'vitest';
import { boundNames, formatProofGoal, splitImplication } from './formatProofGoal';

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

    it('finds the variables a statement binds', () => {
        expect(boundNames('∃ x, ∀ (y : obj), R x y')).toEqual(['x', 'y']);
        expect(boundNames('¬∃ x, x ∈ A ∧ ¬x ∈ B')).toEqual(['x']);
        expect(boundNames('∀ x y, P x → Q y')).toEqual(['x', 'y']);
        expect(boundNames('x ∈ A')).toEqual([]);
    });

    it('puts a negated relation in parentheses, but not a negated membership', () => {
        // Lean's ¬A ⊆ B is ¬(A ⊆ B); written so, it would read as (¬A) ⊆ B.
        expect(formatProofGoal('¬A ⊆ B → ∃ x, x ∈ A ∧ ¬x ∈ B')).toBe('(¬(A ⊆ B) → (∃x (x ∈ A ∧ ¬x ∈ B)))');
        expect(formatProofGoal('¬A = B')).toBe('¬(A = B)');
        expect(formatProofGoal('¬(A ⊆ B)')).toBe('¬(A ⊆ B)');
        expect(formatProofGoal('¬x ∈ A')).toBe('¬x ∈ A');
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
        expect(formatProofGoal('∀ (x : α), P x')).toBe('∀x (P(x))');
        expect(formatProofGoal('∀ (x : α), P x → Q x')).toBe('∀x (P(x) → Q(x))');
        expect(formatProofGoal('∃ x, ∀ (y : α), R x y')).toBe('∃x (∀y (R(x,y)))');
        expect(formatProofGoal('∀ (x y : α), R x y')).toBe('∀x (∀y (R(x,y)))');
    });

    it('puts a quantified formula inside a connective in parentheses', () => {
        expect(formatProofGoal('(∀ (x : α), P x) → ∀ (x : α), Q x')).toBe('((∀x (P(x))) → (∀x (Q(x))))');
        expect(formatProofGoal('(¬∃ x, P x ∧ Q x) → ∀ (y : α), ¬P y')).toBe('((¬∃x (P(x) ∧ Q(x))) → (∀y (¬P(y))))');
        // Without the parentheses, Lean reads the arrow as part of the ∃'s body.
        expect(formatProofGoal('¬∃ x, P x ∧ Q x → ∀ (y : α), ¬P y')).toBe('¬∃x ((P(x) ∧ Q(x)) → (∀y (¬P(y))))');
    });

    it('keeps negation of a quantified formula tight', () => {
        expect(formatProofGoal('¬∀ (x : α), P x')).toBe('¬∀x (P(x))');
    });

    it('puts a relation body in parentheses, so it is clear where it begins', () => {
        expect(formatProofGoal('∃ j, n = 2 * j')).toBe('∃j (n = 2 · j)');
        expect(formatProofGoal('∃ j, (n + 1) = 2 * j')).toBe('∃j ((n + 1) = 2 · j)');
        expect(formatProofGoal('∀ (S : Set α), S ∈ F → x ∈ S')).toBe('∀S (S ∈ F → x ∈ S)');
    });
});

describe('formatProofGoal with the functions of unit 9', () => {
    it('writes their arguments in parentheses', () => {
        expect(formatProofGoal('double (k + 1) = k + 1 + (k + 1)')).toBe('double(k + 1) = k + 1 + (k + 1)');
        expect(formatProofGoal('2 * sumTo n = n * (n + 1)')).toBe('2 · sumTo(n) = n · (n + 1)');
    });
});

describe('formatProofGoal with the structures of unit 10', () => {
    it('writes functions and the ways structures are built as applied to their arguments', () => {
        expect(formatProofGoal('mirror (mirror (node l r)) = (node l r)')).toBe('mirror(mirror(node(l,r))) = node(l,r)');
        expect(formatProofGoal('List.length (l ++ m) = List.length l + List.length m')).toBe('length(l ++ m) = length(l) + length(m)');
        expect(formatProofGoal('max (height l) (height r) + 1 ≤ nodes t')).toBe('max(height(l),height(r)) + 1 ≤ nodes(t)');
        expect(formatProofGoal('a :: (l ++ []) = a :: l')).toBe('a :: (l ++ []) = a :: l');
        // The grouping of ++ and :: shows, though Lean prints it without parentheses.
        expect(formatProofGoal('l ++ (m ++ k) = l ++ m ++ k')).toBe('l ++ (m ++ k) = (l ++ m) ++ k');
        expect(formatProofGoal('a :: l ++ m ++ k = (a :: l)')).toBe('((a :: l) ++ m) ++ k = a :: l');
    });
});

describe('formatProofGoal with power sets', () => {
    it('writes the set in parentheses, also a single one', () => {
        expect(formatProofGoal('X₀ ∈ 𝒫 A')).toBe('X₀ ∈ 𝒫(A)');
        expect(formatProofGoal('A ∈ 𝒫 (A ∪ B)')).toBe('A ∈ 𝒫(A ∪ B)');
        expect(formatProofGoal('A ⊆ B → 𝒫 A ⊆ 𝒫 B')).toBe('(A ⊆ B → 𝒫(A) ⊆ 𝒫(B))');
        expect(formatProofGoal('S ∈ 𝒫 𝒫 A')).toBe('S ∈ 𝒫(𝒫(A))');
    });
});

describe('splitImplication', () => {
    it.each([
        ['P → Q', ['P', 'Q']],
        ['(P → Q) → R', ['(P → Q)', 'R']],
        ['P → Q → R', ['P', 'Q → R']],
        ['(P -> Q)', ['P', 'Q']],
        ['P', null],
        ['P ∧ Q', null],
        ['P ↔ (Q → R)', null],
    ])('%s', (formula, parts) => {
        expect(splitImplication(formula)).toEqual(parts);
    });
});
