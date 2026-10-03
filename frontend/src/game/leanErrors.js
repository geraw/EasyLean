import { formatProofGoal } from './formatProofGoal';
import { isolateFormulas } from './bidi';

// Turns Lean's error messages into explanations in the terms the units use
// (condition, conclusion, goal, assumption), so students never see Lean itself.

export const GENERIC_PROBLEM = 'המהלך הזה לא מתאים למצב ההוכחה כרגע.';

// A move whose field still holds the placeholder ? (see PLACEHOLDER).
export const INCOMPLETE_MOVE = 'בבלוק הזה יש שדה מסומן ?. כתבו בו את ההנחה (או הטענה) שהמהלך משתמש בה, או שם להנחה החדשה שהוא מוסיף. במצב ההוכחה רואים מה יש לנו ביד.';

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

// The rule a block generated, by the head of the failed application.
const explainApplication = ({ argument, type, expected, application, argumentSort }) => {
    const [head, ...args] = application.split(/\s+/);
    const isObject = argumentSort?.startsWith('Type');
    const isForall = type.trim().startsWith('∀');
    if (head === 'easylean_mp') {
        if (args.length === 1) {
            return isForall
                ? `${argument} אומרת ${formula(type)}, טענת "לכל" ולא גרירה. כדי להשתמש בה מציבים בה עצם.`
                : `${argument} אומרת ${formula(type)}, וזו לא גרירה, ולכן אין לה תנאי ומסקנה.`;
        }
        const rule = args[0].startsWith('?') ? 'הגרירה' : args[0];
        const fromRule = args[0].startsWith('?') ? 'מהגרירה' : `מ־${rule}`;
        return isObject
            ? `${argument} הוא עצם, לא הנחה. כדי להסיק ${fromRule} צריך הנחה שאומרת את התנאי שלה.`
            : `${argument} אומרת ${formula(type)}, אבל התנאי של ${rule} הוא ${formula(expected)}, ולכן אי אפשר להסיק ממנה את המסקנה של ${rule}.`;
    }
    if (head === 'easylean_forall_elim') {
        return args.length === 1
            ? `${argument} אומרת ${formula(type)}, וזו לא טענת "לכל", ולכן אי אפשר להציב בה עצם.`
            : `${argument} היא הנחה, לא עצם, ולכן אי אפשר להציב אותה בטענת "לכל". מציבים עצם מהתחום.`;
    }
    if (head === 'Exists.elim') {
        return `${argument} אומרת ${formula(type)}, וזו לא טענת "קיים", ולכן אין ממנה עצם לקבל.`;
    }
    return null;
};

const EXPLANATIONS = [
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
        pattern: /^Application type mismatch: [\s\S]*in the application\s*\n\s*(easylean_mp|easylean_forall_elim|Exists\.elim)\b/,
        explain: (_, text) => explainApplication(parseApplicationMismatch(text)) || GENERIC_PROBLEM,
    },
    {
        // A contradiction used on a goal that is not ⊥ (see logic_contradiction / logic_not_elim).
        pattern: /^type mismatch\s*\n\s*absurd .+?\s*\nhas type\s*\n\s*False\s*\nbut is expected to have type\s*\n\s*(.+?)\s*(?:\n|$)/i,
        explain: ([, goal]) => `המטרה היא ${formula(goal)}, ולא סתירה. כדי להשתמש בסתירה כאן, קודם השתמשו בגרירה "סתירה גוררת ${formula(goal)}" ועברו להוכיח את התנאי שלה.`,
    },
    {
        // The two assumptions of a contradiction do not contradict each other,
        // or the assumption used as a negation is not one.
        pattern: /^Application type mismatch: The argument\s*\n\s*(.+?)\s*\nhas type\s*\n\s*(.+?)\s*\nbut is expected to have type\s*\n\s*(.+?)\s*\nin the application\s*\n\s*absurd /,
        explain: ([, name, type, expected]) => (expected.includes('?')
            ? `${name} אומרת ${formula(type)}, וזו לא שלילה, ולכן אין טענה שהיא שוללת.`
            : `${name} אומרת ${formula(type)}, אבל השלילה של ההנחה האחרת בבלוק היא ${formula(expected)}, ולכן הן לא סותרות זו את זו.`),
    },
    {
        // exact h, where h is not the goal
        pattern: /^type mismatch\s*\n\s*(.+?)\s*\nhas type\s*\n\s*(.+?)\s*\nbut is expected to have type\s*\n\s*(.+?)\s*(?:\n|$)/i,
        explain: ([, term, actual, expected]) => `${term.trim()} אומרת ${formula(actual)}, אבל המטרה היא ${formula(expected)}. אפשר לסגור את המטרה רק בעזרת הנחה שאומרת בדיוק את המטרה.`,
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
        // A rule for using "and" / "iff", applied to an assumption of another kind.
        pattern: /^Application type mismatch: The argument\s*\n\s*(.+?)\s*\nhas type\s*\n\s*(.+?)\s*\nbut is expected to have type[\s\S]*?in the application\s*\n\s*(And|Iff)\./,
        explain: ([, name, type, connective]) => (connective === 'And'
            ? `${name} אומרת ${formula(type)}, וזו לא טענת "וגם", ולכן אי אפשר להסיק ממנה שני צדדים.`
            : `${name} אומרת ${formula(type)}, וזו לא טענת "אם ורק אם", ולכן אי אפשר להסיק ממנה שני כיוונים.`),
    },
    {
        // Splitting into cases by an assumption that is not an "or".
        pattern: /^Invalid alternative name `inl`|^Tactic `cases` failed: major premise type is not an inductive type/,
        explain: () => 'ההנחה שבחרתם היא לא טענת "או", ולכן אי אפשר לחלק לפיה למקרים.',
    },
    {
        // apply h, where the conclusion of h is not the goal
        pattern: /could not unify the conclusion of `(.+?)`\s*\n\s*(.+?)\s*\nwith the goal\s*\n\s*(.+?)\s*(?:\n|$)/,
        explain: ([, name, conclusion, goal]) => `המסקנה (צד ימין) של ${name} היא ${formula(conclusion)}, אבל המטרה היא ${formula(goal)}. אפשר לעבור לתנאי של גרירה רק כשהמסקנה שלה זהה למטרה.`,
    },
    {
        // apply h, where h is not an implication at all
        pattern: /could not unify the type of `(.+?)`\s*\n\s*(.+?)\s*\nwith the goal\s*\n\s*(.+?)\s*(?:\n|$)/,
        explain: ([, name, type, goal]) => `${name} אומרת ${formula(type)}, וזו לא גרירה שהמסקנה שלה היא המטרה ${formula(goal)}. אם ${name} היא בדיוק המטרה, סגרו את המטרה בעזרתה.`,
    },
    {
        pattern: /unknown identifier [`'‘]?([^`'’\s]+)[`'’]?/i,
        explain: ([, name]) => `אין הנחה או עצם בשם ${name}. בדקו את השם מול מצב ההוכחה.`,
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
    {
        // A field the parser could not read, e.g. an empty name.
        pattern: /^(unexpected|expected)\b/,
        explain: () => 'לא הצלחנו לקרוא את מה שכתוב באחד השדות של הבלוק. בדקו שכתבתם בו שם של הנחה.',
    },
];

// Explanations are Hebrew with formulas inside, so negations are isolated (see bidi.js).
export const explainLeanMessage = (text) => {
    for (const { pattern, explain } of EXPLANATIONS) {
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
