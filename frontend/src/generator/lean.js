import * as Blockly from 'blockly/core';

export const leanGenerator = new Blockly.Generator('LEAN');

leanGenerator.ORDER_ATOMIC = 0;

leanGenerator.scrub_ = function (block, code, opt_thisOnly) {
    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    const nextCode = opt_thisOnly ? '' : leanGenerator.blockToCode(nextBlock);
    return code + nextCode;
};

// Helper function to append the block ID as a Lean comment
const tag = (block) => ` -- @block_id: ${block.id}`;

// Generator for 'theorem'
leanGenerator.forBlock['theorem'] = function (block) {
    const name = block.getFieldValue('NAME');
    const params = block.getFieldValue('PARAMETERS');
    const proposition = block.getFieldValue('PROPOSITION');
    const proof = leanGenerator.statementToCode(block, 'PROOF');

    // Basic Lean 4 theorem structure
    const PREAMBLE = ``;
    return `${PREAMBLE}\ntheorem ${name} ${params} : ${proposition} := by${tag(block)}\n${proof}\n`;
};

leanGenerator.forBlock['lemma'] = function (block) {
    const name = block.getFieldValue('NAME');
    const params = block.getFieldValue('PARAMETERS');
    const proposition = block.getFieldValue('PROPOSITION');
    const proof = leanGenerator.statementToCode(block, 'PROOF');
    return `\ntheorem ${name} ${params} : ${proposition} := by${tag(block)}\n${proof}\n`;
};

// Generator for 'tactic_intro'
leanGenerator.forBlock['tactic_intro'] = function (block) {
    const hypothesis = block.getFieldValue('HYPOTHESIS');
    return `  intro ${hypothesis}${tag(block)}\n`;
};

// Generator for 'tactic_by_negation'
leanGenerator.forBlock['tactic_by_negation'] = function (block) {
    const hypothesis = block.getFieldValue('HYPOTHESIS');
    return `  intro ${hypothesis}${tag(block)}\n`;
};

// Generator for 'tactic_intro_variable'
leanGenerator.forBlock['tactic_intro_variable'] = function (block) {
    const variable = block.getFieldValue('VARIABLE');
    const type = block.getFieldValue('TYPE');
    return `  intro ${variable}${tag(block)}\n  have : ${type} := ${variable}${tag(block)}\n`;
};

// Generator for 'tactic_contradiction'
leanGenerator.forBlock['tactic_contradiction'] = function (block) {
    const hypothesis = block.getFieldValue('HYPOTHESIS');
    return `  apply ${hypothesis}${tag(block)}\n`;
};

// Generator for 'tactic_exact'
leanGenerator.forBlock['tactic_exact'] = function (block) {
    const term = block.getFieldValue('TERM');
    return `  exact ${term}${tag(block)}\n`;
};

// Generator for 'tactic_apply'
leanGenerator.forBlock['tactic_apply'] = function (block) {
    const term = block.getFieldValue('TERM');
    return `  apply ${term}${tag(block)}\n`;
};

leanGenerator.forBlock['tactic_and_intro'] = function (block) {
    let leftProof = leanGenerator.statementToCode(block, 'PROOF_LEFT');
    let rightProof = leanGenerator.statementToCode(block, 'PROOF_RIGHT');
    if (!leftProof.trim()) leftProof = `    sorry${tag(block)}\n`;
    if (!rightProof.trim()) rightProof = `    sorry${tag(block)}\n`;

    return `  apply And.intro${tag(block)}\n  ·${tag(block)}\n${leftProof}\n  ·${tag(block)}\n${rightProof}\n`;
};

leanGenerator.forBlock['tactic_iff_intro'] = function (block) {
    let mpProof = leanGenerator.statementToCode(block, 'PROOF_MP');
    let mprProof = leanGenerator.statementToCode(block, 'PROOF_MPR');
    if (!mpProof.trim()) mpProof = `    sorry${tag(block)}\n`;
    if (!mprProof.trim()) mprProof = `    sorry${tag(block)}\n`;

    return `  apply Iff.intro${tag(block)}\n  ·${tag(block)}\n${mpProof}\n  ·${tag(block)}\n${mprProof}\n`;
};

