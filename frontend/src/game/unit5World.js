import { goalXml } from './levelXml';

// Unit 5 (see blocks/moves.js): the quantifiers, with
// the four rules of the natural-deduction courses, in the order of Logic and
// Proof (chapters 8 and 9): ∀I, ∀E, ∃I, ∃E. The levels are the books'
// examples and exercises. Assumptions have no names, but objects do, as in a
// proof written by hand ("יהי x₀ שרירותי"); a new object is named after the
// quantified variable with a subscript (x₀, or x₁ when x₀ is in hand), so
// that it reads apart from the bound x of ∀x and ∃x.
// Each level offers only the moves of its solution.

export const unit5WorldName = 'יחידה 5 - כמתים';

// The domain's type is called obj; the students only see objects' names.
const DOMAIN = 'variable {obj : Type} {P Q : obj → Prop}';

// The moves as the toolbox shows them, before they are placed.
const FORALL_ELIM_BLOCK = '"ב־ ? נציב ? ונקבל מה שהוא אומר על העצם."';
const FORALL_INTRO_BLOCK = '"יהי עצם שרירותי. עלינו להראות שהוא מקיים את התכונה."';
const EXISTS_INTRO_BLOCK = '"נבחר את העצם ? עלינו להראות שהוא מתאים."';
const EXISTS_ELIM_BLOCK = '"לפי ? יהי עצם כזה."';
const ASSUME_BLOCK = '"נניח את התנאי של הגרירה..."';
const FORWARD_BLOCK = '"מ־ ? ומ־ ? נקבל את המסקנה של הגרירה."';
const APPLY_RULE_BLOCK = '"לפי ? כדי להוכיח את המסקנה של הגרירה, די להוכיח את התנאי שלה."';
const AND_ELIM_BLOCK = '"מ־ ? נקבל את שני החלקים של ה"וגם"."';
const OR_INTRO_BLOCK = '"כדי להוכיח את ה"או" נוכיח את ?"';
const NOT_INTRO_BLOCK = '"נניח בשלילה את הטענה שהמטרה שוללת..."';
const NOT_ELIM_BLOCK = '"לפי ? כדי להגיע לסתירה די להוכיח את הטענה שהיא שוללת."';
const BY_CONTRADICTION_BLOCK = '"נניח בשלילה שהמטרה לא נכונה..."';
const CLOSE_BLOCK = '"המטרה בידינו, וזה מה שעלינו להראות."';

const forallElimInfo = {
    name: 'שימוש ב"לכל"',
    doc: 'מ"לכל x מתקיים P(x)" מקבלים P(a) לכל עצם a: מציבים את a במקום x. את העצם אנחנו בוחרים, וכל עצם מתאים. בהוכחה כתובה: "ב־ ∀x (P(x)) נציב x = a ונקבל P(a)."',
};

const forallIntroInfo = {
    name: 'הוכחת "לכל"',
    doc: 'כדי להוכיח "לכל x מתקיים P(x)" לוקחים עצם שרירותי, x₀, שלא ידוע עליו דבר, ומוכיחים P(x₀). מה שהוכח ל־x₀ שרירותי נכון לכל עצם. בהוכחה כתובה: "יהי x₀ שרירותי. עלינו להראות P(x₀). … מאחר ש־x₀ שרירותי, ∀x (P(x))."',
};

const existsIntroInfo = {
    name: 'הוכחת "קיים"',
    doc: 'כדי להוכיח "קיים x כך ש־P(x)" בוחרים עצם מתאים a (עד), ומוכיחים P(a). בהוכחה כתובה: "נבחר x = a. עלינו להראות P(a). … לכן קיים x כזה: ∃x (P(x))."',
};

