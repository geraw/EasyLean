// The intended solutions of every level, as students build them from the
// blocks. solutions.spec.js checks that each one is accepted, using only the
// level's toolbox; docs-screenshots.spec.js photographs each one for the
// curriculum documents (docs/curriculum/), so the images always show a
// working proof. A level with several good solutions lists each of them.
//
// A step is [blockType, { FIELD: value }, { INPUT: [steps] }] (see buildProof).

const exact = (term) => ['tactic_exact', { TERM: term }];
const assume = (name) => ['tactic_intro', { HYPOTHESIS: name }];
const applyRule = (rule) => ['tactic_apply_rule', { RULE: rule }];
const forward = (rule, premise, name) => ['logic_modus_ponens', { RULE: rule, PREMISE: premise, NAME: name }];
const andElim = (h, left, right) => ['logic_and_elim', { HYPOTHESIS: h, LEFT_NAME: left, RIGHT_NAME: right }];
const andIntro = (left, right) => ['logic_and_intro', {}, { LEFT: left, RIGHT: right }];
const orLeft = ['logic_or_intro_left'];
const orRight = ['logic_or_intro_right'];
const orCases = (h, left, leftSteps, right, rightSteps) =>
    ['logic_or_elim', { HYPOTHESIS: h, LEFT_NAME: left, RIGHT_NAME: right }, { LEFT: leftSteps, RIGHT: rightSteps }];
const iffElim = (h, fwd, bwd) => ['logic_iff_elim', { HYPOTHESIS: h, FORWARD_NAME: fwd, BACKWARD_NAME: bwd }];
const contradiction = (negation, hypothesis) => ['logic_contradiction', { NEGATION: negation, HYPOTHESIS: hypothesis }];
const notIntro = (name) => ['logic_not_intro', { HYPOTHESIS: name }];
const notElim = (negation) => ['logic_not_elim', { NEGATION: negation }];
const falseImplies = (formula, name) => ['logic_false_implies', { FORMULA: formula, HYPOTHESIS: name }];
const nonContradiction = (formula, name) => ['logic_non_contradiction', { FORMULA: formula, HYPOTHESIS: name }];
const combine = (left, right, name) => ['logic_and_combine', { LEFT: left, RIGHT: right, NAME: name }];
const byCases = (formula, left, leftSteps, right, rightSteps) =>
    ['logic_by_cases', { FORMULA: formula, LEFT_NAME: left, RIGHT_NAME: right }, { LEFT: leftSteps, RIGHT: rightSteps }];

const swapAnd = [assume('h'), andElim('h', 'h1', 'h2'), andIntro([exact('h2')], [exact('h1')])];

