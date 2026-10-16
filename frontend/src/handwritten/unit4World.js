import { goalXml } from '../game/levelXml';

// Unit 4 of the handwritten version (see blocks.js): the quantifiers, with
// the four rules of the natural-deduction courses, in the order of Logic and
// Proof (chapters 8 and 9): ∀I, ∀E, ∃I, ∃E. The levels are the books'
// examples and exercises. Assumptions have no names, but objects do, as in a
// proof written by hand ("יהי x עצם שרירותי"); a new object is named by its
// move, after the quantified variable. Each level offers only the moves of
// its solution.

export const unit4WorldName = 'יחידה 4 - כמתים';

// The domain's type is called obj; the students only see objects' names.
const DOMAIN = 'variable {obj : Type} {P Q : obj → Prop}';

// The moves as the toolbox shows them, before they are placed.
const FORALL_ELIM_BLOCK = '"מ־? עבור העצם ?"';
const FORALL_INTRO_BLOCK = '"כדי להוכיח "לכל": יהי עצם שרירותי, ונוכיח שהוא מקיים את התכונה"';
const EXISTS_INTRO_BLOCK = '"כדי להוכיח "קיים" נבחר את העצם ?"';
const EXISTS_ELIM_BLOCK = '"מ־? יהי עצם חדש שמקיים אותה"';
const ASSUME_BLOCK = '"כדי להוכיח את הגרירה, נניח..."';
const FORWARD_BLOCK = '"מהגרירה ? ומ־?"';
const AND_ELIM_BLOCK = '"מה"וגם" ?"';
const CLOSE_BLOCK = '"יש לנו ביד בדיוק את מה שאנחנו רוצים להוכיח."';

const forallElimInfo = {
    name: 'שימוש ב"לכל"',
    doc: 'מ"לכל x מתקיים P(x)" נובע P(a) לכל עצם a: מציבים את a במקום x. בכתב יד: "מ־∀x P(x), עבור העצם a, נובע P(a)".',
};

const forallIntroInfo = {
    name: 'הוכחת "לכל"',
    doc: 'כדי להוכיח "לכל x מתקיים P(x)" לוקחים עצם שרירותי x, שלא ידוע עליו דבר, ומוכיחים P(x). מה שהוכח לעצם שרירותי נכון לכל עצם. בכתב יד: "יהי x עצם שרירותי; נוכיח P(x)".',
};

const existsIntroInfo = {
    name: 'הוכחת "קיים"',
    doc: 'כדי להוכיח "קיים x כך ש־P(x)" בוחרים עצם מתאים a (עד), ומוכיחים P(a). בכתב יד: "נבחר את a, ונוכיח P(a)".',
};

const existsElimInfo = {
    name: 'שימוש ב"קיים"',
    doc: 'מ"קיים x כך ש־P(x)" מקבלים עצם חדש x, שעליו ידוע רק ש־P(x). בכתב יד: "יהי x עצם כך ש־P(x)".',
};

