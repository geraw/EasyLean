// Terms as Lean prints them (`List.length (a :: l) + 1`, `mirror (node l r)`),
// parsed by the precedence of their operators, so that the move that unfolds
// a definition can offer the parts it applies to, and name each in Lean.

// Binary operators: [precedence, associativity]. Lean's own precedences.
const OPERATORS = {
    '↔': [20, 'left'], '→': [25, 'right'], '∨': [30, 'right'], '∧': [35, 'right'],
    '=': [50, 'left'], '≠': [50, 'left'], '≤': [50, 'left'], '<': [50, 'left'], '≥': [50, 'left'], '>': [50, 'left'],
    '++': [65, 'left'], '+': [65, 'left'], '::': [67, 'right'], '*': [70, 'left'], '^': [75, 'right'],
};
const NAME = /^[\p{L}\p{N}_'.✝₀-₉]+/u;

const tokenize = (text) => {
    const tokens = [];
    for (let index = 0; index < text.length;) {
        const rest = text.slice(index);
        if (/^\s/.test(rest)) { index += 1; continue; }
        const operator = ['++', '::', '↔', '→', '∨', '∧', '≠', '≤', '≥', '=', '<', '>', '+', '*', '^', '¬', '(', ')'].find((op) => rest.startsWith(op));
        if (rest.startsWith('[')) {
            let depth = 0;
            let end = index;
            for (; end < text.length; end += 1) {
                if (text[end] === '[') depth += 1;
                if (text[end] === ']') depth -= 1;
                if (depth === 0) break;
            }
            tokens.push({ atom: text.slice(index, end + 1) });
            index = end + 1;
        } else if (operator) {
            tokens.push({ op: operator });
            index += operator.length;
        } else {
            const name = rest.match(NAME)?.[0];
            if (!name) return null;
            tokens.push({ atom: name });
            index += name.length;
        }
    }
    return tokens;
};

// A tree: { atom }, { fn, args } (an application), { op, left, right }, { not }.
export const parseTerm = (text) => {
    const tokens = tokenize(text || '');
    if (!tokens) return null;
    let position = 0;
    const peek = () => tokens[position];
    const primary = () => {
        const token = tokens[position];
        if (!token) throw new Error('end');
        position += 1;
        if (token.op === '(') {
            const inner = expression(0);
            if (tokens[position]?.op !== ')') throw new Error(')');
            position += 1;
            return inner;
        }
        if (token.op === '¬') return { not: unary() };
        if (token.atom !== undefined) return { atom: token.atom };
        throw new Error(token.op);
    };
    const startsArgument = (token) => token && (token.atom !== undefined || token.op === '(');
    // An application binds tighter than any operator: `f a (b c)`.
    const unary = () => {
        const head = primary();
        const args = [];
        while (head.atom !== undefined && startsArgument(peek())) args.push(primary());
        return args.length ? { fn: head.atom, args } : head;
    };
    const expression = (minimum) => {
        let left = unary();
        for (let token = peek(); token?.op && OPERATORS[token.op] && OPERATORS[token.op][0] >= minimum; token = peek()) {
            const [precedence, associativity] = OPERATORS[token.op];
            position += 1;
            const right = expression(associativity === 'left' ? precedence + 1 : precedence);
            left = { op: token.op, left, right };
        }
        return left;
    };
    try {
        const tree = expression(0);
        return position === tokens.length ? tree : null;
    } catch {
        return null;
    }
};

// A tree back in Lean, with parentheses around every part that is not an atom.
export const printTerm = (tree) => {
    const inner = (node) => (node.atom !== undefined ? node.atom : `(${printTerm(node)})`);
    if (tree.atom !== undefined) return tree.atom;
    if (tree.not) return `¬${inner(tree.not)}`;
    if (tree.fn) return [tree.fn, ...tree.args.map(inner)].join(' ');
    return `${inner(tree.left)} ${tree.op} ${inner(tree.right)}`;
};

// The parts of a tree, a part before its own parts, and the left before the right.
const subterms = (tree) => [tree, ...(tree.fn ? tree.args : tree.not ? [tree.not] : tree.op ? [tree.left, tree.right] : []).flatMap(subterms)];

const isAtom = (node, text) => node?.atom === text;
const isSuccessor = (node) => node?.op === '+' && isAtom(node.right, '1');
const isApplication = (node, names) => node?.fn !== undefined && names.includes(node.fn);
const isCons = (node) => node?.op === '::' || /^\[.+\]$/.test(node?.atom || '');

// For each function the move unfolds (FUNCTIONS in blocks/moves.js), when a
// part of a term is one it unfolds: the function applied to one of the ways
// its argument is built.
const UNFOLDS = {
    double: (node) => isApplication(node, ['double']) && (isAtom(node.args[0], '0') || isSuccessor(node.args[0])),
    sumTo: (node) => isApplication(node, ['sumTo']) && (isAtom(node.args[0], '0') || isSuccessor(node.args[0])),
    oddSum: (node) => isApplication(node, ['oddSum']) && (isAtom(node.args[0], '0') || isSuccessor(node.args[0])),
    sumCubes: (node) => isApplication(node, ['sumCubes']) && (isAtom(node.args[0], '0') || isSuccessor(node.args[0])),
    add: (node) => node.op === '+' && isSuccessor(node.right),
    pow: (node) => node.op === '^' && isSuccessor(node.right),
    append: (node) => node.op === '++' && (isAtom(node.left, '[]') || isCons(node.left)),
    length: (node) => isApplication(node, ['List.length']) && (isAtom(node.args[0], '[]') || isCons(node.args[0])),
    ...Object.fromEntries(['leaves', 'nodes', 'height', 'mirror'].map((name) => [name,
        (node) => isApplication(node, [name]) && (isAtom(node.args[0], 'leaf') || isApplication(node.args[0], ['node']))])),
    ...Object.fromEntries(['opening', 'closing', 'atoms', 'binaries', 'negations', 'depth'].map((name) => [name,
        (node) => isApplication(node, [name]) && isApplication(node.args[0], ['atom', 'neg', 'conj'])])),
};

// The parts of a statement (in Lean's spelling) that the definition of a
// function unfolds, in Lean's spelling, each once, in the order they appear.
export const unfoldableParts = (functionValue, statement) => {
    const tree = parseTerm(statement);
    const unfolds = UNFOLDS[functionValue];
    if (!tree || !unfolds) return [];
    return [...new Set(subterms(tree).filter(unfolds).map(printTerm))];
};

// Whether a part has no variables (`List.length []`, `double 0`, `mirror leaf`):
// Lean cannot tell its types from it alone (the type of the elements of []),
// but it is the base case of its definition, which Lean tries first.
const CONSTANTS = new Set(['[]', 'leaf']);
export const hasNoVariables = (part) => {
    const tree = parseTerm(part);
    return Boolean(tree) && subterms(tree).every((node) => node.atom === undefined || CONSTANTS.has(node.atom) || /^\d+$/.test(node.atom));
};
