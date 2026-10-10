// The intended solutions of the handwritten version (handwritten.html), like
// solutions.js for the course. An assumption is given by its statement, as
// the menu of a move offers it (Lean's spelling, e.g. P → Q).

const close = ['hw_exact'];
const assume = ['hw_assume'];
const backward = (rule) => ['hw_apply_rule', { RULE: rule }];
const forward = (rule, premise) => ['hw_forward', { RULE: rule, PREMISE: premise }];

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
];