export const unit4Levels = [
    {
        id: 'hw-unit4-1',
        levelNumber: 1,
        totalLevels: 10,
        title: 'משתמשים בהנחה מסוג "לכל"',
        name: 'hw_unit4_l1_forall_elim',
        variableLine: DOMAIN,
        params: '(a : obj) (h : ∀ x, P x)',
        proposition: 'P a',
        goalLabel: 'P(a)',
        objects: [{ name: 'a', type: 'obj' }],
        assumptions: [{ name: 'h', prop: '∀x P(x)' }],
        toolboxBlocks: ['hw_forall_elim', 'hw_exact'],
        introduction: `# "לכל"

מעכשיו הטענות מדברות על *עצמים* מתוך תחום, ועל תכונות שלהם. למשל: התחום הוא הסטודנטים בקורס, ו־P(x) אומרת "x עבר את הבוחן".
לעצמים יש שמות, כמו a, ואותם רואים במצב ההוכחה תחת "עצמים".

הטענה \`∀x P(x)\` נקראת "לכל x מתקיים P(x)": כל עצם בתחום מקיים את P. למשל, "כל הסטודנטים עברו את הבוחן".

כאן נתונים העצם a וההנחה \`∀x P(x)\`, והמטרה היא P(a). אם כולם עברו, גם a עבר.
בכתב יד: "מ־∀x P(x), עבור העצם a, נובע P(a)". הבלוק ${FORALL_ELIM_BLOCK} עושה זאת: בוחרים בו את הטענה ואת העצם.`,
        newTacticsBlocks: ['hw_forall_elim'],
        newTacticsInfo: [forallElimInfo],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${FORALL_ELIM_BLOCK} אל תוך בלוק המטרה, ובחרו בו ∀x P(x) ואת העצם a. עכשיו כתוב בו: נובע P(a).`,
            `P(a) בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `הצבתם את a בטענה "לכל x מתקיים P(x)" וקיבלתם P(a). מטענת "לכל" אפשר להסיק את התכונה לכל עצם שתרצו.`,
        startXml: goalXml('P(a)', '∀x P(x)'),
    },
    {
        id: 'hw-unit4-2',
        levelNumber: 2,
        totalLevels: 10,
        title: '"לכל" וגרירה',
        name: 'hw_unit4_l2_forall_imp',
        variableLine: DOMAIN,
        params: '(a : obj) (h : ∀ x, (P x → Q x)) (hp : P a)',
        proposition: 'Q a',
        goalLabel: 'Q(a)',
        objects: [{ name: 'a', type: 'obj' }],
        assumptions: [
            { name: 'h', prop: '∀x (P(x) → Q(x))' },
            { name: 'hp', prop: 'P(a)' },
        ],
        toolboxBlocks: ['hw_forall_elim', 'hw_forward', 'hw_exact'],
        introduction: `# "לכל" וגרירה

כל מי שעבר את הבוחן עבר את הקורס: \`∀x (P(x) → Q(x))\`. ו־a עבר את הבוחן: P(a). לכן a עבר את הקורס: Q(a).

קודם מציבים את a בטענת ה"לכל", ומקבלים את הגרירה \`P(a) → Q(a)\`.
התנאי שלה, P(a), כבר בידינו, ולכן נובעת המסקנה שלה, כמו ביחידה 1.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${FORALL_ELIM_BLOCK} אל תוך בלוק המטרה, ובחרו בו ∀x (P(x) → Q(x)) ואת העצם a. עכשיו כתוב בו: נובע (P(a) → Q(a)).`,
            `הוסיפו את הבלוק ${FORWARD_BLOCK}, ובחרו בו P(a) → Q(a) ואת P(a). עכשיו כתוב בו: נובע Q(a).`,
            `Q(a) בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "מ־∀x (P(x) → Q(x)), עבור העצם a, נובע P(a) → Q(a). מ־P(a) → Q(a) ומ־P(a) נובע Q(a)."`,
        startXml: goalXml('Q(a)', '∀x (P(x) → Q(x)),  P(a)'),
    },
    {
        id: 'hw-unit4-3',
        levelNumber: 3,
        totalLevels: 10,
        title: 'מוכיחים טענה מסוג "לכל"',
        name: 'hw_unit4_l3_forall_intro',
        variableLine: DOMAIN,
        params: '',
        proposition: '(∀ x, (P x ∧ Q x)) → (∀ x, P x)',
        goalLabel: '((∀x (P(x) ∧ Q(x))) → (∀x P(x)))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['hw_assume', 'hw_forall_intro', 'hw_forall_elim', 'hw_and_elim', 'hw_exact'],
        introduction: `# עצם שרירותי

אם כל הסטודנטים עברו גם את הבוחן וגם את התרגיל, אז כל הסטודנטים עברו את הבוחן.

כדי להוכיח "לכל x מתקיים P(x)" לוקחים עצם *שרירותי*, שלא ידוע עליו דבר, ומוכיחים שהוא מקיים את P.
מכיוון שהעצם לא נבחר בשום אופן מיוחד, מה שהוכח עליו נכון לכל עצם.
בכתב יד: "יהי x עצם שרירותי; נוכיח P(x)". הבלוק ${FORALL_INTRO_BLOCK} עושה זאת, והעצם x מצטרף לעצמים שבידינו.

אחרי הנחת התנאי ולקיחת x, מציבים את x בהנחה, כמו בשלבים הקודמים.`,
        newTacticsBlocks: ['hw_forall_intro'],
        newTacticsInfo: [forallIntroInfo],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: נניח ∀x (P(x) ∧ Q(x)) ונוכיח ∀x P(x).`,
            `הוסיפו את הבלוק ${FORALL_INTRO_BLOCK}. עכשיו כתוב בו: יהי x עצם שרירותי, ונוכיח P(x).`,
            `הוסיפו את הבלוק ${FORALL_ELIM_BLOCK}, ובחרו בו ∀x (P(x) ∧ Q(x)) ואת העצם x. עכשיו כתוב בו: נובע (P(x) ∧ Q(x)).`,
            `הוסיפו את הבלוק ${AND_ELIM_BLOCK}, ובחרו בו P(x) ∧ Q(x). עכשיו P(x) בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `לקחתם עצם שרירותי x והוכחתם עליו את P(x), ולכן P נכונה לכל עצם.
שימו לב לסדר: קודם לוקחים את x, ורק אז אפשר להציב אותו בהנחה. לפני כן אין עצם להציב.`,
        startXml: goalXml('((∀x (P(x) ∧ Q(x))) → (∀x P(x)))'),
    },
    {
        id: 'hw-unit4-4',
        levelNumber: 4,
        totalLevels: 10,
        title: '"לכל" וגרירה, בשני הצדדים',
        name: 'hw_unit4_l4_forall_distrib',
        variableLine: DOMAIN,
        params: '',
        proposition: '(∀ x, (P x → Q x)) → ((∀ x, P x) → (∀ x, Q x))',
        goalLabel: '((∀x (P(x) → Q(x))) → ((∀x P(x)) → (∀x Q(x))))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['hw_assume', 'hw_forall_intro', 'hw_forall_elim', 'hw_forward', 'hw_exact'],
        introduction: `# "לכל" וגרירה, בשני הצדדים

אם כל מי שעבר את הבוחן עבר את הקורס, וכולם עברו את הבוחן, אז כולם עברו את הקורס.

מניחים את שני התנאים, ולוקחים עצם שרירותי x. מציבים את x בשתי ההנחות, ומשתמשים בגרירה שמתקבלת, כמו בשלב 2.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה, והוסיפו אחריו עוד אחד כזה. עכשיו המטרה היא ∀x Q(x).`,
            `הוסיפו את הבלוק ${FORALL_INTRO_BLOCK}. עכשיו כתוב בו: יהי x עצם שרירותי, ונוכיח Q(x).`,
            `הוסיפו פעמיים את הבלוק ${FORALL_ELIM_BLOCK}: פעם עם ∀x (P(x) → Q(x)) ופעם עם ∀x P(x), ובשתיהן את העצם x.`,
            `הוסיפו את הבלוק ${FORWARD_BLOCK}, ובחרו בו P(x) → Q(x) ואת P(x). עכשיו Q(x) בידינו.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "נניח ∀x (P(x) → Q(x)) ונניח ∀x P(x). יהי x עצם שרירותי. נובע P(x) → Q(x), ונובע P(x), ולכן Q(x)."`,
        startXml: goalXml('((∀x (P(x) → Q(x))) → ((∀x P(x)) → (∀x Q(x))))'),
    },
    {
        id: 'hw-unit4-5',
        levelNumber: 5,
        totalLevels: 10,
        title: 'מוכיחים טענה מסוג "קיים"',
        name: 'hw_unit4_l5_exists_intro',
        variableLine: DOMAIN,
        params: '(a : obj) (hp : P a)',
        proposition: '∃ x, (P x ∨ Q x)',
        goalLabel: '∃x (P(x) ∨ Q(x))',
        objects: [{ name: 'a', type: 'obj' }],
        assumptions: [{ name: 'hp', prop: 'P(a)' }],
        toolboxBlocks: ['hw_exists_intro', 'hw_or_intro', 'hw_exact'],
        introduction: `# "קיים"

הטענה \`∃x P(x)\` נקראת "קיים x כך ש־P(x)": לפחות עצם אחד בתחום מקיים את P. למשל, "יש סטודנט שעבר את הבוחן".

כדי להוכיח "קיים" בוחרים עצם מתאים, *עד*, ומוכיחים שהוא מקיים את התכונה.
כאן נתון ש־a מקיים את P, ולכן הוא עד טוב לטענה "קיים x כך ש־P(x) או Q(x)".
בכתב יד: "נבחר את a, ונוכיח P(a) ∨ Q(a)". הבלוק ${EXISTS_INTRO_BLOCK} עושה זאת: בוחרים בו את העצם מהעצמים שבידינו.`,
        newTacticsBlocks: ['hw_exists_intro'],
        newTacticsInfo: [existsIntroInfo],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${EXISTS_INTRO_BLOCK} אל תוך בלוק המטרה, ובחרו בו את a. עכשיו כתוב בו: ונוכיח (P(a) ∨ Q(a)).`,
            'הוסיפו את הבלוק "כדי להוכיח את ה"או" די להוכיח את ?", ובחרו בו P(a).',
            `P(a) בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `בחרתם את a כעד והוכחתם שהוא מתאים. כדי להוכיח "קיים" מספיק עד אחד.`,
        startXml: goalXml('∃x (P(x) ∨ Q(x))', 'P(a)'),
    },
    {
        id: 'hw-unit4-6',
        levelNumber: 6,
        totalLevels: 10,
        title: 'משתמשים בהנחה מסוג "קיים"',
        name: 'hw_unit4_l6_exists_elim',
        variableLine: DOMAIN,
        params: '',
        proposition: '(∃ x, (P x ∧ Q x)) → (∃ x, P x)',
        goalLabel: '((∃x (P(x) ∧ Q(x))) → (∃x P(x)))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['hw_assume', 'hw_exists_elim', 'hw_and_elim', 'hw_exists_intro', 'hw_exact'],
        introduction: `# משתמשים בהנחה מסוג "קיים"

אם יש סטודנט שעבר גם את הבוחן וגם את התרגיל, אז יש סטודנט שעבר את הבוחן.

כדי להשתמש בהנחה "קיים x כך ש־P(x)", נותנים לעצם שקיים שם, ומשתמשים בכך שהוא מקיים את P. מלבד זה לא ידוע עליו דבר.
בכתב יד: "יהי x עצם כך ש־P(x)". הבלוק ${EXISTS_ELIM_BLOCK} עושה זאת, והעצם החדש מצטרף לעצמים שבידינו.

שימו לב לסדר: לפני שמשתמשים בהנחה אין שום עצם בידינו, ולכן אין עד לבחור. קודם מקבלים עצם מההנחה, ואחר כך בוחרים אותו כעד.`,
        newTacticsBlocks: ['hw_exists_elim'],
        newTacticsInfo: [existsElimInfo],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: נניח ∃x (P(x) ∧ Q(x)) ונוכיח ∃x P(x).`,
            `הוסיפו את הבלוק ${EXISTS_ELIM_BLOCK}, ובחרו בו ∃x (P(x) ∧ Q(x)). עכשיו כתוב בו: יהי x עצם כך ש־(P(x) ∧ Q(x)).`,
            `הוסיפו את הבלוק ${AND_ELIM_BLOCK}, ובחרו בו P(x) ∧ Q(x). עכשיו P(x) בידינו.`,
            `הוסיפו את הבלוק ${EXISTS_INTRO_BLOCK}, ובחרו בו את x. אחר כך הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "נניח ∃x (P(x) ∧ Q(x)). יהי x עצם כך ש־P(x) ∧ Q(x). נובע P(x). נבחר את x, ונוכיח P(x): יש לנו אותה ביד."`,
        startXml: goalXml('((∃x (P(x) ∧ Q(x))) → (∃x P(x)))'),
    },
    {
        id: 'hw-unit4-7',
        levelNumber: 7,
        totalLevels: 10,
        title: '"לכל" ו"קיים" יחד',
        name: 'hw_unit4_l7_forall_exists',
        variableLine: DOMAIN,
        params: '(h : ∀ x, (P x → Q x)) (he : ∃ x, P x)',
        proposition: '∃ x, Q x',
        goalLabel: '∃x Q(x)',
        objects: [],
        assumptions: [
            { name: 'h', prop: '∀x (P(x) → Q(x))' },
            { name: 'he', prop: '∃x P(x)' },
        ],
        toolboxBlocks: ['hw_exists_elim', 'hw_forall_elim', 'hw_forward', 'hw_exists_intro', 'hw_exact'],
        introduction: `# "לכל" ו"קיים" יחד

כל מי שעבר את הבוחן עבר את הקורס, ויש מי שעבר את הבוחן. לכן יש מי שעבר את הקורס.

קודם מקבלים מ־\`∃x P(x)\` עצם x שמקיים את P. אחר כך מציבים אותו ב־\`∀x (P(x) → Q(x))\`, ומקבלים שגם Q(x) נכונה.
לבסוף x הוא העד ל־\`∃x Q(x)\`.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${EXISTS_ELIM_BLOCK} אל תוך בלוק המטרה, ובחרו בו ∃x P(x). עכשיו כתוב בו: יהי x עצם כך ש־P(x).`,
            `הוסיפו את הבלוק ${FORALL_ELIM_BLOCK}, ובחרו בו ∀x (P(x) → Q(x)) ואת העצם x. אחר כך הוסיפו את הבלוק ${FORWARD_BLOCK} עם P(x) → Q(x) ועם P(x).`,
            `הוסיפו את הבלוק ${EXISTS_INTRO_BLOCK}, ובחרו בו את x. Q(x) בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "יהי x עצם כך ש־P(x). מ־∀x (P(x) → Q(x)) נובע P(x) → Q(x), ולכן Q(x). נבחר את x."`,
        startXml: goalXml('∃x Q(x)', '∀x (P(x) → Q(x)),  ∃x P(x)'),
    },
    {
        id: 'hw-unit4-8',
        levelNumber: 8,
        totalLevels: 10,
        title: 'שלילה של "קיים"',
        name: 'hw_unit4_l8_not_exists',
        variableLine: DOMAIN,
        params: '',
        proposition: '(¬∃ x, P x) → (∀ x, ¬P x)',
        goalLabel: '((¬∃x P(x)) → (∀x ¬P(x)))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['hw_assume', 'hw_forall_intro', 'hw_not_intro', 'hw_not_elim', 'hw_exists_intro', 'hw_exact'],
        introduction: `# שלילה של "קיים"

אם אין אף סטודנט שעבר את הבוחן, אז כל סטודנט לא עבר אותו.

אחרי הנחת התנאי ולקיחת עצם שרירותי x, המטרה היא \`¬P(x)\`: נניח P(x) ונגיע לסתירה, כמו ביחידה 3.
כדי להגיע לסתירה, השתמשו בשלילה \`¬∃x P(x)\`: די להוכיח \`∃x P(x)\`, ו־x הוא עד מתאים.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה, ואחריו את הבלוק ${FORALL_INTRO_BLOCK}. עכשיו המטרה היא ¬P(x).`,
            'הוסיפו את הבלוק "כדי להוכיח את השלילה, נניח את הטענה שהיא שוללת ונגיע לסתירה". עכשיו כתוב בו: נניח P(x).',
            'הוסיפו את הבלוק "לפי השלילה ? שיש לנו ביד", ובחרו בו ¬∃x P(x). עכשיו כתוב בו: די להוכיח ∃x P(x).',
            `הוסיפו את הבלוק ${EXISTS_INTRO_BLOCK}, ובחרו בו את x. P(x) בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `"לא קיים x כך ש־P(x)" פירושו "לכל x, לא P(x)".`,
        startXml: goalXml('((¬∃x P(x)) → (∀x ¬P(x)))'),
    },
    {
        id: 'hw-unit4-9',
        levelNumber: 9,
        totalLevels: 10,
        title: 'תרגיל מסכם: סדר הכמתים',
        name: 'hw_unit4_l9_quantifier_order',
        variableLine: 'variable {obj : Type} {R : obj → obj → Prop}',
        params: '',
        proposition: '(∃ x, ∀ y, R x y) → (∀ y, ∃ x, R x y)',
        goalLabel: '((∃x ∀y R(x,y)) → (∀y ∃x R(x,y)))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['hw_assume', 'hw_forall_intro', 'hw_exists_elim', 'hw_forall_elim', 'hw_exists_intro', 'hw_exact'],
        introduction: `# תרגיל מסכם: סדר הכמתים

R(x,y) היא תכונה של שני עצמים, למשל "x מכיר את y".
אם יש מישהו שמכיר את כולם, אז כל אחד מוכר על ידי מישהו.

בהוכחה משתמשים בכל ארבעת הכללים: לוקחים עצם שרירותי y, מקבלים מההנחה עצם x שמכיר את כולם, מציבים בה את y, ובוחרים את x כעד.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה, ואחריו את הבלוק ${FORALL_INTRO_BLOCK}. עכשיו כתוב בו: יהי y עצם שרירותי, ונוכיח ∃x R(x,y).`,
            `הוסיפו את הבלוק ${EXISTS_ELIM_BLOCK}, ובחרו בו ∃x ∀y R(x,y). עכשיו כתוב בו: יהי x עצם כך ש־∀y R(x,y).`,
            `הוסיפו את הבלוק ${FORALL_ELIM_BLOCK}, ובחרו בו ∀y R(x,y) ואת העצם y. עכשיו כתוב בו: נובע R(x,y).`,
            `הוסיפו את הבלוק ${EXISTS_INTRO_BLOCK}, ובחרו בו את x. R(x,y) בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `מ"קיים x כך שלכל y" נובע "לכל y קיים x". הכיוון ההפוך לא נכון:
אם כל אחד מוכר על ידי מישהו, לא בהכרח יש מישהו אחד שמכיר את כולם. סדר הכמתים חשוב.`,
        startXml: goalXml('((∃x ∀y R(x,y)) → (∀y ∃x R(x,y)))'),
    },
    {
        id: 'hw-unit4-10',
        levelNumber: 10,
        totalLevels: 10,
        title: 'שלב בונוס: שלילה של "לכל"',
        name: 'hw_unit4_l10_not_forall',
        variableLine: DOMAIN,
        params: '',
        proposition: '(¬∀ x, P x) → (∃ x, ¬P x)',
        goalLabel: '((¬∀x P(x)) → (∃x ¬P(x)))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['hw_assume', 'hw_by_contradiction', 'hw_not_elim', 'hw_forall_intro', 'hw_exists_intro', 'hw_exact'],
        introduction: `# בונוס: שלילה של "לכל"

אם לא כל הסטודנטים עברו את הבוחן, אז יש סטודנט שלא עבר אותו.

לא ידוע איזה סטודנט לא עבר, ולכן אי אפשר לבחור עד מיד. נוכיח בשלילה, כמו ביחידה 3: נניח שאין סטודנט כזה, ונגיע לסתירה.
בהוכחה משתמשים בהוכחה בשלילה פעמיים.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה, ואחריו את הבלוק "נוכיח בשלילה: נניח שהמטרה לא נכונה ונגיע לסתירה". עכשיו כתוב בו: נניח ¬∃x ¬P(x).`,
            'הוסיפו את הבלוק "לפי השלילה ? שיש לנו ביד", ובחרו בו ¬∀x P(x). עכשיו כתוב בו: די להוכיח ∀x P(x).',
            `הוסיפו את הבלוק ${FORALL_INTRO_BLOCK}, ואחריו שוב "נוכיח בשלילה". עכשיו כתוב בו: נניח ¬P(x).`,
            `הוסיפו את הבלוק "לפי השלילה ? שיש לנו ביד", ובחרו בו ¬∃x ¬P(x). אחר כך הוסיפו את הבלוק ${EXISTS_INTRO_BLOCK} עם x, ואת הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `סיימתם את יחידה 4, כולל שלב הבונוס! "לא לכל x מתקיים P(x)" פירושו "קיים x כך שלא P(x)".
יחד עם שלב 8, שלילה הופכת "לכל" ל"קיים", ו"קיים" ל"לכל".`,
        startXml: goalXml('((¬∀x P(x)) → (∃x ¬P(x)))'),
    },
];
