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
const algebra = ['algebra'];
const rewrite = (equation, direction, target = '__goal__') => ['rewrite', { EQUATION: equation, DIRECTION: direction, TARGET: target }];
const unfoldFunction = (name) => ['unfold_function', { FUNCTION: name }];
const induction = (variable, base, step) => ['induction', { VARIABLE: variable }, { BASE: base, STEP: step }];

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
        world: 'יחידה 5 - קבוצות',
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
            [{ label: 'פתרון', steps: [assume, subsetIntro, unfold('x₀ ∈ Bᶜ'), unfold('x₀ ∈ Aᶜ'), notIntro, subsetElim('A ⊆ B', 'x₀ ∈ A'), contradiction('x₀ ∈ B')] }],
            [{
                label: 'פתרון',
                steps: [subsetIntro, unfold('x₀ ∈ A \\ B'), andElim('x₀ ∈ A ∧ ¬x₀ ∈ B'), unfold('x₀ ∈ A ∩ Bᶜ'),
                    andIntro([close], [unfold('x₀ ∈ Bᶜ'), close])],
            }],
            [{ label: 'פתרון', steps: [subsetIntro, unfold('x₀ ∈ ∅'), exfalso, close] }],
            [{
                label: 'פתרון',
                steps: [setEq(
                    [subsetIntro, unfold('x₀ ∈ (A ∪ B)ᶜ'), unfold('x₀ ∈ Aᶜ ∩ Bᶜ'), andIntro(
                        [unfold('x₀ ∈ Aᶜ'), notIntro, notElim('¬x₀ ∈ A ∪ B'), unfold('x₀ ∈ A ∪ B'), orIntro('LEFT'), close],
                        [unfold('x₀ ∈ Bᶜ'), notIntro, notElim('¬x₀ ∈ A ∪ B'), unfold('x₀ ∈ A ∪ B'), orIntro('RIGHT'), close])],
                    [subsetIntro, unfold('x₀ ∈ Aᶜ ∩ Bᶜ'), andElim('x₀ ∈ Aᶜ ∧ x₀ ∈ Bᶜ'), unfold('x₀ ∈ Aᶜ'), unfold('x₀ ∈ Bᶜ'), unfold('x₀ ∈ (A ∪ B)ᶜ'), notIntro,
                        unfold('x₀ ∈ A ∪ B'), orCases('x₀ ∈ A ∨ x₀ ∈ B', [contradiction('x₀ ∈ A')], [contradiction('x₀ ∈ B')])])],
            }],
        ],
    },
    {
        unit: 6,
        world: 'יחידה 6 - קבוצות של קבוצות',
        levels: [
            [{ label: 'פתרון', steps: [unfold('A ∈ 𝒫 (A ∪ B)'), subsetIntro, unfold('x₀ ∈ A ∪ B'), orIntro('LEFT'), close] }],
            [{
                label: 'פתרון',
                steps: [assume, subsetIntro, unfold('X₀ ∈ 𝒫 A'), unfold('X₀ ∈ 𝒫 B'), subsetIntro, subsetElim('X₀ ⊆ A', 'x₀ ∈ X₀'), subsetElim('A ⊆ B', 'x₀ ∈ A'), close],
            }],
            [{ label: 'פתרון', steps: [unfold('∅ ∈ 𝒫 A'), subsetIntro, unfold('x₀ ∈ ∅'), exfalso, close] }],
            [{ label: 'פתרון', steps: [subsetIntro, unfold('x₀ ∈ ⋃₀ F'), existsIntro('A'), andIntro([close], [close])] }],
            [
                { label: 'קדימה', steps: [subsetIntro, unfold('x₀ ∈ ⋂₀ F'), forallElim('∀ (S : Set obj), S ∈ F → x₀ ∈ S', 'A'), forward('A ∈ F → x₀ ∈ A', 'A ∈ F'), close] },
                { label: 'אחורה', steps: [subsetIntro, unfold('x₀ ∈ ⋂₀ F'), forallElim('∀ (S : Set obj), S ∈ F → x₀ ∈ S', 'A'), backward('A ∈ F → x₀ ∈ A'), close] },
            ],
            [{
                label: 'פתרון',
                steps: [assume, subsetIntro, unfold('x₀ ∈ ⋃₀ F'), existsElim('∃ S, S ∈ F ∧ x₀ ∈ S'), andElim('S₀ ∈ F ∧ x₀ ∈ S₀'),
                    forallElim('∀ (S : Set obj), S ∈ F → S ⊆ A', 'S₀'), forward('S₀ ∈ F → S₀ ⊆ A', 'S₀ ∈ F'), subsetElim('S₀ ⊆ A', 'x₀ ∈ S₀'), close],
            }],
        ],
    },
    {
        unit: 7,
        world: 'יחידה 7 - שוויון ואינדוקציה',
        levels: [
            [{ label: 'פתרון', steps: [rfl] }],
            [{ label: 'פתרון', steps: [rewrite('y = x + 7', 'FORWARD'), rfl] }],
            [
                { label: 'בטענה שבידינו', steps: [rewrite('a = b', 'BACKWARD', 'P b'), close] },
                { label: 'במטרה', steps: [rewrite('a = b', 'FORWARD'), close] },
            ],
            [
                { label: 'a ב־b', steps: [rewrite('a = b', 'FORWARD'), close] },
                { label: 'c ב־b', steps: [rewrite('b = c', 'BACKWARD'), close] },
            ],
            [{ label: 'פתרון', steps: [induction('n', [unfoldFunction('double'), rfl], [unfoldFunction('double'), rewrite('double n = n + n', 'FORWARD'), calc])] }],
            [{ label: 'פתרון', steps: [induction('n', [rfl], [unfoldFunction('add'), rewrite('0 + n = n', 'FORWARD'), rfl])] }],
            [{ label: 'פתרון', steps: [assume, calc] }],
            [{ label: 'פתרון', steps: [induction('n', [calc], [unfoldFunction('pow'), calc])] }],
            [{ label: 'פתרון', steps: [induction('n', [unfoldFunction('sumTo'), rfl], [unfoldFunction('sumTo'), algebra])] }],
            [{
                label: 'פתרון',
                steps: [induction('n', [orIntro('LEFT'), existsIntro('0'), rfl], [orCases('(∃ j, n = 2 * j) ∨ ∃ j, n = 2 * j + 1',
                    [existsElim('∃ j, n = 2 * j'), orIntro('RIGHT'), existsIntro('j₀'), calc],
                    [existsElim('∃ j, n = 2 * j + 1'), orIntro('LEFT'), existsIntro('j₀ + 1'), calc])])],
            }],
            [{ label: 'פתרון', steps: [induction('n', [unfoldFunction('oddSum'), rfl], [unfoldFunction('oddSum'), rewrite('oddSum n = n * n', 'FORWARD'), algebra])] }],
        ],
    },
];
