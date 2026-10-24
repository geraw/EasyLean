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
// Unit 7: the lecture's strategies.
const mt = (rule, negation) => ['modus_tollens', { RULE: rule, NEGATION: negation }];
const contrapositive = ['contrapositive'];
const orByNegation = ['or_by_negation'];
const emCases = (statement, left, right) => ['em_cases', { STATEMENT: statement }, { LEFT: left, RIGHT: right }];
const replace = (law, direction, target = '__goal__') => ['replace', { LAW: law, DIRECTION: direction, TARGET: target }];
const iffIntro = (forwardPart, backwardPart) => ['iff_intro', {}, { FORWARD: forwardPart, BACKWARD: backwardPart }];
// Lesson 2: sets.
const subsetIntro = ['subset_intro'];
const subsetElim = (subset, member) => ['subset_elim', { SUBSET: subset, MEMBER: member }];
const setEq = (first, second) => ['set_eq', {}, { FIRST: first, SECOND: second }];
const unfold = (statement) => ['unfold', { STATEMENT: statement }];
const claim = (statement, proof) => ['claim', { CLAIM: statement }, { PROOF: proof }];

// Unit 3: "Q ∧ P" from the assumption "P ∧ Q", in two parts or forward.
const swapAnd = (and) => [assume, andElim(and), andIntro([close], [close])];
const swapAndForward = (and, left, right) => [assume, andElim(and), combine(left, right), close];

