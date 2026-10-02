import { describe, expect, it } from 'vitest';
import { isolateNegations, withoutIsolates } from './bidi';

describe('isolateNegations', () => {
    it('wraps each negated formula in a left-to-right isolate', () => {
        expect(isolateNegations('ו־¬Q לא נכונה')).toBe('ו־⁦¬Q⁩ לא נכונה');
        expect(isolateNegations('hn : ¬(P ∨ Q)')).toBe('hn : ⁦¬(P ∨ Q)⁩');
        expect(isolateNegations('¬¬P ו־¬(¬P ∧ (Q ∨ R))')).toBe('⁦¬¬P⁩ ו־⁦¬(¬P ∧ (Q ∨ R))⁩');
    });

    it('leaves text without negation alone', () => {
        expect(isolateNegations('h : (P → Q)')).toBe('h : (P → Q)');
    });

    it('can be undone for comparing texts', () => {
        expect(withoutIsolates(isolateNegations('ו־¬Q'))).toBe('ו־¬Q');
    });
});
