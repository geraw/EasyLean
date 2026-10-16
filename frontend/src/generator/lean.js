import * as Blockly from 'blockly/core';

export const leanGenerator = new Blockly.Generator('LEAN');

// Lemmas placed before every proof. In Lean, ∀ and → are the same construct
// (an implication is a ∀ over proofs), so "intro" or applying a hypothesis
// would accept either. These lemmas tell them apart, so that each move works
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

// Units 5 and 6: a small set theory, placed before the proofs of the levels
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

// Unit 7: functions on the natural numbers defined by recursion, placed
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
