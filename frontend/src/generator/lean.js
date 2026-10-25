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

// Units 8-10: a small set theory, placed before the proofs of the levels
// that use sets (level.usesSets). A set is a property of objects, and each
// operation is defined through membership, so that using its definition (the
// easylean_mem_* lemmas, see the definition move in blocks/moves.js) leaves a
// formula of units 2-5. Core Lean has no sets, and Mathlib would make every
// check slower and the server image larger.
export const SET_PRELUDE = `def Set (α : Type u) := α → Prop
instance : Membership α (Set α) := ⟨fun A x => A x⟩
instance : HasSubset (Set α) := ⟨fun A B => ∀ x, x ∈ A → x ∈ B⟩
theorem easylean_subset_def {α : Type u} {A B : Set α} : A ⊆ B ↔ ∀ x, x ∈ A → x ∈ B := Iff.rfl
instance : Inter (Set α) := ⟨fun A B => fun x => x ∈ A ∧ x ∈ B⟩
instance : Union (Set α) := ⟨fun A B => fun x => x ∈ A ∨ x ∈ B⟩
instance : SDiff (Set α) := ⟨fun A B => fun x => x ∈ A ∧ ¬ x ∈ B⟩
instance : EmptyCollection (Set α) := ⟨fun _ => False⟩
def Set.symmDiff (A B : Set α) : Set α := fun x => (x ∈ A ∧ ¬ x ∈ B) ∨ (¬ x ∈ A ∧ x ∈ B)
infixl:65 " ∆ " => Set.symmDiff
@[pp_nodot] def Set.sep {α : Type u} (A : Set α) (p : α → Prop) : Set α := fun x => x ∈ A ∧ p x
def Set.repl {α : Type u} {β : Type v} (f : α → β) (A : Set α) : Set β := fun y => ∃ x, x ∈ A ∧ f x = y
def Set.compl (A : Set α) : Set α := fun x => ¬ x ∈ A
postfix:max "ᶜ" => Set.compl
def Set.powerset (A : Set α) : Set (Set α) := fun B => B ⊆ A
prefix:100 "𝒫 " => Set.powerset
def Set.sUnion (F : Set (Set α)) : Set α := fun x => ∃ S, S ∈ F ∧ x ∈ S
prefix:110 "⋃ " => Set.sUnion
def Set.sInter (F : Set (Set α)) : Set α := fun x => ∀ S, S ∈ F → x ∈ S
prefix:110 "⋂ " => Set.sInter
theorem easylean_mem_inter {α : Type u} {A B : Set α} {x : α} : x ∈ A ∩ B ↔ x ∈ A ∧ x ∈ B := Iff.rfl
theorem easylean_mem_union {α : Type u} {A B : Set α} {x : α} : x ∈ A ∪ B ↔ x ∈ A ∨ x ∈ B := Iff.rfl
theorem easylean_mem_diff {α : Type u} {A B : Set α} {x : α} : x ∈ A \\ B ↔ x ∈ A ∧ ¬ x ∈ B := Iff.rfl
theorem easylean_mem_symmDiff {α : Type u} {A B : Set α} {x : α} : x ∈ A ∆ B ↔ (x ∈ A ∧ ¬ x ∈ B) ∨ (¬ x ∈ A ∧ x ∈ B) := Iff.rfl
theorem easylean_mem_sep {α : Type u} {A : Set α} {p : α → Prop} {x : α} : x ∈ Set.sep A p ↔ x ∈ A ∧ p x := Iff.rfl
theorem easylean_mem_repl {α : Type u} {β : Type v} {f : α → β} {A : Set α} {y : β} : y ∈ Set.repl f A ↔ ∃ x, x ∈ A ∧ f x = y := Iff.rfl
theorem easylean_mem_compl {α : Type u} {A : Set α} {x : α} : x ∈ Aᶜ ↔ ¬ x ∈ A := Iff.rfl
theorem easylean_mem_empty {α : Type u} {x : α} : x ∈ (∅ : Set α) ↔ False := Iff.rfl
theorem easylean_mem_powerset {α : Type u} {A B : Set α} : B ∈ 𝒫 A ↔ B ⊆ A := Iff.rfl
theorem easylean_mem_sUnion {α : Type u} {F : Set (Set α)} {x : α} : x ∈ ⋃ F ↔ ∃ S, S ∈ F ∧ x ∈ S := Iff.rfl
theorem easylean_mem_sInter {α : Type u} {F : Set (Set α)} {x : α} : x ∈ ⋂ F ↔ ∀ S, S ∈ F → x ∈ S := Iff.rfl
theorem easylean_subset_intro {α : Type u} {A B : Set α} (h : ∀ x, x ∈ A → x ∈ B) : A ⊆ B := h
theorem easylean_subset_intro_pair {α : Type u} {A B : Set (α × α)} (h : ∀ x y, (x, y) ∈ A → (x, y) ∈ B) : A ⊆ B := fun p => h p.1 p.2
theorem easylean_subset_elim {α : Type u} {A B : Set α} {x : α} (h : A ⊆ B) (hx : x ∈ A) : x ∈ B := h x hx
theorem easylean_set_eq {α : Type u} {A B : Set α} (hab : A ⊆ B) (hba : B ⊆ A) : A = B :=
  funext (fun x => propext ⟨hab x, hba x⟩)
`;

