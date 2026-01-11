import * as Blockly from 'blockly/core';

export const leanGenerator = new Blockly.Generator('LEAN');

leanGenerator.ORDER_ATOMIC = 0;

leanGenerator.scrub_ = function (block, code, opt_thisOnly) {
    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    const nextCode = opt_thisOnly ? '' : leanGenerator.blockToCode(nextBlock);
    return code + nextCode;
};

// Generator for 'theorem'
leanGenerator.forBlock['theorem'] = function (block) {
    const name = block.getFieldValue('NAME');
    const params = block.getFieldValue('PARAMETERS');
    const proposition = block.getFieldValue('PROPOSITION');
    const proof = leanGenerator.statementToCode(block, 'PROOF');

    // Basic Lean 4 theorem structure
    const PREAMBLE = ``;
    return `${PREAMBLE}\ntheorem ${name} ${params} : ${proposition} := by\n${proof}\n`;
};

leanGenerator.forBlock['lemma'] = function (block) {
    const name = block.getFieldValue('NAME');
    const params = block.getFieldValue('PARAMETERS');
    const proposition = block.getFieldValue('PROPOSITION');
    const proof = leanGenerator.statementToCode(block, 'PROOF');
    return `\ntheorem ${name} ${params} : ${proposition} := by\n${proof}\n`;
};

// Generator for 'tactic_intro'
leanGenerator.forBlock['tactic_intro'] = function (block) {
    const hypothesis = block.getFieldValue('HYPOTHESIS');
    return `  intro ${hypothesis}\n`;
};

// Generator for 'tactic_by_negation'
leanGenerator.forBlock['tactic_by_negation'] = function (block) {
    const hypothesis = block.getFieldValue('HYPOTHESIS');
    return `  intro ${hypothesis}\n`;
};

// Generator for 'tactic_intro_variable'
leanGenerator.forBlock['tactic_intro_variable'] = function (block) {
    const variable = block.getFieldValue('VARIABLE');
    const type = block.getFieldValue('TYPE');
    return `  intro ${variable}\n  have : ${type} := ${variable}\n`;
};

// Generator for 'tactic_contradiction'
leanGenerator.forBlock['tactic_contradiction'] = function (block) {
    const hypothesis = block.getFieldValue('HYPOTHESIS');
    return `  apply ${hypothesis}\n`;
};

// Generator for 'tactic_exact'
leanGenerator.forBlock['tactic_exact'] = function (block) {
    const term = block.getFieldValue('TERM');
    return `  exact ${term}\n`;
};

// Generator for 'tactic_apply'
leanGenerator.forBlock['tactic_apply'] = function (block) {
    const term = block.getFieldValue('TERM');
    return `  apply ${term}\n`;
};

leanGenerator.forBlock['tactic_and_intro'] = function (block) {
    let leftProof = leanGenerator.statementToCode(block, 'PROOF_LEFT');
    let rightProof = leanGenerator.statementToCode(block, 'PROOF_RIGHT');
    if (!leftProof.trim()) leftProof = '    sorry\n';
    if (!rightProof.trim()) rightProof = '    sorry\n';

    return `  apply And.intro\n  ·\n${leftProof}\n  ·\n${rightProof}\n`;
};

leanGenerator.forBlock['tactic_iff_intro'] = function (block) {
    let mpProof = leanGenerator.statementToCode(block, 'PROOF_MP');
    let mprProof = leanGenerator.statementToCode(block, 'PROOF_MPR');
    if (!mpProof.trim()) mpProof = '    sorry\n';
    if (!mprProof.trim()) mprProof = '    sorry\n';

    return `  apply Iff.intro\n  ·\n${mpProof}\n  ·\n${mprProof}\n`;
};

leanGenerator.forBlock['tactic_and_elim'] = function (block) {
    const h = block.getFieldValue('HYPOTHESIS');
    const h1 = block.getFieldValue('HYPOTHESIS_LEFT');
    const h2 = block.getFieldValue('HYPOTHESIS_RIGHT');
    let branch = leanGenerator.statementToCode(block, 'DO');
    if (!branch.trim()) branch = '    sorry\n';
    return `  cases ${h} with\n  | intro ${h1} ${h2} =>\n${branch}\n`;
};

leanGenerator.forBlock['tactic_or_intro_left'] = function (block) {
    return `  apply Or.inl\n`;
};

leanGenerator.forBlock['tactic_or_intro_right'] = function (block) {
    return `  apply Or.inr\n`;
};

leanGenerator.forBlock['tactic_or_elim'] = function (block) {
    const h = block.getFieldValue('HYPOTHESIS');
    const hLeft = block.getFieldValue('HYPOTHESIS_LEFT');
    const hRight = block.getFieldValue('HYPOTHESIS_RIGHT');
    let leftBranch = leanGenerator.statementToCode(block, 'CASE_LEFT');
    let rightBranch = leanGenerator.statementToCode(block, 'CASE_RIGHT');
    if (!leftBranch.trim()) leftBranch = '    sorry\n';
    if (!rightBranch.trim()) rightBranch = '    sorry\n';
    return `  cases ${h} with\n  | inl ${hLeft} =>\n${leftBranch}\n  | inr ${hRight} =>\n${rightBranch}\n`;
};

leanGenerator.forBlock['tactic_show'] = function (block) {
    const proposition = block.getFieldValue('PROPOSITION');
    return `  show ${proposition}\n`;
};

leanGenerator.forBlock['tactic_check_hyp'] = function (block) {
    const hypothesis = block.getFieldValue('HYPOTHESIS');
    const proposition = block.getFieldValue('PROPOSITION');
    return `  have : ${proposition} := ${hypothesis}\n`;
};

leanGenerator.forBlock['tactic_have'] = function (block) {
    const hypothesis = block.getFieldValue('HYPOTHESIS');
    const proposition = block.getFieldValue('PROPOSITION');
    let proof = leanGenerator.statementToCode(block, 'PROOF');
    if (!proof.trim()) proof = '    sorry\n';
    return `  have ${hypothesis} : ${proposition} := by\n${proof}\n`;
};