leanGenerator.forBlock['tactic_and_elim'] = function (block) {
    const h = block.getFieldValue('HYPOTHESIS');
    const h1 = block.getFieldValue('HYPOTHESIS_LEFT');
    const h2 = block.getFieldValue('HYPOTHESIS_RIGHT');
    let branch = leanGenerator.statementToCode(block, 'DO');
    if (!branch.trim()) branch = `    sorry${tag(block)}\n`;
    return `  cases ${h} with${tag(block)}\n  | intro ${h1} ${h2} =>${tag(block)}\n${branch}\n`;
};

leanGenerator.forBlock['tactic_or_intro_left'] = function (block) {
    return `  apply Or.inl${tag(block)}\n`;
};

leanGenerator.forBlock['tactic_or_intro_right'] = function (block) {
    return `  apply Or.inr${tag(block)}\n`;
};

leanGenerator.forBlock['tactic_or_elim'] = function (block) {
    const h = block.getFieldValue('HYPOTHESIS');
    const hLeft = block.getFieldValue('HYPOTHESIS_LEFT');
    const hRight = block.getFieldValue('HYPOTHESIS_RIGHT');
    let leftBranch = leanGenerator.statementToCode(block, 'CASE_LEFT');
    let rightBranch = leanGenerator.statementToCode(block, 'CASE_RIGHT');
    if (!leftBranch.trim()) leftBranch = `    sorry${tag(block)}\n`;
    if (!rightBranch.trim()) rightBranch = `    sorry${tag(block)}\n`;
    return `  cases ${h} with${tag(block)}\n  | inl ${hLeft} =>${tag(block)}\n${leftBranch}\n  | inr ${hRight} =>${tag(block)}\n${rightBranch}\n`;
};

leanGenerator.forBlock['tactic_show'] = function (block) {
    const proposition = block.getFieldValue('PROPOSITION');
    return `  show ${proposition}${tag(block)}\n`;
};

leanGenerator.forBlock['tactic_check_hyp'] = function (block) {
    const hypothesis = block.getFieldValue('HYPOTHESIS');
    const proposition = block.getFieldValue('PROPOSITION');
    return `  have : ${proposition} := ${hypothesis}${tag(block)}\n`;
};

leanGenerator.forBlock['tactic_have'] = function (block) {
    const hypothesis = block.getFieldValue('HYPOTHESIS');
    const proposition = block.getFieldValue('PROPOSITION');
    let proof = leanGenerator.statementToCode(block, 'PROOF');
    if (!proof.trim()) proof = `    sorry${tag(block)}\n`;
    return `  have ${hypothesis} : ${proposition} := by${tag(block)}\n${proof}\n`;
};

leanGenerator.forBlock['tactic_use'] = function (block) {
    const term = block.getFieldValue('TERM');
    return `  apply Exists.intro ${term}${tag(block)}\n`;
};

leanGenerator.forBlock['tactic_obtain'] = function (block) {
    const h = block.getFieldValue('HYPOTHESIS');
    const x = block.getFieldValue('VARIABLE');
    const hx = block.getFieldValue('HYPOTHESIS_BODY');
    let branch = leanGenerator.statementToCode(block, 'DO');
    if (!branch.trim()) branch = `    sorry${tag(block)}\n`;
    return `  cases ${h} with${tag(block)}\n  | intro ${x} ${hx} =>${tag(block)}\n${branch}\n`;
};

leanGenerator.forBlock['tactic_auto_contradiction'] = function (block) {
    return `  contradiction${tag(block)}\n`;
};

leanGenerator.forBlock['tactic_assumption'] = function (block) {
    return `  assumption${tag(block)}\n`;
};

// Theorem block generators
leanGenerator.forBlock['theorem_subset_transitive'] = function (block) {
    const setA = block.getFieldValue('SET_A');
    const setC = block.getFieldValue('SET_C');
    const h1 = block.getFieldValue('H1');
    const h2 = block.getFieldValue('H2');
    const resultName = block.getFieldValue('RESULT');
    return `  have ${resultName} : ${setA} ⊆ ${setC} := fun x hx => ${h2} (${h1} hx)${tag(block)}\n`;
};

leanGenerator.forBlock['theorem_modus_ponens_sets'] = function (block) {
    const element = block.getFieldValue('ELEMENT');
    const setA = block.getFieldValue('SET_A');
    const setB = block.getFieldValue('SET_B');
    const h1 = block.getFieldValue('H1');
    const h2 = block.getFieldValue('H2');
    const resultName = block.getFieldValue('RESULT');
    return `  have ${resultName} : ${element} ∈ ${setB} := ${h2} ${h1}${tag(block)}\n`;
};