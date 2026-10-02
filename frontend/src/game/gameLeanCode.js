import { leanGenerator } from '../generator/lean';

const findGoalBlock = (workspace) => workspace?.getTopBlocks(true).find(b => b.type === 'game_goal');

// Lean source for a game level, plus which move produced each line (so a
// Lean error can be shown on the block that caused it). With untilBlockId,
// the proof stops right before that block (or right after it, with
// includeUntilBlock), which is how the "before/after the move" proof states
// are computed; if that block is not one of the moves, the whole proof is used.
export const generateGameLeanSource = (workspace, level, preamble, { includeFallback = true, untilBlockId = null, includeUntilBlock = false } = {}) => {
    const goalBlock = findGoalBlock(workspace);
    if (!goalBlock) return { code: '', lineBlockIds: new Map() };

    const moves = [];
    for (let block = goalBlock.getInputTargetBlock('PROOF'); block; block = block.getNextBlock()) {
        if (block.id === untilBlockId) {
            if (includeUntilBlock) moves.push(block);
            break;
        }
        moves.push(block);
    }

    const header = `${preamble}\n${level.variableLine}\n\ntheorem ${level.name} ${level.params} : ${level.proposition} := by\n`;
    const lineBlockIds = new Map();
    let line = header.split('\n').length; // 1-based line of the first move
    let proof = '';
    moves.forEach((block) => {
        const code = leanGenerator.blockToCode(block, true);
        const lineCount = code.split('\n').length - 1;
        for (let offset = 0; offset < lineCount; offset += 1) lineBlockIds.set(line + offset, block.id);
        line += lineCount;
        proof += code;
    });
    if (!proof.trim()) proof = includeFallback ? '  sorry\n' : '  exact ?_\n';
    return { code: header + proof, lineBlockIds };
};

export const generateGameLeanCode = (...args) => generateGameLeanSource(...args).code;

export const getLastProofBlockId = (workspace) => {
    let proofBlock = findGoalBlock(workspace)?.getInputTargetBlock('PROOF');
    let lastBlockId = null;
    while (proofBlock) {
        lastBlockId = proofBlock.id;
        proofBlock = proofBlock.getNextBlock();
    }
    return lastBlockId;
};
