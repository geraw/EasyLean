import { describe, expect, it } from 'vitest';
import { findLeanProblem, explainLeanMessage as explainWithIsolates, parseLeanMessages, GENERIC_PROBLEM } from './leanErrors';
import { withoutIsolates } from './bidi';

const explainLeanMessage = (text) => withoutIsolates(explainWithIsolates(text));

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
            unsolved: true,
        });
    });

    it('reports the line of the first real error', () => {
        expect(findLeanProblem(applyWrongConclusion)?.line).toBe(4);
    });

    it('returns null for clean output', () => {
        expect(findLeanProblem('')).toBeNull();
    });
});

// Real Lean 4.26 output for unit 2 rules used on the wrong connective.
const andIntroOnOr = `Proof.lean:5:2: error: Tactic \`apply\` failed: could not unify the conclusion of \`@And.intro\`
  ?a ∧ ?b
with the goal
  P ∨ Q

Note: The full type of \`@And.intro\` is
  ∀ {a b : Prop}, a → b → a ∧ b

P Q : Prop
⊢ P ∨ Q
`;
const orInlOnAnd = andIntroOnOr.replaceAll('And.intro', 'Or.inl').replace('?a ∧ ?b', '?a ∨ ?b').replace('P ∨ Q', 'P ∧ Q');
const iffIntroOnAtom = andIntroOnOr.replaceAll('And.intro', 'Iff.intro').replace('?a ∧ ?b', '?a ↔ ?b').replace('  P ∨ Q', '  P');
const andElimOnIff = `Proof.lean:5:22: error: Application type mismatch: The argument
  h
has type
  P ↔ Q
but is expected to have type
  ?m.3 ∧ ?m.4
in the application
  And.left h
`;
const iffElimOnAnd = andElimOnIff.replace('P ↔ Q', 'P ∧ Q').replace('?m.3 ∧ ?m.4', '?m.3 ↔ ?m.4').replace('And.left h', 'Iff.mp h');
const casesOnAnd = `Proof.lean:6:2: error: Invalid alternative name \`inl\`: Expected \`intro\`
Proof.lean:8:2: error: Invalid alternative name \`inr\`: Expected \`intro\`
`;
const casesOnAtom = `Proof.lean:5:2: error: Tactic \`cases\` failed: major premise type is not an inductive type
  P

Explanation: the \`cases\` tactic is for constructor-based reasoning.
`;

describe('explainLeanMessage for and, or, iff', () => {
    const explain = (output) => explainLeanMessage(parseLeanMessages(output)[0].text);

    it('explains proving both sides of a goal that is not an "and"', () => {
        expect(explain(andIntroOnOr)).toBe('המטרה היא (P ∨ Q), והיא לא טענת "וגם", ולכן אין לה שני צדדים להוכיח לחוד.');
    });

    it('explains choosing a side of a goal that is not an "or"', () => {
        expect(explain(orInlOnAnd)).toBe('המטרה היא (P ∧ Q), והיא לא טענת "או", ולכן אין בה צד לבחור להוכיח.');
    });

    it('explains proving both directions of a goal that is not an "iff"', () => {
        expect(explain(iffIntroOnAtom)).toBe('המטרה היא P, והיא לא טענת "אם ורק אם", ולכן אין לה שני כיוונים להוכיח.');
    });

    it('explains using an assumption as an "and" or an "iff" when it is not one', () => {
        expect(explain(andElimOnIff)).toBe('h אומרת (P ↔ Q), וזו לא טענת "וגם", ולכן אי אפשר להסיק ממנה שני צדדים.');
        expect(explain(iffElimOnAnd)).toBe('h אומרת (P ∧ Q), וזו לא טענת "אם ורק אם", ולכן אי אפשר להסיק ממנה שני כיוונים.');
    });

    it('explains splitting into cases by an assumption that is not an "or"', () => {
        const message = 'ההנחה שבחרתם היא לא טענת "או", ולכן אי אפשר לחלק לפיה למקרים.';
        expect(explain(casesOnAnd)).toBe(message);
        expect(explain(casesOnAtom)).toBe(message);
    });
});

// Real Lean 4.26 output for unit 3 rules used the wrong way.
const contradictionOnOtherGoal = `Proof.lean:5:2: error: Type mismatch
  absurd hp hn
has type
  False
but is expected to have type
  Q
`;
const notContradicting = `Proof.lean:5:19: error: Application type mismatch: The argument
  hn
has type
  ¬Q
but is expected to have type
  ¬P
in the application
  absurd hp hn
`;
const notANegation = `Proof.lean:5:20: error: Application type mismatch: The argument
  hn
has type
  Q
but is expected to have type
  ¬?m.2
in the application
  absurd ?m.4 hn
`;
const notIntroOnAtom = `Proof.lean:5:2: error: Tactic \`apply\` failed: could not unify the conclusion of \`@Not.intro\`
  False
with the goal
  P

Note: The full type of \`@Not.intro\` is
  ∀ {a : Prop}, (a → False) → ¬a
`;

describe('explainLeanMessage for negation', () => {
    const explain = (output) => explainLeanMessage(parseLeanMessages(output)[0].text);

    it('explains reaching a contradiction when the goal is not ⊥', () => {
        expect(explain(contradictionOnOtherGoal)).toBe('המטרה היא Q, ולא סתירה. כדי להשתמש בסתירה כאן, קודם השתמשו בגרירה "סתירה גוררת Q" ועברו להוכיח את התנאי שלה.');
    });

    it('explains two assumptions that do not contradict each other', () => {
        expect(explain(notContradicting)).toBe('hn אומרת ¬Q, אבל השלילה של ההנחה האחרת בבלוק היא ¬P, ולכן הן לא סותרות זו את זו.');
    });

    it('explains using an assumption as a negation when it is not one', () => {
        expect(explain(notANegation)).toBe('hn אומרת Q, וזו לא שלילה, ולכן אין טענה שהיא שוללת.');
    });

    it('explains proving a goal that is not a negation by assuming what it negates', () => {
        expect(explain(notIntroOnAtom)).toBe('המטרה היא P, והיא לא שלילה, ולכן אי אפשר להוכיח אותה בהנחת הטענה שהיא שוללת.');
    });
});

// Real Lean 4.26 output for a forward step (modus ponens) that does not fit.
const notTheCondition = `Proof.lean:5:16: error: Application type mismatch: The argument
  hr
has type
  R
but is expected to have type
  P
in the application
  h1 hr
`;
const notAnImplication = `Proof.lean:5:13: error: Function expected at
  h1
but this term has type
  P ∧ Q

Note: Expected a function because this term is being applied to the argument
  hp
`;

describe('explainLeanMessage for a forward step', () => {
    const explain = (output) => explainLeanMessage(parseLeanMessages(output)[0].text);

    it('explains an assumption that is not the condition of the implication', () => {
        expect(explain(notTheCondition)).toBe('hr אומרת R, אבל התנאי של h1 הוא P, ולכן אי אפשר להסיק ממנה את המסקנה של h1.');
    });

    it('explains using an assumption that is not an implication', () => {
        expect(explain(notAnImplication)).toBe('h1 אומרת (P ∧ Q), וזו לא גרירה, ולכן אין לה תנאי ומסקנה.');
    });
});
