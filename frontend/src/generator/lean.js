import * as Blockly from 'blockly/core';

export const leanGenerator = new Blockly.Generator('LEAN');

// Lemmas placed before every proof. In Lean, ∀ and → are the same construct
// (an implication is a ∀ over proofs), so "intro" or applying a hypothesis
// would accept either. These lemmas tell them apart, so that each block works
// only on its own kind of formula: a ∀ ranges over the objects of a domain (a
// Type), an implication over statements (a Prop).
export const LEAN_PRELUDE = `theorem easylean_imp_intro {p q : Prop} (h : p → q) : p → q := h
theorem easylean_mp {p q : Prop} (h : p → q) (hp : p) : q := h hp
theorem easylean_forall_intro {α : Type u} {p : α → Prop} (h : ∀ x, p x) : ∀ x, p x := h
theorem easylean_forall_elim {α : Type u} {p : α → Prop} (h : ∀ x, p x) (a : α) : p a := h a
`;

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
    const PREAMBLE = LEAN_PRELUDE;
    return `${PREAMBLE}\ntheorem ${name} ${params} : ${proposition} := by\n${proof}\n`;
};

leanGenerator.forBlock['lemma'] = function (block) {
    const name = block.getFieldValue('NAME');
    const params = block.getFieldValue('PARAMETERS');
    const proposition = block.getFieldValue('PROPOSITION');
    const proof = leanGenerator.statementToCode(block, 'PROOF');
    return `\ntheorem ${name} ${params} : ${proposition} := by\n${proof}\n`;
};

