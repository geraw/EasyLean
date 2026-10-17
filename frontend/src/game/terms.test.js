import { describe, expect, it } from 'vitest';
import { hasNoVariables, parseTerm, printTerm, unfoldableParts } from './terms';

describe('parseTerm', () => {
    it('reads the operators by their precedence, and applications first', () => {
        expect(printTerm(parseTerm('a :: l ++ m ++ k'))).toBe('((a :: l) ++ m) ++ k');
        expect(printTerm(parseTerm('List.length (a :: l) + List.length m'))).toBe('(List.length (a :: l)) + (List.length m)');
        expect(printTerm(parseTerm('n + 1 + 1 ≤ 2 ^ n * 2'))).toBe('((n + 1) + 1) ≤ ((2 ^ n) * 2)');
        expect(parseTerm('∀ x, P x')).toBeNull();
    });
});

describe('unfoldableParts', () => {
    it.each([
        ['append', 'a :: l ++ (m ++ k) = a :: l ++ m ++ k', ['(a :: l) ++ (m ++ k)', '(a :: l) ++ m']],
        ['append', 'a :: (l ++ (m ++ k)) = a :: (l ++ m) ++ k', ['(a :: (l ++ m)) ++ k']],
        ['length', 'List.length (a :: (l ++ m)) = List.length (a :: l) + List.length m', ['List.length (a :: (l ++ m))', 'List.length (a :: l)']],
        ['mirror', 'mirror (mirror (node l r)) = node l r', ['mirror (node l r)']],
        ['double', 'double 0 = 0 + 0', ['double 0']],
        ['add', '0 + (n + 1) = n + 1', ['0 + (n + 1)']],
        ['pow', 'n + 1 + 1 ≤ 2 ^ (n + 1)', ['2 ^ (n + 1)']],
        ['atoms', 'atoms (neg φ) = binaries (neg φ) + 1', ['atoms (neg φ)']],
        // Applied to a variable, not to one of the ways it is built: nothing to unfold.
        ['height', 'max (height l) (height r) + 1 ≤ nodes (node l r)', []],
    ])('finds where %s unfolds in %s', (value, statement, parts) => {
        expect(unfoldableParts(value, statement)).toEqual(parts);
    });
});

describe('hasNoVariables', () => {
    it('tells the base cases, whose types Lean cannot tell, from parts with variables', () => {
        expect(hasNoVariables('List.length []')).toBe(true);
        expect(hasNoVariables('double 0')).toBe(true);
        expect(hasNoVariables('mirror leaf')).toBe(true);
        expect(hasNoVariables('List.length (a :: l)')).toBe(false);
        expect(hasNoVariables('[] ++ m')).toBe(false);
    });
});
