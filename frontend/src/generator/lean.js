import * as Blockly from 'blockly/core';

export const leanGenerator = new Blockly.Generator('LEAN');

// Lemmas placed before every proof. In Lean, ∀ and → are the same construct
// (an implication is a ∀ over proofs), so "intro" or applying a hypothesis
// would accept either. These lemmas tell them apart, so that each move works
// only on its own kind of formula: a ∀ ranges over the objects of a domain (a
// Type), an implication over statements (a Prop). A negation is P → ⊥, but
// it is proved with its own move, as in the textbooks, so easylean_assume
// refuses it, also when the goal is one only by a definition (x₀ ∈ Aᶜ).
// easylean_goal_only drops the assumptions in hand (they have no names, so
// they are named one by one and cleared), for the arithmetic and algebra
// moves that work from the goal alone.
export const LEAN_PRELUDE = `theorem easylean_imp_intro {p q : Prop} (h : p → q) : p → q := h
macro "easylean_goal_only" : tactic => \`(tactic| repeat (rename_i easylean_h; clear easylean_h))
macro "easylean_assume" : tactic => \`(tactic| ((first | fail_if_success show ¬ _ | fail "easylean: the goal is a negation"); refine easylean_imp_intro (fun _ => ?_)))
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

// Units 6 and 7: a small set theory, placed before the proofs of the levels
// that use sets (level.usesSets). A set is a property of objects, and each
// operation is defined through membership, so that using its definition (the
// easylean_mem_* lemmas, see the definition move in blocks/moves.js) leaves a
// formula of units 1-4. Core Lean has no sets, and Mathlib would make every
// check slower and the server image larger.
export const SET_PRELUDE = `def Set (α : Type u) := α → Prop
instance : Membership α (Set α) := ⟨fun A x => A x⟩
instance : HasSubset (Set α) := ⟨fun A B => ∀ x, x ∈ A → x ∈ B⟩
instance : Inter (Set α) := ⟨fun A B => fun x => x ∈ A ∧ x ∈ B⟩
instance : Union (Set α) := ⟨fun A B => fun x => x ∈ A ∨ x ∈ B⟩
instance : SDiff (Set α) := ⟨fun A B => fun x => x ∈ A ∧ ¬ x ∈ B⟩
instance : EmptyCollection (Set α) := ⟨fun _ => False⟩
def Set.symmDiff (A B : Set α) : Set α := fun x => x ∈ A \\ B ∨ x ∈ B \\ A
infixl:65 " ∆ " => Set.symmDiff
def Set.compl (A : Set α) : Set α := fun x => ¬ x ∈ A
postfix:max "ᶜ" => Set.compl
def Set.powerset (A : Set α) : Set (Set α) := fun B => B ⊆ A
prefix:100 "𝒫 " => Set.powerset
def Set.sUnion (F : Set (Set α)) : Set α := fun x => ∃ S, S ∈ F ∧ x ∈ S
prefix:110 "⋃₀ " => Set.sUnion
def Set.sInter (F : Set (Set α)) : Set α := fun x => ∀ S, S ∈ F → x ∈ S
prefix:110 "⋂₀ " => Set.sInter
theorem easylean_mem_inter {α : Type u} {A B : Set α} {x : α} : x ∈ A ∩ B ↔ x ∈ A ∧ x ∈ B := Iff.rfl
theorem easylean_mem_union {α : Type u} {A B : Set α} {x : α} : x ∈ A ∪ B ↔ x ∈ A ∨ x ∈ B := Iff.rfl
theorem easylean_mem_diff {α : Type u} {A B : Set α} {x : α} : x ∈ A \\ B ↔ x ∈ A ∧ ¬ x ∈ B := Iff.rfl
theorem easylean_mem_symmDiff {α : Type u} {A B : Set α} {x : α} : x ∈ A ∆ B ↔ x ∈ A \\ B ∨ x ∈ B \\ A := Iff.rfl
theorem easylean_mem_compl {α : Type u} {A : Set α} {x : α} : x ∈ Aᶜ ↔ ¬ x ∈ A := Iff.rfl
theorem easylean_mem_empty {α : Type u} {x : α} : x ∈ (∅ : Set α) ↔ False := Iff.rfl
theorem easylean_mem_powerset {α : Type u} {A B : Set α} : B ∈ 𝒫 A ↔ B ⊆ A := Iff.rfl
theorem easylean_mem_sUnion {α : Type u} {F : Set (Set α)} {x : α} : x ∈ ⋃₀ F ↔ ∃ S, S ∈ F ∧ x ∈ S := Iff.rfl
theorem easylean_mem_sInter {α : Type u} {F : Set (Set α)} {x : α} : x ∈ ⋂₀ F ↔ ∀ S, S ∈ F → x ∈ S := Iff.rfl
theorem easylean_subset_intro {α : Type u} {A B : Set α} (h : ∀ x, x ∈ A → x ∈ B) : A ⊆ B := h
theorem easylean_subset_elim {α : Type u} {A B : Set α} {x : α} (h : A ⊆ B) (hx : x ∈ A) : x ∈ B := h x hx
theorem easylean_set_eq {α : Type u} {A B : Set α} (hab : A ⊆ B) (hba : B ⊆ A) : A = B :=
  funext (fun x => propext ⟨hab x, hba x⟩)