const COURSE = [
    {
        unit: 2,
        world: 'יחידה 2 - מהנחה למסקנה',
        levels: [
            [{ label: 'פתרון', steps: [close] }],
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
        unit: 3,
        world: 'יחידה 3 - וגם, או, אם ורק אם',
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
        unit: 4,
        world: 'יחידה 4 - שלילה והוכחה בשלילה',
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
            [{ label: 'כמו בהרצאה', steps: [orByNegation, close] }],
            [{ label: 'פתרון', steps: [assume, orByNegation, backward('P → Q'), byContradiction, notElim('¬¬P'), close] }],
        ],
    },
    {
        unit: 5,
        world: 'יחידה 5 - כמתים',
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
        unit: 6,
        world: 'יחידה 6 - שקילויות לוגיות',
        levels: [
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
                steps: [assume, replace('easylean_not_forall', 'FORWARD', '¬∀ x, P x → Q x'), replace('easylean_not_imp', 'FORWARD', '∃ x, ¬(P x → Q x)'), close],
            }],
            [{
                label: 'פתרון',
                steps: [assume, replace('easylean_not_imp', 'FORWARD', '¬(P ∧ Q → R ∨ ¬S)'), replace('easylean_not_or', 'FORWARD', '(P ∧ Q) ∧ ¬(R ∨ ¬S)'),
                    replace('easylean_not_not', 'FORWARD', '(P ∧ Q) ∧ ¬R ∧ ¬¬S'), close],
            }],
            [{
                label: 'פתרון',
                steps: [assume, replace('easylean_not_forall', 'FORWARD', '¬∀ x, ∃ y, R x y ∧ Q y'), replace('easylean_not_exists', 'FORWARD', '∃ x, ¬∃ y, R x y ∧ Q y'),
                    replace('easylean_not_and', 'FORWARD', '∃ x, ∀ y, ¬(R x y ∧ Q y)'), close],
            }],
            [{
                label: 'פתרון',
                steps: [replace('easylean_or_as_imp', 'BACKWARD'), assume, forward('¬P → R', '¬P'), forward('R → Q', 'R'), close],
            }],
            [{
                label: 'פתרון',
                steps: [replace('easylean_or_as_imp', 'BACKWARD'), assume, replace('easylean_not_not', 'FORWARD', '¬¬P'), forward('P → Q', 'P'), close],
            }],
            [
                {
                    label: 'כמו בהרצאה',
                    steps: [assume, replace('easylean_or_as_imp', 'BACKWARD'), assume, replace('easylean_not_not', 'FORWARD', '¬¬P'), notIntro, notElim('¬(P ∧ Q)'), andIntro([close], [close])],
                },
                {
                    label: 'גרירה כ"או"',
                    steps: [assume, replace('easylean_imp_or', 'BACKWARD'), assume, notIntro, notElim('¬(P ∧ Q)'), andIntro([close], [close])],
                },
            ],
        ],
    },
    {
        unit: 7,
        world: 'יחידה 7 - מבני הוכחה',
        levels: [
            [{
                label: 'פתרון',
                steps: [assume, andIntro(
                    [forallIntro, forallElim('∀ x, P x ∧ Q x', 'x₀'), andElim('P x₀ ∧ Q x₀'), close],
                    [forallIntro, forallElim('∀ x, P x ∧ Q x', 'x₀'), andElim('P x₀ ∧ Q x₀'), close])],
            }],
            [{ label: 'פתרון', steps: [mt('P → Q', '¬Q'), close] }],
            [{ label: 'פתרון', steps: [contrapositive, forward('¬R → ¬Q', '¬R'), forward('¬Q → ¬P', '¬Q'), close] }],
            [
                { label: 'ישירה', steps: [forallIntro, forallElim('∀ x, (P x → R x) ∧ (R x → Q x)', 'x₀'), andElim('(P x₀ → R x₀) ∧ (R x₀ → Q x₀)'), assume, forward('P x₀ → R x₀', 'P x₀'), forward('R x₀ → Q x₀', 'R x₀'), close] },
                { label: 'קונטרפוזיציה', steps: [forallIntro, forallElim('∀ x, (P x → R x) ∧ (R x → Q x)', 'x₀'), andElim('(P x₀ → R x₀) ∧ (R x₀ → Q x₀)'), contrapositive, mt('R x₀ → Q x₀', '¬Q x₀'), mt('P x₀ → R x₀', '¬R x₀'), close] },
                { label: 'בשלילה', steps: [forallIntro, forallElim('∀ x, (P x → R x) ∧ (R x → Q x)', 'x₀'), andElim('(P x₀ → R x₀) ∧ (R x₀ → Q x₀)'), assume, byContradiction, forward('P x₀ → R x₀', 'P x₀'), forward('R x₀ → Q x₀', 'R x₀'), contradiction('Q x₀')] },
            ],
            [{
                label: 'פתרון',
                steps: [notIntro, existsElim('∃ b, ∀ (y : obj), Shaves b y ↔ ¬Shaves y y'), forallElim('∀ (y : obj), Shaves b₀ y ↔ ¬Shaves y y', 'b₀'), iffElim('Shaves b₀ b₀ ↔ ¬Shaves b₀ b₀'),
                    emCases('Shaves b₀ b₀', [forward('Shaves b₀ b₀ → ¬Shaves b₀ b₀', 'Shaves b₀ b₀'), contradiction('Shaves b₀ b₀')], [forward('¬Shaves b₀ b₀ → Shaves b₀ b₀', '¬Shaves b₀ b₀'), contradiction('Shaves b₀ b₀')])],
            }],
            [{
                label: 'פתרון',
                steps: [forallIntro, assume, andIntro(
                    [forallElim('∀ x, Penguin x → Bird x', 'x₀'), forward('Penguin x₀ → Bird x₀', 'Penguin x₀'), close],
                    [forallElim('∀ x, Penguin x → Swims x', 'x₀'), forward('Penguin x₀ → Swims x₀', 'Penguin x₀'), close])],
            }],
            [{
                label: 'פתרון',
                steps: [assume, orByNegation, replace('easylean_not_forall', 'FORWARD', '¬∀ x, Quiz x'), existsElim('∃ x, ¬Quiz x'), forallElim('∀ x, Quiz x ∨ Project x', 'x₀'),
                    orCases('Quiz x₀ ∨ Project x₀', [exfalso, contradiction('Quiz x₀')], [existsIntro('x₀'), close])],
            }],
            [{ label: 'פתרון', steps: [assume, forallIntro, assume, forallElim('∀ x, Locked x', 'x₀'), close] }],
            [{ label: 'פתרון', steps: [assume, forallIntro, existsIntro('x₀'), forallElim('∀ x, Friend x x', 'x₀'), close] }],
            [{ label: 'פתרון', steps: [assume, existsElim('∃ x, ∀ y, Knows x y'), forallIntro, existsIntro('x₀'), forallElim('∀ y, Knows x₀ y', 'y₀'), close] }],
            [{ label: 'פתרון', steps: [forallIntro, assume, forallElim('∀ y, Trusts x₀ y', 'x₀'), close] }],
            [{
                label: 'פתרון',
                steps: [forallIntro, emCases('Rain d₀',
                    [forallElim('∀ d, Rain d → Bus d', 'd₀'), forward('Rain d₀ → Bus d₀', 'Rain d₀'), orIntro('LEFT'), close],
                    [forallElim('∀ d, ¬Rain d → Bike d', 'd₀'), forward('¬Rain d₀ → Bike d₀', '¬Rain d₀'), orIntro('RIGHT'), close])],
            }],
        ],
    },
    {
        unit: 8,
        world: 'יחידה 8 - קבוצות והכלה',
        levels: [
            [{ label: 'פתרון', steps: [subsetIntro, close] }],
            [{ label: 'פתרון', steps: [subsetElim('A ⊆ B', 'x ∈ A'), close] }],
            [{ label: 'פתרון', steps: [assume, andElim('A ⊆ B ∧ B ⊆ C'), subsetIntro, subsetElim('A ⊆ B', 'x ∈ A'), subsetElim('B ⊆ C', 'x ∈ B'), close] }],
            [{
                label: 'פתרון',
                steps: [assume, byContradiction, notElim('¬A ⊆ B'), subsetIntro, byContradiction, notElim('¬∃ x, x ∈ A ∧ ¬x ∈ B'), existsIntro('x₀'), andIntro([close], [close])],
            }],
            [{ label: 'פתרון', steps: [assume, andElim('A ⊆ B ∧ B ⊆ A'), setEq([close], [close])] }],
            [{ label: 'פתרון', steps: [subsetIntro, unfold('x ∈ ∅'), exfalso, close] }],
        ],
    },
    {
        unit: 9,
        world: 'יחידה 9 - פעולות על קבוצות',
        levels: [
            [{ label: 'פתרון', steps: [subsetIntro, unfold('x ∈ A ∪ B'), orIntro('LEFT'), close] }],
            [{ label: 'פתרון', steps: [subsetIntro, unfold('x ∈ A ∩ B'), andElim('x ∈ A ∧ x ∈ B'), close] }],
            [{
                label: 'פתרון',
                steps: [iffIntro(
                    [assume, andIntro(
                        [subsetIntro, subsetElim('X ⊆ A ∩ B', 'x ∈ X'), unfold('x ∈ A ∩ B'), andElim('x ∈ A ∧ x ∈ B'), close],
                        [subsetIntro, subsetElim('X ⊆ A ∩ B', 'x ∈ X'), unfold('x ∈ A ∩ B'), andElim('x ∈ A ∧ x ∈ B'), close])],
                    [assume, andElim('X ⊆ A ∧ X ⊆ B'), subsetIntro, unfold('x ∈ A ∩ B'), andIntro(
                        [subsetElim('X ⊆ A', 'x ∈ X'), close],
                        [subsetElim('X ⊆ B', 'x ∈ X'), close])])],
            }],
            [
                {
                    label: 'בשני חלקים',
                    steps: [setEq(
                        [subsetIntro, unfold('x ∈ A ∩ B'), andElim('x ∈ A ∧ x ∈ B'), unfold('x ∈ B ∩ A'), andIntro([close], [close])],
                        [subsetIntro, unfold('x ∈ B ∩ A'), andElim('x ∈ B ∧ x ∈ A'), unfold('x ∈ A ∩ B'), andIntro([close], [close])])],
                },
                {
                    label: 'קדימה',
                    steps: [setEq(
                        [subsetIntro, unfold('x ∈ A ∩ B'), andElim('x ∈ A ∧ x ∈ B'), unfold('x ∈ B ∩ A'), combine('x ∈ B', 'x ∈ A'), close],
                        [subsetIntro, unfold('x ∈ B ∩ A'), andElim('x ∈ B ∧ x ∈ A'), unfold('x ∈ A ∩ B'), combine('x ∈ A', 'x ∈ B'), close])],
                },
            ],
            [{
                label: 'פתרון',
                steps: [subsetIntro, unfold('x ∈ A ∩ (B ∪ C)'), andElim('x ∈ A ∧ x ∈ B ∪ C'), unfold('x ∈ B ∪ C'), unfold('x ∈ A ∩ B ∪ A ∩ C'),
                    orCases('x ∈ B ∨ x ∈ C',
                        [orIntro('LEFT'), unfold('x ∈ A ∩ B'), andIntro([close], [close])],
                        [orIntro('RIGHT'), unfold('x ∈ A ∩ C'), andIntro([close], [close])])],
            }],
            [{
                label: 'פתרון',
                steps: [assume, setEq(
                    [subsetIntro, unfold('x ∈ A \\ B'), andElim('x ∈ A ∧ ¬x ∈ B'), exfalso, subsetElim('A ⊆ B', 'x ∈ A'), contradiction('x ∈ B')],
                    [subsetIntro, unfold('x ∈ ∅'), exfalso, close])],
            }],
            [{
                label: 'פתרון',
                steps: [subsetIntro, unfold('x ∈ A \\ C'), andElim('x ∈ A ∧ ¬x ∈ C'), unfold('x ∈ A \\ B ∪ B \\ C'), emCases('x ∈ B',
                    [orIntro('RIGHT'), unfold('x ∈ B \\ C'), andIntro([close], [close])],
                    [orIntro('LEFT'), unfold('x ∈ A \\ B'), andIntro([close], [close])])],
            }],
            [{
                label: 'פתרון',
                steps: [setEq(
                    [subsetIntro, unfold('x ∈ A ∆ B'), unfold('x ∈ A \\ B ∪ B \\ A'), orCases('x ∈ A ∧ ¬x ∈ B ∨ ¬x ∈ A ∧ x ∈ B',
                        [orIntro('LEFT'), unfold('x ∈ A \\ B'), close],
                        [andElim('¬x ∈ A ∧ x ∈ B'), orIntro('RIGHT'), unfold('x ∈ B \\ A'), combine('x ∈ B', '¬x ∈ A'), close])],
                    [subsetIntro, unfold('x ∈ A \\ B ∪ B \\ A'), unfold('x ∈ A ∆ B'), orCases('x ∈ A \\ B ∨ x ∈ B \\ A',
                        [unfold('x ∈ A \\ B'), orIntro('LEFT'), close],
                        [unfold('x ∈ B \\ A'), andElim('x ∈ B ∧ ¬x ∈ A'), orIntro('RIGHT'), combine('¬x ∈ A', 'x ∈ B'), close])])],
            }],
            [{
                label: 'פתרון',
                steps: [setEq(
                    [subsetIntro, unfold('x ∈ A \\ (B ∩ C)'), andElim('x ∈ A ∧ ¬x ∈ B ∩ C'), unfold('x ∈ A \\ B ∪ A \\ C'), emCases('x ∈ B',
                        [orIntro('RIGHT'), unfold('x ∈ A \\ C'), andIntro([close], [notIntro, notElim('¬x ∈ B ∩ C'), unfold('x ∈ B ∩ C'), andIntro([close], [close])])],
                        [orIntro('LEFT'), unfold('x ∈ A \\ B'), andIntro([close], [close])])],
                    [subsetIntro, unfold('x ∈ A \\ B ∪ A \\ C'), unfold('x ∈ A \\ (B ∩ C)'), orCases('x ∈ A \\ B ∨ x ∈ A \\ C',
                        [unfold('x ∈ A \\ B'), andElim('x ∈ A ∧ ¬x ∈ B'), andIntro([close], [notIntro, unfold('x ∈ B ∩ C'), andElim('x ∈ B ∧ x ∈ C'), contradiction('x ∈ B')])],
                        [unfold('x ∈ A \\ C'), andElim('x ∈ A ∧ ¬x ∈ C'), andIntro([close], [notIntro, unfold('x ∈ B ∩ C'), andElim('x ∈ B ∧ x ∈ C'), contradiction('x ∈ C')])])])],
            }],
        ],
    },
    {
        unit: 10,
        world: 'יחידה 10 - קבוצת החזקה ופעולות אונריות',
        levels: [
            [{ label: 'פתרון', steps: [unfold('A ∈ 𝒫 A'), subsetIntro, close] }],
            [{ label: 'פתרון', steps: [unfold('∅ ∈ 𝒫 A'), subsetIntro, unfold('x ∈ ∅'), exfalso, close] }],
            [{
                label: 'פתרון',
                steps: [assume, subsetIntro, unfold('X ∈ 𝒫 A'), unfold('X ∈ 𝒫 B'), subsetIntro, subsetElim('X ⊆ A', 'x ∈ X'), subsetElim('A ⊆ B', 'x ∈ A'), close],
            }],
            [{
                label: 'פתרון',
                steps: [assume, claim('A ∈ 𝒫 A', [unfold('A ∈ 𝒫 A'), subsetIntro, close]), subsetElim('𝒫 A ⊆ 𝒫 B', 'A ∈ 𝒫 A'), unfold('A ∈ 𝒫 B'), close],
            }],
            [{
                label: 'פתרון',
                steps: [setEq(
                    [subsetIntro, unfold('X ∈ 𝒫 (A ∩ B)'), unfold('X ∈ 𝒫 A ∩ 𝒫 B'), andIntro(
                        [unfold('X ∈ 𝒫 A'), subsetIntro, subsetElim('X ⊆ A ∩ B', 'x ∈ X'), unfold('x ∈ A ∩ B'), andElim('x ∈ A ∧ x ∈ B'), close],
                        [unfold('X ∈ 𝒫 B'), subsetIntro, subsetElim('X ⊆ A ∩ B', 'x ∈ X'), unfold('x ∈ A ∩ B'), andElim('x ∈ A ∧ x ∈ B'), close])],
                    [subsetIntro, unfold('X ∈ 𝒫 A ∩ 𝒫 B'), andElim('X ∈ 𝒫 A ∧ X ∈ 𝒫 B'), unfold('X ∈ 𝒫 A'), unfold('X ∈ 𝒫 B'), unfold('X ∈ 𝒫 (A ∩ B)'),
                        subsetIntro, unfold('x ∈ A ∩ B'), andIntro([subsetElim('X ⊆ A', 'x ∈ X'), close], [subsetElim('X ⊆ B', 'x ∈ X'), close])])],
            }],
            [{
                label: 'פתרון',
                steps: [subsetIntro, unfold('X ∈ 𝒫 A ∪ 𝒫 B'), unfold('X ∈ 𝒫 (A ∪ B)'), orCases('X ∈ 𝒫 A ∨ X ∈ 𝒫 B',
                    [unfold('X ∈ 𝒫 A'), subsetIntro, subsetElim('X ⊆ A', 'x ∈ X'), unfold('x ∈ A ∪ B'), orIntro('LEFT'), close],
                    [unfold('X ∈ 𝒫 B'), subsetIntro, subsetElim('X ⊆ B', 'x ∈ X'), unfold('x ∈ A ∪ B'), orIntro('RIGHT'), close])],
            }],
            [
                { label: 'קדימה', steps: [subsetIntro, unfold('x ∈ ⋂ X'), forallElim('∀ (S : Set obj), S ∈ X → x ∈ S', 'A'), forward('A ∈ X → x ∈ A', 'A ∈ X'), close] },
                { label: 'אחורה', steps: [subsetIntro, unfold('x ∈ ⋂ X'), forallElim('∀ (S : Set obj), S ∈ X → x ∈ S', 'A'), backward('A ∈ X → x ∈ A'), close] },
            ],
            [{ label: 'פתרון', steps: [subsetIntro, unfold('x ∈ ⋃ X'), existsIntro('A'), andIntro([close], [close])] }],
            [{
                label: 'פתרון',
                steps: [setEq(
                    [subsetIntro, unfold('x ∈ ⋃ (𝒫 A)'), existsElim('∃ S, S ∈ 𝒫 A ∧ x ∈ S'), andElim('S₀ ∈ 𝒫 A ∧ x ∈ S₀'), unfold('S₀ ∈ 𝒫 A'), subsetElim('S₀ ⊆ A', 'x ∈ S₀'), close],
                    [subsetIntro, unfold('x ∈ ⋃ (𝒫 A)'), existsIntro('A'), andIntro([unfold('A ∈ 𝒫 A'), subsetIntro, close], [close])])],
            }],
        ],
    },
];

// The lecture proves an "or" by assuming the negation of one side and proving
// the other. Every level that proves one by choosing a side can also be solved
// so: the negation of the other side assumed, and not needed.
const asLecture = (steps) => steps.map(([type, fields = {}, parts = {}]) => [
    type === 'or_intro' ? 'or_by_negation' : type,
    type === 'or_intro' ? { SIDE: fields.SIDE === 'LEFT' ? 'RIGHT' : 'LEFT' } : fields,
    Object.fromEntries(Object.entries(parts).map(([part, partSteps]) => [part, asLecture(partSteps)])),
]);
const choosesSide = (steps) => steps.some(([type, , parts = {}]) => type === 'or_intro' || Object.values(parts).some(choosesSide));

export const UNITS = COURSE.map((unit) => ({
    ...unit,
    levels: unit.levels.map((solutions) => (solutions.some(({ label }) => label === 'כמו בהרצאה') || !solutions.some(({ steps }) => choosesSide(steps))
        ? solutions
        : [...solutions, { label: 'כמו בהרצאה', steps: asLecture(solutions.find(({ steps }) => choosesSide(steps)).steps) }])),
}));

// The solutions of a unit, by its number.
export const unitSolutions = (number) => UNITS.find(({ unit }) => unit === number);
