import { describe, expect, it } from 'vitest';
import { goalLabel, openGoals } from './proofState';

// Real Lean 4.26 output (file path shortened). The theorem is on line 4.
const twoCases = `Proof.lean:4:33: error: unsolved goals
case inl
P Q : Prop
h1 : P
⊢ Q ∨ P

case inr
P Q : Prop
h2 : Q
⊢ Q ∨ P
`;
// Cut inside the left part of "and": that part (line 6) and the theorem (line 4) are open.
const insideLeftPart = `Proof.lean:6:2: error: unsolved goals
case left
P Q : Prop
h1 : P
h2 : Q
⊢ P
Proof.lean:4:39: error: unsolved goals
case right
P Q : Prop
h1 : P
h2 : Q
⊢ Q
`;

describe('openGoals', () => {
    it('reads every goal of an unsolved goals message, with its case and assumptions', () => {
        expect(openGoals(twoCases, 4)).toEqual([
            { caseName: 'inl', assumptions: [{ name: 'P Q', prop: 'Prop' }, { name: 'h1', prop: 'P' }], goal: 'Q ∨ P' },
            { caseName: 'inr', assumptions: [{ name: 'P Q', prop: 'Prop' }, { name: 'h2', prop: 'Q' }], goal: 'Q ∨ P' },
        ]);
    });

    it('only reads the goals of the part the proof was cut in', () => {
        expect(openGoals(insideLeftPart, 6).map((goal) => goal.goal)).toEqual(['P']);
    });

    it('at the top level, also counts parts left unfinished, before the remaining goals', () => {
        expect(openGoals(insideLeftPart, 4).map((goal) => goal.goal)).toEqual(['P', 'Q']);
    });

    it('returns no goals once the part is proved', () => {
        expect(openGoals('', 6)).toEqual([]);
        expect(openGoals(insideLeftPart.split('Proof.lean:4')[0], 7)).toEqual([]);
    });

    it('joins a goal that Lean wrapped over several lines', () => {
        expect(openGoals('Proof.lean:4:2: error: unsolved goals\nh : P\n⊢ P ∧\n    Q\n', 4)[0].goal).toBe('P ∧ Q');
    });
});

describe('goalLabel', () => {
    it('names the parts of each rule in Hebrew', () => {
        expect(goalLabel({ caseName: 'left' }, 0)).toBe('צד שמאל');
        expect(goalLabel({ caseName: 'mpr' }, 1)).toBe('כיוון שני (←)');
        expect(goalLabel({ caseName: 'inr' }, 1)).toBe('מקרה שני');
    });

    it('numbers goals without a known case', () => {
        expect(goalLabel({ caseName: null }, 1)).toBe('מטרה 2');
    });
});
