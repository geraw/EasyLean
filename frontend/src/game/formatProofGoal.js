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

// The functions of units 11 and 12, and the ways structures are built, applied
// to their arguments as functions are written: `double (k + 1)` is
// `double(k + 1)`, `mirror (node l r)` is `mirror(node(l,r))`, and Lean's
// `List.length l` is `length(l)`.
const FUNCTION_NAMES = new Set(['double', 'sumTo', 'oddSum', 'sumCubes', 'f', 'g', 'injective', 'surjective', 'reflexive', 'symmetric', 'transitive', 'antisymmetric', 'max', 'length', 'leaves', 'nodes', 'height', 'mirror', 'node',
    'opening', 'closing', 'atoms', 'binaries', 'negations', 'depth', 'atom', 'neg', 'conj']);
const NAME = /^[\p{L}\p{N}_'₀-₉]+/u;
const closingOf = (text, start) => {
    const open = text[start];
    const close = open === '(' ? ')' : ']';
    let depth = 0;
    for (let index = start; index < text.length; index += 1) {
        if (text[index] === open) depth += 1;
        if (text[index] === close) depth -= 1;
        if (depth === 0) return index;
    }
    return -1;
};
// An argument at `start`: a name, or a group in parentheses or brackets.
const argumentAt = (text, start) => {
    if (text[start] === '(' || text[start] === '[') {
        const end = closingOf(text, start);
        if (end < 0) return null;
        const inner = writeApplications(text.slice(start + 1, end));
        return { text: text[start] === '(' ? inner : `[${inner}]`, end: end + 1 };
    }
    const name = text.slice(start).match(NAME)?.[0];
    return name && !FUNCTION_NAMES.has(name) ? { text: name, end: start + name.length } : null;
};
const writeApplications = (text) => {
    const source = text.replace(/\bList\.length\b/g, 'length');
    let result = '';
    let index = 0;
    while (index < source.length) {
        // A function applied to its arguments needs no parentheses of its own:
        // `(node l r)` is `node(l,r)`.
        const argumentList = /[\p{L}\p{N}_'₀-₉)]$/u.test(source.slice(0, index));
        const end = source[index] === '(' && !argumentList ? closingOf(source, index) : -1;
        if (end > 0) {
            const inner = writeApplications(source.slice(index + 1, end));
            const application = inner.match(/^[\p{L}_][\p{L}\p{N}_'₀-₉]*\(/u);
            result += application && closingOf(inner, application[0].length - 1) === inner.length - 1 ? inner : `(${inner})`;
            index = end + 1;
            continue;
        }
        const name = source.slice(index).match(NAME)?.[0];
        const atWordStart = !index || !NAME.test(source[index - 1]);
        if (!name || !atWordStart) {
            result += name && !atWordStart ? name : source[index];
            index += name && !atWordStart ? name.length : 1;
            continue;
        }
        index += name.length;
        const args = [];
        while (FUNCTION_NAMES.has(name) && source[index] === ' ') {
            const argument = argumentAt(source, index + 1);
            if (!argument) break;
            args.push(argument.text);
            index = argument.end;
        }
        result += args.length ? `${name}(${args.join(',')})` : name;
    }
    return result;
};

// Lists (unit 12) and sets (units 7-8): Lean prints `(l ++ m) ++ k` as
// `l ++ m ++ k`, `(a :: l) ++ m` as `a :: l ++ m`, and `(A \ B) ∩ C` as
// `A \ B ∩ C`, by the precedence of the operators. The display writes the
// parentheses of every operation inside another one (but a :: inside a ::,
// which reads one way only), so that the grouping shows; and a whole side of
// an equation needs none of its own: `x = (a :: l)` is `x = a :: l`. The set
// a membership is about is in parentheses when it is an operation:
// `¬x ∈ A \ B` is `¬x ∈ (A \ B)`, which cannot be read as `(¬x ∈ A) \ B`.
const RELATIONS = new Set(['=', '≠', '≤', '<', '≥', '>']);
const INFIX = { '++': [65, 'left'], '::': [67, 'right'], '∪': [65, 'left'], '∆': [65, 'left'], '∩': [70, 'left'], '\\': [70, 'left'], '∘': [90, 'right'] };
const isInfix = (word) => Object.prototype.hasOwnProperty.call(INFIX, word);
// The words of a text at its top level: groups in parentheses or brackets are
// one word each, with their insides written the same way.
const topLevelWords = (text) => {
    const words = [];
    let word = '';
    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        if (char === '(' || char === '[') {
            const end = closingOf(text, index);
            if (end < 0) return null;
            word += `${char}${writeLists(text.slice(index + 1, end))}${text[end]}`;
            index = end;
        } else if (char === ' ') {
            if (word) words.push(word);
            word = '';
        } else {
            word += char;
        }
    }
    if (word) words.push(word);
    return words;
};
// A run atom (op atom)*, parsed by the operators' precedence, and written
// with parentheses.
const writeListRun = (words) => {
    let position = 0;
    const parse = (minimum) => {
        let left = { atom: words[position] };
        position += 1;
        while (isInfix(words[position]) && INFIX[words[position]][0] >= minimum) {
            const op = words[position];
            const [precedence, associativity] = INFIX[op];
            position += 1;
            left = { op, left, right: parse(associativity === 'left' ? precedence + 1 : precedence) };
        }
        return left;
    };
    const write = (node, parent, side) => {
        if (node.atom !== undefined) return /^[⋃⋂] /.test(node.atom) ? `(${node.atom})` : node.atom;
        const text = `${write(node.left, node.op, 'left')} ${node.op} ${write(node.right, node.op, 'right')}`;
        const chain = node.op === '::' && parent === '::' && side === 'right';
        return parent && !chain ? `(${text})` : text;
    };
    return write(parse(0), null, null);
};
const enclosedGroup = (word) => word.startsWith('(') && closingOf(word, 0) === word.length - 1;
const writeLists = (text) => {
    if (!/\+\+|::|∪|∆|∩|∘|\\/.test(text)) return text;
    const separate = topLevelWords(text);
    if (!separate) return text;
    // The union or intersection of a family is one operand: `⋃ F ∪ A` is (⋃ F) ∪ A.
    const words = separate.reduce((merged, word) => (['⋃', '⋂'].includes(merged.at(-1)) ? [...merged.slice(0, -1), `${merged.at(-1)} ${word}`] : [...merged, word]), []);
    const result = [];
    for (let index = 0; index < words.length;) {
        if (isInfix(words[index + 1])) {
            let end = index + 1;
            while (isInfix(words[end])) end += 2;
            const run = writeListRun(words.slice(index, end));
            result.push(words[index - 1] === '∈' ? `(${run})` : run);
            index = end;
        } else {
            const word = words[index];
            const alone = (index === 0 || RELATIONS.has(words[index - 1])) && (index === words.length - 1 || RELATIONS.has(words[index + 1]));
            result.push(alone && enclosedGroup(word) && /\+\+|::/.test(word) ? word.slice(1, -1) : word);
            index += 1;
        }
    }
    return result.join(' ');
};

// The image and the preimage (unit 10), as the course writes them: Lean's
// `Set.image f A` is f[A], and `Set.preimage f B` is f⁻¹[B]; and a set given
// by a property, `setOf fun x => P x`, is {x | P(x)} (to the end of the
// statement, or of the parentheses around it).
const writeImages = (text) => {
    let result = text.replace(/setOf fun (\S+) => ([^()]*(?:\([^()]*\)[^()]*)*)/gu, (match, x, body) => `{${x} | ${body.trim()}}`);
    for (let previous = null; previous !== result;) {
        previous = result;
        result = result.replace(/Set\.(image|preimage) (\S+) (\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)|[^\s()]+)/u,
            (match, kind, f, set) => `${f}${kind === 'preimage' ? '⁻¹' : ''}[${stripOuterParentheses(set)}]`);
    }
    return result;
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
        // The body of every quantifier is in parentheses, so it is clear where
        // it begins and ends: `∀x (∃y (R(x,y)))`, `∃j (n = 2 · j)`.
        const enclose = (text) => (stripOuterParentheses(text) !== text ? text : `(${text})`);
        return quantifier.names.reduceRight((inner, name) => `${quantifier.symbol}${name} ${enclose(inner)}`, formatProofGoal(quantifier.body));
    }
    // Lean's False is the contradiction, written ⊥ in the course.
    if (normalized === 'False') return '⊥';
    // A predicate applied to objects: `R x y` is `R(x,y)`.
    const tokens = normalized.split(/\s+/);
    if (tokens.length > 1 && tokens.every((token) => /^[\p{L}_][\p{L}\p{N}_']*$/u.test(token))) {
        return `${tokens[0]}(${tokens.slice(1).join(',')})`;
    }
    // Multiplication is written with a dot.
    // The union and intersection of a family are written next to it, ⋃F, as
    // in the textbooks: apart, ⋂ F reads like the binary ∩ with a side missing.
    return writeLists(writeApplications(writePowerSets(writeImages(normalized)))).replace(/ \* /g, ' · ').replace(/([⋃⋂]) /g, '$1')
        // The inverse of an inverse: Lean writes R⁻¹⁻¹.
        .replace(/(\S+⁻¹)⁻¹/g, '($1)⁻¹');
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

// The name of a new object for a quantified variable: the variable's own
// name, as the course writes it ("יהי x שרירותי"), or, when an object in hand
// already has it, the first subscript none has (x₀, x₁, ...).
export const freshName = (variable, taken = []) => {
    if (!taken.includes(variable)) return variable;
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

const isAtom = (text) => /^[\p{L}\p{N}_₀-₉']+(⁻¹)?$/u.test(text);
const wrap = (text) => {
    const set = stripOuterParentheses(text);
    // An image or a preimage is written f[A], f⁻¹[B]: one piece.
    return isAtom(set) || /^Set\.(image|preimage) /.test(set) ? set : `(${set})`;
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
    '∆': { lemma: 'easylean_mem_symmDiff', name: 'ההפרש הסימטרי', means: (t, [a, b]) => `${t} ∈ ${a} \\ ${b} ∨ ${t} ∈ ${b} \\ ${a}` },
    'ᶜ': { lemma: 'easylean_mem_compl', name: 'המשלים', means: (t, [a]) => `¬${t} ∈ ${a}` },
    '∅': { lemma: 'easylean_mem_empty', name: 'הקבוצה הריקה', means: () => 'False' },
    '𝒫': { lemma: 'easylean_mem_powerset', name: 'קבוצת החזקה', means: (t, [a]) => `${t} ⊆ ${stripOuterParentheses(a)}` },
    '⋃': { lemma: 'easylean_mem_sUnion', name: 'איחוד המשפחה', means: (t, [f]) => `∃ S, S ∈ ${f} ∧ ${t} ∈ S` },
    '⋂': { lemma: 'easylean_mem_sInter', name: 'חיתוך המשפחה', means: (t, [f]) => `∀ S, S ∈ ${f} → ${t} ∈ S` },
    // Relations (unit 9): a member is a pair (x, y).
    '⁻¹': { lemma: 'easylean_mem_inv', name: 'היחס ההפוך', means: (t, [r]) => { const [x, y] = pairOf(t); return `(${y}, ${x}) ∈ ${r}`; } },
    // The middle of a composition is y, as in the textbooks: (x, z) ∈ R ∘ S.
    '∘': { lemma: 'easylean_mem_comp', name: 'ההרכבה', means: (t, [r, s]) => { const [x, z] = pairOf(t); return `∃ y, (${x}, y) ∈ ${s} ∧ (y, ${z}) ∈ ${r}`; } },
    '[]_': { lemma: 'easylean_mem_cls', name: 'מחלקת השקילות', means: (t, [x, r]) => `(${stripOuterParentheses(x)}, ${stripOuterParentheses(t)}) ∈ ${r}` },
    // Functions (unit 10): the image, the preimage, and a set given by a property.
    image: { lemma: 'easylean_mem_image', name: 'התמונה', means: (t, [f, a]) => `∃ x, x ∈ ${a} ∧ ${f} x = ${t}` },
    preimage: { lemma: 'easylean_mem_preimage', name: 'התמונה ההפוכה', means: (t, [f, b]) => `${f} ${t} ∈ ${b}` },
    setOf: { lemma: 'easylean_mem_setOf', name: 'קבוצה לפי תכונה', means: (t, [x, p]) => substituteName(stripOuterParentheses(p), stripOuterParentheses(x), t) },
};

// A statement with a name replaced by a term (a whole word only).
const substituteName = (text, name, term) => text.replace(new RegExp(`(?<![\\p{L}\\p{N}_₀-₉'])${name}(?![\\p{L}\\p{N}_₀-₉'])`, 'gu'), term);

// The two parts of a pair `(x, y)`, or of any other member, as Lean would
// name them.
const pairOf = (text) => {
    const inner = stripOuterParentheses(text);
    const comma = findTopLevel(inner, [',']);
    return comma ? [inner.slice(0, comma.index).trim(), inner.slice(comma.index + 1).trim()] : [`${text}.1`, `${text}.2`];
};

// The properties of a relation (unit 9), defined as statements about its
// pairs: what each says, the lemma stating it (see RELATION_PRELUDE), and its
// name in Hebrew.
const PROPERTIES = {
    reflexive: { name: 'הרפלקסיביות', means: (r) => `∀ x, (x, x) ∈ ${r}` },
    symmetric: { name: 'הסימטריות', means: (r) => `∀ x y, (x, y) ∈ ${r} → (y, x) ∈ ${r}` },
    transitive: { name: 'הטרנזיטיביות', means: (r) => `∀ x y z, (x, y) ∈ ${r} ∧ (y, z) ∈ ${r} → (x, z) ∈ ${r}` },
    antisymmetric: { name: 'האנטי־סימטריות', means: (r) => `∀ x y, (x, y) ∈ ${r} ∧ (y, x) ∈ ${r} → x = y` },
    // Of a function (unit 10): (g ∘ f)(x) is written g(f(x)), as the move does.
    injective: { name: 'פונקציה חד־חד־ערכית', means: (f) => `∀ x y, ${applied(f, 'x')} = ${applied(f, 'y')} → x = y` },
    surjective: { name: 'פונקציה על', means: (f) => `∀ y, ∃ x, ${applied(f, 'x')} = y` },
};
const applied = (f, x) => {
    const composition = stripOuterParentheses(f).match(/^(\S+) ∘ (\S+)$/);
    return composition ? `${composition[1]} (${composition[2]} ${x})` : `${f} ${x}`;
};

// The main operation of a set expression and its operands, or null for a set's name.
const mainSetOperation = (text) => {
    const set = stripOuterParentheses(text);
    for (const operations of [['∪', '∆'], ['∩', '\\']]) {
        const found = findLastTopLevel(set, operations);
        if (found) return { operation: found.operation, operands: [set.slice(0, found.index).trim(), set.slice(found.index + found.length).trim()] };
    }
    // Composition binds tighter, and to the right: R ∘ S ∘ T is R ∘ (S ∘ T).
    const composition = findTopLevel(set, [' ∘ ']);
    if (composition) return { operation: '∘', operands: [set.slice(0, composition.index).trim(), set.slice(composition.index + 3).trim()] };
    if (set.endsWith('ᶜ')) return { operation: 'ᶜ', operands: [set.slice(0, -1).trim()] };
    if (set.endsWith('⁻¹')) return { operation: '⁻¹', operands: [set.slice(0, -2).trim()] };
    const equivalenceClass = set.match(/^\[(.+)\]_(.+)$/);
    if (equivalenceClass) return { operation: '[]_', operands: [equivalenceClass[1], equivalenceClass[2]] };
    const image = set.match(/^Set\.(image|preimage) (\S+) (.+)$/);
    if (image) return { operation: image[1], operands: [image[2], image[3]] };
    const byProperty = set.match(/^setOf fun (\S+) => (.+)$/);
    if (byProperty) return { operation: 'setOf', operands: [byProperty[1], byProperty[2]] };
    if (set === '∅') return { operation: '∅', operands: [] };
    const prefix = ['𝒫', '⋃', '⋂'].find((operation) => set.startsWith(`${operation} `) || set.startsWith(`${operation}(`));
    return prefix ? { operation: prefix, operands: [set.slice(prefix.length).trim()] } : null;
};

// What a membership statement `t ∈ S` means by the definition of S's main
// operation, or a property of a relation (`reflexive R`) by its definition:
// { name, lemma, means }, or null when it is not one.
export const unfoldMembership = (text) => {
    // A property of one relation or function: its argument is a name or a group.
    const property = stripOuterParentheses(text || '').match(/^(reflexive|symmetric|transitive|antisymmetric|injective|surjective) ([^\s()]+|\((?:[^()]|\([^()]*\))*\))$/);
    if (property) {
        const { name, means } = PROPERTIES[property[1]];
        return { name, lemma: `easylean_${property[1]}`, means: means(wrap(property[2])) };
    }
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
