// Right-to-left text treats the logical symbols as neutral, so next to Hebrew
// a formula can come out in the wrong order: "¬P" as "P¬", "⊥ → Q" as
// "Q → ⊥", and "P → ⊥" before a Hebrew word as "⊥ → P". Wrapping each formula
// that contains a logical symbol in a left-to-right isolate (LRI … PDI) keeps
// it in order.
const LRI = '\u2066';
const PDI = '\u2069';

// A run of formula characters (names, also Greek ones, connectives,
// quantifiers, parentheses, brackets and :: of lists,
// commas between arguments as in R(x,y), spaces) from
// its first to its last name, ⊥ or parenthesis; a trailing space or
// punctuation before the Hebrew stays outside. Only runs with a logical
// symbol are formulas: a lone name like P reads the same either way.
const FORMULA_RUN = /[A-Za-zα-ω0-9([{¬⊥∀∃∅𝒫⋃⋂](?:[A-Za-zα-ω0-9()[\]¬⊥∧∨→↔↑≡∀∃, ∈∉⊆∩∪∆∘×⁻¹_{}|∅ᶜ\\=𝒫⋃⋂₀+*·^≤≥<>∣]|::)*[A-Za-zα-ω0-9)\]}⊥∅ᶜ₀¹]|[¬⊥∅]/gu;
const LOGICAL_SYMBOL = /[¬⊥∧∨→↔↑≡∀∃∈∉⊆∩∪∆∘⁻∅ᶜ\\=𝒫⋃⋂+*·^≤≥<>∣[]|::/u;

const count = (text, char) => text.split(char).length - 1;

export const isolateFormulas = (text) => text.replace(FORMULA_RUN, (match) => {
    if (!LOGICAL_SYMBOL.test(match)) return match;
    // Parentheses of the surrounding text, as in "סתירה (⊥)", stay outside.
    let formula = match;
    let before = '';
    let after = '';
    while (formula.endsWith(')') && count(formula, ')') > count(formula, '(')) {
        formula = formula.slice(0, -1).trimEnd();
        after = `)${after}`;
    }
    while (formula.startsWith('(') && count(formula, '(') > count(formula, ')')) {
        formula = formula.slice(1).trimStart();
        before = `${before}(`;
    }
    return `${before}${LRI}${formula}${PDI}${after}`;
});

// A Hebrew text with formulas in one field, as in a menu ("את a ב־b"):
// a block draws a field left to right, so the whole text is a right-to-left
// isolate (RLI … PDI), with its formulas left to right inside it.
const RLI = '\u2067';
export const isolateHebrew = (text) => `${RLI}${text}${PDI}`;

// For tests: the text as a student reads it, without the invisible isolates.
export const withoutIsolates = (text) => text.replace(/[\u2066\u2067\u2069\u200f]/g, '');
