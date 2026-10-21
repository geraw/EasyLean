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

// Unit 3: "Q ∧ P" from the assumption "P ∧ Q", in two parts or forward.
const swapAnd = (and) => [assume, andElim(and), andIntro([close], [close])];
const swapAndForward = (and, left, right) => [assume, andElim(and), combine(left, right), close];

export const UNITS = [
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
            [{
                label: 'פתרון',
                steps: [byContradiction, notElim('¬(P ∨ ¬P)'), orIntro('RIGHT'), notIntro, notElim('¬(P ∨ ¬P)'), orIntro('LEFT'), close],
            }],
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
            [{ label: 'פתרון', steps: [assume, forallIntro, forallElim('∀ x, P x ∧ Q x', 'x'), andElim('P x ∧ Q x'), close] }],
            [
                { label: 'קדימה', steps: [assume, assume, forallIntro, forallElim('∀ x, P x → Q x', 'x'), forallElim('∀ x, P x', 'x'), forward('P x → Q x', 'P x'), close] },
                { label: 'אחורה', steps: [assume, assume, forallIntro, forallElim('∀ x, P x → Q x', 'x'), backward('P x → Q x'), forallElim('∀ x, P x', 'x'), close] },
            ],
            [{ label: 'פתרון', steps: [existsIntro('a'), orIntro('LEFT'), close] }],
            [{ label: 'פתרון', steps: [assume, existsElim('∃ x, P x ∧ Q x'), andElim('P x ∧ Q x'), existsIntro('x'), close] }],
            [
                { label: 'קדימה', steps: [existsElim('∃ x, P x'), forallElim('∀ x, P x → Q x', 'x'), forward('P x → Q x', 'P x'), existsIntro('x'), close] },
                { label: 'אחורה', steps: [existsElim('∃ x, P x'), forallElim('∀ x, P x → Q x', 'x'), existsIntro('x'), backward('P x → Q x'), close] },
            ],
            [{ label: 'פתרון', steps: [assume, forallIntro, notIntro, notElim('¬∃ x, P x'), existsIntro('x'), close] }],
            [{ label: 'פתרון', steps: [assume, forallIntro, existsElim('∃ x, ∀ y, R x y'), forallElim('∀ y, R x y', 'y'), existsIntro('x'), close] }],
            [{
                label: 'פתרון',
                steps: [assume, byContradiction, notElim('¬∀ x, P x'), forallIntro, byContradiction, notElim('¬∃ x, ¬P x'), existsIntro('x'), close],
            }],
        ],
    },
    {
        unit: 6,
        world: 'יחידה 6 - שקילויות לוגיות',
        levels: [
            [{ label: 'פתרון', steps: [assume, notIntro, existsElim('∃ x, P x'), forallElim('∀ x, ¬P x', 'x'), contradiction('P x')] }],
            [{ label: 'פתרון', steps: [assume, notIntro, existsElim('∃ x, ¬P x'), forallElim('∀ x, P x', 'x'), contradiction('P x')] }],
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
                    [forallIntro, forallElim('∀ x, P x ∧ Q x', 'x'), andElim('P x ∧ Q x'), close],
                    [forallIntro, forallElim('∀ x, P x ∧ Q x', 'x'), andElim('P x ∧ Q x'), close])],
            }],
            [{ label: 'פתרון', steps: [mt('P → Q', '¬Q'), close] }],
            [{ label: 'פתרון', steps: [contrapositive, forward('¬R → ¬Q', '¬R'), forward('¬Q → ¬P', '¬Q'), close] }],
            [
                { label: 'ישירה', steps: [forallIntro, forallElim('∀ x, (P x → R x) ∧ (R x → Q x)', 'x'), andElim('(P x → R x) ∧ (R x → Q x)'), assume, forward('P x → R x', 'P x'), forward('R x → Q x', 'R x'), close] },
                { label: 'קונטרפוזיציה', steps: [forallIntro, forallElim('∀ x, (P x → R x) ∧ (R x → Q x)', 'x'), andElim('(P x → R x) ∧ (R x → Q x)'), contrapositive, mt('R x → Q x', '¬Q x'), mt('P x → R x', '¬R x'), close] },
                { label: 'בשלילה', steps: [forallIntro, forallElim('∀ x, (P x → R x) ∧ (R x → Q x)', 'x'), andElim('(P x → R x) ∧ (R x → Q x)'), assume, byContradiction, forward('P x → R x', 'P x'), forward('R x → Q x', 'R x'), contradiction('Q x')] },
            ],
            [{
                label: 'פתרון',
                steps: [notIntro, existsElim('∃ b, ∀ (y : obj), Shaves b y ↔ ¬Shaves y y'), forallElim('∀ (y : obj), Shaves b y ↔ ¬Shaves y y', 'b'), iffElim('Shaves b b ↔ ¬Shaves b b'),
                    emCases('Shaves b b', [forward('Shaves b b → ¬Shaves b b', 'Shaves b b'), contradiction('Shaves b b')], [forward('¬Shaves b b → Shaves b b', '¬Shaves b b'), contradiction('Shaves b b')])],
            }],
            [{
                label: 'פתרון',
                steps: [forallIntro, assume, andIntro(
                    [forallElim('∀ x, Penguin x → Bird x', 'x'), forward('Penguin x → Bird x', 'Penguin x'), close],
                    [forallElim('∀ x, Penguin x → Swims x', 'x'), forward('Penguin x → Swims x', 'Penguin x'), close])],
            }],
            [{
                label: 'פתרון',
                steps: [assume, orByNegation, replace('easylean_not_forall', 'FORWARD', '¬∀ x, Quiz x'), existsElim('∃ x, ¬Quiz x'), forallElim('∀ x, Quiz x ∨ Project x', 'x'),
                    orCases('Quiz x ∨ Project x', [exfalso, contradiction('Quiz x')], [existsIntro('x'), close])],
            }],
            [{ label: 'פתרון', steps: [assume, forallIntro, assume, forallElim('∀ x, Locked x', 'x'), close] }],
            [{ label: 'פתרון', steps: [assume, forallIntro, existsIntro('x'), forallElim('∀ x, Friend x x', 'x'), close] }],
            [{ label: 'פתרון', steps: [assume, existsElim('∃ x, ∀ y, Knows x y'), forallIntro, existsIntro('x'), forallElim('∀ y, Knows x y', 'y'), close] }],
            [{ label: 'פתרון', steps: [forallIntro, assume, forallElim('∀ y, Trusts x y', 'x'), close] }],
            [{
                label: 'פתרון',
                steps: [forallIntro, emCases('Rain d',
                    [forallElim('∀ d, Rain d → Bus d', 'd'), forward('Rain d → Bus d', 'Rain d'), orIntro('LEFT'), close],
                    [forallElim('∀ d, ¬Rain d → Bike d', 'd'), forward('¬Rain d → Bike d', '¬Rain d'), orIntro('RIGHT'), close])],
            }],
        ],
    },
];

// The solutions of a unit, by its number.
export const unitSolutions = (number) => UNITS.find(({ unit }) => unit === number);
