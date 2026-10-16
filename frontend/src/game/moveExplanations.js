import { formatProofGoal, splitImplication } from './formatProofGoal';

// Explanations of Lean's errors for the moves, where assumptions have no
// names: each one speaks of an assumption by what it says. They come before
// the general explanations in leanErrors.js, which cover the errors that
// never mention an assumption.

const formula = (text) => formatProofGoal(text.trim());
const isHole = (text) => /^\?m\.\d+$/.test(text.trim());

export const INCOMPLETE_MOVE = 'בבלוק הזה יש שדה מסומן ?. בחרו בו את ההנחה שהמהלך משתמש בה, מתוך הרשימה או בכתיבה ידנית. במצב ההוכחה רואים מה יש לנו ביד.';

// Lean's "Application type mismatch" for a use of an implication (easylean_mp).
const APPLICATION = /^Application type mismatch: The argument\s*\n\s*(.+?)\s*\nhas type\s*\n\s*(.+?)\s*\nbut is expected to have type\s*\n\s*(.+?)\s*\nin the application\s*\n\s*easylean_mp(.*)/;

export const MOVE_EXPLANATIONS = [
    {
        // Replacing by a law a side that is not there (see the move replace).
        pattern: /^easylean: no part of the form ([^\n]+)/,
        explain: ([, side]) => `במקום שבחרתם אין חלק מהצורה ${side}, ולכן אין מה להחליף. בדקו את המקום ואת כיוון ההחלפה.`,
    },
    {
        // Using a negation as an implication (see refuseNegation in blocks/moves.js).
        pattern: /^easylean: (forward|backward) by a negation: ([^\n]+)/,
        explain: ([, direction, negation]) => (direction === 'forward'
            ? `ההנחה ${formula(negation)} היא שלילה, ולא גרירה. כדי להגיע לסתירה משלילה ומהטענה שהיא שוללת, משתמשים בבלוק "יש לנו ביד את ? ואת השלילה שלה, וזו סתירה."`
            : `ההנחה ${formula(negation)} היא שלילה, ולא גרירה. כדי להגיע לסתירה בעזרת שלילה, משתמשים בבלוק "לפי השלילה ? שיש לנו ביד".`),
    },
    {
        // Assuming the condition of a goal that is a negation (see the move assume).
        pattern: /^easylean: the goal is a negation[\s\S]*⊢ ([^\n]+)\s*$/,
        explain: ([, goal]) => (goal.trim().startsWith('¬') || / → False$/.test(goal.trim())
            ? `המטרה ${formula(goal)} היא שלילה, ולא גרירה. כדי להוכיח שלילה משתמשים בבלוק "כדי להוכיח את השלילה, נניח את הטענה שהיא שוללת ונגיע לסתירה".`
            : `המטרה ${formula(goal)} היא, לפי ההגדרה, שלילה, ולא גרירה. כדי להוכיח שלילה משתמשים בבלוק "כדי להוכיח את השלילה, נניח את הטענה שהיא שוללת ונגיע לסתירה".`),
    },
    {
        pattern: APPLICATION,
        explain: ([, , type, expected, args]) => {
            if (args.trim().split(/\s+/).length > 1) {
                // The second argument, forward: an assumption that is not the condition.
                return `ההנחה ${formula(type)} היא לא התנאי של הגרירה: התנאי שלה הוא ${formula(expected)}.`;
            }
            const parts = splitImplication(type);
            if (!parts && type.trim().startsWith('∀')) return `ההנחה ${formula(type)} היא טענת "לכל" ולא גרירה. כדי להשתמש בה מציבים בה עצם.`;
            if (!parts) return `ההנחה ${formula(type)} היא לא גרירה, ולכן אין לה תנאי ומסקנה.`;
            // Backward: the expected type is "? → goal".
            const goal = splitImplication(expected)?.[1];
            return goal && !isHole(goal)
                ? `המסקנה של ${formula(type)} היא ${formula(parts[1])}, אבל צריך להוכיח ${formula(goal)}. אפשר לעבור לתנאי של גרירה רק כשהמסקנה שלה היא בדיוק מה שצריך להוכיח.`
                : `אי אפשר להשתמש כאן בגרירה ${formula(type)}.`;
        },
    },
    {
        // Using an "and" or an "iff" that the assumption is not.
        pattern: /^Application type mismatch: The argument\s*\n\s*.+?\s*\nhas type\s*\n\s*(.+?)\s*\nbut is expected to have type[\s\S]*?in the application\s*\n\s*(And|Iff)\./,
        explain: ([, type, connective]) => (connective === 'And'
            ? `ההנחה ${formula(type)} היא לא טענת "וגם", ולכן אין לה שני צדדים.`
            : `ההנחה ${formula(type)} היא לא טענת "אם ורק אם", ולכן אין לה שני כיוונים.`),
    },
    {
        // Using as a "for all" or a "there exists" an assumption that is not one.
        pattern: /^Application type mismatch: The argument\s*\n\s*.+?\s*\nhas type\s*\n\s*(.+?)\s*\n(?:of sort .*)?but is expected to have type\s*\n\s*(∀|∃)[\s\S]*?in the application\s*\n\s*(?:easylean_forall_elim|Exists\.elim) /,
        explain: ([, type, symbol]) => (symbol === '∀'
            ? `ההנחה ${formula(type)} היא לא טענת "לכל", ולכן אין במה להציב עצם.`
            : `ההנחה ${formula(type)} היא לא טענת "קיים", ולכן אין עצם לקבל ממנה.`),
    },
    {
        // Using an inclusion with an assumption that is not one, or with a
        // membership in another set (Lean names the given assumptions here).
        pattern: /^Application type mismatch: The argument\s*\n\s*.+?\s*\nhas type\s*\n\s*(.+?)\s*\n(?:of sort .*)?but is expected to have type\s*\n\s*(.+?)\s*\n(?:of sort .*)?in the application\s*\n\s*easylean_subset_elim /,
        explain: ([, type, expected]) => {
            const member = expected.match(/∈ (.+)$/);
            return member && !expected.includes('⊆')
                ? `ההנחה ${formula(type)} לא אומרת שהאיבר שייך ל־${formula(member[1])}, הקבוצה המוכלת בהכלה.`
                : `ההנחה ${formula(type)} היא לא הכלה.`;
        },
    },
    {
        // Using as a negation an assumption that is not one (not_elim).
        pattern: /^Application type mismatch: The argument\s*\n\s*.+?\s*\nhas type\s*\n\s*(.+?)\s*\n(?:of sort .*)?but is expected to have type\s*\n\s*¬\?[\s\S]*?in the application\s*\n\s*absurd /,
        explain: ([, type]) => `ההנחה ${formula(type)} היא לא שלילה, ולכן אין טענה שהיא שוללת.`,
    },
    {
        // Closing before the goal is in hand, or a statement chosen in a move
        // that is not one of the assumptions in hand.
        pattern: /^Tactic `assumption` failed[\s\S]*?^⊢ (.+)$/m,
        explain: ([, statement]) => `אין בידינו הנחה שאומרת ${formula(statement)}. במצב ההוכחה רואים מה יש לנו ביד.`,
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
