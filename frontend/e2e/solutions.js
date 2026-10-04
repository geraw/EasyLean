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

const forallIntro = (name) => ['logic_forall_intro', { VARIABLE: name }];
const forallElim = (term, h, name) => ['logic_forall_elim', { TERM: term, HYPOTHESIS: h, NAME: name }];
const existsIntro = (term) => ['logic_exists_intro', { TERM: term }];
const existsElim = (h, variable, name) => ['logic_exists_elim', { HYPOTHESIS: h, VARIABLE: variable, NAME: name }];
const subsetIntro = (variable, name) => ['logic_subset_intro', { VARIABLE: variable, NAME: name }];
const subsetElim = (h, member, name) => ['logic_subset_elim', { HYPOTHESIS: h, MEMBER: member, NAME: name }];
const setEq = (first, second) => ['logic_set_eq', {}, { FIRST: first, SECOND: second }];
// Unfolding a definition: in the goal, or in the assumption named h.
const unfold = (operation, h) => [`logic_unfold_${operation}`, h ? { TARGET: 'HYPOTHESIS', HYPOTHESIS: h } : { TARGET: 'GOAL' }];
const rfl = ['logic_rfl'];
const calc = ['logic_calc'];
const algebra = ['logic_algebra'];
// Substitution by an equality: direction 'FORWARD' (left to right) or 'BACKWARD', in the goal or in assumption h.
const rewrite = (equation, direction, h) => ['logic_rewrite', { EQUATION: equation, DIRECTION: direction, ...(h ? { TARGET: 'HYPOTHESIS', HYPOTHESIS: h } : { TARGET: 'GOAL' }) }];
const induction = (n, base, k, ih, step) => ['logic_induction', { VARIABLE: n, STEP_VARIABLE: k, HYPOTHESIS: ih }, { BASE: base, STEP: step }];
const byContradiction = (name) => ['logic_by_contradiction', { HYPOTHESIS: name }];

