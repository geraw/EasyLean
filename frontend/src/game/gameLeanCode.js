import { LEAN_PRELUDE, SET_PRELUDE, leanBranches, leanGenerator } from '../generator/lean';
import { PLACEHOLDER } from '../blocks/gameBlocks';

const findGoalBlock = (workspace) => workspace?.getTopBlocks(true).find(b => b.type === 'game_goal');

// Lean source for a game level, plus which move produced each line (so a
// Lean error can be shown on the block that caused it, or, for a part of the
// proof left unfinished, on the part's last move: partLastBlockIds). With untilBlockId,
// the proof stops right before that block (or right after it, with
// includeUntilBlock), which is how the "before/after the move" proof states
// are computed; if that block is not one of the moves, the whole proof is used.
//
// Moves that split the proof (see leanBranches) put each part's sub-proof on
// its own indented lines. An empty part gets `skip`, so Lean reports its goal
// as unsolved. When the proof stops inside a part, the later parts only get
// `sorry` (Lean needs all of them, but they are not open at that point), and
// stateLine is the line opening the innermost part still open: Lean reports
// that part's remaining goals there (or on the theorem's line, at the top
// level, where the open parts of a rule the proof stopped right after are
// reported on their own lines).
export const generateGameLeanSource = (workspace, level, preamble, { includeFallback = true, untilBlockId = null, includeUntilBlock = false } = {}) => {
    const goalBlock = findGoalBlock(workspace);
    if (!goalBlock) return { code: '', lineBlockIds: new Map(), partLastBlockIds: new Map(), stateLine: null, inPart: false };

    // Levels often give assumptions the proof does not need, so Lean's
    // unused-variable warnings are just noise here.
    const header = `${preamble}\n${LEAN_PRELUDE}${level.usesSets ? SET_PRELUDE : ''}set_option linter.unusedVariables false\n${level.variableLine}\n\ntheorem ${level.name} ${level.params} : ${level.proposition} := by\n`;
    const lines = [];
    const lineBlockIds = new Map();
    const partLastBlockIds = new Map();
    const firstLine = header.split('\n').length; // 1-based line of the first move
    let stateLine = firstLine - 1;
    let stopped = false;

    const emit = (text, depth, blockId) => {
        lineBlockIds.set(firstLine + lines.length, blockId);
        lines.push('  '.repeat(depth) + text);
    };

    // Emits the moves from `block` on; returns the last move emitted, if any.
    const emitMoves = (block, depth) => {
        let last = null;
        for (; block && !stopped; block = block.getNextBlock()) {
            const isUntil = block.id === untilBlockId;
            if (isUntil && !includeUntilBlock) {
                stopped = true;
                break;
            }
            const code = leanGenerator.blockToCode(block, true);
            code.split('\n').slice(0, -1).forEach((line) => emit(line, depth, block.id));
            last = block;
            // Cut right after a rule that splits the proof: each of its parts is still open.
            const cutAfterRule = isUntil;
            if (isUntil) stopped = true;
            const branches = leanBranches[block.type]?.(block) || [];
            for (const { input, header: branchHeader } of branches) {
                const headerIndex = lines.length;
                emit(`  ${branchHeader}`, depth, block.id);
                if (stopped && !cutAfterRule) {
                    // The proof was cut in an earlier part. Lean needs every part
                    // (e.g. every case), so this one only gets a placeholder.
                    emit('    sorry', depth, block.id);
                    continue;
                }
                const lastInBranch = cutAfterRule ? null : emitMoves(block.getInputTargetBlock(input), depth + 1);
                if (lines.length === headerIndex + 1) emit('    skip', depth, block.id);
                // Lean reports an unfinished part on its opening line; the
                // part's last move is where it was left unfinished.
                if (lastInBranch) partLastBlockIds.set(firstLine + headerIndex, lastInBranch.id);
                if (stopped && !cutAfterRule && stateLine < firstLine + headerIndex) stateLine = firstLine + headerIndex;
            }
            if (stopped) break;
        }
        return last;
    };

    const goalProof = goalBlock.getInputTargetBlock('PROOF');
    emitMoves(goalProof, 0);
    let proof = lines.map((line) => `${line}\n`).join('');
    if (!proof.trim()) proof = includeFallback ? '  sorry\n' : '  exact ?_\n';
    return { code: header + proof, lineBlockIds, partLastBlockIds, stateLine, inPart: stateLine >= firstLine };
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

// The moves of the proof in the order they are read: each move, then the
// moves inside its parts, then the next move.
const movesInOrder = (block) => {
    const moves = [];
    for (; block; block = block.getNextBlock()) {
        moves.push(block);
        (leanBranches[block.type]?.(block) || []).forEach(({ input }) => moves.push(...movesInOrder(block.getInputTargetBlock(input))));
    }
    return moves;
};

const hasPlaceholder = (block) => block.inputList.some((input) => input.fieldRow.some((field) => field.EDITABLE && field.isVisible() && String(field.getValue()).trim() === PLACEHOLDER));

// The first move with a field the student has not filled in yet, or null.
export const findIncompleteMove = (workspace) => {
    const proof = findGoalBlock(workspace)?.getInputTargetBlock('PROOF');
    return movesInOrder(proof).find(hasPlaceholder) || null;
};
