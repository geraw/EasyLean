// The intended solutions of the handwritten version (handwritten.html), like
// solutions.js for the course. An assumption is given by its statement, as
// the menu of a move offers it (Lean's spelling, e.g. P → Q).

const close = ['hw_exact'];
const assume = ['hw_assume'];
const backward = (rule) => ['hw_apply_rule', { RULE: rule }];
const forward = (rule, premise) => ['hw_forward', { RULE: rule, PREMISE: premise }];
const andElim = (and) => ['hw_and_elim', { AND: and }];
const andIntro = (left, right) => ['hw_and_intro', {}, { LEFT: left, RIGHT: right }];
const combine = (left, right) => ['hw_and_combine', { LEFT: left, RIGHT: right }];
const orIntro = (side) => ['hw_or_intro', { SIDE: side }];
const orCases = (or, left, right) => ['hw_or_elim', { OR: or }, { LEFT: left, RIGHT: right }];
const iffElim = (iff) => ['hw_iff_elim', { IFF: iff }];
const contradiction = (fact) => ['hw_contradiction', { FACT: fact }];
const notIntro = ['hw_not_intro'];
const notElim = (negation) => ['hw_not_elim', { NEGATION: negation }];
const exfalso = ['hw_exfalso'];
const byContradiction = ['hw_by_contradiction'];
const forallElim = (forall, term) => ['hw_forall_elim', { FORALL: forall, TERM: term }];
const forallIntro = ['hw_forall_intro'];
const existsIntro = (term) => ['hw_exists_intro', { TERM: term }];
const existsElim = (exists) => ['hw_exists_elim', { EXISTS: exists }];

// Unit 2: "Q ∧ P" from the assumption "P ∧ Q", in two parts or forward.
const swapAnd = (and) => [assume, andElim(and), andIntro([close], [close])];
const swapAndForward = (and, left, right) => [assume, andElim(and), combine(left, right), close];

export const HANDWRITTEN_UNITS = [
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
                { label: 'אחורה', steps: [['hw_iff_intro', {}, { FORWARD: swapAnd('P ∧ Q'), BACKWARD: swapAnd('Q ∧ P') }]] },
                { label: 'קדימה', steps: [['hw_iff_intro', {}, { FORWARD: swapAndForward('P ∧ Q', 'Q', 'P'), BACKWARD: swapAndForward('Q ∧ P', 'P', 'Q') }]] },
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
            [{ label: 'פתרון', steps: [forallElim('∀ x, P x → Q x', 'a'), forward('P a → Q a', 'P a'), close] }],
            [{ label: 'פתרון', steps: [assume, forallIntro, forallElim('∀ x, P x ∧ Q x', 'x'), andElim('P x ∧ Q x'), close] }],
            [{ label: 'פתרון', steps: [assume, assume, forallIntro, forallElim('∀ x, P x → Q x', 'x'), forallElim('∀ x, P x', 'x'), forward('P x → Q x', 'P x'), close] }],
            [{ label: 'פתרון', steps: [existsIntro('a'), orIntro('LEFT'), close] }],
            [{ label: 'פתרון', steps: [assume, existsElim('∃ x, P x ∧ Q x'), andElim('P x ∧ Q x'), existsIntro('x'), close] }],
            [{ label: 'פתרון', steps: [existsElim('∃ x, P x'), forallElim('∀ x, P x → Q x', 'x'), forward('P x → Q x', 'P x'), existsIntro('x'), close] }],
            [{ label: 'פתרון', steps: [assume, forallIntro, notIntro, notElim('¬∃ x, P x'), existsIntro('x'), close] }],
            [{ label: 'פתרון', steps: [assume, forallIntro, existsElim('∃ x, ∀ y, R x y'), forallElim('∀ y, R x y', 'y'), existsIntro('x'), close] }],
            [{
                label: 'פתרון',
                steps: [assume, byContradiction, notElim('¬∀ x, P x'), forallIntro, byContradiction, notElim('¬∃ x, ¬P x'), existsIntro('x'), close],
            }],
        ],
    },
];
