import { formatProofGoal } from './formatProofGoal';
import { MOVE_EXPLANATIONS } from './moveExplanations';
import { isolateFormulas } from './bidi';

// Turns Lean's error messages into explanations in the terms the units use
// (condition, conclusion, goal, assumption), so students never see Lean itself.

export const GENERIC_PROBLEM = 'המהלך הזה לא מתאים למצב ההוכחה כרגע.';

// A move whose field still holds the placeholder ? (see PLACEHOLDER).
export { INCOMPLETE_MOVE } from './moveExplanations';

const MESSAGE_HEADER = /^.*?:(\d+):(\d+): (error|warning|info)(?:\([^)]*\))?: ?(.*)$/;

// Splits Lean's output into messages; continuation lines belong to the message above.
export const parseLeanMessages = (output = '') => {
    const messages = [];
    output.split(/\r?\n/).forEach((text) => {
        const header = text.match(MESSAGE_HEADER);
        if (header) {
            messages.push({ line: Number(header[1]), severity: header[3], text: header[4] });
        } else if (messages.length > 0) {
            messages[messages.length - 1].text += `\n${text}`;
        }
    });
    return messages;
};

const goalsOf = (text) => [...text.matchAll(/^⊢ (.+)$/gm)].map((match) => formatProofGoal(match[1]));

const formula = (text) => formatProofGoal(text.trim());

// Lean's "Application type mismatch" as { argument, type, expected, application,
// argumentSort }, or null. The sort lines appear when an object is given
// where a statement is expected, or the other way around.
const parseApplicationMismatch = (text) => {
    const match = text.match(/^Application type mismatch: The argument\s*\n\s*(.+?)\s*\nhas type\s*\n\s*(.+?)\s*\n(?:of sort `([^`]*)` )?but is expected to have type\s*\n\s*(.+?)\s*\n(?:of sort `[^`]*` )?in the application\s*\n\s*(.+?)\s*(?:\n|$)/);
    if (!match) return null;
    const [, argument, type, argumentSort, expected, application] = match;
    return { argument, type, expected, application, argumentSort };
};

// What the moves' own explanations (moveExplanations.js) leave of a failed
// application: an object given where a statement is needed, or the other way
// around, or a "for all" used as an implication.
const explainApplication = ({ argument, type, application, argumentSort }) => {
    const [head, ...args] = application.split(/\s+/);
    if (head === 'easylean_mp') {
        if (argumentSort?.startsWith('Type')) return `${argument} הוא עצם, לא טענה. כדי להסיק מגרירה צריך טענה שאומרת את התנאי שלה.`;
        if (args.length === 1 && type.trim().startsWith('∀')) return `ההנחה ${formula(type)} היא טענת "לכל" ולא גרירה. כדי להשתמש בה מציבים בה עצם.`;
    }
    if (head === 'easylean_forall_elim' && args.length > 1) {
        return `${formula(argument)} היא טענה, לא עצם, ולכן אי אפשר להציב אותה בטענת "לכל". מציבים עצם מהתחום.`;
    }
    return null;
};

