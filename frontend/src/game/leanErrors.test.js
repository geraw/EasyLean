import { describe, expect, it } from 'vitest';
import { findLeanProblem, explainLeanMessage, parseLeanMessages, GENERIC_PROBLEM } from './leanErrors';

// Real Lean 4.26 output for typical mistakes (file path shortened).
const typeMismatch = `Proof.lean:4:2: error: Type mismatch
  h
has type
  P
but is expected to have type
  Q
`;
const unknownName = 'Proof.lean:4:8: error(lean.unknownIdentifier): Unknown identifier `hh`\n';
const applyWrongConclusion = `Proof.lean:4:2: error: Tactic \`apply\` failed: could not unify the conclusion of \`h1\`
  Q
with the goal
  R
Note: The full type of \`h1\` is
  P → Q
P Q R : Prop
h1 : P → Q
`;
const applyNotImplication = `Proof.lean:4:2: error: Tactic \`apply\` failed: could not unify the type of \`h\`
  P
with the goal
  Q
P Q R : Prop
h : P
`;
const introNotImplication = `Proof.lean:4:8: error: Tactic \`introN\` failed: There are no additional binders or \`let\` bindings in the goal to introduce
P Q R : Prop
h : P
⊢ Q
`;
const holeAndUnsolved = `Proof.lean:5:8: error: don't know how to synthesize placeholder
context:
P : Prop
⊢ P → P
Proof.lean:4:38: error: unsolved goals
P : Prop
⊢ P → P
`;

describe('parseLeanMessages', () => {
    it('splits the output into messages with their lines', () => {
        expect(parseLeanMessages(holeAndUnsolved).map(({ line, severity }) => [line, severity])).toEqual([[5, 'error'], [4, 'error']]);
    });

    it('keeps continuation lines with their message', () => {
        expect(parseLeanMessages(typeMismatch)[0].text).toContain('but is expected to have type');
    });
});

describe('explainLeanMessage', () => {
    const explain = (output) => explainLeanMessage(parseLeanMessages(output)[0].text);

    it('explains closing the goal with the wrong assumption', () => {
        expect(explain(typeMismatch)).toBe('h אומרת P, אבל המטרה היא Q. אפשר לסגור את המטרה רק בעזרת הנחה שאומרת בדיוק את המטרה.');
    });

    it('explains using an implication whose conclusion is not the goal', () => {
        expect(explain(applyWrongConclusion)).toBe('המסקנה (צד ימין) של h1 היא Q, אבל המטרה היא R. אפשר לעבור לתנאי של גרירה רק כשהמסקנה שלה זהה למטרה.');
    });

    it('explains using an assumption that is not an implication', () => {
        expect(explain(applyNotImplication)).toContain('h אומרת P, וזו לא גרירה');
    });

    it('explains an unknown name', () => {
        expect(explain(unknownName)).toBe('אין הנחה בשם hh. בדקו את השם מול ההנחות שבמצב ההוכחה.');
    });

    it('explains assuming when the goal is not an implication', () => {
        expect(explain(introNotImplication)).toBe('המטרה Q היא לא גרירה, ולכן אין תנאי להניח.');
    });

    it('falls back to a general explanation', () => {
        expect(explainLeanMessage('something Lean has never said before')).toBe(GENERIC_PROBLEM);
    });
});

describe('findLeanProblem', () => {
    it('ignores the hole and unsolved goals of a partial proof', () => {
        expect(findLeanProblem(holeAndUnsolved)).toBeNull();
    });

    it('reports unsolved goals when the whole proof is checked', () => {
        expect(findLeanProblem(holeAndUnsolved, { includeUnsolvedGoals: true })).toEqual({
            line: 4,
            message: 'ההוכחה עוד לא הושלמה: נשאר להוכיח (P → P).',
        });
    });

    it('reports the line of the first real error', () => {
        expect(findLeanProblem(applyWrongConclusion)?.line).toBe(4);
    });

    it('returns null for clean output', () => {
        expect(findLeanProblem('')).toBeNull();
    });
});