// Generator for 'tactic_intro': assuming the condition of an implication
// (only of an implication, not of a ∀: see LEAN_PRELUDE).
leanGenerator.forBlock['tactic_intro'] = function (block) {
    const hypothesis = block.getFieldValue('HYPOTHESIS');
    return `  refine easylean_imp_intro (fun ${hypothesis} => ?_)\n`;
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

leanGenerator.forBlock['tactic_apply_rule'] = function (block) {
    const rule = block.getFieldValue('RULE');
    return `  apply ${rule}\n`;
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

leanGenerator.forBlock['tactic_use'] = function (block) {
    const term = block.getFieldValue('TERM');
    return `  apply Exists.intro ${term}\n`;
};

leanGenerator.forBlock['tactic_obtain'] = function (block) {
    const h = block.getFieldValue('HYPOTHESIS');
    const x = block.getFieldValue('VARIABLE');
    const hx = block.getFieldValue('HYPOTHESIS_BODY');
    let branch = leanGenerator.statementToCode(block, 'DO');
    if (!branch.trim()) branch = '    sorry\n';
    return `  cases ${h} with\n  | intro ${x} ${hx} =>\n${branch}\n`;
};

leanGenerator.forBlock['tactic_auto_contradiction'] = function (block) {
    return `  contradiction\n`;
};

// Unit 1, forward: from h : P → Q and hp : P, the new assumption hq : Q.
leanGenerator.forBlock['logic_modus_ponens'] = function (block) {
    return `  have ${block.getFieldValue('NAME')} := easylean_mp ${block.getFieldValue('RULE')} ${block.getFieldValue('PREMISE')}\n`;
};

// Unit 4: quantifiers. ∀ through the lemmas of LEAN_PRELUDE, ∃ through its
// own rules, which already fail on any other kind of formula.
leanGenerator.forBlock['logic_forall_intro'] = function (block) {
    return `  refine easylean_forall_intro (fun ${block.getFieldValue('VARIABLE')} => ?_)\n`;
};

leanGenerator.forBlock['logic_forall_elim'] = function (block) {
    return `  have ${block.getFieldValue('NAME')} := easylean_forall_elim ${block.getFieldValue('HYPOTHESIS')} ${block.getFieldValue('TERM')}\n`;
};

leanGenerator.forBlock['logic_exists_intro'] = function (block) {
    return `  apply Exists.intro ${block.getFieldValue('TERM')}\n`;
};

leanGenerator.forBlock['logic_exists_elim'] = function (block) {
    return `  refine Exists.elim ${block.getFieldValue('HYPOTHESIS')} (fun ${block.getFieldValue('VARIABLE')} ${block.getFieldValue('NAME')} => ?_)\n`;
};

// Unit 2 rules. Each one generates the specific introduction or elimination
// rule, so that a rule used on the wrong connective fails instead of Lean
// quietly doing something else (e.g. `constructor` proves an "or" by its left side).
leanGenerator.forBlock['logic_and_intro'] = () => '  apply And.intro\n';

leanGenerator.forBlock['logic_and_elim'] = function (block) {
    const h = block.getFieldValue('HYPOTHESIS');
    return `  have ${block.getFieldValue('LEFT_NAME')} := And.left ${h}\n  have ${block.getFieldValue('RIGHT_NAME')} := And.right ${h}\n`;
};

leanGenerator.forBlock['logic_or_intro_left'] = () => '  apply Or.inl\n';

leanGenerator.forBlock['logic_or_intro_right'] = () => '  apply Or.inr\n';

leanGenerator.forBlock['logic_or_elim'] = function (block) {
    return `  cases ${block.getFieldValue('HYPOTHESIS')} with\n`;
};

leanGenerator.forBlock['logic_iff_intro'] = () => '  apply Iff.intro\n';

leanGenerator.forBlock['logic_iff_elim'] = function (block) {
    const h = block.getFieldValue('HYPOTHESIS');
    return `  have ${block.getFieldValue('FORWARD_NAME')} := Iff.mp ${h}\n  have ${block.getFieldValue('BACKWARD_NAME')} := Iff.mpr ${h}\n`;
};

// Unit 3 rules. As in unit 2, each one is the specific rule, so that it fails
// on a goal or an assumption of the wrong kind: e.g. a contradiction only
// closes the goal ⊥ (False); to reach other goals, ⊥ → Q is used first.
leanGenerator.forBlock['logic_contradiction'] = function (block) {
    return `  exact (absurd ${block.getFieldValue('HYPOTHESIS')} ${block.getFieldValue('NEGATION')} : False)\n`;
};

leanGenerator.forBlock['logic_false_implies'] = function (block) {
    return `  have ${block.getFieldValue('HYPOTHESIS')} : False → (${block.getFieldValue('FORMULA')}) := False.elim\n`;
};

leanGenerator.forBlock['logic_non_contradiction'] = function (block) {
    const p = block.getFieldValue('FORMULA');
    return `  have ${block.getFieldValue('HYPOTHESIS')} : ((${p}) ∧ ¬(${p})) → False := fun h => absurd h.1 h.2\n`;
};

leanGenerator.forBlock['logic_and_combine'] = function (block) {
    return `  have ${block.getFieldValue('NAME')} := And.intro ${block.getFieldValue('LEFT')} ${block.getFieldValue('RIGHT')}\n`;
};

leanGenerator.forBlock['logic_not_intro'] = function (block) {
    return `  apply Not.intro\n  intro ${block.getFieldValue('HYPOTHESIS')}\n`;
};

leanGenerator.forBlock['logic_not_elim'] = function (block) {
    return `  refine (absurd ?_ ${block.getFieldValue('NEGATION')} : False)\n`;
};

leanGenerator.forBlock['logic_by_contradiction'] = function (block) {
    return `  apply Classical.byContradiction\n  intro ${block.getFieldValue('HYPOTHESIS')}\n`;
};

leanGenerator.forBlock['logic_by_cases'] = function (block) {
    return `  cases Classical.em (${block.getFieldValue('FORMULA')}) with\n`;
};

// Moves that split the proof: for each part, the statement input holding its
// sub-proof and the line that opens that part in Lean (at the move's indentation).
export const leanBranches = {
    logic_and_intro: () => [{ input: 'LEFT', header: '·' }, { input: 'RIGHT', header: '·' }],
    logic_iff_intro: () => [{ input: 'FORWARD', header: '·' }, { input: 'BACKWARD', header: '·' }],
    logic_by_cases: (block) => [
        { input: 'LEFT', header: `| inl ${block.getFieldValue('LEFT_NAME')} =>` },
        { input: 'RIGHT', header: `| inr ${block.getFieldValue('RIGHT_NAME')} =>` },
    ],
    logic_or_elim: (block) => [
        { input: 'LEFT', header: `| inl ${block.getFieldValue('LEFT_NAME')} =>` },
        { input: 'RIGHT', header: `| inr ${block.getFieldValue('RIGHT_NAME')} =>` },
    ],
};
