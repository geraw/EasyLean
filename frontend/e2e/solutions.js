// The intended solutions of every level, as steps: [type, { FIELD: value },
// { PART: steps }]. An assumption is given by its statement, as the menu of
// a move offers it (Lean's spelling, e.g. P → Q).

const close = ['exact'];
const assume = ['assume'];
const backward = (rule) => ['apply_rule', { RULE: rule }];
const forward = (rule, premise) => ['forward', { RULE: rule, PREMISE: premise }];
const andElim = (and) => ['and_elim', { AND: and }];
const andIntro = (left, right) => ['and_intro', {}, { LEFT: left, RIGHT: right }];
const combine = (left, right) => ['and_combine', { LEFT: left, RIGHT: right }];
const orIntro = (side) => ['or_intro', { SIDE: side }];
const orCases = (or, left, right) => ['or_elim', { OR: or }, { LEFT: left, RIGHT: right }];
const iffElim = (iff) => ['iff_elim', { IFF: iff }];
const contradiction = (fact) => ['contradiction', { FACT: fact }];
const notIntro = ['not_intro'];
const notElim = (negation) => ['not_elim', { NEGATION: negation }];
const exfalso = ['exfalso'];
const byContradiction = ['by_contradiction'];
const forallElim = (forall, term) => ['forall_elim', { FORALL: forall, TERM: term }];
const forallIntro = ['forall_intro'];
const existsIntro = (term) => ['exists_intro', { TERM: term }];
const existsElim = (exists) => ['exists_elim', { EXISTS: exists }];
const subsetIntro = ['subset_intro'];
const subsetElim = (subset, member) => ['subset_elim', { SUBSET: subset, MEMBER: member }];
const setEq = (first, second) => ['set_eq', {}, { FIRST: first, SECOND: second }];
const unfold = (statement) => ['unfold', { STATEMENT: statement }];
const rfl = ['rfl'];
const calc = ['calc'];
// With the assumptions it uses, by their statements: the first, then each more.
const withFacts = (type) => (fact, ...more) => [type, { FACT: fact, ...Object.fromEntries(more.map((other, index) => [`AND${index + 1}`, other])) }];
const calcHyps = withFacts('calc_hyps');
const algebra = ['algebra'];
const algebraHyps = withFacts('algebra_hyps');
const rewrite = (equation, direction, target = '__goal__') => ['rewrite', { EQUATION: equation, DIRECTION: direction, TARGET: target }];
const unfoldFunction = (name) => ['unfold_function', { FUNCTION: name }];
// One part only (in Lean's spelling, as the menu offers it).
const unfoldPart = (name, part) => ['unfold_function', { FUNCTION: name, PART: part }];
const replace = (law, direction, target = '__goal__') => ['replace', { LAW: law, DIRECTION: direction, TARGET: target }];
const iffIntro = (forward, backward) => ['iff_intro', {}, { FORWARD: forward, BACKWARD: backward }];
// An intermediate claim, proved in its part, and then in hand.
const claim = (statement, proof) => ['claim', { CLAIM: statement }, { PROOF: proof }];
const induction = (variable, base, step) => ['induction', { VARIABLE: variable }, { BASE: base, STEP: step }];
// Structural induction (unit 11): a part for each way the structure is built.
const inductionOn = (variable, parts) => ['induction', { VARIABLE: variable }, parts];
// The step of ∧ in 11.8: by both induction hypotheses, then arithmetic.
const ihs = [rewrite('atoms φ = binaries φ + 1', 'FORWARD'), rewrite('atoms ψ = binaries ψ + 1', 'FORWARD'), calc];

// Unit 2: "Q ∧ P" from the assumption "P ∧ Q", in two parts or forward.
const swapAnd = (and) => [assume, andElim(and), andIntro([close], [close])];
const swapAndForward = (and, left, right) => [assume, andElim(and), combine(left, right), close];

