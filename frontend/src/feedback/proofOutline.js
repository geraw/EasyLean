// A proof as its blocks read, for feedback: a line for each row of a block
// (each of its inputs), and the moves inside a block indented under it.
export const proofOutline = (block, depth = 0) => {
    const lines = [];
    for (let current = block; current; current = current.getNextBlock()) {
        for (const input of current.inputList) {
            if (!input.isVisible()) continue;
            const text = input.fieldRow.filter((field) => field.isVisible()).map((field) => field.getText()).join(' ')
                .replace(/\s+/g, ' ').trim();
            if (text) lines.push(`${'    '.repeat(depth)}${text}`);
            const child = input.connection?.targetBlock();
            if (child) lines.push(...proofOutline(child, depth + 1));
        }
    }
    return lines;
};
