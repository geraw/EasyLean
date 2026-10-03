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
        expect(explain(unknownName)).toBe('אין הנחה או עצם בשם hh. בדקו את השם מול מצב ההוכחה.');
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
        const problem = findLeanProblem(holeAndUnsolved, { includeUnsolvedGoals: true });
        expect({ ...problem, message: withoutIsolates(problem.message) }).toEqual({
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

// Real Lean 4.26 output for a forward step (modus ponens, via easylean_mp) that does not fit.
const notTheCondition = `Proof.lean:9:28: error: Application type mismatch: The argument
  hr
has type
  P a
but is expected to have type
  R
in the application
  easylean_mp h1 hr
`;
const notAnImplication = `Proof.lean:9:25: error: Application type mismatch: The argument
  h1
has type
  R ∧ S
but is expected to have type
  ?m.3 → ?m.4
in the application
  easylean_mp h1
`;
const forallAsImplication = notAnImplication.replace('R ∧ S', '∀ (x : α), P x').replace('?m.3 → ?m.4', 'R → ?m.5');
const objectAsPremise = `Proof.lean:9:27: error: Application type mismatch: The argument
  a
has type
  α
of sort \`Type\` but is expected to have type
  ?m.4
of sort \`Prop\` in the application
  easylean_mp ?m.7 a
`;

describe('explainLeanMessage for a forward step', () => {
    const explain = (output) => explainLeanMessage(parseLeanMessages(output)[0].text);

    it('explains an assumption that is not the condition of the implication', () => {
        expect(explain(notTheCondition)).toBe('hr אומרת P(a), אבל התנאי של h1 הוא R, ולכן אי אפשר להסיק ממנה את המסקנה של h1.');
    });

    it('explains using an assumption that is not an implication', () => {
        expect(explain(notAnImplication)).toBe('h1 אומרת (R ∧ S), וזו לא גרירה, ולכן אין לה תנאי ומסקנה.');
    });

    it('explains using a "for all" as if it were an implication', () => {
        expect(explain(forallAsImplication)).toBe('h1 אומרת ∀x P(x), טענת "לכל" ולא גרירה. כדי להשתמש בה מציבים בה עצם.');
    });

    it('explains giving an object where an assumption is needed', () => {
        expect(explain(objectAsPremise)).toBe('a הוא עצם, לא הנחה. כדי להסיק מהגרירה צריך הנחה שאומרת את התנאי שלה.');
    });
});

// Real Lean 4.26 output for unit 4's quantifier rules, and for assuming the
// condition of an implication, used on formulas of the wrong kind.
const assumeOnForall = `Proof.lean:9:2: error: Type mismatch
  easylean_imp_intro fun h => ?m.5
has type
  ?m.2 → ?m.3
but is expected to have type
  ∀ (x : α), P x
`;
const assumeOnAtom = assumeOnForall.replace('∀ (x : α), P x', 'R');
const arbitraryOnImplication = `Proof.lean:9:2: error: Type mismatch
  easylean_forall_intro fun x => ?m.5
has type
  ∀ (x : ?m.2), ?m.3 x
but is expected to have type
  R → S
`;
const substituteIntoImplication = `Proof.lean:9:34: error: Application type mismatch: The argument
  h
has type
  R → S
but is expected to have type
  ∀ (x : α), ?m.4 x
in the application
  easylean_forall_elim h
`;
const substituteAStatement = `Proof.lean:9:36: error: Application type mismatch: The argument
  hr
has type
  R
of sort \`Prop\` but is expected to have type
  ?m.3
of sort \`Type ?u.101\` in the application
  easylean_forall_elim ?m.6 hr
`;
const witnessForAnd = `Proof.lean:5:2: error: Tactic \`apply\` failed: could not unify the conclusion of \`Exists.intro a\`
  Exists ?m.3
with the goal
  R ∧ R
`;
const obtainFromAnd = `Proof.lean:5:21: error: Application type mismatch: The argument
  h
has type
  P a ∧ R
but is expected to have type
  ∃ x, ?m.4 x
in the application
  Exists.elim h
`;

describe('explainLeanMessage for quantifiers', () => {
    const explain = (output) => explainLeanMessage(parseLeanMessages(output)[0].text);

    it('explains assuming a condition when the goal is a "for all", or no implication', () => {
        expect(explain(assumeOnForall)).toBe('המטרה היא ∀x P(x), טענת "לכל" ולא גרירה, ולכן אין תנאי להניח. כדי להוכיח "לכל" לוקחים עצם שרירותי.');
        expect(explain(assumeOnAtom)).toBe('המטרה היא R, והיא לא גרירה, ולכן אין תנאי להניח.');
    });

    it('explains taking an arbitrary object when the goal is an implication', () => {
        expect(explain(arbitraryOnImplication)).toBe('המטרה היא (R → S), וזו גרירה ולא טענת "לכל". כדי להוכיח גרירה מניחים את התנאי שלה.');
    });

    it('explains substituting into something that is not a "for all", or substituting a statement', () => {
        expect(explain(substituteIntoImplication)).toBe('h אומרת (R → S), וזו לא טענת "לכל", ולכן אי אפשר להציב בה עצם.');
        expect(explain(substituteAStatement)).toBe('hr היא הנחה, לא עצם, ולכן אי אפשר להציב אותה בטענת "לכל". מציבים עצם מהתחום.');
    });

    it('explains choosing a witness for a goal that is not a "there exists"', () => {
        expect(explain(witnessForAnd)).toBe('המטרה היא (R ∧ R), והיא לא טענת "קיים", ולכן אין עד לבחור.');
    });

    it('explains taking an object from an assumption that is not a "there exists"', () => {
        expect(explain(obtainFromAnd)).toBe('h אומרת (P(a) ∧ R), וזו לא טענת "קיים", ולכן אין ממנה עצם לקבל.');
    });
});

// Real Lean 4.26 output for proving a negation when the goal is not one.
const notIntroOnContradiction = `Proof.lean:5:2: error: Type mismatch
  Not.intro fun h => ?m.4
has type
  ¬?m.2
but is expected to have type
  False
`;
const notIntroOnAtomStrict = notIntroOnContradiction.replace('  False\n', '  P\n');

describe('explainLeanMessage for proving a negation', () => {
    const explain = (output) => explainLeanMessage(parseLeanMessages(output)[0].text);

    it('explains that a contradiction goal is not a negation', () => {
        expect(explain(notIntroOnContradiction)).toBe('המטרה היא כבר סתירה (⊥), ולא שלילה, ולכן אין טענה להניח. כדי להגיע לסתירה, השתמשו בהנחות שבידיכם, למשל בשלילה ובטענה שהיא שוללת.');
    });

    it('explains a goal that is not a negation', () => {
        expect(explain(notIntroOnAtomStrict)).toBe('המטרה היא P, והיא לא שלילה, ולכן אי אפשר להוכיח אותה בהנחת הטענה שהיא שוללת.');
    });
});