// Unit 9: relations, as sets of ordered pairs (a relation on obj is a
// Set (obj × obj)), placed after the set theory, before the proofs of the
// levels that use them (level.usesRelations). The inverse R⁻¹, and the
// composition R ∘ S: first S, then R, as in the course. The properties of a
// relation are definitions, read with the same move as the operations
// (easylean_reflexive, ...), and so is the equivalence class [x]_R.
export const RELATION_PRELUDE = `def Set.inv {α : Type u} (R : Set (α × α)) : Set (α × α) := fun p => (p.2, p.1) ∈ R
postfix:max "⁻¹" => Set.inv
def Set.comp {α : Type u} (R S : Set (α × α)) : Set (α × α) := fun p => ∃ y, (p.1, y) ∈ S ∧ (y, p.2) ∈ R
infixr:90 " ∘ " => Set.comp
def Set.cls {α : Type u} (R : Set (α × α)) (x : α) : Set α := fun y => (x, y) ∈ R
notation:max "[" x "]_" R:max => Set.cls R x
def reflexive {α : Type u} (R : Set (α × α)) : Prop := ∀ x, (x, x) ∈ R
def symmetric {α : Type u} (R : Set (α × α)) : Prop := ∀ x y, (x, y) ∈ R → (y, x) ∈ R
def transitive {α : Type u} (R : Set (α × α)) : Prop := ∀ x y z, (x, y) ∈ R ∧ (y, z) ∈ R → (x, z) ∈ R
def antisymmetric {α : Type u} (R : Set (α × α)) : Prop := ∀ x y, (x, y) ∈ R ∧ (y, x) ∈ R → x = y
theorem easylean_mem_inv {α : Type u} {R : Set (α × α)} {x y : α} : (x, y) ∈ R⁻¹ ↔ (y, x) ∈ R := Iff.rfl
theorem easylean_mem_comp {α : Type u} {R S : Set (α × α)} {x z : α} : (x, z) ∈ R ∘ S ↔ ∃ y, (x, y) ∈ S ∧ (y, z) ∈ R := Iff.rfl
theorem easylean_mem_cls {α : Type u} {R : Set (α × α)} {x y : α} : y ∈ [x]_R ↔ (x, y) ∈ R := Iff.rfl
theorem easylean_reflexive {α : Type u} {R : Set (α × α)} : reflexive R ↔ ∀ x, (x, x) ∈ R := Iff.rfl
theorem easylean_symmetric {α : Type u} {R : Set (α × α)} : symmetric R ↔ ∀ x y, (x, y) ∈ R → (y, x) ∈ R := Iff.rfl
theorem easylean_transitive {α : Type u} {R : Set (α × α)} : transitive R ↔ ∀ x y z, (x, y) ∈ R ∧ (y, z) ∈ R → (x, z) ∈ R := Iff.rfl
theorem easylean_antisymmetric {α : Type u} {R : Set (α × α)} : antisymmetric R ↔ ∀ x y, (x, y) ∈ R ∧ (y, x) ∈ R → x = y := Iff.rfl
`;

// Unit 10: functions, as Lean's functions (f : obj → obj, written f(x) as in
// the course), with injective and surjective as definitions read by the move
// "לפי ההגדרה" (which also writes (g ∘ f)(x) as g(f(x))), the image f[A] and
// the preimage f⁻¹[B] (shown so, see formatProofGoal.js), and a set given by
// a property, setOf fun x => P x, shown {x | P(x)}, for Cantor's theorem
// (level.usesFunctions). The server refuses syntax extensions, so these are
// written in the display only.
export const FUNCTION_PRELUDE = `def injective {α : Type u} {β : Type v} (f : α → β) : Prop := ∀ x y, f x = f y → x = y
def surjective {α : Type u} {β : Type v} (f : α → β) : Prop := ∀ y, ∃ x, f x = y
def Set.image {α : Type u} {β : Type v} (f : α → β) (A : Set α) : Set β := fun y => ∃ x, x ∈ A ∧ f x = y
def Set.preimage {α : Type u} {β : Type v} (f : α → β) (B : Set β) : Set α := fun x => f x ∈ B
def setOf {α : Type u} (p : α → Prop) : Set α := p
theorem easylean_injective {α : Type u} {β : Type v} {f : α → β} : injective f ↔ ∀ x y, f x = f y → x = y := Iff.rfl
theorem easylean_surjective {α : Type u} {β : Type v} {f : α → β} : surjective f ↔ ∀ y, ∃ x, f x = y := Iff.rfl
theorem easylean_mem_image {α : Type u} {β : Type v} {f : α → β} {A : Set α} {y : β} : y ∈ Set.image f A ↔ ∃ x, x ∈ A ∧ f x = y := Iff.rfl
theorem easylean_mem_preimage {α : Type u} {β : Type v} {f : α → β} {B : Set β} {x : α} : x ∈ Set.preimage f B ↔ f x ∈ B := Iff.rfl
theorem easylean_mem_setOf {α : Type u} {p : α → Prop} {a : α} : a ∈ setOf p ↔ p a := Iff.rfl
`;

