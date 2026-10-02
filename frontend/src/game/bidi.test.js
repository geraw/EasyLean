import { describe, expect, it } from 'vitest';
import { isolateFormulas, withoutIsolates } from './bidi';

const iso = (formula) => `⁦${formula}⁩`;

describe('isolateFormulas', () => {
    it('wraps each formula that starts with ¬ in a left-to-right isolate', () => {
        expect(isolateFormulas('ו־¬Q לא נכונה')).toBe(`ו־${iso('¬Q')} לא נכונה`);
        expect(isolateFormulas('hn : ¬(P ∨ Q)')).toBe(`hn : ${iso('¬(P ∨ Q)')}`);
        expect(isolateFormulas('¬¬P ו־¬P ∧ ¬Q, אלא')).toBe(`${iso('¬¬P')} ו־${iso('¬P ∧ ¬Q')}, אלא`);
    });

    it('wraps formulas that start with ⊥, and ⊥ alone', () => {
        expect(isolateFormulas('הגרירה ⊥ → Q נכונה')).toBe(`הגרירה ${iso('⊥ → Q')} נכונה`);
        expect(isolateFormulas('סתירה (⊥)')).toBe(`סתירה (${iso('⊥')})`);
    });

    it('leaves text without ¬ or ⊥ alone', () => {
        expect(isolateFormulas('h : (P → Q)')).toBe('h : (P → Q)');
    });

    it('can be undone for comparing texts', () => {
        expect(withoutIsolates(isolateFormulas('ו־¬Q'))).toBe('ו־¬Q');
    });
});