export const UNITS = [
    {
        unit: 0,
        world: 'יחידה 0 - היכרות עם הסביבה',
        levels: [
            [{ label: 'פתרון', steps: [close] }],
        ],
    },
    {
        unit: 1,
        world: 'יחידה 1 - מהנחה למסקנה',
        levels: [
            [{ label: 'פתרון', steps: [assume, close] }],
            [{ label: 'אחורה', steps: [backward('P → Q'), close] }],
            [{ label: 'קדימה', steps: [forward('P → Q', 'P'), forward('Q → R', 'Q'), close] }],
            [
                { label: 'אחורה', steps: [assume, assume, backward('P → Q'), close] },
                { label: 'קדימה', steps: [assume, assume, forward('P → Q', 'P'), close] },
            ],
            [
                { label: 'אחורה', steps: [assume, assume, assume, backward('Q → R'), backward('P → Q'), close] },
                { label: 'קדימה', steps: [assume, assume, assume, forward('P → Q', 'P'), forward('Q → R', 'Q'), close] },
            ],
        ],
    },
    {
        unit: 2,
        world: 'יחידה 2 - וגם, או, אם ורק אם',
        levels: [
            [{ label: 'פתרון', steps: [andElim('P ∧ Q'), close] }],
            [{ label: 'פתרון', steps: [andIntro([close], [close])] }],
            [
                { label: 'אחורה', steps: swapAnd('P ∧ Q') },
                { label: 'קדימה', steps: swapAndForward('P ∧ Q', 'Q', 'P') },
            ],
            [{ label: 'פתרון', steps: [orIntro('RIGHT'), close] }],
            [
                { label: 'אחורה', steps: [orCases('P ∨ Q', [backward('P → R'), close], [backward('Q → R'), close])] },
                { label: 'קדימה', steps: [orCases('P ∨ Q', [forward('P → R', 'P'), close], [forward('Q → R', 'Q'), close])] },
            ],
            [{ label: 'פתרון', steps: [assume, orCases('P ∨ Q', [orIntro('RIGHT'), close], [orIntro('LEFT'), close])] }],
            [
                { label: 'אחורה', steps: [iffElim('P ↔ Q'), backward('Q → P'), close] },
                { label: 'קדימה', steps: [iffElim('P ↔ Q'), forward('Q → P', 'Q'), close] },
            ],
            [
                { label: 'אחורה', steps: [['iff_intro', {}, { FORWARD: swapAnd('P ∧ Q'), BACKWARD: swapAnd('Q ∧ P') }]] },
                { label: 'קדימה', steps: [['iff_intro', {}, { FORWARD: swapAndForward('P ∧ Q', 'Q', 'P'), BACKWARD: swapAndForward('Q ∧ P', 'P', 'Q') }]] },
            ],
            [
                {
                    label: 'אחורה',
                    steps: [assume, andElim('P ∧ (Q ∨ R)'), orCases('Q ∨ R',
                        [orIntro('LEFT'), andIntro([close], [close])],
                        [orIntro('RIGHT'), andIntro([close], [close])])],
                },
                {
                    label: 'קדימה',
                    steps: [assume, andElim('P ∧ (Q ∨ R)'), orCases('Q ∨ R',
                        [orIntro('LEFT'), combine('P', 'Q'), close],
                        [orIntro('RIGHT'), combine('P', 'R'), close])],
                },
            ],
        ],
    },
    {
        unit: 3,
        world: 'יחידה 3 - שלילה והוכחה בשלילה',
        levels: [
            [
                { label: 'פתרון', steps: [contradiction('P')] },
                { label: 'מהשלילה', steps: [contradiction('¬P')] },
            ],
            [{ label: 'פתרון', steps: [notIntro, contradiction('P')] }],
            [{ label: 'פתרון', steps: [notIntro, forward('P → Q', 'P'), contradiction('Q')] }],
            [{ label: 'פתרון', steps: [notIntro, notElim('¬(P ∨ Q)'), orIntro('LEFT'), close] }],
            [{
                label: 'פתרון',
                steps: [assume, andIntro(
                    [notIntro, notElim('¬(P ∨ Q)'), orIntro('LEFT'), close],
                    [notIntro, notElim('¬(P ∨ Q)'), orIntro('RIGHT'), close])],
            }],
            [{ label: 'פתרון', steps: [exfalso, contradiction('P')] }],
            [{ label: 'פתרון', steps: [orCases('P ∨ Q', [exfalso, contradiction('P')], [close])] }],
            [{ label: 'פתרון', steps: [byContradiction, contradiction('¬P')] }],
            [{ label: 'פתרון', steps: [assume, assume, byContradiction, forward('¬Q → ¬P', '¬Q'), contradiction('P')] }],
            [{
                label: 'פתרון',
                steps: [byContradiction, notElim('¬(P ∨ ¬P)'), orIntro('RIGHT'), notIntro, notElim('¬(P ∨ ¬P)'), orIntro('LEFT'), close],
            }],
        ],
    },
    {
        unit: 4,
        world: 'יחידה 4 - כמתים',
        levels: [
            [{ label: 'פתרון', steps: [forallElim('∀ x, P x', 'a'), close] }],
            [
                { label: 'קדימה', steps: [forallElim('∀ x, P x → Q x', 'a'), forward('P a → Q a', 'P a'), close] },
                { label: 'אחורה', steps: [forallElim('∀ x, P x → Q x', 'a'), backward('P a → Q a'), close] },
            ],
            [{ label: 'פתרון', steps: [assume, forallIntro, forallElim('∀ x, P x ∧ Q x', 'x₀'), andElim('P x₀ ∧ Q x₀'), close] }],
            [
                { label: 'קדימה', steps: [assume, assume, forallIntro, forallElim('∀ x, P x → Q x', 'x₀'), forallElim('∀ x, P x', 'x₀'), forward('P x₀ → Q x₀', 'P x₀'), close] },
                { label: 'אחורה', steps: [assume, assume, forallIntro, forallElim('∀ x, P x → Q x', 'x₀'), backward('P x₀ → Q x₀'), forallElim('∀ x, P x', 'x₀'), close] },
            ],
            [{ label: 'פתרון', steps: [existsIntro('a'), orIntro('LEFT'), close] }],
            [{ label: 'פתרון', steps: [assume, existsElim('∃ x, P x ∧ Q x'), andElim('P x₀ ∧ Q x₀'), existsIntro('x₀'), close] }],
            [
                { label: 'קדימה', steps: [existsElim('∃ x, P x'), forallElim('∀ x, P x → Q x', 'x₀'), forward('P x₀ → Q x₀', 'P x₀'), existsIntro('x₀'), close] },
                { label: 'אחורה', steps: [existsElim('∃ x, P x'), forallElim('∀ x, P x → Q x', 'x₀'), existsIntro('x₀'), backward('P x₀ → Q x₀'), close] },
            ],
            [{ label: 'פתרון', steps: [assume, forallIntro, notIntro, notElim('¬∃ x, P x'), existsIntro('x₀'), close] }],
            [{ label: 'פתרון', steps: [assume, forallIntro, existsElim('∃ x, ∀ y, R x y'), forallElim('∀ y, R x₀ y', 'y₀'), existsIntro('x₀'), close] }],
            [{
                label: 'פתרון',
                steps: [assume, byContradiction, notElim('¬∀ x, P x'), forallIntro, byContradiction, notElim('¬∃ x, ¬P x'), existsIntro('x₀'), close],
            }],
        ],
    },
    {
        unit: 5,
        world: 'יחידה 5 - שקילויות לוגיות',
        levels: [
            [{ label: 'פתרון', steps: [assume, andElim('¬P ∧ ¬Q'), notIntro, orCases('P ∨ Q', [contradiction('P')], [contradiction('Q')])] }],
            [{ label: 'פתרון', steps: [assume, assume, notIntro, forward('P → Q', 'P'), contradiction('Q')] }],
            [{
                label: 'פתרון',
                steps: [iffIntro(
                    [assume, byContradiction, notElim('¬(¬P ∨ Q)'), orIntro('LEFT'), notIntro, notElim('¬(¬P ∨ Q)'), orIntro('RIGHT'), backward('P → Q'), close],
                    [assume, assume, orCases('¬P ∨ Q', [exfalso, contradiction('P')], [close])])],
            }],
            [{ label: 'פתרון', steps: [assume, notIntro, existsElim('∃ x, P x'), forallElim('∀ x, ¬P x', 'x₀'), contradiction('P x₀')] }],
            [{ label: 'פתרון', steps: [assume, notIntro, existsElim('∃ x, ¬P x'), forallElim('∀ x, P x', 'x₀'), contradiction('P x₀')] }],
            [{ label: 'פתרון', steps: [replace('easylean_imp_or', 'FORWARD'), orIntro('LEFT'), close] }],
            [{ label: 'פתרון', steps: [replace('easylean_not_or', 'FORWARD', '¬(P ∨ Q)'), andElim('¬P ∧ ¬Q'), close] }],
            [
                { label: 'במטרה', steps: [assume, replace('easylean_contrapositive', 'FORWARD'), close] },
                { label: 'בהנחה', steps: [assume, replace('easylean_contrapositive', 'BACKWARD', '¬Q → ¬P'), close] },
            ],
            [{ label: 'פתרון', steps: [assume, replace('easylean_not_or', 'FORWARD', '¬(P ∨ ¬Q)'), replace('easylean_not_not', 'FORWARD', '¬P ∧ ¬¬Q'), close] }],
            [{
                label: 'פתרון',
                steps: [assume, replace('easylean_not_forall', 'FORWARD', '¬∀ x, ∃ y, R x y'), replace('easylean_not_exists', 'FORWARD', '∃ x, ¬∃ y, R x y'), close],
            }],
            [{
                label: 'פתרון',
                steps: [iffIntro(
                    [assume, andIntro(
                        [byContradiction, notElim('¬(P → Q)'), assume, exfalso, contradiction('P')],
                        [notIntro, notElim('¬(P → Q)'), assume, close])],
                    [assume, andElim('P ∧ ¬Q'), notIntro, forward('P → Q', 'P'), contradiction('Q')])],
            }],
            [{
                label: 'פתרון',
                steps: [assume, replace('easylean_not_forall', 'FORWARD', '¬∀ x, P x → Q x'), replace('easylean_not_imp', 'FORWARD', '∃ x, ¬(P x → Q x)'), close],
            }],
            [{
                label: 'פתרון',
                steps: [assume, replace('easylean_imp_or', 'BACKWARD'), assume, notIntro, notElim('¬(P ∧ Q)'), andIntro([close], [close])],
            }],
        ],
    },
    {
        unit: 6,
        world: 'יחידה 6 - קבוצות',
        levels: [
            [{ label: 'פתרון', steps: [subsetElim('A ⊆ B', 'x₀ ∈ A'), close] }],
            [{ label: 'פתרון', steps: [assume, assume, subsetIntro, subsetElim('A ⊆ B', 'x₀ ∈ A'), subsetElim('B ⊆ C', 'x₀ ∈ B'), close] }],
            [{ label: 'פתרון', steps: [subsetIntro, unfold('x₀ ∈ A ∩ B'), andElim('x₀ ∈ A ∧ x₀ ∈ B'), close] }],
            [{ label: 'פתרון', steps: [subsetIntro, unfold('x₀ ∈ A ∪ B'), orIntro('LEFT'), close] }],
            [{
                label: 'פתרון',
                steps: [subsetIntro, unfold('x₀ ∈ A ∪ B'), orCases('x₀ ∈ A ∨ x₀ ∈ B',
                    [subsetElim('A ⊆ C', 'x₀ ∈ A'), close],
                    [subsetElim('B ⊆ C', 'x₀ ∈ B'), close])],
            }],
            [
                {
                    label: 'בשני חלקים',
                    steps: [setEq(
                        [subsetIntro, unfold('x₀ ∈ A ∩ B'), andElim('x₀ ∈ A ∧ x₀ ∈ B'), unfold('x₀ ∈ B ∩ A'), andIntro([close], [close])],
                        [subsetIntro, unfold('x₀ ∈ B ∩ A'), andElim('x₀ ∈ B ∧ x₀ ∈ A'), unfold('x₀ ∈ A ∩ B'), andIntro([close], [close])])],
                },
                {
                    label: 'קדימה',
                    steps: [setEq(
                        [subsetIntro, unfold('x₀ ∈ A ∩ B'), andElim('x₀ ∈ A ∧ x₀ ∈ B'), unfold('x₀ ∈ B ∩ A'), combine('x₀ ∈ B', 'x₀ ∈ A'), close],
                        [subsetIntro, unfold('x₀ ∈ B ∩ A'), andElim('x₀ ∈ B ∧ x₀ ∈ A'), unfold('x₀ ∈ A ∩ B'), combine('x₀ ∈ A', 'x₀ ∈ B'), close])],
                },
            ],
            [{
                label: 'פתרון',
                steps: [subsetIntro, unfold('x₀ ∈ A ∩ (B ∪ C)'), andElim('x₀ ∈ A ∧ x₀ ∈ B ∪ C'), unfold('x₀ ∈ B ∪ C'), unfold('x₀ ∈ A ∩ B ∪ A ∩ C'),
                    orCases('x₀ ∈ B ∨ x₀ ∈ C',
                        [orIntro('LEFT'), unfold('x₀ ∈ A ∩ B'), andIntro([close], [close])],
                        [orIntro('RIGHT'), unfold('x₀ ∈ A ∩ C'), andIntro([close], [close])])],
            }],
            [{
                label: 'פתרון',
                steps: [assume, subsetIntro, unfold('x₀ ∈ C \\ B'), andElim('x₀ ∈ C ∧ ¬x₀ ∈ B'), unfold('x₀ ∈ C \\ A'),
                    andIntro([close], [notIntro, subsetElim('A ⊆ B', 'x₀ ∈ A'), contradiction('x₀ ∈ B')])],
            }],
            [{
                label: 'פתרון',
                steps: [subsetIntro, unfold('x₀ ∈ A \\ (A \\ B)'), andElim('x₀ ∈ A ∧ ¬x₀ ∈ A \\ B'), unfold('x₀ ∈ A ∩ B'),
                    andIntro([close], [byContradiction, notElim('¬x₀ ∈ A \\ B'), unfold('x₀ ∈ A \\ B'), andIntro([close], [close])])],
            }],
            [{
                label: 'פתרון',
                steps: [subsetIntro, unfold('x₀ ∈ A ∆ B'), unfold('x₀ ∈ (A ∪ B) \\ (A ∩ B)'), orCases('x₀ ∈ A \\ B ∨ x₀ ∈ B \\ A',
                    [unfold('x₀ ∈ A \\ B'), andElim('x₀ ∈ A ∧ ¬x₀ ∈ B'), andIntro(
                        [unfold('x₀ ∈ A ∪ B'), orIntro('LEFT'), close],
                        [notIntro, unfold('x₀ ∈ A ∩ B'), andElim('x₀ ∈ A ∧ x₀ ∈ B'), contradiction('x₀ ∈ B')])],
                    [unfold('x₀ ∈ B \\ A'), andElim('x₀ ∈ B ∧ ¬x₀ ∈ A'), andIntro(
                        [unfold('x₀ ∈ A ∪ B'), orIntro('RIGHT'), close],
                        [notIntro, unfold('x₀ ∈ A ∩ B'), andElim('x₀ ∈ A ∧ x₀ ∈ B'), contradiction('x₀ ∈ A')])])],
            }],
            [{ label: 'פתרון', steps: [subsetIntro, unfold('x₀ ∈ ∅'), exfalso, close] }],
            [{
                label: 'פתרון',
                steps: [setEq(
                    [subsetIntro, unfold('x₀ ∈ A \\ (B ∪ C)'), andElim('x₀ ∈ A ∧ ¬x₀ ∈ B ∪ C'), unfold('x₀ ∈ (A \\ B) ∩ (A \\ C)'), andIntro(
                        [unfold('x₀ ∈ A \\ B'), andIntro([close], [notIntro, notElim('¬x₀ ∈ B ∪ C'), unfold('x₀ ∈ B ∪ C'), orIntro('LEFT'), close])],
                        [unfold('x₀ ∈ A \\ C'), andIntro([close], [notIntro, notElim('¬x₀ ∈ B ∪ C'), unfold('x₀ ∈ B ∪ C'), orIntro('RIGHT'), close])])],
                    [subsetIntro, unfold('x₀ ∈ (A \\ B) ∩ (A \\ C)'), andElim('x₀ ∈ A \\ B ∧ x₀ ∈ A \\ C'), unfold('x₀ ∈ A \\ B'), andElim('x₀ ∈ A ∧ ¬x₀ ∈ B'),
                        unfold('x₀ ∈ A \\ C'), andElim('x₀ ∈ A ∧ ¬x₀ ∈ C'), unfold('x₀ ∈ A \\ (B ∪ C)'),
                        andIntro([close], [notIntro, unfold('x₀ ∈ B ∪ C'), orCases('x₀ ∈ B ∨ x₀ ∈ C', [contradiction('x₀ ∈ B')], [contradiction('x₀ ∈ C')])])])],
            }],
        ],
    },
    {
        unit: 7,
        world: 'יחידה 7 - קבוצות של קבוצות',
        levels: [
            [{ label: 'פתרון', steps: [unfold('A ∈ 𝒫 (A ∪ B)'), subsetIntro, unfold('x₀ ∈ A ∪ B'), orIntro('LEFT'), close] }],
            [{
                label: 'פתרון',
                steps: [assume, subsetIntro, unfold('X₀ ∈ 𝒫 A'), unfold('X₀ ∈ 𝒫 B'), subsetIntro, subsetElim('X₀ ⊆ A', 'x₀ ∈ X₀'), subsetElim('A ⊆ B', 'x₀ ∈ A'), close],
            }],
            [{
                label: 'פתרון',
                steps: [assume, claim('A ∈ 𝒫 A', [unfold('A ∈ 𝒫 A'), subsetIntro, close]), subsetElim('𝒫 A ⊆ 𝒫 B', 'A ∈ 𝒫 A'), unfold('A ∈ 𝒫 B'), close],
            }],
            [{ label: 'פתרון', steps: [unfold('∅ ∈ 𝒫 A'), subsetIntro, unfold('x₀ ∈ ∅'), exfalso, close] }],
            [{ label: 'פתרון', steps: [subsetIntro, unfold('x₀ ∈ ⋃ F'), existsIntro('A'), andIntro([close], [close])] }],
            [
                { label: 'קדימה', steps: [subsetIntro, unfold('x₀ ∈ ⋂ F'), forallElim('∀ (S : Set obj), S ∈ F → x₀ ∈ S', 'A'), forward('A ∈ F → x₀ ∈ A', 'A ∈ F'), close] },
                { label: 'אחורה', steps: [subsetIntro, unfold('x₀ ∈ ⋂ F'), forallElim('∀ (S : Set obj), S ∈ F → x₀ ∈ S', 'A'), backward('A ∈ F → x₀ ∈ A'), close] },
            ],
            [{
                label: 'פתרון',
                steps: [assume, subsetIntro, unfold('x₀ ∈ ⋃ F'), existsElim('∃ S, S ∈ F ∧ x₀ ∈ S'), andElim('S₀ ∈ F ∧ x₀ ∈ S₀'),
                    forallElim('∀ (S : Set obj), S ∈ F → S ⊆ A', 'S₀'), forward('S₀ ∈ F → S₀ ⊆ A', 'S₀ ∈ F'), subsetElim('S₀ ⊆ A', 'x₀ ∈ S₀'), close],
            }],
        ],
    },
    {
        unit: 8,
        world: 'יחידה 8 - שוויון ויחסים',
        levels: [
            [{ label: 'פתרון', steps: [rfl] }],
            [
                { label: 'בטענה שבידינו', steps: [rewrite('a = b', 'FORWARD', '(a, c) ∈ R'), close] },
                { label: 'במטרה', steps: [rewrite('a = b', 'BACKWARD'), close] },
            ],
            [{ label: 'פתרון', steps: [rewrite('a = b', 'FORWARD'), rfl] }],
            [
                { label: 'a ב־b', steps: [rewrite('a = b', 'FORWARD'), close] },
                { label: 'c ב־b', steps: [rewrite('b = c', 'BACKWARD'), close] },
            ],
            [{
                label: 'פתרון',
                steps: [setEq([subsetIntro, unfold('(x₀, y₀) ∈ R⁻¹⁻¹'), unfold('(y₀, x₀) ∈ R⁻¹'), close], [subsetIntro, unfold('(x₀, y₀) ∈ R⁻¹⁻¹'), unfold('(y₀, x₀) ∈ R⁻¹'), close])],
            }],
            [{
                label: 'פתרון',
                steps: [subsetIntro, unfold('(x₀, z₀) ∈ (R ∘ S)⁻¹'), unfold('(z₀, x₀) ∈ R ∘ S'), existsElim('∃ y, (z₀, y) ∈ S ∧ (y, x₀) ∈ R'), andElim('(z₀, y₀) ∈ S ∧ (y₀, x₀) ∈ R'),
                    unfold('(x₀, z₀) ∈ S⁻¹ ∘ R⁻¹'), existsIntro('y₀'), andIntro([unfold('(x₀, y₀) ∈ R⁻¹'), close], [unfold('(y₀, z₀) ∈ S⁻¹'), close])],
            }],
            [{
                label: 'פתרון',
                steps: [assume, unfold('reflexive R'), subsetIntro, unfold('(x₀, z₀) ∈ R ∘ R'), existsIntro('z₀'), andIntro([close], [forallElim('∀ (x : obj), (x, x) ∈ R', 'z₀'), close])],
            }],
            [{
                label: 'פתרון',
                steps: [iffIntro(
                    [assume, unfold('symmetric R'), subsetIntro, unfold('(x₀, y₀) ∈ R⁻¹'), forallElim('∀ (x y : obj), (x, y) ∈ R → (y, x) ∈ R', 'y₀'),
                        forallElim('∀ (y : obj), (y₀, y) ∈ R → (y, y₀) ∈ R', 'x₀'), forward('(y₀, x₀) ∈ R → (x₀, y₀) ∈ R', '(y₀, x₀) ∈ R'), close],
                    [assume, unfold('symmetric R'), forallIntro, forallIntro, assume, claim('(y₀, x₀) ∈ R⁻¹', [unfold('(y₀, x₀) ∈ R⁻¹'), close]),
                        subsetElim('R⁻¹ ⊆ R', '(y₀, x₀) ∈ R⁻¹'), close])],
            }],
            [{
                label: 'פתרון',
                steps: [iffIntro(
                    [assume, unfold('transitive R'), subsetIntro, unfold('(x₀, z₀) ∈ R ∘ R'), existsElim('∃ y, (x₀, y) ∈ R ∧ (y, z₀) ∈ R'),
                        forallElim('∀ (x y z : obj), (x, y) ∈ R ∧ (y, z) ∈ R → (x, z) ∈ R', 'x₀'), forallElim('∀ (y z : obj), (x₀, y) ∈ R ∧ (y, z) ∈ R → (x₀, z) ∈ R', 'y₀'),
                        forallElim('∀ (z : obj), (x₀, y₀) ∈ R ∧ (y₀, z) ∈ R → (x₀, z) ∈ R', 'z₀'), forward('(x₀, y₀) ∈ R ∧ (y₀, z₀) ∈ R → (x₀, z₀) ∈ R', '(x₀, y₀) ∈ R ∧ (y₀, z₀) ∈ R'), close],
                    [assume, unfold('transitive R'), forallIntro, forallIntro, forallIntro, assume, andElim('(x₀, y₀) ∈ R ∧ (y₀, z₀) ∈ R'),
                        claim('(x₀, z₀) ∈ R ∘ R', [unfold('(x₀, z₀) ∈ R ∘ R'), existsIntro('y₀'), andIntro([close], [close])]), subsetElim('R ∘ R ⊆ R', '(x₀, z₀) ∈ R ∘ R'), close])],
            }],
            [{
                label: 'פתרון',
                steps: [assume, unfold('antisymmetric R'), unfold('antisymmetric (R ∩ S)'), forallIntro, forallIntro, assume, andElim('(x₀, y₀) ∈ R ∩ S ∧ (y₀, x₀) ∈ R ∩ S'),
                    unfold('(x₀, y₀) ∈ R ∩ S'), andElim('(x₀, y₀) ∈ R ∧ (x₀, y₀) ∈ S'), unfold('(y₀, x₀) ∈ R ∩ S'), andElim('(y₀, x₀) ∈ R ∧ (y₀, x₀) ∈ S'),
                    forallElim('∀ (x y : obj), (x, y) ∈ R ∧ (y, x) ∈ R → x = y', 'x₀'), forallElim('∀ (y : obj), (x₀, y) ∈ R ∧ (y, x₀) ∈ R → x₀ = y', 'y₀'),
                    backward('(x₀, y₀) ∈ R ∧ (y₀, x₀) ∈ R → x₀ = y₀'), andIntro([close], [close])],
            }],
            [{
                label: 'פתרון',
                steps: [unfold('antisymmetric R'), forallElim('∀ (x y : obj), (x, y) ∈ R ∧ (y, x) ∈ R → x = y', 'm'), forallElim('∀ (y : obj), (m, y) ∈ R ∧ (y, m) ∈ R → m = y', 'n'),
                    backward('(m, n) ∈ R ∧ (n, m) ∈ R → m = n'), andIntro([forallElim('∀ (x : obj), (m, x) ∈ R', 'n'), close], [forallElim('∀ (x : obj), (n, x) ∈ R', 'm'), close])],
            }],
            [{
                label: 'פתרון',
                steps: [unfold('transitive R'), setEq(
                    [subsetIntro, unfold('x₀ ∈ [a]_R'), unfold('x₀ ∈ [b]_R'), forallElim('∀ (x y z : obj), (x, y) ∈ R ∧ (y, z) ∈ R → (x, z) ∈ R', 'b'), forallElim('∀ (y z : obj), (b, y) ∈ R ∧ (y, z) ∈ R → (b, z) ∈ R', 'a'),
                        forallElim('∀ (z : obj), (b, a) ∈ R ∧ (a, z) ∈ R → (b, z) ∈ R', 'x₀'), backward('(b, a) ∈ R ∧ (a, x₀) ∈ R → (b, x₀) ∈ R'),
                        andIntro([unfold('symmetric R'), forallElim('∀ (x y : obj), (x, y) ∈ R → (y, x) ∈ R', 'a'), forallElim('∀ (y : obj), (a, y) ∈ R → (y, a) ∈ R', 'b'),
                            forward('(a, b) ∈ R → (b, a) ∈ R', '(a, b) ∈ R'), close], [close])],
                    [subsetIntro, unfold('x₀ ∈ [b]_R'), unfold('x₀ ∈ [a]_R'), forallElim('∀ (x y z : obj), (x, y) ∈ R ∧ (y, z) ∈ R → (x, z) ∈ R', 'a'), forallElim('∀ (y z : obj), (a, y) ∈ R ∧ (y, z) ∈ R → (a, z) ∈ R', 'b'),
                        forallElim('∀ (z : obj), (a, b) ∈ R ∧ (b, z) ∈ R → (a, z) ∈ R', 'x₀'), backward('(a, b) ∈ R ∧ (b, x₀) ∈ R → (a, x₀) ∈ R'), andIntro([close], [close])])],
            }],
            [{
                label: 'פתרון',
                steps: [unfold('c ∈ [a]_R'), unfold('c ∈ [b]_R'), unfold('transitive R'), forallElim('∀ (x y z : obj), (x, y) ∈ R ∧ (y, z) ∈ R → (x, z) ∈ R', 'a'), forallElim('∀ (y z : obj), (a, y) ∈ R ∧ (y, z) ∈ R → (a, z) ∈ R', 'c'),
                    forallElim('∀ (z : obj), (a, c) ∈ R ∧ (c, z) ∈ R → (a, z) ∈ R', 'b'), backward('(a, c) ∈ R ∧ (c, b) ∈ R → (a, b) ∈ R'),
                    andIntro([close], [unfold('symmetric R'), forallElim('∀ (x y : obj), (x, y) ∈ R → (y, x) ∈ R', 'b'), forallElim('∀ (y : obj), (b, y) ∈ R → (y, b) ∈ R', 'c'),
                        forward('(b, c) ∈ R → (c, b) ∈ R', '(b, c) ∈ R'), close])],
            }],
            [{
                label: 'פתרון',
                steps: [unfold('transitive R'), unfold('transitive S'), unfold('transitive (R ∘ S)'), forallIntro, forallIntro, forallIntro, assume, andElim('(x₀, y₀) ∈ R ∘ S ∧ (y₀, z₀) ∈ R ∘ S'),
                    unfold('(x₀, y₀) ∈ R ∘ S'), existsElim('∃ y, (x₀, y) ∈ S ∧ (y, y₀) ∈ R'), andElim('(x₀, y₁) ∈ S ∧ (y₁, y₀) ∈ R'),
                    unfold('(y₀, z₀) ∈ R ∘ S'), existsElim('∃ y, (y₀, y) ∈ S ∧ (y, z₀) ∈ R'), andElim('(y₀, y₂) ∈ S ∧ (y₂, z₀) ∈ R'),
                    claim('(y₁, y₂) ∈ S ∘ R', [unfold('(y₁, y₂) ∈ S ∘ R'), existsIntro('y₀'), andIntro([close], [close])]),
                    rewrite('R ∘ S = S ∘ R', 'BACKWARD', '(y₁, y₂) ∈ S ∘ R'), unfold('(y₁, y₂) ∈ R ∘ S'), existsElim('∃ y, (y₁, y) ∈ S ∧ (y, y₂) ∈ R'), andElim('(y₁, y₃) ∈ S ∧ (y₃, y₂) ∈ R'),
                    unfold('(x₀, z₀) ∈ R ∘ S'), existsIntro('y₃'), andIntro(
                        [forallElim('∀ (x y z : obj), (x, y) ∈ S ∧ (y, z) ∈ S → (x, z) ∈ S', 'x₀'), forallElim('∀ (y z : obj), (x₀, y) ∈ S ∧ (y, z) ∈ S → (x₀, z) ∈ S', 'y₁'),
                            forallElim('∀ (z : obj), (x₀, y₁) ∈ S ∧ (y₁, z) ∈ S → (x₀, z) ∈ S', 'y₃'), backward('(x₀, y₁) ∈ S ∧ (y₁, y₃) ∈ S → (x₀, y₃) ∈ S'), andIntro([close], [close])],
                        [forallElim('∀ (x y z : obj), (x, y) ∈ R ∧ (y, z) ∈ R → (x, z) ∈ R', 'y₃'), forallElim('∀ (y z : obj), (y₃, y) ∈ R ∧ (y, z) ∈ R → (y₃, z) ∈ R', 'y₂'),
                            forallElim('∀ (z : obj), (y₃, y₂) ∈ R ∧ (y₂, z) ∈ R → (y₃, z) ∈ R', 'z₀'), backward('(y₃, y₂) ∈ R ∧ (y₂, z₀) ∈ R → (y₃, z₀) ∈ R'), andIntro([close], [close])])],
            }],
        ],
    },
    {
        unit: 9,
        world: 'יחידה 9 - פונקציות',
        levels: [
            [{
                label: 'פתרון',
                steps: [assume, assume, unfold('injective f'), unfold('injective g'), unfold('injective (g ∘ f)'), forallIntro, forallIntro, assume,
                    forallElim('∀ (x y : obj), g x = g y → x = y', 'f x₀'), forallElim('∀ (y : obj), g (f x₀) = g y → f x₀ = y', 'f y₀'),
                    forward('g (f x₀) = g (f y₀) → f x₀ = f y₀', 'g (f x₀) = g (f y₀)'),
                    forallElim('∀ (x y : obj), f x = f y → x = y', 'x₀'), forallElim('∀ (y : obj), f x₀ = f y → x₀ = y', 'y₀'), forward('f x₀ = f y₀ → x₀ = y₀', 'f x₀ = f y₀'), close],
            }],
            [{
                label: 'פתרון',
                steps: [assume, assume, unfold('surjective f'), unfold('surjective g'), unfold('surjective (g ∘ f)'), forallIntro,
                    forallElim('∀ (y : obj), ∃ x, g x = y', 'y₀'), existsElim('∃ x, g x = y₀'), forallElim('∀ (y : obj), ∃ x, f x = y', 'x₀'), existsElim('∃ x, f x = x₀'),
                    existsIntro('x₁'), rewrite('f x₁ = x₀', 'FORWARD'), close],
            }],
            [{
                label: 'פתרון',
                steps: [assume, unfold('injective (g ∘ f)'), unfold('injective f'), forallIntro, forallIntro, assume,
                    forallElim('∀ (x y : obj), g (f x) = g (f y) → x = y', 'x₀'), forallElim('∀ (y : obj), g (f x₀) = g (f y) → x₀ = y', 'y₀'),
                    backward('g (f x₀) = g (f y₀) → x₀ = y₀'), rewrite('f x₀ = f y₀', 'FORWARD'), rfl],
            }],
            [{
                label: 'פתרון',
                steps: [assume, unfold('surjective (g ∘ f)'), unfold('surjective g'), forallIntro, forallElim('∀ (y : obj), ∃ x, g (f x) = y', 'y₀'),
                    existsElim('∃ x, g (f x) = y₀'), existsIntro('f x₀'), close],
            }],
            [{
                label: 'פתרון',
                steps: [subsetIntro, unfold('y₀ ∈ Set.image f (A ∩ B)'), existsElim('∃ x, x ∈ A ∩ B ∧ f x = y₀'), andElim('x₀ ∈ A ∩ B ∧ f x₀ = y₀'),
                    unfold('x₀ ∈ A ∩ B'), andElim('x₀ ∈ A ∧ x₀ ∈ B'), unfold('y₀ ∈ Set.image f A ∩ Set.image f B'),
                    andIntro(...['A', 'B'].map((set) => [unfold(`y₀ ∈ Set.image f ${set}`), existsIntro('x₀'), andIntro([close], [close])]))],
            }],
            [{
                label: 'פתרון',
                steps: [setEq(
                    [subsetIntro, unfold('x₀ ∈ Set.preimage f (A ∩ B)'), unfold('f x₀ ∈ A ∩ B'), andElim('f x₀ ∈ A ∧ f x₀ ∈ B'),
                        unfold('x₀ ∈ Set.preimage f A ∩ Set.preimage f B'), andIntro([unfold('x₀ ∈ Set.preimage f A'), close], [unfold('x₀ ∈ Set.preimage f B'), close])],
                    [subsetIntro, unfold('x₀ ∈ Set.preimage f A ∩ Set.preimage f B'), andElim('x₀ ∈ Set.preimage f A ∧ x₀ ∈ Set.preimage f B'),
                        unfold('x₀ ∈ Set.preimage f A'), unfold('x₀ ∈ Set.preimage f B'), unfold('x₀ ∈ Set.preimage f (A ∩ B)'), unfold('f x₀ ∈ A ∩ B'), andIntro([close], [close])])],
            }],
            [{
                label: 'פתרון',
                steps: [subsetIntro, unfold('y₀ ∈ Set.image f (Set.preimage f B)'), existsElim('∃ x, x ∈ Set.preimage f B ∧ f x = y₀'),
                    andElim('x₀ ∈ Set.preimage f B ∧ f x₀ = y₀'), unfold('x₀ ∈ Set.preimage f B'), rewrite('f x₀ = y₀', 'FORWARD', 'f x₀ ∈ B'), close],
            }],
            [{
                label: 'פתרון',
                steps: [assume, unfold('injective f'), subsetIntro, unfold('x₀ ∈ Set.preimage f (Set.image f A)'), unfold('f x₀ ∈ Set.image f A'),
                    existsElim('∃ x, x ∈ A ∧ f x = f x₀'), andElim('x₁ ∈ A ∧ f x₁ = f x₀'), forallElim('∀ (x y : obj), f x = f y → x = y', 'x₁'),
                    forallElim('∀ (y : obj), f x₁ = f y → x₁ = y', 'x₀'), forward('f x₁ = f x₀ → x₁ = x₀', 'f x₁ = f x₀'), rewrite('x₁ = x₀', 'FORWARD', 'x₁ ∈ A'), close],
            }],
            [{
                label: 'פתרון',
                steps: [notIntro, unfold('surjective f'), forallElim('∀ (y : Set obj), ∃ x, f x = y', 'setOf fun z => ¬z ∈ f z'), existsElim('∃ x, f x = setOf fun z => ¬z ∈ f z'),
                    claim('¬x₀ ∈ f x₀', [notIntro, rewrite('f x₀ = setOf fun z => ¬z ∈ f z', 'FORWARD', 'x₀ ∈ f x₀'), unfold('x₀ ∈ setOf fun z => ¬z ∈ f z'), contradiction('x₀ ∈ f x₀')]),
                    claim('x₀ ∈ setOf fun z => ¬z ∈ f z', [unfold('x₀ ∈ setOf fun z => ¬z ∈ f z'), close]),
                    rewrite('f x₀ = setOf fun z => ¬z ∈ f z', 'BACKWARD', 'x₀ ∈ setOf fun z => ¬z ∈ f z'), contradiction('x₀ ∈ f x₀')],
            }],
        ],
    },
    {
        unit: 10,
        world: 'יחידה 10 - אינדוקציה',
        levels: [
            [{ label: 'פתרון', steps: [rfl] }],
            [{ label: 'פתרון', steps: [induction('n', [unfoldFunction('double'), rfl], [unfoldFunction('double'), rewrite('double n = n + n', 'FORWARD'), calc])] }],
            [{ label: 'פתרון', steps: [induction('n', [rfl], [unfoldFunction('add'), rewrite('0 + n = n', 'FORWARD'), rfl])] }],
            [{ label: 'פתרון', steps: [assume, calcHyps('n + 1 ≤ n')] }],
            [{ label: 'פתרון', steps: [induction('n', [calc], [unfoldFunction('pow'), calcHyps('n + 1 ≤ 2 ^ n')])] }],
            [{ label: 'פתרון', steps: [induction('n', [unfoldFunction('sumTo'), rfl], [unfoldFunction('sumTo'), algebraHyps('2 * sumTo n = n * (n + 1)')])] }],
            [{
                label: 'פתרון',
                steps: [induction('n', [orIntro('LEFT'), existsIntro('0'), rfl], [orCases('(∃ j, n = 2 * j) ∨ ∃ j, n = 2 * j + 1',
                    [existsElim('∃ j, n = 2 * j'), orIntro('RIGHT'), existsIntro('j₀'), calcHyps('n = 2 * j₀')],
                    [existsElim('∃ j, n = 2 * j + 1'), orIntro('LEFT'), existsIntro('j₀ + 1'), calcHyps('n = 2 * j₀ + 1')])])],
            }],
            [{ label: 'פתרון', steps: [induction('n', [unfoldFunction('oddSum'), rfl], [unfoldFunction('oddSum'), rewrite('oddSum n = n * n', 'FORWARD'), algebra])] }],
        ],
    },
    {
        unit: 11,
        world: 'יחידה 11 - אינדוקציה מבנית',
        levels: [
            [{ label: 'פתרון', steps: [inductionOn('l', { NIL: [rfl], CONS: [unfoldFunction('append'), rewrite('l ++ [] = l', 'FORWARD'), rfl] })] }],
            [{
                label: 'פתרון',
                steps: [inductionOn('l', {
                    NIL: [unfoldFunction('append'), unfoldFunction('length'), calc],
                    CONS: [unfoldFunction('append'), unfoldPart('length', 'List.length (a :: (l ++ m))'), unfoldPart('length', 'List.length (a :: l)'),
                        rewrite('List.length (l ++ m) = List.length l + List.length m', 'FORWARD'), calc],
                })],
            }],
            [{
                label: 'פתרון',
                steps: [inductionOn('l', {
                    NIL: [rfl],
                    CONS: [unfoldPart('append', '(a :: l) ++ (m ++ k)'), unfoldPart('append', '(a :: l) ++ m'), unfoldPart('append', '(a :: (l ++ m)) ++ k'),
                        rewrite('l ++ (m ++ k) = l ++ m ++ k', 'FORWARD'), rfl],
                })],
            }],
            [{
                label: 'פתרון',
                steps: [inductionOn('t', {
                    LEAF: [rfl],
                    NODE: [unfoldFunction('leaves'), unfoldFunction('nodes'), rewrite('leaves l = nodes l + 1', 'FORWARD'), rewrite('leaves r = nodes r + 1', 'FORWARD'), calc],
                })],
            }],
            [{
                label: 'פתרון',
                steps: [inductionOn('t', {
                    LEAF: [unfoldFunction('height'), unfoldFunction('nodes'), calc],
                    NODE: [unfoldFunction('height'), unfoldFunction('nodes'), calcHyps('height l ≤ nodes l', 'height r ≤ nodes r')],
                })],
            }],
            [{
                label: 'פתרון',
                steps: [inductionOn('t', {
                    LEAF: [rfl],
                    NODE: [unfoldPart('mirror', 'mirror (node l r)'), unfoldPart('mirror', 'mirror (node (mirror r) (mirror l))'),
                        rewrite('mirror (mirror l) = l', 'FORWARD'), rewrite('mirror (mirror r) = r', 'FORWARD'), rfl],
                })],
            }],
            [{
                label: 'פתרון',
                steps: [inductionOn('φ', {
                    ATOM: [rfl],
                    NEG: [unfoldFunction('opening'), unfoldFunction('closing'), close],
                    CONJ: [unfoldFunction('opening'), unfoldFunction('closing'), rewrite('opening φ = closing φ', 'FORWARD'), rewrite('opening ψ = closing ψ', 'FORWARD'), rfl],
                })],
            }],
            [{
                label: 'פתרון',
                steps: [inductionOn('φ', {
                    ATOM: [rfl],
                    NEG: [unfoldFunction('atoms'), unfoldFunction('binaries'), close],
                    CONJ: [unfoldFunction('atoms'), unfoldFunction('binaries'), ...ihs],
                })],
            }],
            [{
                label: 'פתרון',
                steps: [inductionOn('φ', {
                    ATOM: [unfoldFunction('depth'), unfoldFunction('binaries'), unfoldFunction('negations'), calc],
                    NEG: [unfoldFunction('depth'), unfoldFunction('binaries'), unfoldFunction('negations'), calcHyps('depth φ ≤ binaries φ + negations φ')],
                    CONJ: [unfoldFunction('depth'), unfoldFunction('binaries'), unfoldFunction('negations'),
                        calcHyps('depth φ ≤ binaries φ + negations φ', 'depth ψ ≤ binaries ψ + negations ψ')],
                })],
            }],
        ],
    },
    {
        unit: 12,
        world: 'יחידה 12 - תרגילים מסכמים',
        levels: [
            [{
                label: 'פתרון',
                steps: [iffIntro(
                    [assume, byContradiction, replace('easylean_not_or', 'FORWARD', '¬((P → Q) ∨ (P → R))'), andElim('¬(P → Q) ∧ ¬(P → R)'),
                        replace('easylean_not_imp', 'FORWARD', '¬(P → Q)'), andElim('P ∧ ¬Q'), replace('easylean_not_imp', 'FORWARD', '¬(P → R)'), andElim('P ∧ ¬R'),
                        forward('P → Q ∨ R', 'P'), orCases('Q ∨ R', [contradiction('Q')], [contradiction('R')])],
                    [assume, assume, orCases('(P → Q) ∨ (P → R)', [orIntro('LEFT'), forward('P → Q', 'P'), close], [orIntro('RIGHT'), forward('P → R', 'P'), close])])],
            }],
            [{
                label: 'פתרון',
                steps: [byContradiction, replace('easylean_not_or', 'FORWARD', '¬((P → Q) ∨ (Q → P))'), andElim('¬(P → Q) ∧ ¬(Q → P)'),
                    replace('easylean_not_imp', 'FORWARD', '¬(P → Q)'), andElim('P ∧ ¬Q'), replace('easylean_not_imp', 'FORWARD', '¬(Q → P)'), andElim('Q ∧ ¬P'), contradiction('P')],
            }],
            [{
                label: 'פתרון',
                steps: [assume, replace('easylean_not_forall', 'FORWARD', '¬∀ x, ∀ y, R x y ∧ R y x → x = y'),
                    replace('easylean_not_forall', 'FORWARD', '∃ x, ¬∀ y, R x y ∧ R y x → x = y'),
                    replace('easylean_not_imp', 'FORWARD', '∃ x, ∃ y, ¬(R x y ∧ R y x → x = y)'), close],
            }],
            [{
                label: 'פתרון',
                steps: [forallIntro, forallIntro, forallIntro, assume, andElim('(R x₀ y₀ ∧ S x₀ y₀) ∧ R y₀ z₀ ∧ S y₀ z₀'), andElim('R x₀ y₀ ∧ S x₀ y₀'), andElim('R y₀ z₀ ∧ S y₀ z₀'),
                    andIntro(...['R', 'S'].map((rel) => [
                        forallElim(`∀ (x y z : obj), ${rel} x y ∧ ${rel} y z → ${rel} x z`, 'x₀'), forallElim(`∀ (y z : obj), ${rel} x₀ y ∧ ${rel} y z → ${rel} x₀ z`, 'y₀'),
                        forallElim(`∀ (z : obj), ${rel} x₀ y₀ ∧ ${rel} y₀ z → ${rel} x₀ z`, 'z₀'), backward(`${rel} x₀ y₀ ∧ ${rel} y₀ z₀ → ${rel} x₀ z₀`), andIntro([close], [close])]))],
            }],
            [{
                label: 'פתרון',
                steps: [subsetIntro, unfold('x₀ ∈ (A \\ C) ∩ B'), andElim('x₀ ∈ A \\ C ∧ x₀ ∈ B'), unfold('x₀ ∈ A \\ C'), andElim('x₀ ∈ A ∧ ¬x₀ ∈ C'),
                    unfold('x₀ ∈ B \\ C'), andIntro([close], [close])],
            }],
            [{
                label: 'פתרון',
                steps: [setEq(
                    [subsetIntro, unfold('x₀ ∈ A \\ (B \\ C)'), andElim('x₀ ∈ A ∧ ¬x₀ ∈ B \\ C'), unfold('x₀ ∈ (A \\ B) ∪ (A ∩ C)'),
                        claim('x₀ ∈ C ∨ ¬x₀ ∈ C', [byContradiction, notElim('¬(x₀ ∈ C ∨ ¬x₀ ∈ C)'), orIntro('RIGHT'), notIntro, notElim('¬(x₀ ∈ C ∨ ¬x₀ ∈ C)'), orIntro('LEFT'), close]),
                        orCases('x₀ ∈ C ∨ ¬x₀ ∈ C',
                            [orIntro('RIGHT'), unfold('x₀ ∈ A ∩ C'), andIntro([close], [close])],
                            [orIntro('LEFT'), unfold('x₀ ∈ A \\ B'), andIntro([close], [notIntro, notElim('¬x₀ ∈ B \\ C'), unfold('x₀ ∈ B \\ C'), andIntro([close], [close])])])],
                    [subsetIntro, unfold('x₀ ∈ (A \\ B) ∪ (A ∩ C)'), unfold('x₀ ∈ A \\ (B \\ C)'), orCases('x₀ ∈ A \\ B ∨ x₀ ∈ A ∩ C',
                        [unfold('x₀ ∈ A \\ B'), andElim('x₀ ∈ A ∧ ¬x₀ ∈ B'), andIntro([close], [notIntro, unfold('x₀ ∈ B \\ C'), andElim('x₀ ∈ B ∧ ¬x₀ ∈ C'), contradiction('x₀ ∈ B')])],
                        [unfold('x₀ ∈ A ∩ C'), andElim('x₀ ∈ A ∧ x₀ ∈ C'), andIntro([close], [notIntro, unfold('x₀ ∈ B \\ C'), andElim('x₀ ∈ B ∧ ¬x₀ ∈ C'), contradiction('x₀ ∈ C')])])])],
            }],
            [{
                label: 'פתרון',
                steps: [iffIntro(
                    [assume, setEq(
                        [subsetIntro, unfold('x₀ ∈ (A ∪ B) \\ B'), andElim('x₀ ∈ A ∪ B ∧ ¬x₀ ∈ B'), unfold('x₀ ∈ A ∪ B'), orCases('x₀ ∈ A ∨ x₀ ∈ B', [close], [exfalso, contradiction('x₀ ∈ B')])],
                        [subsetIntro, unfold('x₀ ∈ (A ∪ B) \\ B'), andIntro(
                            [unfold('x₀ ∈ A ∪ B'), orIntro('LEFT'), close],
                            [notIntro, claim('x₀ ∈ A ∩ B', [unfold('x₀ ∈ A ∩ B'), andIntro([close], [close])]), rewrite('A ∩ B = ∅', 'FORWARD', 'x₀ ∈ A ∩ B'), unfold('x₀ ∈ ∅'), close])])],
                    [assume, setEq(
                        [subsetIntro, unfold('x₀ ∈ A ∩ B'), andElim('x₀ ∈ A ∧ x₀ ∈ B'), rewrite('(A ∪ B) \\ B = A', 'BACKWARD', 'x₀ ∈ A'), unfold('x₀ ∈ (A ∪ B) \\ B'),
                            andElim('x₀ ∈ A ∪ B ∧ ¬x₀ ∈ B'), exfalso, contradiction('x₀ ∈ B')],
                        [subsetIntro, unfold('x₀ ∈ ∅'), exfalso, close])])],
            }],
            [{
                label: 'פתרון',
                steps: [assume, forallElim('∀ (X : Set obj), A ∩ X = A', '∅'), setEq(
                    [subsetIntro, rewrite('A ∩ ∅ = A', 'BACKWARD', 'x₀ ∈ A'), unfold('x₀ ∈ A ∩ ∅'), andElim('x₀ ∈ A ∧ x₀ ∈ ∅'), close],
                    [subsetIntro, unfold('x₀ ∈ ∅'), exfalso, close])],
            }],
            [{
                label: 'פתרון',
                steps: [existsIntro('E \\ A'), andIntro(
                    [claim('∃ x, x ∈ E ∧ ¬x ∈ A', [byContradiction, notElim('¬E ⊆ A'), subsetIntro, byContradiction, notElim('¬∃ x, x ∈ E ∧ ¬x ∈ A'), existsIntro('x₀'), andIntro([close], [close])]),
                        existsElim('∃ x, x ∈ E ∧ ¬x ∈ A'), andElim('x₀ ∈ E ∧ ¬x₀ ∈ A'), existsIntro('x₀'), unfold('x₀ ∈ (E \\ A) ∩ E'),
                        andIntro([unfold('x₀ ∈ E \\ A'), andIntro([close], [close])], [close])],
                    [setEq(
                        [subsetIntro, unfold('x₀ ∈ A ∩ (E \\ A)'), andElim('x₀ ∈ A ∧ x₀ ∈ E \\ A'), unfold('x₀ ∈ E \\ A'), andElim('x₀ ∈ E ∧ ¬x₀ ∈ A'), exfalso, contradiction('x₀ ∈ A')],
                        [subsetIntro, unfold('x₀ ∈ ∅'), exfalso, close])])],
            }],
            [{
                label: 'פתרון',
                steps: [subsetIntro, unfold('x₀ ∈ (A ∪ B) \\ (A ∩ B)'), andElim('x₀ ∈ A ∪ B ∧ ¬x₀ ∈ A ∩ B'), unfold('x₀ ∈ A ∪ B'), unfold('x₀ ∈ A ∆ B'),
                    orCases('x₀ ∈ A ∨ x₀ ∈ B', ...[['LEFT', 'A \\ B'], ['RIGHT', 'B \\ A']].map(([side, diff]) => [orIntro(side), unfold(`x₀ ∈ ${diff}`),
                        andIntro([close], [notIntro, notElim('¬x₀ ∈ A ∩ B'), unfold('x₀ ∈ A ∩ B'), andIntro([close], [close])])]))],
            }],
            [{
                label: 'פתרון',
                steps: [setEq(
                    [subsetIntro, unfold('X₀ ∈ 𝒫 (A ∩ B)'), unfold('X₀ ∈ 𝒫 A ∩ 𝒫 B'), andIntro(...['A', 'B'].map((set) => [unfold(`X₀ ∈ 𝒫 ${set}`), subsetIntro,
                        subsetElim('X₀ ⊆ A ∩ B', 'x₀ ∈ X₀'), unfold('x₀ ∈ A ∩ B'), andElim('x₀ ∈ A ∧ x₀ ∈ B'), close]))],
                    [subsetIntro, unfold('X₀ ∈ 𝒫 A ∩ 𝒫 B'), andElim('X₀ ∈ 𝒫 A ∧ X₀ ∈ 𝒫 B'), unfold('X₀ ∈ 𝒫 A'), unfold('X₀ ∈ 𝒫 B'), unfold('X₀ ∈ 𝒫 (A ∩ B)'), subsetIntro,
                        unfold('x₀ ∈ A ∩ B'), andIntro([subsetElim('X₀ ⊆ A', 'x₀ ∈ X₀'), close], [subsetElim('X₀ ⊆ B', 'x₀ ∈ X₀'), close])])],
            }],
            [{
                label: 'פתרון',
                steps: [iffIntro(
                    [assume, subsetIntro, unfold('x₀ ∈ ⋃ F'), existsElim('∃ S, S ∈ F ∧ x₀ ∈ S'), andElim('S₀ ∈ F ∧ x₀ ∈ S₀'), subsetElim('F ⊆ 𝒫 A', 'S₀ ∈ F'),
                        unfold('S₀ ∈ 𝒫 A'), subsetElim('S₀ ⊆ A', 'x₀ ∈ S₀'), close],
                    [assume, subsetIntro, unfold('X₀ ∈ 𝒫 A'), subsetIntro, claim('x₀ ∈ ⋃ F', [unfold('x₀ ∈ ⋃ F'), existsIntro('X₀'), andIntro([close], [close])]),
                        subsetElim('⋃ F ⊆ A', 'x₀ ∈ ⋃ F'), close])],
            }],
            [{
                label: 'פתרון',
                steps: [setEq(
                    [subsetIntro, unfold('x₀ ∈ ⋃ (𝒫 A)'), existsElim('∃ S, S ∈ 𝒫 A ∧ x₀ ∈ S'), andElim('S₀ ∈ 𝒫 A ∧ x₀ ∈ S₀'), unfold('S₀ ∈ 𝒫 A'), subsetElim('S₀ ⊆ A', 'x₀ ∈ S₀'), close],
                    [subsetIntro, unfold('x₀ ∈ ⋃ (𝒫 A)'), existsIntro('A'), andIntro([unfold('A ∈ 𝒫 A'), subsetIntro, close], [close])])],
            }],
            [{
                label: 'פתרון',
                steps: [assume, subsetIntro, unfold('x₀ ∈ ⋃ F'), existsElim('∃ S, S ∈ F ∧ x₀ ∈ S'), andElim('S₀ ∈ F ∧ x₀ ∈ S₀'),
                    forallElim('∀ (T : Set obj), T ∈ F → ∃ X, X ∈ G ∧ T ⊆ X', 'S₀'), forward('S₀ ∈ F → ∃ X, X ∈ G ∧ S₀ ⊆ X', 'S₀ ∈ F'),
                    existsElim('∃ X, X ∈ G ∧ S₀ ⊆ X'), andElim('X₀ ∈ G ∧ S₀ ⊆ X₀'), subsetElim('S₀ ⊆ X₀', 'x₀ ∈ S₀'), unfold('x₀ ∈ ⋃ G'), existsIntro('X₀'), andIntro([close], [close])],
            }],
            [{
                label: 'פתרון',
                steps: [claim('∀ k, 2 * sumTo k = k * (k + 1)', [forallIntro, induction('k₀', [unfoldFunction('sumTo'), rfl], [unfoldFunction('sumTo'), algebraHyps('2 * sumTo k₀ = k₀ * (k₀ + 1)')])]),
                    induction('n', [unfoldFunction('sumCubes'), unfoldFunction('sumTo'), rfl], [unfoldPart('sumCubes', 'sumCubes (n + 1)'), unfoldPart('sumTo', 'sumTo (n + 1)'),
                        forallElim('∀ (k : Nat), 2 * sumTo k = k * (k + 1)', 'n'), algebraHyps('sumCubes n = sumTo n ^ 2', '2 * sumTo n = n * (n + 1)')])],
            }],
            [{
                label: 'פתרון',
                steps: [induction('n', [calc], [forallElim('∀ (m k : Nat), m ≤ k ↔ f m ≤ f k', 'n + 1'), forallElim('∀ (k : Nat), n + 1 ≤ k ↔ f (n + 1) ≤ f k', 'n'),
                    calcHyps('n ≤ f n', 'n + 1 ≤ n ↔ f (n + 1) ≤ f n')])],
            }],
            [{
                label: 'פתרון',
                steps: [subsetIntro, unfold('x₀ ∈ ⋂ F ∪ ⋂ G'), byContradiction, replace('easylean_not_or', 'FORWARD', '¬(x₀ ∈ ⋂ F ∨ x₀ ∈ ⋂ G)'), andElim('¬x₀ ∈ ⋂ F ∧ ¬x₀ ∈ ⋂ G'),
                    ...[['F', 'X'], ['G', 'Y']].map(([family, set]) => claim(`∃ ${set}, ${set} ∈ ${family} ∧ ¬x₀ ∈ ${set}`, [byContradiction, notElim(`¬x₀ ∈ ⋂ ${family}`), unfold(`x₀ ∈ ⋂ ${family}`),
                        forallIntro, assume, byContradiction, notElim(`¬∃ ${set}, ${set} ∈ ${family} ∧ ¬x₀ ∈ ${set}`), existsIntro('S₀'), andIntro([close], [close])])),
                    existsElim('∃ X, X ∈ F ∧ ¬x₀ ∈ X'), andElim('X₀ ∈ F ∧ ¬x₀ ∈ X₀'), existsElim('∃ Y, Y ∈ G ∧ ¬x₀ ∈ Y'), andElim('Y₀ ∈ G ∧ ¬x₀ ∈ Y₀'),
                    forallElim('∀ (X : Set obj), X ∈ F → ∀ (Y : Set obj), Y ∈ G → X ∪ Y ∈ H', 'X₀'), forward('X₀ ∈ F → ∀ (Y : Set obj), Y ∈ G → X₀ ∪ Y ∈ H', 'X₀ ∈ F'),
                    forallElim('∀ (Y : Set obj), Y ∈ G → X₀ ∪ Y ∈ H', 'Y₀'), forward('Y₀ ∈ G → X₀ ∪ Y₀ ∈ H', 'Y₀ ∈ G'),
                    unfold('x₀ ∈ ⋂ H'), forallElim('∀ (S : Set obj), S ∈ H → x₀ ∈ S', 'X₀ ∪ Y₀'), forward('X₀ ∪ Y₀ ∈ H → x₀ ∈ X₀ ∪ Y₀', 'X₀ ∪ Y₀ ∈ H'),
                    unfold('x₀ ∈ X₀ ∪ Y₀'), orCases('x₀ ∈ X₀ ∨ x₀ ∈ Y₀', [contradiction('x₀ ∈ X₀')], [contradiction('x₀ ∈ Y₀')])],
            }],
        ],
    },
];