// Unit 6 and after: the laws of logical equivalence (LAWS in
// blocks/moves.js), placed before the proofs of the levels that offer them
// (level.laws). Each law is proved by the students, in both directions, in
// earlier levels; here it is proved again, so that Lean can use it.
// The proof strategies of the lecture that are derived rules (unit 7): modus
// tollens, proof by contraposition, and proving "or" by assuming the negation
// of one side. Placed only before the levels that offer them (see
// STRATEGY_MOVES in game/gameLeanCode.js).
export const STRATEGY_PRELUDE = `theorem easylean_mt {a b : Prop} (h : a → b) (nb : ¬b) : ¬a := fun x => nb (h x)
theorem easylean_by_contrapositive {a b : Prop} (h : ¬b → ¬a) : a → b := fun x => Classical.byContradiction fun nb => h nb x
theorem easylean_or_by_negation {a b : Prop} (h : ¬a → b) : a ∨ b := (Classical.em a).elim Or.inl fun n => Or.inr (h n)
theorem easylean_or_by_negation_right {a b : Prop} (h : ¬b → a) : a ∨ b := (Classical.em b).elim Or.inr fun n => Or.inl (h n)
`;

export const EQUIV_PRELUDE = `theorem easylean_not_not {a : Prop} : ¬¬a ↔ a := ⟨fun h => Classical.byContradiction h, fun h n => n h⟩
theorem easylean_not_or {a b : Prop} : ¬(a ∨ b) ↔ (¬a ∧ ¬b) := ⟨fun h => ⟨fun x => h (Or.inl x), fun x => h (Or.inr x)⟩, fun h x => x.elim h.1 h.2⟩
theorem easylean_not_and {a b : Prop} : ¬(a ∧ b) ↔ (¬a ∨ ¬b) := ⟨fun h => (Classical.em a).elim (fun x => Or.inr fun y => h ⟨x, y⟩) Or.inl, fun h ⟨x, y⟩ => h.elim (· x) (· y)⟩
theorem easylean_imp_or {a b : Prop} : (a → b) ↔ (¬a ∨ b) := ⟨fun h => (Classical.em a).elim (fun x => Or.inr (h x)) Or.inl, fun h x => h.elim (fun n => (n x).elim) id⟩
theorem easylean_or_as_imp {a b : Prop} : (¬a → b) ↔ (a ∨ b) := ⟨fun h => (Classical.em a).elim Or.inl (fun n => Or.inr (h n)), fun h n => h.elim (fun x => (n x).elim) id⟩
theorem easylean_contrapositive {a b : Prop} : (a → b) ↔ (¬b → ¬a) := ⟨fun h nb x => nb (h x), fun h x => Classical.byContradiction fun nb => h nb x⟩
theorem easylean_not_imp {a b : Prop} : ¬(a → b) ↔ (a ∧ ¬b) := ⟨fun h => ⟨Classical.byContradiction fun na => h fun x => (na x).elim, fun hb => h fun _ => hb⟩, fun ⟨x, nb⟩ h => nb (h x)⟩
theorem easylean_not_exists {α : Type u} {p : α → Prop} : (¬∃ x, p x) ↔ ∀ x, ¬p x := ⟨fun h x hx => h ⟨x, hx⟩, fun h ⟨x, hx⟩ => h x hx⟩
theorem easylean_not_forall {α : Type u} {p : α → Prop} : (¬∀ x, p x) ↔ ∃ x, ¬p x := ⟨fun h => Classical.byContradiction fun h' => h fun x => Classical.byContradiction fun hx => h' ⟨x, hx⟩, fun ⟨x, hx⟩ h => hx (h x)⟩
`;

// Unit 11: functions on the natural numbers defined by recursion, placed
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
def sumCubes : Nat → Nat
  | 0 => 0
  | n + 1 => sumCubes n + (n + 1) ^ 3
theorem easylean_add_succ (n m : Nat) : n + (m + 1) = (n + m) + 1 := rfl
`;

// Moves that split the proof: for each part, the statement input holding its
// sub-proof and the line that opens that part in Lean (at the move's
// indentation). The moves add their own (see blocks/moves.js).
export const leanBranches = {};

// Unit 12: structures defined by construction, placed before the proofs of the
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
