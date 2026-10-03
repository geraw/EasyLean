import { formatProofGoal } from './formatProofGoal';
import { isolateFormulas } from './bidi';

// Turns Lean's error messages into explanations in the terms the units use
// (condition, conclusion, goal, assumption), so students never see Lean itself.

export const GENERIC_PROBLEM = 'המהלך הזה לא מתאים למצב ההוכחה כרגע.';

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

const EXPLANATIONS = [
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
        // Modus ponens with an assumption that is not the condition of the implication.
        pattern: /^Application type mismatch: The argument\s*\n\s*(\S+)\s*\nhas type\s*\n\s*(.+?)\s*\nbut is expected to have type\s*\n\s*(.+?)\s*\nin the application\s*\n\s*(\S+) \S+\s*$/,
        explain: ([, premise, type, condition, rule]) => `${premise} אומרת ${formula(type)}, אבל התנאי של ${rule} הוא ${formula(condition)}, ולכן אי אפשר להסיק ממנה את המסקנה של ${rule}.`,
    },
    {
        // Modus ponens with an assumption that is not an implication.
        pattern: /^Function expected at\s*\n\s*(\S+)\s*\nbut this term has type\s*\n\s*(.+?)\s*(?:\n|$)/,
        explain: ([, rule, type]) => `${rule} אומרת ${formula(type)}, וזו לא גרירה, ולכן אין לה תנאי ומסקנה.`,
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
        explain: ([, name]) => `אין הנחה בשם ${name}. בדקו את השם מול ההנחות שבמצב ההוכחה.`,
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
