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

const findTopLevelArrow = (text) => {
    let depth = 0;
    for (let index = 0; index < text.length; index += 1) {
        if (text[index] === '(') depth += 1;
        if (text[index] === ')') depth -= 1;
        if (depth === 0 && text[index] === '→') return index;
        if (depth === 0 && text.slice(index, index + 2) === '->') return index;
    }
    return -1;
};

export const formatProofGoal = (text) => {
    const normalized = stripOuterParentheses(text || '');
    const arrowIndex = findTopLevelArrow(normalized);
    if (arrowIndex === -1) return normalized;
    const arrowLength = normalized[arrowIndex] === '→' ? 1 : 2;
    const left = formatProofGoal(normalized.slice(0, arrowIndex));
    const right = formatProofGoal(normalized.slice(arrowIndex + arrowLength));
    return `(${left} → ${right})`;
};
