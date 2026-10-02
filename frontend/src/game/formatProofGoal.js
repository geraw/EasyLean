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

// The first top-level (not parenthesized) occurrence of the connective.
const findTopLevel = (text, spellings) => {
    let depth = 0;
    for (let index = 0; index < text.length; index += 1) {
        if (text[index] === '(') depth += 1;
        if (text[index] === ')') depth -= 1;
        if (depth !== 0) continue;
        const spelling = spellings.find((candidate) => text.startsWith(candidate, index));
        // `<->` also contains `->`, which must not be read as an implication.
        if (spelling && !(spelling === '->' && text[index - 1] === '<')) return { index, length: spelling.length };
    }
    return null;
};

// Writes every compound formula in parentheses, so students never need to
// know which connective binds tighter: `P ∧ Q → R` is `((P ∧ Q) → R)`.
export const formatProofGoal = (text) => {
    const normalized = stripOuterParentheses(text || '');
    for (const [symbol, spellings] of CONNECTIVES) {
        const found = findTopLevel(normalized, spellings);
        if (!found) continue;
        const left = formatProofGoal(normalized.slice(0, found.index));
        const right = formatProofGoal(normalized.slice(found.index + found.length));
        return `(${left} ${symbol} ${right})`;
    }
    if (normalized.startsWith('¬')) return `¬${formatProofGoal(normalized.slice(1))}`;
    // Lean's False is the contradiction, written ⊥ in the course.
    if (normalized === 'False') return '⊥';
    return normalized;
};
