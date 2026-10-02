// Right-to-left text treats ¬ as neutral, so next to Hebrew "¬P" shows as
// "P¬". Wrapping each negated formula in a left-to-right isolate (LRI … PDI)
// keeps it in order. Formulas that start with a letter or a parenthesis are
// already laid out correctly.
const LRI = '⁦';
const PDI = '⁩';

// ¬ followed by a name or a parenthesized formula (one level of nesting).
const NEGATED_FORMULA = /¬+(?:\((?:[^()]|\([^()]*\))*\)|[A-Za-z][A-Za-z0-9]*)/g;

export const isolateNegations = (text) => text.replace(NEGATED_FORMULA, (match) => `${LRI}${match}${PDI}`);

// For tests: the text as a student reads it, without the invisible isolates.
export const withoutIsolates = (text) => text.replace(/[⁦⁩]/g, '');
