// The intended solutions of the handwritten version (handwritten.html), like
// solutions.js for the course. An assumption is given by its statement, as
// the menu of a move offers it (Lean's spelling, e.g. P → Q).

const close = (fact) => ['hw_exact', { FACT: fact }];
const assume = ['hw_assume'];
const backward = (rule) => ['hw_apply_rule', { RULE: rule }];
const forward = (rule, premise) => ['hw_forward', { RULE: rule, PREMISE: premise }];

export const HANDWRITTEN_UNITS = [
    {
        unit: 0,
        world: 'יחידה 0 - היכרות עם הסביבה',
        levels: [
            [{ label: 'פתרון', steps: [close('P')] }],
            [{ label: 'פתרון', steps: [close('Q')] }],
        ],
    },
    {
        unit: 1,
        world: 'יחידה 1 - מהנחה למסקנה',
        levels: [
            [{ label: 'פתרון', steps: [assume, close('P')] }],
            [{ label: 'אחורה', steps: [backward('P → Q'), close('P')] }],
            [{ label: 'קדימה', steps: [forward('P → Q', 'P'), forward('Q → R', 'Q'), close('R')] }],
            [
                { label: 'אחורה', steps: [assume, assume, backward('P → Q'), close('P')] },
                { label: 'קדימה', steps: [assume, assume, forward('P → Q', 'P'), close('Q')] },
            ],
            [
                { label: 'אחורה', steps: [assume, assume, assume, backward('Q → R'), backward('P → Q'), close('P')] },
                { label: 'קדימה', steps: [assume, assume, assume, forward('P → Q', 'P'), forward('Q → R', 'Q'), close('R')] },
            ],
        ],
    },
];
