const test = require('node:test');
const assert = require('node:assert/strict');
const { parseLeanProofState } = require('../server');

// Real Lean output for `intro h; exact ?_` on `(h1 : P → Q) : P → Q`.
const unsolvedOutput = `Proof.lean:5:8: error: don't know how to synthesize placeholder
context:
P Q : Prop
h1 : P → Q
h : P
⊢ Q
Proof.lean:3:34: error: unsolved goals
P Q : Prop
h1 : P → Q
h : P
⊢ Q
`;

test('reads hypotheses and goal from the unsolved goals block', () => {
    assert.deepEqual(parseLeanProofState(unsolvedOutput), {
        assumptions: [
            { name: 'P Q', prop: 'Prop' },
            { name: 'h1', prop: 'P → Q' },
            { name: 'h', prop: 'P' },
        ],
        goal: 'Q',
        complete: false,
    });
});

test('returns null when there are no unsolved goals', () => {
    assert.equal(parseLeanProofState(''), null);
    assert.equal(parseLeanProofState('Proof.lean:1:0: error: unknown identifier'), null);
});

test('returns null when the unsolved goals block has no goal line', () => {
    assert.equal(parseLeanProofState('error: unsolved goals\nP : Prop\n'), null);
});