// One entry per unit: its tab name, its design document, and per level the
// solutions, each with a short label and a one-line description (Hebrew).
export const UNITS = [
    {
        unit: 0,
        world: 'יחידה 0 - היכרות עם הסביבה',
        doc: '00-getting-started.md',
        levels: [
            [{ label: 'פתרון', note: 'ההנחה h אומרת בדיוק את המטרה.', steps: [exact('h')] }],
            [{ label: 'פתרון', note: 'השלב נפתח עם h בשדה; מתקנים ל־h2, ההנחה שאומרת Q.', steps: [exact('h2')] }],
        ],
    },
    {
        unit: 1,
        world: 'יחידה 1 - מהנחה למסקנה',
        doc: '01-implications.md',
        levels: [
            [{ label: 'פתרון', note: 'מניחים את התנאי, וסוגרים בעזרתו.', steps: [assume('h'), exact('h')] }],
            [{ label: 'אחורה', note: 'המסקנה של h1 היא המטרה, ולכן עוברים לתנאי שלה.', steps: [applyRule('h1'), exact('h')] }],
            [{ label: 'קדימה', note: 'מ־P מסיקים את Q, ומ־Q את R.', steps: [forward('h1', 'hp', 'hq'), forward('h2', 'hq', 'hr'), exact('hr')] }],
            [
                { label: 'אחורה', note: 'אחרי שתי ההנחות, המסקנה של h2 היא המטרה.', steps: [assume('h1'), assume('h2'), applyRule('h2'), exact('h1')] },
                { label: 'קדימה', note: 'אחרי שתי ההנחות, מ־h2 ומ־h1 מסיקים את Q.', steps: [assume('h1'), assume('h2'), forward('h2', 'h1', 'hq'), exact('hq')] },
            ],
            [
                { label: 'אחורה', note: 'מהמטרה R אחורה: דרך h2 ל־Q, ודרך h1 ל־P.', steps: [assume('h1'), assume('h2'), assume('h3'), applyRule('h2'), applyRule('h1'), exact('h3')] },
                { label: 'קדימה', note: 'מ־P קדימה: דרך h1 ל־Q, ודרך h2 ל־R.', steps: [assume('h1'), assume('h2'), assume('h3'), forward('h1', 'h3', 'hq'), forward('h2', 'hq', 'hr'), exact('hr')] },
            ],
        ],
    },
    {
        unit: 2,
        world: 'יחידה 2 - וגם, או, אם ורק אם',
        doc: '02-and-or-iff.md',
        levels: [
            [{ label: 'פתרון', note: 'מסיקים מ־h את שני הצדדים, וסוגרים בצד ימין.', steps: [andElim('h', 'h1', 'h2'), exact('h2')] }],
            [{ label: 'פתרון', note: 'כל צד בחלק משלו.', steps: [andIntro([exact('h1')], [exact('h2')])] }],
            [{ label: 'פתרון', note: 'משתמשים ב"וגם" שבהנחה, ומוכיחים "וגם" בשני חלקים.', steps: swapAnd }],
            [{ label: 'פתרון', note: 'בוחרים את הצד שאפשר להוכיח, P.', steps: [orRight, exact('h')] }],
            [
                { label: 'אחורה', note: 'בכל מקרה, המסקנה של הגרירה המתאימה היא R.', steps: [orCases('h', 'h1', [applyRule('hpr'), exact('h1')], 'h2', [applyRule('hqr'), exact('h2')])] },
                { label: 'קדימה', note: 'בכל מקרה, ההנחה החדשה היא התנאי של אחת הגרירות.', steps: [orCases('h', 'h1', [forward('hpr', 'h1', 'hr'), exact('hr')], 'h2', [forward('hqr', 'h2', 'hr'), exact('hr')])] },
            ],
            [{ label: 'פתרון', note: 'קודם מקרים, ורק בתוך כל מקרה בוחרים צד.', steps: [assume('h'), orCases('h', 'h1', [orRight, exact('h1')], 'h2', [orLeft, exact('h2')])] }],
            [
                { label: 'אחורה', note: 'משתמשים בכיוון מימין לשמאל, Q → P, אחורה.', steps: [iffElim('h', 'h1', 'h2'), applyRule('h2'), exact('hq')] },
                { label: 'קדימה', note: 'התנאי Q בידינו, ולכן מסיקים את P.', steps: [iffElim('h', 'h1', 'h2'), forward('h2', 'hq', 'hp'), exact('hp')] },
            ],
            [{ label: 'פתרון', note: 'שני הכיוונים, כל אחד כמו שלב 3.', steps: [['logic_iff_intro', {}, { FORWARD: swapAnd, BACKWARD: swapAnd }]] }],
            [{
                label: 'פתרון',
                note: 'מקרים לפי h2, ובכל מקרה בוחרים צד ומוכיחים "וגם".',
                steps: [assume('h'), andElim('h', 'h1', 'h2'), orCases('h2',
                    'hq', [orLeft, andIntro([exact('h1')], [exact('hq')])],
                    'hr', [orRight, andIntro([exact('h1')], [exact('hr')])])],
            }],
        ],
    },
    {
        unit: 3,
        world: 'יחידה 3 - שלילה והוכחה בשלילה',
        doc: '03-negation.md',
        levels: [
            [{ label: 'פתרון', note: 'hn היא השלילה של hp.', steps: [contradiction('hn', 'hp')] }],
            [
                { label: 'אחורה', note: 'המסקנה של העיקרון היא ⊥; מוכיחים את התנאי שלו בשני חלקים.', steps: [nonContradiction('P', 'hc'), applyRule('hc'), andIntro([exact('hp')], [exact('hn')])] },
                { label: 'קדימה', note: 'מצרפים את hp ו־hn, ומהעיקרון מסיקים סתירה.', steps: [nonContradiction('P', 'hc'), combine('hp', 'hn', 'hpn'), forward('hc', 'hpn', 'hb'), exact('hb')] },
            ],
            [
                { label: 'אחורה', note: 'סתירה גוררת Q; עוברים להוכיח סתירה.', steps: [falseImplies('Q', 'hf'), applyRule('hf'), contradiction('hn', 'hp')] },
                { label: 'קדימה', note: 'מ־hn ו־hp נובעת סתירה, וממנה ומ־hf נובע Q.', steps: [forward('hn', 'hp', 'hb'), falseImplies('Q', 'hf'), forward('hf', 'hb', 'hq'), exact('hq')] },
            ],
            [
                { label: 'פתרון', note: 'מניחים ¬P ומגיעים לסתירה עם hp.', steps: [notIntro('hn'), contradiction('hn', 'hp')] },
                { label: 'קדימה', note: '¬P היא P → ⊥, ולכן מ־hn ו־hp נובעת סתירה.', steps: [notIntro('hn'), forward('hn', 'hp', 'hb'), exact('hb')] },
            ],
            [
                { label: 'אחורה', note: 'מגיעים לסתירה בעזרת ¬Q: מוכיחים את Q.', steps: [notIntro('hp'), notElim('hnq'), applyRule('h'), exact('hp')] },
                { label: 'קדימה', note: 'מ־h ו־hp נובע Q, ומ־hnq ו־Q נובעת סתירה.', steps: [notIntro('hp'), forward('h', 'hp', 'hq'), forward('hnq', 'hq', 'hb'), exact('hb')] },
            ],
            [{
                label: 'פתרון',
                note: 'בכל חלק מוכיחים שלילה, ומגיעים לסתירה בעזרת h.',
                steps: [assume('h'), andIntro(
                    [notIntro('hp'), notElim('h'), orLeft, exact('hp')],
                    [notIntro('hq'), notElim('h'), orRight, exact('hq')])],
            }],
            [{ label: 'פתרון', note: 'מניחים בשלילה ¬P; h היא השלילה שלה.', steps: [assume('h'), ['logic_by_contradiction', { HYPOTHESIS: 'hn' }], contradiction('h', 'hn')] }],
            [
                { label: 'אחורה', note: 'בכל אפשרות, המסקנה של הגרירה המתאימה היא Q.', steps: [byCases('P', 'h1', [applyRule('hpq'), exact('h1')], 'h2', [applyRule('hnpq'), exact('h2')])] },
                { label: 'קדימה', note: 'בכל אפשרות, ההנחה החדשה היא התנאי של אחת הגרירות.', steps: [byCases('P', 'h1', [forward('hpq', 'h1', 'hq'), exact('hq')], 'h2', [forward('hnpq', 'h2', 'hq'), exact('hq')])] },
            ],
            [{
                label: 'פתרון',
                note: 'שתי אפשרויות לגבי P, ובכל אחת בוחרים צד.',
                steps: [assume('h'), byCases('P',
                    'h1', [orRight, notIntro('hq'), notElim('h'), andIntro([exact('h1')], [exact('hq')])],
                    'h2', [orLeft, exact('h2')])],
            }],
            [{
                label: 'פתרון',
                note: 'מוכיחים ¬¬P; הסתירה מגיעה מ־h, ו־Q נובעת מהסתירה בין hp ל־hnp.',
                steps: [assume('h'), notIntro('hnp'), notElim('h'), assume('hp'), falseImplies('Q', 'hf'), applyRule('hf'), contradiction('hnp', 'hp')],
            }],
        ],
    },
];
