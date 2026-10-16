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
// A power set is written as a function of its set: `𝒫 A` is `𝒫(A)`, and
// `𝒫 (A ∪ B)` is `𝒫(A ∪ B)`.
const POWER_SET = '𝒫 ';
const powerSetArgument = (text, start) => {
    if (text.startsWith(POWER_SET, start)) {
        const inner = powerSetArgument(text, start + POWER_SET.length);
        return { text: `𝒫(${inner.text})`, end: inner.end };
    }
    if (text[start] === '(') {
        let depth = 0;
        for (let index = start; index < text.length; index += 1) {
            if (text[index] === '(') depth += 1;
            if (text[index] === ')') depth -= 1;
            if (depth === 0) return { text: writePowerSets(text.slice(start + 1, index)), end: index + 1 };
        }
    }
    const atom = text.slice(start).match(/^[\p{L}\p{N}_₀-₉']+/u)?.[0] || '';
    return { text: atom, end: start + atom.length };
};
const writePowerSets = (text) => {
    let result = '';
    let index = 0;
    for (let found = text.indexOf(POWER_SET); found !== -1; found = text.indexOf(POWER_SET, index)) {
        const argument = powerSetArgument(text, found + POWER_SET.length);
        result += `${text.slice(index, found)}𝒫(${argument.text})`;
        index = argument.end;
    }
    return result + text.slice(index);
};

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
        // A relation (n = 2 · j, x ∈ A) is written in parentheses too, so it is
        // clear where the body begins: `∃j (n = 2 · j)`.
        const body = formatProofGoal(quantifier.body);
        const enclosed = stripOuterParentheses(body) !== body;
        const isRelation = / (=|≠|≤|<|≥|>|∈|∉|⊆) /.test(body) && !enclosed && !/^[¬∀∃]/.test(body);
        return `${prefix} ${isRelation ? `(${body})` : body}`;
    }
    // Lean's False is the contradiction, written ⊥ in the course.
    if (normalized === 'False') return '⊥';
    // A predicate applied to objects: `R x y` is `R(x,y)`.
    const tokens = normalized.split(/\s+/);
    if (tokens.length > 1 && tokens.every((token) => /^[\p{L}_][\p{L}\p{N}_']*$/u.test(token))) {
        return `${tokens[0]}(${tokens.slice(1).join(',')})`;
    }
    // The functions of unit 7 inside an equation: `double (k + 1)` is
    // `double(k + 1)`; multiplication is written with a dot.
    return writePowerSets(normalized).replace(/ \* /g, ' · ').replace(/\b(double|sumTo|oddSum) (\([^()]*\)|[\p{L}\p{N}_]+)/gu,
        (_, name, argument) => `${name}(${argument.replace(/^\((.*)\)$/, '$1')})`);
};

// The two sides of a formula whose main connective is `symbol` (one of
// CONNECTIVES), as Lean or a student writes it, or null for any other formula.
export const splitConnective = (text, symbol) => {
    const normalized = stripOuterParentheses(text || '');
    const position = CONNECTIVES.findIndex(([candidate]) => candidate === symbol);
    if (CONNECTIVES.slice(0, position).some(([, spellings]) => findTopLevel(normalized, spellings))) return null;
    const found = findTopLevel(normalized, CONNECTIVES[position][1]);
    if (!found) return null;
    return [normalized.slice(0, found.index).trim(), normalized.slice(found.index + found.length).trim()];
};

// The condition and conclusion of an implication (`P → Q → R` is P and `Q → R`).
export const splitImplication = (text) => splitConnective(text, '→');

// A formula quantified by `symbol` (∀ or ∃) as its first variable and the
// rest, its body (`∀ (x y : α), R x y` is x and `∀ y, R x y`), or null.
export const splitQuantifier = (text, symbol) => {
    const quantifier = parseQuantifier(stripOuterParentheses(text || ''));
    if (!quantifier || quantifier.symbol !== symbol) return null;
    const [variable, ...rest] = quantifier.names;
    const body = quantifier.body.trim();
    return { variable, body: rest.length ? `${symbol} ${rest.join(' ')}, ${body}` : body };
};

// The body with the term in place of the variable, as a whole word.
export const substitute = (body, variable, term) => {
    const name = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return body.replace(new RegExp(`(?<![\\p{L}\\p{N}_'])${name}(?![\\p{L}\\p{N}_'₀-₉])`, 'gu'), /\s/.test(term) ? `(${term})` : term);
};

// The name of a new object for a quantified variable: the variable's name
// with the first subscript no object in hand has (x₀, x₁, ...), so that the
// object is not confused with the variable of a formula.
export const freshName = (variable, taken = []) => {
    const subscript = (n) => String(n).replace(/\d/g, (digit) => '₀₁₂₃₄₅₆₇₈₉'[digit]);
    for (let n = 0; ; n += 1) if (!taken.includes(`${variable}${subscript(n)}`)) return `${variable}${subscript(n)}`;
};

// The two sides of a relation (∈, ⊆, =) written at the top level of a
// statement that has no logical connective there, or null.
export const splitRelation = (text, relation) => {
    const normalized = stripOuterParentheses(text || '');
    if (normalized.startsWith('¬') || QUANTIFIERS.includes(normalized[0])
        || CONNECTIVES.some(([, spellings]) => findTopLevel(normalized, spellings))) return null;
    const found = findTopLevel(normalized, [` ${relation} `]);
    if (!found) return null;
    return [normalized.slice(0, found.index).trim(), normalized.slice(found.index + found.length).trim()];
};

const isAtom = (text) => /^[\p{L}\p{N}_₀-₉']+$/u.test(text);
const wrap = (text) => {
    const set = stripOuterParentheses(text);
    return isAtom(set) ? set : `(${set})`;
};

// The last top-level occurrence of one of the operations (they group to the left).
const findLastTopLevel = (text, operations) => {
    let depth = 0;
    let found = null;
    for (let index = 0; index < text.length; index += 1) {
        if (text[index] === '(') depth += 1;
        if (text[index] === ')') depth -= 1;
        if (depth !== 0) continue;
        const operation = operations.find((candidate) => text.startsWith(` ${candidate} `, index));
        if (operation) found = { index, operation, length: operation.length + 2 };
    }
    return found;
};

// The set operations, from the loosest: what membership in each means, the
// lemma stating it (see SET_PRELUDE), and its name in Hebrew.
const SET_OPERATIONS = {
    '∪': { lemma: 'easylean_mem_union', name: 'האיחוד', means: (t, [a, b]) => `${t} ∈ ${a} ∨ ${t} ∈ ${b}` },
    '∩': { lemma: 'easylean_mem_inter', name: 'החיתוך', means: (t, [a, b]) => `${t} ∈ ${a} ∧ ${t} ∈ ${b}` },
    '\\': { lemma: 'easylean_mem_diff', name: 'ההפרש', means: (t, [a, b]) => `${t} ∈ ${a} ∧ ¬${t} ∈ ${b}` },
    'ᶜ': { lemma: 'easylean_mem_compl', name: 'המשלים', means: (t, [a]) => `¬${t} ∈ ${a}` },
    '∅': { lemma: 'easylean_mem_empty', name: 'הקבוצה הריקה', means: () => 'False' },
    '𝒫': { lemma: 'easylean_mem_powerset', name: 'קבוצת החזקה', means: (t, [a]) => `${t} ⊆ ${a}` },
    '⋃₀': { lemma: 'easylean_mem_sUnion', name: 'איחוד המשפחה', means: (t, [f]) => `∃ S, S ∈ ${f} ∧ ${t} ∈ S` },
    '⋂₀': { lemma: 'easylean_mem_sInter', name: 'חיתוך המשפחה', means: (t, [f]) => `∀ S, S ∈ ${f} → ${t} ∈ S` },
};

// The main operation of a set expression and its operands, or null for a set's name.
const mainSetOperation = (text) => {
    const set = stripOuterParentheses(text);
    for (const operations of [['∪'], ['∩', '\\']]) {
        const found = findLastTopLevel(set, operations);
        if (found) return { operation: found.operation, operands: [set.slice(0, found.index).trim(), set.slice(found.index + found.length).trim()] };
    }
    if (set.endsWith('ᶜ')) return { operation: 'ᶜ', operands: [set.slice(0, -1).trim()] };
    if (set === '∅') return { operation: '∅', operands: [] };
    const prefix = ['𝒫', '⋃₀', '⋂₀'].find((operation) => set.startsWith(`${operation} `) || set.startsWith(`${operation}(`));
    return prefix ? { operation: prefix, operands: [set.slice(prefix.length).trim()] } : null;
};

// What a membership statement `t ∈ S` means by the definition of S's main
// operation: { name, lemma, means }, or null when it is not one.
export const unfoldMembership = (text) => {
    const sides = splitRelation(text, '∈');
    const main = sides && mainSetOperation(sides[1]);
    if (!main) return null;
    const { lemma, name, means } = SET_OPERATIONS[main.operation];
    return { name, lemma, means: means(wrap(sides[0]), main.operands.map(wrap)) };
};

// The statement a negation denies (`¬(P ∨ Q)` is `P ∨ Q`), or null when the
// formula is not a negation (`¬P ∨ Q` is an "or").
export const negatedStatement = (text) => {
    const normalized = stripOuterParentheses(text || '');
    if (!normalized.startsWith('¬') || CONNECTIVES.some(([, spellings]) => findTopLevel(normalized, spellings))) return null;
    return normalized.slice(1).trim();
};