`;

// Unit 5 and after: the laws of logical equivalence (LAWS in
// blocks/moves.js), placed before the proofs of the levels that offer them
// (level.laws). Each law is proved by the students, in both directions, in
// earlier levels; here it is proved again, so that Lean can use it.
export const EQUIV_PRELUDE = `theorem easylean_not_not {a : Prop} : ¬¬a ↔ a := ⟨fun h => Classical.byContradiction h, fun h n => n h⟩
theorem easylean_not_or {a b : Prop} : ¬(a ∨ b) ↔ (¬a ∧ ¬b) := ⟨fun h => ⟨fun x => h (Or.inl x), fun x => h (Or.inr x)⟩, fun h x => x.elim h.1 h.2⟩
theorem easylean_not_and {a b : Prop} : ¬(a ∧ b) ↔ (¬a ∨ ¬b) := ⟨fun h => (Classical.em a).elim (fun x => Or.inr fun y => h ⟨x, y⟩) Or.inl, fun h ⟨x, y⟩ => h.elim (· x) (· y)⟩
theorem easylean_imp_or {a b : Prop} : (a → b) ↔ (¬a ∨ b) := ⟨fun h => (Classical.em a).elim (fun x => Or.inr (h x)) Or.inl, fun h x => h.elim (fun n => (n x).elim) id⟩
theorem easylean_contrapositive {a b : Prop} : (a → b) ↔ (¬b → ¬a) := ⟨fun h nb x => nb (h x), fun h x => Classical.byContradiction fun nb => h nb x⟩
theorem easylean_not_imp {a b : Prop} : ¬(a → b) ↔ (a ∧ ¬b) := ⟨fun h => ⟨Classical.byContradiction fun na => h fun x => (na x).elim, fun hb => h fun _ => hb⟩, fun ⟨x, nb⟩ h => nb (h x)⟩
theorem easylean_not_exists {α : Type u} {p : α → Prop} : (¬∃ x, p x) ↔ ∀ x, ¬p x := ⟨fun h x hx => h ⟨x, hx⟩, fun h ⟨x, hx⟩ => h x hx⟩
theorem easylean_not_forall {α : Type u} {p : α → Prop} : (¬∀ x, p x) ↔ ∃ x, ¬p x := ⟨fun h => Classical.byContradiction fun h' => h fun x => Classical.byContradiction fun hx => h' ⟨x, hx⟩, fun ⟨x, hx⟩ h => hx (h x)⟩
`;

// Unit 8: functions on the natural numbers defined by recursion, placed
// before the proofs of the levels that use them (level.usesNat), and the
// definition of addition on its second argument. Unfolding them is a move
// of its own: the calculation moves (omega, grind) do not look inside them.
export const NAT_PRELUDE = `def double : Nat → Nat
  | 0 => 0
  | n + 1 => double n + 2
def sumTo : Nat → Nat
  | 0 => 0
  | n + 1 => sumTo n + (n + 1)
def oddSum : Nat → Nat
  | 0 => 0
  | n + 1 => oddSum n + (2 * n + 1)
theorem easylean_add_succ (n m : Nat) : n + (m + 1) = (n + m) + 1 := rfl
`;

// Moves that split the proof: for each part, the statement input holding its
// sub-proof and the line that opens that part in Lean (at the move's
// indentation). The moves add their own (see blocks/moves.js).
export const leanBranches = {};

// Unit 9: structures defined by construction, placed before the proofs of the
// levels that do induction on them (level.structure), with the functions
// defined on them by recursion. Lean prints `node l r` and `List.length l`,
// not `l.node r` or `l.length`, so that they read as functions of their
// arguments (see writeApplications in game/formatProofGoal.js).
const PRINT_AS_FUNCTIONS = 'set_option pp.fieldNotation false\n';
const TREE = `inductive Tree where
  | leaf : Tree
  | node : Tree → Tree → Tree
open Tree
def leaves : Tree → Nat
  | leaf => 1
  | node l r => leaves l + leaves r
def nodes : Tree → Nat
  | leaf => 0
  | node l r => nodes l + nodes r + 1
def height : Tree → Nat
  | leaf => 0
  | node l r => max (height l) (height r) + 1
def mirror : Tree → Tree
  | leaf => leaf
  | node l r => node (mirror r) (mirror l)
`;
const formula = (connectives) => `inductive Formula where
  | atom : Nat → Formula
  | neg : Formula → Formula
${connectives.map((name) => `  | ${name} : Formula → Formula → Formula`).join('\n')}
open Formula
def opening : Formula → Nat
  | atom _ => 0
  | neg φ => opening φ
${connectives.map((name) => `  | ${name} φ ψ => opening φ + opening ψ + 1`).join('\n')}
def closing : Formula → Nat
  | atom _ => 0
  | neg φ => closing φ
${connectives.map((name) => `  | ${name} φ ψ => closing φ + closing ψ + 1`).join('\n')}
def atoms : Formula → Nat
  | atom _ => 1
  | neg φ => atoms φ
${connectives.map((name) => `  | ${name} φ ψ => atoms φ + atoms ψ`).join('\n')}
def binaries : Formula → Nat
  | atom _ => 0
  | neg φ => binaries φ
${connectives.map((name) => `  | ${name} φ ψ => binaries φ + binaries ψ + 1`).join('\n')}
def negations : Formula → Nat
  | atom _ => 0
  | neg φ => negations φ + 1
${connectives.map((name) => `  | ${name} φ ψ => negations φ + negations ψ`).join('\n')}
def depth : Formula → Nat
  | atom _ => 0
  | neg φ => depth φ + 1
${connectives.map((name) => `  | ${name} φ ψ => max (depth φ) (depth ψ) + 1`).join('\n')}
`;
export const STRUCTURE_PRELUDES = {
    List: PRINT_AS_FUNCTIONS,
    Tree: PRINT_AS_FUNCTIONS + TREE,
    Formula: PRINT_AS_FUNCTIONS + formula(['conj']),
};