const existsElimInfo = {
    name: 'שימוש ב"קיים"',
    doc: 'מ"קיים x כך ש־P(x)" לוקחים עצם כזה ונותנים לו שם, x₀. עליו ידוע רק ש־P(x₀), ואת הערך שלו לא אנחנו בוחרים. בהוכחה כתובה: "לפי ∃x (P(x)) יהי x₀ כזה, כלומר P(x₀)."',
};

export const unit5Levels = [
    {
        id: 'unit5-1',
        levelNumber: 1,
        totalLevels: 10,
        title: 'משתמשים בהנחה מסוג "לכל"',
        name: 'unit5_l1_forall_elim',
        variableLine: DOMAIN,
        params: '(a : obj) (h : ∀ x, P x)',
        proposition: 'P a',
        goalLabel: 'P(a)',
        objects: [{ name: 'a', type: 'obj' }],
        assumptions: [{ name: 'h', prop: '∀x (P(x))' }],
        toolboxBlocks: ['forall_elim', 'exact'],
        introduction: `# "לכל"

מעכשיו הטענות מדברות על *עצמים* מתוך תחום, ועל תכונות שלהם. למשל: התחום הוא הסטודנטים בקורס, ו־P(x) אומרת "x עבר את הבוחן".
לעצמים יש שמות, כמו a, ואותם רואים במצב ההוכחה תחת "עצמים".

הטענה \`∀x (P(x))\` נקראת "לכל x מתקיים P(x)": כל עצם בתחום מקיים את P. למשל, "כל הסטודנטים עברו את הבוחן".

כאן נתונים העצם a וההנחה \`∀x (P(x))\`, והמטרה היא P(a). אם כולם עברו, גם a עבר.
בהוכחה כתובה: "ב־ ∀x (P(x)) נציב x = a ונקבל P(a)." הבלוק ${FORALL_ELIM_BLOCK} עושה זאת: בוחרים בו את הטענה ואת העצם.
את העצם שמציבים אנחנו בוחרים, וכל עצם מתאים.`,
        newTacticsBlocks: ['forall_elim'],
        newTacticsInfo: [forallElimInfo],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${FORALL_ELIM_BLOCK} אל תוך בלוק המטרה, ובחרו בו ∀x (P(x)) ואת העצם a. עכשיו כתוב בו: ב־ ∀x (P(x)) נציב x = a ונקבל P(a).`,
            `P(a) בידינו: הוסיפו אחריו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `הצבתם x = a בטענה "לכל x מתקיים P(x)" וקיבלתם P(a). מטענת "לכל" אפשר להסיק את התכונה לכל עצם שתבחרו.`,
        startXml: goalXml('P(a)', '∀x (P(x))'),
    },
    {
        id: 'unit5-2',
        levelNumber: 2,
        totalLevels: 10,
        title: '"לכל" וגרירה',
        name: 'unit5_l2_forall_imp',
        variableLine: DOMAIN,
        params: '(a : obj) (h : ∀ x, (P x → Q x)) (hp : P a)',
        proposition: 'Q a',
        goalLabel: 'Q(a)',
        objects: [{ name: 'a', type: 'obj' }],
        assumptions: [
            { name: 'h', prop: '∀x (P(x) → Q(x))' },
            { name: 'hp', prop: 'P(a)' },
        ],
        toolboxBlocks: ['forall_elim', 'forward', 'apply_rule', 'exact'],
        introduction: `# "לכל" וגרירה

כל מי שעבר את הבוחן עבר את הקורס: \`∀x (P(x) → Q(x))\`. ו־a עבר את הבוחן: P(a). לכן a עבר את הקורס: Q(a).

קודם מציבים את a בטענת ה"לכל", ומקבלים את הגרירה \`P(a) → Q(a)\`.
התנאי שלה, P(a), כבר בידינו, ולכן נקבל את המסקנה שלה, כמו ביחידה 2.
אפשר גם ללכת אחורה, כמו ביחידה 2: המסקנה של הגרירה היא בדיוק המטרה Q(a), ולכן די להוכיח את התנאי שלה, P(a).`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${FORALL_ELIM_BLOCK} אל תוך בלוק המטרה, ובחרו בו ∀x (P(x) → Q(x)) ואת העצם a. עכשיו כתוב בו: ב־ ∀x (P(x) → Q(x)) נציב x = a ונקבל (P(a) → Q(a)).`,
            `הוסיפו אחריו את הבלוק ${FORWARD_BLOCK}, ובחרו בו P(a) → Q(a) ואת P(a). עכשיו כתוב בו: מ־ (P(a) → Q(a)) ומ־ P(a) נקבל Q(a).`,
            `Q(a) בידינו: הוסיפו אחריו את הבלוק ${CLOSE_BLOCK}.`,
            `או אחורה, במקום הבלוק "מ־ ? ומ־ ? נקבל...": הבלוק ${APPLY_RULE_BLOCK} עם P(a) → Q(a). עכשיו כתוב בו: לפי P(a) → Q(a) כדי להוכיח Q(a) די להוכיח P(a). ו־P(a) בידינו.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "ב־ ∀x (P(x) → Q(x)) נציב x = a ונקבל P(a) → Q(a). מ־ P(a) → Q(a) ומ־ P(a) נקבל Q(a)."
או אחורה: "...ונקבל P(a) → Q(a). לפי P(a) → Q(a) כדי להוכיח Q(a) די להוכיח P(a), וזה בידינו."`,
        startXml: goalXml('Q(a)', '∀x (P(x) → Q(x)),  P(a)'),
    },
    {
        id: 'unit5-3',
        levelNumber: 3,
        totalLevels: 10,
        title: 'מוכיחים טענה מסוג "לכל"',
        name: 'unit5_l3_forall_intro',
        variableLine: DOMAIN,
        params: '',
        proposition: '(∀ x, (P x ∧ Q x)) → (∀ x, P x)',
        goalLabel: '((∀x (P(x) ∧ Q(x))) → (∀x (P(x))))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['assume', 'forall_intro', 'forall_elim', 'and_elim', 'exact'],
        introduction: `# עצם שרירותי

אם כל הסטודנטים עברו גם את הבוחן וגם את התרגיל, אז כל הסטודנטים עברו את הבוחן.

כדי להוכיח "לכל x מתקיים P(x)" לוקחים עצם *שרירותי*, שלא ידוע עליו דבר, ומוכיחים שהוא מקיים את P.
מכיוון שהעצם לא נבחר בשום אופן מיוחד, מה שהוכח עליו נכון לכל עצם.
בהוכחה כתובה: "יהי x₀ שרירותי. עלינו להראות P(x₀). … מאחר ש־x₀ שרירותי, ∀x (P(x))." הבלוק ${FORALL_INTRO_BLOCK} עושה זאת, והעצם x₀ מצטרף לעצמים שבידינו.
ב־\`∀x (P(x))\` המשתנה x קשור: הוא רק מסמן "כל עצם". העצם שלוקחים הוא עצם מסוים שיש בידינו, אף שלא ידוע עליו דבר, ולכן הוא מקבל שם משלו, x₀, שלא יתבלבל עם x הקשור. אם כבר יש בידינו x₀, העצם החדש נקרא x₁.

אחרי הנחת התנאי ולקיחת x₀, מציבים את x₀ בהנחה, כמו בשלבים הקודמים.`,
        newTacticsBlocks: ['forall_intro'],
        newTacticsInfo: [forallIntroInfo],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: נניח ∀x (P(x) ∧ Q(x)). עלינו להראות ∀x (P(x)).`,
            `גררו לתוכו את הבלוק ${FORALL_INTRO_BLOCK}. עכשיו כתוב בו: יהי x₀ שרירותי. עלינו להראות P(x₀).`,
            `גררו לתוכו את הבלוק ${FORALL_ELIM_BLOCK}, ובחרו בו ∀x (P(x) ∧ Q(x)) ואת העצם x₀. עכשיו כתוב בו: ב־ ∀x (P(x) ∧ Q(x)) נציב x = x₀ ונקבל (P(x₀) ∧ Q(x₀)).`,
            `הוסיפו אחריו את הבלוק ${AND_ELIM_BLOCK}, ובחרו בו P(x₀) ∧ Q(x₀). עכשיו P(x₀) בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `לקחתם x₀ שרירותי והוכחתם עליו את P(x₀): "מאחר ש־x₀ שרירותי, ∀x (P(x))." לכן P נכונה לכל עצם.
שימו לב לסדר: קודם לוקחים את x₀, ורק אז אפשר להציב אותו בהנחה. לפני כן אין עצם להציב.`,
        startXml: goalXml('((∀x (P(x) ∧ Q(x))) → (∀x (P(x))))'),
    },
    {
        id: 'unit5-4',
        levelNumber: 4,
        totalLevels: 10,
        title: '"לכל" וגרירה, בשני הצדדים',
        name: 'unit5_l4_forall_distrib',
        variableLine: DOMAIN,
        params: '',
        proposition: '(∀ x, (P x → Q x)) → ((∀ x, P x) → (∀ x, Q x))',
        goalLabel: '((∀x (P(x) → Q(x))) → ((∀x (P(x))) → (∀x (Q(x)))))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['assume', 'forall_intro', 'forall_elim', 'forward', 'apply_rule', 'exact'],
        introduction: `# "לכל" וגרירה, בשני הצדדים

אם כל מי שעבר את הבוחן עבר את הקורס, וכולם עברו את הבוחן, אז כולם עברו את הקורס.

מניחים את שני התנאים, ולוקחים x₀ שרירותי. מציבים את x₀ בשתי ההנחות, ומשתמשים בגרירה שמתקבלת, כמו בשלב 2.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה, ולתוכו עוד אחד כזה. עכשיו המטרה היא ∀x (Q(x)).`,
            `גררו לתוך הבלוק הפנימי את הבלוק ${FORALL_INTRO_BLOCK}. עכשיו כתוב בו: יהי x₀ שרירותי. עלינו להראות Q(x₀).`,
            `גררו לתוכו פעמיים את הבלוק ${FORALL_ELIM_BLOCK}, זה אחרי זה: פעם עם ∀x (P(x) → Q(x)) ופעם עם ∀x (P(x)), ובשתיהן את העצם x₀.`,
            `הוסיפו אחריהם את הבלוק ${FORWARD_BLOCK}, ובחרו בו P(x₀) → Q(x₀) ואת P(x₀). עכשיו Q(x₀) בידינו.`,
            `או אחורה, כמו בשלב 2: הבלוק ${APPLY_RULE_BLOCK} עם P(x₀) → Q(x₀). עכשיו כתוב בו: לפי P(x₀) → Q(x₀) כדי להוכיח Q(x₀) די להוכיח P(x₀).`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "נניח ∀x (P(x) → Q(x)). נניח ∀x (P(x)). עלינו להראות ∀x (Q(x)). יהי x₀ שרירותי. עלינו להראות Q(x₀). נציב x = x₀ בשתי ההנחות ונקבל P(x₀) → Q(x₀) ו־P(x₀), ולכן Q(x₀). מאחר ש־x₀ שרירותי, ∀x (Q(x)). לכן (∀x (P(x))) → (∀x (Q(x))), ולכן גם הגרירה כולה."`,
        startXml: goalXml('((∀x (P(x) → Q(x))) → ((∀x (P(x))) → (∀x (Q(x)))))'),
    },
    {
        id: 'unit5-5',
        levelNumber: 5,
        totalLevels: 10,
        title: 'מוכיחים טענה מסוג "קיים"',
        name: 'unit5_l5_exists_intro',
        variableLine: DOMAIN,
        params: '(a : obj) (hp : P a)',
        proposition: '∃ x, (P x ∨ Q x)',
        goalLabel: '∃x (P(x) ∨ Q(x))',
        objects: [{ name: 'a', type: 'obj' }],
        assumptions: [{ name: 'hp', prop: 'P(a)' }],
        toolboxBlocks: ['exists_intro', 'or_intro', 'exact'],
        introduction: `# "קיים"

הטענה \`∃x (P(x))\` נקראת "קיים x כך ש־P(x)": לפחות עצם אחד בתחום מקיים את P. למשל, "יש סטודנט שעבר את הבוחן".

כדי להוכיח "קיים" בוחרים עצם מתאים, *עד*, ומוכיחים שהוא מקיים את התכונה.
כאן נתון ש־a מקיים את P, ולכן הוא עד טוב לטענה "קיים x כך ש־P(x) או Q(x)".
בהוכחה כתובה: "נבחר x = a. עלינו להראות P(a) ∨ Q(a). … לכן קיים x כזה: ∃x (P(x) ∨ Q(x))." הבלוק ${EXISTS_INTRO_BLOCK} עושה זאת: בוחרים בו את העצם מהעצמים שבידינו.`,
        newTacticsBlocks: ['exists_intro'],
        newTacticsInfo: [existsIntroInfo],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${EXISTS_INTRO_BLOCK} אל תוך בלוק המטרה, ובחרו בו את a. עכשיו כתוב בו: נבחר x = a. עלינו להראות (P(a) ∨ Q(a)).`,
            `גררו לתוכו את הבלוק ${OR_INTRO_BLOCK}, ובחרו בו P(a). עכשיו כתוב בו: כדי להוכיח (P(a) ∨ Q(a)) נוכיח את P(a).`,
            `P(a) בידינו: גררו לתוכו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `בחרתם את a כעד והוכחתם שהוא מתאים: "נבחר x = a. עלינו להראות P(a) ∨ Q(a). כדי להוכיח P(a) ∨ Q(a) נוכיח את P(a), וזה בידינו. לכן P(a) ∨ Q(a). לכן קיים x כזה: ∃x (P(x) ∨ Q(x))."
כדי להוכיח "קיים" מספיק עד אחד.`,
        startXml: goalXml('∃x (P(x) ∨ Q(x))', 'P(a)'),
    },
    {
        id: 'unit5-6',
        levelNumber: 6,
        totalLevels: 10,
        title: 'משתמשים בהנחה מסוג "קיים"',
        name: 'unit5_l6_exists_elim',
        variableLine: DOMAIN,
        params: '',
        proposition: '(∃ x, (P x ∧ Q x)) → (∃ x, P x)',
        goalLabel: '((∃x (P(x) ∧ Q(x))) → (∃x (P(x))))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['assume', 'exists_elim', 'and_elim', 'exists_intro', 'exact'],
        introduction: `# משתמשים בהנחה מסוג "קיים"

אם יש סטודנט שעבר גם את הבוחן וגם את התרגיל, אז יש סטודנט שעבר את הבוחן.

כדי להשתמש בהנחה "קיים x כך ש־P(x)", לוקחים עצם כזה ונותנים לו שם, x₀, ומשתמשים בכך שהוא מקיים את P. מלבד זה לא ידוע עליו דבר.
את x₀ הזה לא אנחנו בוחרים: רק נותנים לו שם. זה ההבדל מהצבה ב"לכל", שבה את העצם אנחנו בוחרים.
בהוכחה כתובה: "לפי ∃x (P(x)) יהי x₀ כזה, כלומר P(x₀)." הבלוק ${EXISTS_ELIM_BLOCK} עושה זאת, והעצם x₀ מצטרף לעצמים שבידינו.

שימו לב לסדר: לפני שמשתמשים בהנחה אין שום עצם בידינו, ולכן אין עד לבחור. קודם מקבלים עצם מההנחה, ואחר כך בוחרים אותו כעד.`,
        newTacticsBlocks: ['exists_elim'],
        newTacticsInfo: [existsElimInfo],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: נניח ∃x (P(x) ∧ Q(x)). עלינו להראות ∃x (P(x)).`,
            `גררו לתוכו את הבלוק ${EXISTS_ELIM_BLOCK}, ובחרו בו ∃x (P(x) ∧ Q(x)). עכשיו כתוב בו: לפי ∃x (P(x) ∧ Q(x)) יהי x₀ כזה, כלומר (P(x₀) ∧ Q(x₀)).`,
            `הוסיפו אחריו את הבלוק ${AND_ELIM_BLOCK}, ובחרו בו P(x₀) ∧ Q(x₀). עכשיו P(x₀) בידינו.`,
            `הוסיפו אחריו את הבלוק ${EXISTS_INTRO_BLOCK}, ובחרו בו את x₀. אחר כך גררו לתוכו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "נניח ∃x (P(x) ∧ Q(x)). עלינו להראות ∃x (P(x)). לפי ∃x (P(x) ∧ Q(x)) יהי x₀ כזה, כלומר P(x₀) ∧ Q(x₀). מ־ P(x₀) ∧ Q(x₀) נקבל P(x₀) וגם Q(x₀). נבחר x = x₀. עלינו להראות P(x₀), וזה בידינו. לכן קיים x כזה: ∃x (P(x)). לכן (∃x (P(x) ∧ Q(x))) → (∃x (P(x)))."`,
        startXml: goalXml('((∃x (P(x) ∧ Q(x))) → (∃x (P(x))))'),
    },
    {
        id: 'unit5-7',
        levelNumber: 7,
        totalLevels: 10,
        title: '"לכל" ו"קיים" יחד',
        name: 'unit5_l7_forall_exists',
        variableLine: DOMAIN,
        params: '(h : ∀ x, (P x → Q x)) (he : ∃ x, P x)',
        proposition: '∃ x, Q x',
        goalLabel: '∃x (Q(x))',
        objects: [],
        assumptions: [
            { name: 'h', prop: '∀x (P(x) → Q(x))' },
            { name: 'he', prop: '∃x (P(x))' },
        ],
        toolboxBlocks: ['exists_elim', 'forall_elim', 'forward', 'exists_intro', 'apply_rule', 'exact'],
        introduction: `# "לכל" ו"קיים" יחד

כל מי שעבר את הבוחן עבר את הקורס, ויש מי שעבר את הבוחן. לכן יש מי שעבר את הקורס.

קודם לוקחים מ־\`∃x (P(x))\` עצם כזה, x₀, שמקיים את P. את x₀ הזה לא אנחנו בוחרים.
אחר כך מציבים אותו ב־\`∀x (P(x) → Q(x))\`: כאן אנחנו בוחרים מה להציב, ובוחרים את x₀. מקבלים שגם Q(x₀) נכונה.
לבסוף x₀ הוא העד ל־\`∃x (Q(x))\`.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${EXISTS_ELIM_BLOCK} אל תוך בלוק המטרה, ובחרו בו ∃x (P(x)). עכשיו כתוב בו: לפי ∃x (P(x)) יהי x₀ כזה, כלומר P(x₀).`,
            `הוסיפו אחריו את הבלוק ${FORALL_ELIM_BLOCK}, ובחרו בו ∀x (P(x) → Q(x)) ואת העצם x₀. אחר כך הוסיפו את הבלוק ${FORWARD_BLOCK} עם P(x₀) → Q(x₀) ועם P(x₀).`,
            `הוסיפו אחריו את הבלוק ${EXISTS_INTRO_BLOCK}, ובחרו בו את x₀. Q(x₀) בידינו: גררו לתוכו את הבלוק ${CLOSE_BLOCK}.`,
            `או אחורה: קודם בחרו את x₀ כעד, ובתוך הבלוק שלו הבלוק ${APPLY_RULE_BLOCK} עם P(x₀) → Q(x₀): לפי P(x₀) → Q(x₀) כדי להוכיח Q(x₀) די להוכיח P(x₀).`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "לפי ∃x (P(x)) יהי x₀ כזה, כלומר P(x₀). ב־ ∀x (P(x) → Q(x)) נציב x = x₀ ונקבל P(x₀) → Q(x₀), ולכן Q(x₀). נבחר x = x₀. עלינו להראות Q(x₀), וזה בידינו. לכן קיים x כזה: ∃x (Q(x))."`,
        startXml: goalXml('∃x (Q(x))', '∀x (P(x) → Q(x)),  ∃x (P(x))'),
    },
    {
        id: 'unit5-8',
        levelNumber: 8,
        totalLevels: 10,
        title: 'שלילה של "קיים"',
        name: 'unit5_l8_not_exists',
        variableLine: DOMAIN,
        params: '',
        proposition: '(¬∃ x, P x) → (∀ x, ¬P x)',
        goalLabel: '((¬∃x (P(x))) → (∀x (¬P(x))))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['assume', 'forall_intro', 'not_intro', 'not_elim', 'exists_intro', 'exact'],
        introduction: `# שלילה של "קיים"

אם אין אף סטודנט שעבר את הבוחן, אז כל סטודנט לא עבר אותו.

אחרי הנחת התנאי ולקיחת x₀ שרירותי, המטרה היא \`¬P(x₀)\`: נניח בשלילה P(x₀) ונגיע לסתירה, כמו ביחידה 4.
כדי להגיע לסתירה, השתמשו בשלילה \`¬∃x (P(x))\`: די להוכיח \`∃x (P(x))\`, ו־x₀ הוא עד מתאים.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה, ולתוכו את הבלוק ${FORALL_INTRO_BLOCK}. עכשיו המטרה היא ¬P(x₀).`,
            `גררו לתוכו את הבלוק ${NOT_INTRO_BLOCK}. עכשיו כתוב בו: נניח בשלילה P(x₀). עלינו להגיע לסתירה.`,
            `גררו לתוכו את הבלוק ${NOT_ELIM_BLOCK}, ובחרו בו ¬∃x (P(x)). עכשיו כתוב בו: לפי ¬∃x (P(x)) כדי להגיע לסתירה די להוכיח ∃x (P(x)).`,
            `הוסיפו אחריו את הבלוק ${EXISTS_INTRO_BLOCK}, ובחרו בו את x₀. P(x₀) בידינו: גררו לתוכו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `"לא קיים x כך ש־P(x)" פירושו "לכל x, לא P(x)".`,
        startXml: goalXml('((¬∃x (P(x))) → (∀x (¬P(x))))'),
    },
    {
        id: 'unit5-9',
        levelNumber: 9,
        totalLevels: 10,
        title: 'תרגיל מסכם: סדר הכמתים',
        name: 'unit5_l9_quantifier_order',
        variableLine: 'variable {obj : Type} {R : obj → obj → Prop}',
        params: '',
        proposition: '(∃ x, ∀ y, R x y) → (∀ y, ∃ x, R x y)',
        goalLabel: '((∃x (∀y (R(x,y)))) → (∀y (∃x (R(x,y)))))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['assume', 'forall_intro', 'exists_elim', 'forall_elim', 'exists_intro', 'exact'],
        introduction: `# תרגיל מסכם: סדר הכמתים

R(x,y) היא תכונה של שני עצמים, למשל "x מכיר את y".
אם יש מישהו שמכיר את כולם, אז כל אחד מוכר על ידי מישהו.

בהוכחה משתמשים בכל ארבעת הכללים: לוקחים y₀ שרירותי, לוקחים מההנחה x₀ שמכיר את כולם, מציבים בה את y₀, ובוחרים את x₀ כעד.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה, ולתוכו את הבלוק ${FORALL_INTRO_BLOCK}. עכשיו כתוב בו: יהי y₀ שרירותי. עלינו להראות ∃x (R(x,y₀)).`,
            `גררו לתוכו את הבלוק ${EXISTS_ELIM_BLOCK}, ובחרו בו ∃x (∀y (R(x,y))). עכשיו כתוב בו: לפי ∃x (∀y (R(x,y))) יהי x₀ כזה, כלומר ∀y (R(x₀,y)).`,
            `הוסיפו אחריו את הבלוק ${FORALL_ELIM_BLOCK}, ובחרו בו ∀y (R(x₀,y)) ואת העצם y₀. עכשיו כתוב בו: ב־ ∀y (R(x₀,y)) נציב y = y₀ ונקבל R(x₀,y₀).`,
            `הוסיפו אחריו את הבלוק ${EXISTS_INTRO_BLOCK}, ובחרו בו את x₀. R(x₀,y₀) בידינו: גררו לתוכו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `מ"קיים x כך שלכל y" נובע "לכל y קיים x". הכיוון ההפוך לא נכון:
אם כל אחד מוכר על ידי מישהו, לא בהכרח יש מישהו אחד שמכיר את כולם. סדר הכמתים חשוב.`,
        startXml: goalXml('((∃x (∀y (R(x,y)))) → (∀y (∃x (R(x,y)))))'),
    },
    {
        id: 'unit5-10',
        levelNumber: 10,
        totalLevels: 10,
        title: 'שלב בונוס: שלילה של "לכל"',
        name: 'unit5_l10_not_forall',
        variableLine: DOMAIN,
        params: '',
        proposition: '(¬∀ x, P x) → (∃ x, ¬P x)',
        goalLabel: '((¬∀x (P(x))) → (∃x (¬P(x))))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['assume', 'by_contradiction', 'not_elim', 'forall_intro', 'exists_intro', 'exact'],
        introduction: `# בונוס: שלילה של "לכל"

אם לא כל הסטודנטים עברו את הבוחן, אז יש סטודנט שלא עבר אותו.

לא ידוע איזה סטודנט לא עבר, ולכן אי אפשר לבחור עד מיד. נוכיח בשלילה, כמו ביחידה 4: נניח שאין סטודנט כזה, ונגיע לסתירה.
בהוכחה משתמשים בהוכחה בשלילה פעמיים.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה, ולתוכו את הבלוק ${BY_CONTRADICTION_BLOCK}. עכשיו כתוב בו: נניח בשלילה ¬∃x (¬P(x)). עלינו להגיע לסתירה.`,
            `גררו לתוכו את הבלוק ${NOT_ELIM_BLOCK}, ובחרו בו ¬∀x (P(x)). עכשיו כתוב בו: לפי ¬∀x (P(x)) כדי להגיע לסתירה די להוכיח ∀x (P(x)).`,
            `הוסיפו אחריו את הבלוק ${FORALL_INTRO_BLOCK}, ולתוכו שוב את הבלוק ${BY_CONTRADICTION_BLOCK}. עכשיו כתוב בו: נניח בשלילה ¬P(x₀). עלינו להגיע לסתירה.`,
            `גררו לתוכו את הבלוק ${NOT_ELIM_BLOCK}, ובחרו בו ¬∃x (¬P(x)). אחריו הוסיפו את הבלוק ${EXISTS_INTRO_BLOCK} עם x₀, ולתוכו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `סיימתם את יחידה 5, כולל שלב הבונוס! "לא לכל x מתקיים P(x)" פירושו "קיים x כך שלא P(x)".
יחד עם שלב 8, שלילה הופכת "לכל" ל"קיים", ו"קיים" ל"לכל".`,
        startXml: goalXml('((¬∀x (P(x))) → (∃x (¬P(x))))'),
    },
];