const swapAnd = [assume('h'), andElim('h', 'h1', 'h2'), andIntro([exact('h2')], [exact('h1')])];
const swapAndForward = [assume('h'), andElim('h', 'h1', 'h2'), combine('h2', 'h1', 'hqp'), exact('hqp')];

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
            [
                { label: 'אחורה', note: 'משתמשים ב"וגם" שבהנחה, ומוכיחים "וגם" בשני חלקים.', steps: swapAnd },
                { label: 'קדימה', note: 'מסיקים את שני הצדדים, ומצרפים אותם בסדר ההפוך.', steps: swapAndForward },
            ],
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
            [
                { label: 'אחורה', note: 'שני הכיוונים, כל אחד כמו שלב 3.', steps: [['logic_iff_intro', {}, { FORWARD: swapAnd, BACKWARD: swapAnd }]] },
                { label: 'קדימה', note: 'בכל כיוון מצרפים את שני הצדדים בסדר ההפוך.', steps: [['logic_iff_intro', {}, { FORWARD: swapAndForward, BACKWARD: swapAndForward }]] },
            ],
            [
                {
                    label: 'אחורה',
                    note: 'מקרים לפי h2, ובכל מקרה בוחרים צד ומוכיחים "וגם" בשני חלקים.',
                    steps: [assume('h'), andElim('h', 'h1', 'h2'), orCases('h2',
                        'hq', [orLeft, andIntro([exact('h1')], [exact('hq')])],
                        'hr', [orRight, andIntro([exact('h1')], [exact('hr')])])],
                },
                {
                    label: 'קדימה',
                    note: 'בכל מקרה בוחרים צד, ומצרפים את h1 להנחה של המקרה.',
                    steps: [assume('h'), andElim('h', 'h1', 'h2'), orCases('h2',
                        'hq', [orLeft, combine('h1', 'hq', 'hpq'), exact('hpq')],
                        'hr', [orRight, combine('h1', 'hr', 'hpr'), exact('hpr')])],
                },
            ],
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
                { label: 'קדימה', note: 'מ־h ו־hp נובע Q, ו־hnq היא השלילה שלה: סתירה.', steps: [notIntro('hp'), forward('h', 'hp', 'hq'), contradiction('hnq', 'hq')] },
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
            [
                {
                    label: 'אחורה',
                    note: 'שתי אפשרויות לגבי P, ובכל אחת בוחרים צד; הסתירה בעזרת h, דרך הוכחת P ∧ Q.',
                    steps: [assume('h'), byCases('P',
                        'h1', [orRight, notIntro('hq'), notElim('h'), andIntro([exact('h1')], [exact('hq')])],
                        'h2', [orLeft, exact('h2')])],
                },
                {
                    label: 'קדימה',
                    note: 'במקרה ש־P נכונה, מצרפים את h1 ו־hq ל־P ∧ Q, ומ־h ומהצירוף נובעת סתירה.',
                    steps: [assume('h'), byCases('P',
                        'h1', [orRight, notIntro('hq'), combine('h1', 'hq', 'hpq'), forward('h', 'hpq', 'hb'), exact('hb')],
                        'h2', [orLeft, exact('h2')])],
                },
            ],
            [{
                label: 'פתרון',
                note: 'מוכיחים ¬¬P; הסתירה מגיעה מ־h, ו־Q נובעת מהסתירה בין hp ל־hnp.',
                steps: [assume('h'), notIntro('hnp'), notElim('h'), assume('hp'), falseImplies('Q', 'hf'), applyRule('hf'), contradiction('hnp', 'hp')],
            }],
        ],
    },
    {
        unit: 4,
        world: 'יחידה 4 - כמתים',
        doc: '04-quantifiers.md',
        levels: [
            [{ label: 'פתרון', note: 'מציבים את a בהנחה h.', steps: [forallElim('a', 'h', 'ha'), exact('ha')] }],
            [
                { label: 'קדימה', note: 'מציבים את a, ומהגרירה ומ־hp מסיקים את Q(a).', steps: [forallElim('a', 'h', 'ha'), forward('ha', 'hp', 'hq'), exact('hq')] },
                { label: 'אחורה', note: 'מציבים את a; המסקנה של הגרירה היא המטרה.', steps: [forallElim('a', 'h', 'ha'), applyRule('ha'), exact('hp')] },
            ],
            [{ label: 'פתרון', note: 'עצם שרירותי x0, הצבה בהנחה, ושימוש ב"וגם".', steps: [assume('h'), forallIntro('x0'), forallElim('x0', 'h', 'hx0'), andElim('hx0', 'hp', 'hq'), exact('hp')] }],
            [
                { label: 'קדימה', note: 'אותו עצם שרירותי מוצב בשתי ההנחות.', steps: [assume('h1'), assume('h2'), forallIntro('x0'), forallElim('x0', 'h1', 'hpq'), forallElim('x0', 'h2', 'hp'), forward('hpq', 'hp', 'hq'), exact('hq')] },
                { label: 'אחורה', note: 'המסקנה של הגרירה על x היא המטרה.', steps: [assume('h1'), assume('h2'), forallIntro('x0'), forallElim('x0', 'h1', 'hpq'), applyRule('hpq'), forallElim('x0', 'h2', 'hp'), exact('hp')] },
            ],
            [{ label: 'פתרון', note: 'a הוא עד, ובוחרים את הצד שאפשר להוכיח.', steps: [existsIntro('a'), orLeft, exact('hp')] }],
            [{ label: 'פתרון', note: 'קודם מקבלים עצם מ"קיים", ורק אז בוחרים אותו כעד.', steps: [assume('h'), existsElim('h', 'x0', 'hx0'), existsIntro('x0'), andElim('hx0', 'hp', 'hq'), exact('hq')] }],
            [
                { label: 'קדימה', note: 'העצם x0 מ"קיים" מוצב ב"לכל", ומשמש כעד.', steps: [assume('h1'), assume('h2'), existsElim('h2', 'x0', 'hx0'), forallElim('x0', 'h1', 'hpq'), forward('hpq', 'hx0', 'hq'), existsIntro('x0'), exact('hq')] },
                { label: 'אחורה', note: 'בוחרים את x0 כעד, ועוברים לתנאי של הגרירה.', steps: [assume('h1'), assume('h2'), existsElim('h2', 'x0', 'hx0'), forallElim('x0', 'h1', 'hpq'), existsIntro('x0'), applyRule('hpq'), exact('hx0')] },
            ],
            [{ label: 'פתרון', note: 'עצם שרירותי, הוכחת שלילה, והסתירה דרך עד ל"קיים".', steps: [assume('h'), forallIntro('x0'), notIntro('hp'), notElim('h'), existsIntro('x0'), exact('hp')] }],
            [{ label: 'פתרון', note: 'y0 שרירותי, עצם x0 מ"קיים", ו־x0 הוא העד לכל y0.', steps: [assume('h'), forallIntro('y0'), existsElim('h', 'x0', 'hx0'), existsIntro('x0'), forallElim('y0', 'hx0', 'hx0y0'), exact('hx0y0')] }],
            [{
                label: 'פתרון',
                note: 'הוכחה בשלילה, ובתוכה עוד הוכחה בשלילה של P(x).',
                steps: [assume('h'), byContradiction('hn'), notElim('h'), forallIntro('x0'), byContradiction('hnp'), notElim('hn'), existsIntro('x0'), exact('hnp')],
            }],
        ],
    },
    {
        unit: 5,
        world: 'יחידה 5 - קבוצות',
        doc: '05-sets.md',
        levels: [
            [{ label: 'פתרון', note: 'מההכלה ומהשייכות ל־A נובעת השייכות ל־B.', steps: [subsetElim('h', 'hx', 'hb'), exact('hb')] }],
            [{ label: 'פתרון', note: 'שתי הכלות ברצף.', steps: [subsetElim('h1', 'hx', 'hb'), subsetElim('h2', 'hb', 'hc'), exact('hc')] }],
            [{ label: 'פתרון', note: 'קודם איבר x0 של A, ורק אז ההכלות.', steps: [assume('h1'), assume('h2'), subsetIntro('x0', 'hx'), subsetElim('h1', 'hx', 'hb'), subsetElim('h2', 'hb', 'hc'), exact('hc')] }],
            [{ label: 'פתרון', note: 'פותחים את הגדרת החיתוך בהנחה, ומשתמשים ב"וגם".', steps: [subsetIntro('x0', 'hx'), unfold('inter', 'hx'), andElim('hx', 'ha', 'hb'), exact('ha')] }],
            [{
                label: 'פתרון',
                note: 'פותחים את הגדרת החיתוך במטרה, ומוכיחים כל צד בעזרת ההכלה המתאימה.',
                steps: [subsetIntro('x0', 'hx'), unfold('inter'), andIntro([subsetElim('h1', 'hx', 'hb'), exact('hb')], [subsetElim('h2', 'hx', 'hc'), exact('hc')])],
            }],
            [{
                label: 'פתרון',
                note: 'פותחים את הגדרת האיחוד, ומחלקים למקרים.',
                steps: [subsetIntro('x0', 'hx'), unfold('union', 'hx'), orCases('hx', 'ha', [subsetElim('h1', 'ha', 'hc'), exact('hc')], 'hb', [subsetElim('h2', 'hb', 'hc'), exact('hc')])],
            }],
            [{
                label: 'פתרון',
                note: 'שתי הכלות; בכל אחת מחליפים את סדר הצדדים.',
                steps: [setEq(
                    [subsetIntro('x0', 'hx'), unfold('inter', 'hx'), andElim('hx', 'ha', 'hb'), unfold('inter'), andIntro([exact('hb')], [exact('ha')])],
                    [subsetIntro('x0', 'hx'), unfold('inter', 'hx'), andElim('hx', 'hb', 'ha'), unfold('inter'), andIntro([exact('ha')], [exact('hb')])])],
            }],
            [{
                label: 'פתרון',
                note: 'אחרי פתיחת ההגדרות, הוכחת הפילוג משלב 2.9.',
                steps: [subsetIntro('x0', 'hx'), unfold('inter', 'hx'), andElim('hx', 'ha', 'hbc'), unfold('union', 'hbc'), orCases('hbc',
                    'hb', [unfold('union'), orLeft, unfold('inter'), andIntro([exact('ha')], [exact('hb')])],
                    'hc', [unfold('union'), orRight, unfold('inter'), andIntro([exact('ha')], [exact('hc')])])],
            }],
            [{
                label: 'פתרון',
                note: 'פותחים את הגדרת המשלים, ומוכיחים שלילה: x0 ∈ A היה נותן x0 ∈ B.',
                steps: [assume('h'), subsetIntro('x0', 'hx'), unfold('compl', 'hx'), unfold('compl'), notIntro('ha'), subsetElim('h', 'ha', 'hb'), contradiction('hx', 'hb')],
            }],
            [{
                label: 'פתרון',
                note: 'פותחים את ההפרש בהנחה, ואת החיתוך והמשלים במטרה.',
                steps: [subsetIntro('x0', 'hx'), unfold('diff', 'hx'), andElim('hx', 'ha', 'hnb'), unfold('inter'), andIntro([exact('ha')], [unfold('compl'), exact('hnb')])],
            }],
            [{
                label: 'פתרון',
                note: 'שתי הכלות; בכל אחת פותחים הגדרות ומשתמשים בשלילה, כמו בשלב 3.6.',
                steps: [setEq(
                    [subsetIntro('x0', 'hx'), unfold('compl', 'hx'), unfold('inter'), andIntro(
                        [unfold('compl'), notIntro('ha'), notElim('hx'), unfold('union'), orLeft, exact('ha')],
                        [unfold('compl'), notIntro('hb'), notElim('hx'), unfold('union'), orRight, exact('hb')])],
                    [subsetIntro('x0', 'hx'), unfold('inter', 'hx'), andElim('hx', 'hna', 'hnb'), unfold('compl', 'hna'), unfold('compl', 'hnb'), unfold('compl'), notIntro('hab'), unfold('union', 'hab'),
                        orCases('hab', 'ha', [contradiction('hna', 'ha')], 'hb', [contradiction('hnb', 'hb')])])],
            }],
            [
                { label: 'אחורה', note: 'האיבר של ∅ הוא סתירה; סתירה גוררת x0 ∈ A.', steps: [subsetIntro('x0', 'hx'), unfold('empty', 'hx'), falseImplies('x0 ∈ A', 'hf'), applyRule('hf'), exact('hx')] },
                { label: 'קדימה', note: 'מהסתירה ומ"סתירה גוררת x0 ∈ A" נובע x0 ∈ A.', steps: [subsetIntro('x0', 'hx'), unfold('empty', 'hx'), falseImplies('x0 ∈ A', 'hf'), forward('hf', 'hx', 'ha'), exact('ha')] },
            ],
            [{
                label: 'פתרון',
                note: 'הכלה ראשונה מגיעה לסתירה; בשנייה, מסתירה נובע כל צד.',
                steps: [setEq(
                    [subsetIntro('x0', 'hx'), unfold('inter', 'hx'), andElim('hx', 'ha', 'hna'), unfold('compl', 'hna'), unfold('empty'), contradiction('hna', 'ha')],
                    [subsetIntro('x0', 'hx'), unfold('empty', 'hx'), unfold('inter'), andIntro(
                        [falseImplies('x0 ∈ A', 'hf'), applyRule('hf'), exact('hx')],
                        [unfold('compl'), notIntro('ha'), exact('hx')])])],
            }],
            [{
                label: 'פתרון',
                note: 'האיבר הוא קבוצה X; אחרי פתיחת ההגדרה, שרשרת הכלות.',
                steps: [assume('h'), subsetIntro('X', 'hX'), unfold('powerset', 'hX'), unfold('powerset'), subsetIntro('x0', 'hx'), subsetElim('hX', 'hx', 'ha'), subsetElim('h', 'ha', 'hb'), exact('hb')],
            }],
            [{
                label: 'פתרון',
                note: 'שייכות לאיחוד המשפחה היא "קיים": העד הוא A.',
                steps: [subsetIntro('x0', 'hx'), unfold('sunion'), existsIntro('A'), andIntro([exact('hA')], [exact('hx')])],
            }],
            [{
                label: 'פתרון',
                note: 'שייכות לחיתוך המשפחה היא "לכל": מציבים את A.',
                steps: [subsetIntro('x0', 'hx'), unfold('sinter', 'hx'), forallElim('A', 'hx', 'hxa'), forward('hxa', 'hA', 'ha'), exact('ha')],
            }],
            [{
                label: 'פתרון',
                note: 'הכלה ראשונה בהוכחה בשלילה (עיקרון קלאסי); השנייה בהוכחת שלילה.',
                steps: [setEq(
                    [subsetIntro('x0', 'hx'), unfold('compl', 'hx'), byContradiction('hn'), notElim('hx'), unfold('compl'), exact('hn')],
                    [subsetIntro('x0', 'hx'), unfold('compl'), notIntro('hc'), unfold('compl', 'hc'), contradiction('hc', 'hx')])],
            }],
        ],
    },
    {
        unit: 6,
        world: 'יחידה 6 - שוויון ואינדוקציה',
        doc: '06-equality-and-induction.md',
        levels: [
            [{ label: 'פתרון', note: 'n + 0 = n לפי הגדרת החיבור.', steps: [rfl] }],
            [{ label: 'פתרון', note: 'מחליפים את y ב־x + 7, ושני הצדדים זהים.', steps: [rewrite('h', 'FORWARD'), rfl] }],
            [
                { label: 'בהנחה', note: 'מימין לשמאל בהנחה hb: b מוחלף ב־a.', steps: [rewrite('h', 'BACKWARD', 'hb'), exact('hb')] },
                { label: 'במטרה', note: 'משמאל לימין במטרה: a מוחלף ב־b.', steps: [rewrite('h', 'FORWARD'), exact('hb')] },
            ],
            [{ label: 'פתרון', note: 'מחליפים את a ב־b במטרה, ומקבלים את h2.', steps: [rewrite('h1', 'FORWARD'), exact('h2')] }],
            [{
                label: 'פתרון',
                note: 'בבסיס פותחים את double; בצעד גם מחליפים לפי הנחת האינדוקציה, ואת השאר משלים חשבון.',
                steps: [induction('n', [unfold('double'), rfl], 'k', 'ih', [unfold('double'), rewrite('ih', 'FORWARD'), calc])],
            }],
            [{
                label: 'פתרון',
                note: 'בצעד פותחים את הגדרת החיבור ומחליפים לפי הנחת האינדוקציה; בלי חשבון.',
                steps: [induction('n', [rfl], 'k', 'ih', [unfold('add'), rewrite('ih', 'FORWARD'), rfl])],
            }],
            [{ label: 'פתרון', note: 'הצעד נכון לפי חשבון; הבסיס הוא שלא נכון.', steps: [assume('h'), calc] }],
            [{
                label: 'פתרון',
                note: 'בצעד פותחים את הגדרת החזקה, ואז חשבון עם הנחת האינדוקציה.',
                steps: [induction('n', [calc], 'k', 'ih', [unfold('pow'), calc])],
            }],
            [{
                label: 'פתרון',
                note: 'פותחים את sumTo; בצעד, אלגברה עם הנחת האינדוקציה.',
                steps: [induction('n', [unfold('sumto'), rfl], 'k', 'ih', [unfold('sumto'), algebra])],
            }],
            [{
                label: 'פתרון',
                note: 'בצעד, מקרים לפי הנחת האינדוקציה; בכל מקרה עד מתאים, וחשבון.',
                steps: [induction('n', [orLeft, existsIntro('0'), rfl], 'k', 'ih', [orCases('ih',
                    'he', [existsElim('he', 'm', 'hm'), orRight, existsIntro('m'), calc],
                    'ho', [existsElim('ho', 'm', 'hm'), orLeft, existsIntro('m + 1'), calc])])],
            }],
            [{
                label: 'פתרון',
                note: 'פותחים את oddSum, מחליפים לפי הנחת האינדוקציה, ואלגברה.',
                steps: [induction('n', [unfold('oddsum'), rfl], 'k', 'ih', [unfold('oddsum'), rewrite('ih', 'FORWARD'), algebra])],
            }],
        ],
    },
];
