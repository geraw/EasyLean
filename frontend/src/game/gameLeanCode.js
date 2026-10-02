import { leanGenerator } from '../generator/lean';

const findGoalBlock = (workspace) => workspace?.getTopBlocks(true).find(b => b.type === 'game_goal');

// Lean source for a game level. With untilBlockId, the proof stops right
// before that block (or right after it, with includeUntilBlock), which is how
// the "before/after the move" proof states are computed.
export const generateGameLeanCode = (workspace, level, preamble, { includeFallback = true, untilBlockId = null, includeUntilBlock = false } = {}) => {
    const goalBlock = findGoalBlock(workspace);
    if (!goalBlock) return '';
    let proof = '';
    let proofBlock = goalBlock.getInputTargetBlock('PROOF');
    let selectedBlockFound = !untilBlockId;
    while (proofBlock) {
        if (proofBlock.id === untilBlockId) {
            selectedBlockFound = true;
            if (includeUntilBlock) proof += leanGenerator.blockToCode(proofBlock, true);
            break;
        }
        proof += leanGenerator.blockToCode(proofBlock, true);
        proofBlock = proofBlock.getNextBlock();
    }
    if (untilBlockId && !selectedBlockFound) proof = leanGenerator.statementToCode(goalBlock, 'PROOF');
    if (!proof.trim()) proof = includeFallback ? '  sorry\n' : '  exact ?_\n';
    return `${preamble}\n${level.variableLine}\n\ntheorem ${level.name} ${level.params} : ${level.proposition} := by\n${proof}`;
};

export const getLastProofBlockId = (workspace) => {
    let proofBlock = findGoalBlock(workspace)?.getInputTargetBlock('PROOF');
    let lastBlockId = null;
    while (proofBlock) {
        lastBlockId = proofBlock.id;
        proofBlock = proofBlock.getNextBlock();
    }
    return lastBlockId;
};
