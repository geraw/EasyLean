// Right-to-left text treats ¬ and ⊥ as neutral, so next to Hebrew "¬P"
// shows as "P¬" and "⊥ → Q" as "Q → ⊥". Wrapping each formula that starts
// with one of them in a left-to-right isolate (LRI … PDI) keeps it in order.
// Formulas that start with a letter or a parenthesis are already laid out
// correctly.
const LRI = '\u2066';
const PDI = '\u2069';

// From ¬ or ⊥ through the rest of the formula: letters, connectives,
// parentheses and spaces, up to the last letter, ⊥ or closing parenthesis
// (so a trailing space or punctuation before the Hebrew stays outside).
const FORMULA = /[¬⊥][¬⊥A-Za-z0-9()∧∨→↔ ]*[A-Za-z0-9)⊥]|[¬⊥]/g;

export const isolateFormulas = (text) => text.replace(FORMULA, (match) => {
    // A closing parenthesis of the surrounding text, as in "סתירה (⊥)", stays outside.
    let formula = match;
    let rest = '';
    const unbalanced = () => formula.split(')').length > formula.split('(').length;
    while (formula.endsWith(')') && unbalanced()) {
        formula = formula.slice(0, -1).trimEnd();
        rest = `)${rest}`;
    }
    return `${LRI}${formula}${PDI}${rest}`;
});

// For tests: the text as a student reads it, without the invisible isolates.
export const withoutIsolates = (text) => text.replace(/[⁦⁩]/g, '');
