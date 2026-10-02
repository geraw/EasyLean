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
