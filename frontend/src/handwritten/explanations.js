import { formatProofGoal, splitImplication } from '../game/formatProofGoal';

// Explanations of Lean's errors for the handwritten version, where assumptions
// have no names: each one speaks of an assumption by what it says. They come
// before the course's usual explanations (see explainLeanMessage), which
// still cover the errors that never mention an assumption.

const formula = (text) => formatProofGoal(text.trim());
const isHole = (text) => /^\?m\.\d+$/.test(text.trim());

export const INCOMPLETE_MOVE = 'בבלוק הזה יש שדה מסומן ?. בחרו בו את ההנחה שהמהלך משתמש בה, מתוך הרשימה או בכתיבה ידנית. במצב ההוכחה רואים מה יש לנו ביד.';

// Lean's "Application type mismatch" for a use of an implication (easylean_mp).
const APPLICATION = /^Application type mismatch: The argument\s*\n\s*(.+?)\s*\nhas type\s*\n\s*(.+?)\s*\nbut is expected to have type\s*\n\s*(.+?)\s*\nin the application\s*\n\s*easylean_mp(.*)/;

export const HANDWRITTEN_EXPLANATIONS = [
    {
        pattern: APPLICATION,
        explain: ([, , type, expected, args]) => {
            if (args.trim().split(/\s+/).length > 1) {
                // The second argument, forward: an assumption that is not the condition.
                return `ההנחה ${formula(type)} היא לא התנאי של הגרירה: התנאי שלה הוא ${formula(expected)}.`;
            }
            const parts = splitImplication(type);
            if (!parts) return `ההנחה ${formula(type)} היא לא גרירה, ולכן אין לה תנאי ומסקנה.`;
            // Backward: the expected type is "? → goal".
            const goal = splitImplication(expected)?.[1];
            return goal && !isHole(goal)
                ? `המסקנה של ${formula(type)} היא ${formula(parts[1])}, אבל צריך להוכיח ${formula(goal)}. אפשר לעבור לתנאי של גרירה רק כשהמסקנה שלה היא בדיוק מה שצריך להוכיח.`
                : `אי אפשר להשתמש כאן בגרירה ${formula(type)}.`;
        },
    },
    {
        // Closing the goal with an assumption that says something else (the
        // course's own rules, easylean_…, have their own explanations).
        pattern: /^type mismatch\s*\n[ \t]*(?![ \t]|easylean_)(.+?)\s*\nhas type\s*\n\s*(.+?)\s*\nbut is expected to have type\s*\n\s*(.+?)\s*(?:\n|$)/i,
        explain: ([, , actual, expected]) => `ההנחה ${formula(actual)} היא לא מה שצריך להוכיח: צריך להוכיח ${formula(expected)}. אפשר לסיים רק בעזרת הנחה שאומרת בדיוק את זה.`,
    },
    {
        // A statement that is not one of the assumptions in hand.
        pattern: /^Tactic `assumption` failed[\s\S]*?^⊢ (.+)$/m,
        explain: ([, statement]) => `אין בידינו הנחה שאומרת ${formula(statement)}. בחרו הנחה מהרשימה, או בדקו את מה שכתבתם מול מצב ההוכחה.`,
    },
    {
        pattern: /unknown identifier [`'‘]?([^`'’\s]+)[`'’]?/i,
        explain: ([, name]) => `${name} לא מופיעה בשלב הזה. בדקו את מה שכתבתם מול מצב ההוכחה.`,
    },
    {
        // A typed statement Lean could not read.
        pattern: /^(unexpected|expected)\b/,
        explain: () => 'לא הצלחנו לקרוא את הטענה שכתבתם. כתבו אותה כמו במצב ההוכחה, למשל P → Q.',
    },
];
