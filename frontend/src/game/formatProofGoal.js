const stripOuterParentheses = (text) => {
    let result = text.trim();
    let changed = true;
    while (changed && result.startsWith('(') && result.endsWith(')')) {
        let depth = 0;
        changed = false;
        for (let index = 0; index < result.length; index += 1) {
            if (result[index] === '(') depth += 1;
            if (result[index] === ')') depth -= 1;
            if (depth === 0 && index < result.length - 1) break;
            if (index === result.length - 1 && depth === 0) {
                result = result.slice(1, -1).trim();
                changed = true;
            }
        }
    }
    return result;
};

// Binary connectives from the loosest to the tightest (Lean's precedence);
// all of them group to the right, so splitting at the first one is correct.
const CONNECTIVES = [['↔', ['↔', '<->']], ['→', ['→', '->']], ['∨', ['∨', '\\/']], ['∧', ['∧', '/\\']]];

const QUANTIFIERS = ['∀', '∃'];

// The first top-level (not parenthesized) occurrence of the connective. A
// quantifier extends to the end of the formula, so the search stops there:
// in `∀ x, P x → Q x` the arrow belongs to the quantifier's body.
const findTopLevel = (text, spellings) => {
    let depth = 0;
    for (let index = 0; index < text.length; index += 1) {
        if (text[index] === '(') depth += 1;
        if (text[index] === ')') depth -= 1;
        if (depth !== 0) continue;
        if (QUANTIFIERS.includes(text[index])) return null;
        const spelling = spellings.find((candidate) => text.startsWith(candidate, index));
        // `<->` also contains `->`, which must not be read as an implication.
        if (spelling && !(spelling === '->' && text[index - 1] === '<')) return { index, length: spelling.length };
    }
    return null;
};

// Lean's `∀ (x y : α), body` or `∃ x, body` as { symbol, names, body }.
const parseQuantifier = (text) => {
    if (!QUANTIFIERS.includes(text[0])) return null;
    let depth = 0;
    for (let index = 1; index < text.length; index += 1) {
        if (text[index] === '(') depth += 1;
        if (text[index] === ')') depth -= 1;
        if (depth === 0 && text[index] === ',') {
            const names = text.slice(1, index).replace(/[()]/g, '').split(':')[0].trim().split(/\s+/);
            return { symbol: text[0], names, body: text.slice(index + 1) };
        }
    }
    return null;
};

// A quantified formula (possibly negated) inside a connective is written in
// parentheses, so it is clear where its body ends: `(∀x P(x)) → Q`.
const isQuantified = (formula) => QUANTIFIERS.includes(formula.replace(/^¬+/, '')[0]);
const operand = (formula) => (isQuantified(formula) ? `(${formula})` : formula);

// Writes every compound formula in parentheses, so students never need to
// know which connective binds tighter: `P ∧ Q → R` is `((P ∧ Q) → R)`.
// Quantifiers and predicates use the course's notation: Lean's
// `∀ (x : α), R x y` is `∀x R(x,y)`.
export const formatProofGoal = (text) => {
    const normalized = stripOuterParentheses(text || '');
    for (const [symbol, spellings] of CONNECTIVES) {
        const found = findTopLevel(normalized, spellings);
        if (!found) continue;
        const left = formatProofGoal(normalized.slice(0, found.index));
        const right = formatProofGoal(normalized.slice(found.index + found.length));
        return `(${operand(left)} ${symbol} ${operand(right)})`;
    }
    if (normalized.startsWith('¬')) return `¬${formatProofGoal(normalized.slice(1))}`;
    const quantifier = parseQuantifier(normalized);
    if (quantifier) {
        const prefix = quantifier.names.map((name) => `${quantifier.symbol}${name}`).join(' ');
        return `${prefix} ${formatProofGoal(quantifier.body)}`;
    }
    // Lean's False is the contradiction, written ⊥ in the course.
    if (normalized === 'False') return '⊥';
    // A predicate applied to objects: `R x y` is `R(x,y)`.
    const tokens = normalized.split(/\s+/);
    if (tokens.length > 1 && tokens.every((token) => /^[\p{L}_][\p{L}\p{N}_']*$/u.test(token))) {
        return `${tokens[0]}(${tokens.slice(1).join(',')})`;
    }
    // The functions of unit 6 inside an equation: `double (k + 1)` is
    // `double(k + 1)`; multiplication is written with a dot.
    return normalized.replace(/ \* /g, ' · ').replace(/\b(double|sumTo|oddSum) (\([^()]*\)|[\p{L}\p{N}_]+)/gu,
        (_, name, argument) => `${name}(${argument.replace(/^\((.*)\)$/, '$1')})`);
};

// The condition and conclusion of an implication, as Lean or a student
// writes it (`P → Q → R` is P and `Q → R`), or null for any other formula.
export const splitImplication = (text) => {
    const normalized = stripOuterParentheses(text || '');
    if (findTopLevel(normalized, CONNECTIVES[0][1])) return null;
    const found = findTopLevel(normalized, CONNECTIVES[1][1]);
    if (!found) return null;
    return [normalized.slice(0, found.index).trim(), normalized.slice(found.index + found.length).trim()];
};