const EXPLANATIONS = [
    {
        // "Both sides are equal by definition" (rfl), when they are not.
        pattern: /^Tactic `rfl` failed: The left-hand side\s*\n\s*(.+?)\s*\nis not definitionally equal to the right-hand side\s*\n\s*(.+?)\s*(?:\n|$)/,
        explain: ([, left, right]) => `${formula(left)} ו־${formula(right)} לא שווים לפי ההגדרות בלבד. אולי צריך קודם להחליף לפי שוויון, לפתוח הגדרה, או להוכיח באינדוקציה?`,
    },
    {
        // Substituting by something that is not an equality.
        pattern: /^Invalid rewrite argument: Expected an equality[\s\S]*?but `.+?` is a proof of\s*\n\s*(.+?)\s*(?:\n|$)/,
        explain: ([, type]) => `ההנחה ${formula(type)} היא לא שוויון, ולכן אי אפשר להחליף לפיה.`,
    },
    {
        // Unfolding a function definition where it cannot be unfolded.
        pattern: /^Failed to rewrite using equation theorems for `(.+?)`/,
        explain: ([, name]) => `אין כאן מקום שאפשר לפתוח בו את ההגדרה של ${name}: היא נפתחת רק על 0 או על משהו מהצורה n + 1.`,
    },
    {
        pattern: /^omega could not prove the goal/,
        explain: () => 'החשבון לבדו לא מספיק כדי להוכיח את המטרה. אולי צריך קודם לפתוח הגדרה, או להחליף לפי הנחת האינדוקציה?',
    },
    {
        pattern: /^`grind` failed/,
        explain: () => 'האלגברה לבדה לא מספיקה כדי להוכיח את המטרה. אולי צריך קודם לפתוח הגדרה, או להחליף לפי הנחת האינדוקציה?',
    },
    {
        pattern: /^Tactic `induction` failed/,
        explain: () => 'אינדוקציה אפשרית רק על מספר טבעי. בחרו בבלוק את המספר שעליו הטענה מדברת.',
    },
    {
        // Unfolding a definition that is not there, or substituting a side
        // of an equality that does not occur.
        pattern: /^Tactic `rewrite` failed: Did not find an occurrence of the pattern\s*\n\s*(.+?)\s*\nin the target expression\s*\n\s*(.+?)\s*(?:\n|$)/,
        explain: ([, pattern, target]) => (/\?/.test(pattern)
            ? `ב־${formula(target)} אין מקום שאפשר לפתוח בו את ההגדרה הזאת.`
            : `ב־${formula(target)} לא מופיע ${formula(pattern)}, ולכן אין מה להחליף. אולי צריך להחליף בכיוון השני, או במקום אחר?`),
    },
    {
        // Proving an inclusion, when the goal is not one.
        pattern: /^type mismatch\s*\n\s*easylean_subset_intro[\s\S]*?but is expected to have type\s*\n\s*(.+?)\s*(?:\n|$)/i,
        explain: ([, goal]) => `המטרה היא ${formula(goal)}, והיא לא הכלה, ולכן אין איבר לקחת.`,
    },
    {
        // Proving set equality, when the goal is not one.
        pattern: /could not unify the conclusion of `@?easylean_set_eq`[\s\S]*?\nwith the goal\s*\n\s*(.+?)\s*(?:\n|$)/,
        explain: ([, goal]) => `המטרה היא ${formula(goal)}, והיא לא שוויון קבוצות.`,
    },
    {
        // Proving a negation, when the goal is not one.
        pattern: /^type mismatch\s*\n\s*Not\.intro[\s\S]*?but is expected to have type\s*\n\s*(.+?)\s*(?:\n|$)/i,
        explain: ([, goal]) => (goal.trim() === 'False'
            ? 'המטרה היא כבר סתירה (⊥), ולא שלילה, ולכן אין טענה להניח. כדי להגיע לסתירה, השתמשו בהנחות שבידיכם, למשל בשלילה ובטענה שהיא שוללת.'
            : `המטרה היא ${formula(goal)}, והיא לא שלילה, ולכן אי אפשר להוכיח אותה בהנחת הטענה שהיא שוללת.`),
    },
    {
        // Assuming the condition of an implication, when the goal is not one.
        pattern: /^type mismatch\s*\n\s*easylean_imp_intro[\s\S]*?but is expected to have type\s*\n\s*(.+?)\s*(?:\n|$)/i,
        explain: ([, goal]) => (goal.trim().startsWith('∀')
            ? `המטרה היא ${formula(goal)}, טענת "לכל" ולא גרירה, ולכן אין תנאי להניח. כדי להוכיח "לכל" לוקחים עצם שרירותי.`
            : `המטרה היא ${formula(goal)}, והיא לא גרירה, ולכן אין תנאי להניח.`),
    },
    {
        // Taking an arbitrary object, when the goal is not a "for all".
        pattern: /^type mismatch\s*\n\s*easylean_forall_intro[\s\S]*?but is expected to have type\s*\n\s*(.+?)\s*(?:\n|$)/i,
        explain: ([, goal]) => (/→/.test(formula(goal)) && !formula(goal).startsWith('∀')
            ? `המטרה היא ${formula(goal)}, וזו גרירה ולא טענת "לכל". כדי להוכיח גרירה מניחים את התנאי שלה.`
            : `המטרה היא ${formula(goal)}, והיא לא טענת "לכל", ולכן אין עצם שרירותי לקחת.`),
    },
    {
        // Choosing a witness, when the goal is not a "there exists".
        pattern: /could not unify the conclusion of `Exists\.intro[^`]*`[\s\S]*?\nwith the goal\s*\n\s*(.+?)\s*(?:\n|$)/,
        explain: ([, goal]) => `המטרה היא ${formula(goal)}, והיא לא טענת "קיים", ולכן אין עד לבחור.`,
    },
    {
        // The forward step, substituting into a "for all", or using a "there exists",
        // with an argument of the wrong kind.
        pattern: /^Application type mismatch: [\s\S]*in the application\s*\n\s*(easylean_mp|easylean_forall_elim|easylean_subset_elim|Exists\.elim)\b/,
        explain: (_, text) => explainApplication(parseApplicationMismatch(text)) || GENERIC_PROBLEM,
    },
    {
        // A contradiction used on a goal that is not ⊥.
        pattern: /^type mismatch\s*\n\s*absurd .+?\s*\nhas type\s*\n\s*False\s*\nbut is expected to have type\s*\n\s*(.+?)\s*(?:\n|$)/i,
        explain: ([, goal]) => `המטרה היא ${formula(goal)}, ולא סתירה. כדי להשתמש בסתירה כאן, קודם השתמשו במהלך "מסתירה נובע הכול, ולכן די להגיע לסתירה".`,
    },
    {
        // A rule for proving a connective, used on a goal of another kind.
        pattern: /could not unify the conclusion of `@(And\.intro|Or\.inl|Or\.inr|Iff\.intro|Not\.intro)`[\s\S]*?\nwith the goal\s*\n\s*(.+?)\s*(?:\n|$)/,
        explain: ([, rule, goal]) => ({
            'And.intro': `המטרה היא ${formula(goal)}, והיא לא טענת "וגם", ולכן אין לה שני צדדים להוכיח לחוד.`,
            'Or.inl': `המטרה היא ${formula(goal)}, והיא לא טענת "או", ולכן אין בה צד לבחור להוכיח.`,
            'Or.inr': `המטרה היא ${formula(goal)}, והיא לא טענת "או", ולכן אין בה צד לבחור להוכיח.`,
            'Iff.intro': `המטרה היא ${formula(goal)}, והיא לא טענת "אם ורק אם", ולכן אין לה שני כיוונים להוכיח.`,
            'Not.intro': `המטרה היא ${formula(goal)}, והיא לא שלילה, ולכן אי אפשר להוכיח אותה בהנחת הטענה שהיא שוללת.`,
        })[rule],
    },
    {
        // Splitting into cases by an assumption that is not an "or".
        pattern: /^Invalid alternative name `inl`|^Tactic `cases` failed: major premise type is not an inductive type/,
        explain: () => 'ההנחה שבחרתם היא לא טענת "או", ולכן אי אפשר לחלק לפיה למקרים.',
    },
    {
        // intro, when the goal is not an implication
        pattern: /no additional binders/,
        explain: (_, text) => {
            const [goal] = goalsOf(text);
            return goal
                ? `המטרה ${goal} היא לא גרירה, ולכן אין תנאי להניח.`
                : 'המטרה היא לא גרירה, ולכן אין תנאי להניח.';
        },
    },
    {
        pattern: /^unsolved goals/,
        explain: (_, text) => {
            const goals = goalsOf(text);
            return goals.length > 0
                ? `ההוכחה עוד לא הושלמה: נשאר להוכיח ${goals.join(', ')}.`
                : 'ההוכחה עוד לא הושלמה.';
        },
    },
];

// Explanations are Hebrew with formulas inside, so negations are isolated (see bidi.js).
// The explanations of the moves (see moveExplanations.js), which speak of an
// assumption by what it says, come first.
export const explainLeanMessage = (text) => {
    for (const { pattern, explain } of [...MOVE_EXPLANATIONS, ...EXPLANATIONS]) {
        const match = text.match(pattern);
        if (match) return isolateFormulas(explain(match, text));
    }
    return GENERIC_PROBLEM;
};

// The first problem worth showing a student, as { line, message, unsolved }, or null.
// Holes left on purpose to compute a proof state are not problems, and
// neither are unsolved goals unless the whole proof is being checked.
export const findLeanProblem = (output, { includeUnsolvedGoals = false } = {}) => {
    for (const { line, severity, text } of parseLeanMessages(output)) {
        if (severity !== 'error') continue;
        if (/don't know how to synthesize placeholder/.test(text)) continue;
        const unsolved = /^unsolved goals/.test(text);
        if (!includeUnsolvedGoals && unsolved) continue;
        return { line, message: explainLeanMessage(text), unsolved };
    }
    return null;
};
