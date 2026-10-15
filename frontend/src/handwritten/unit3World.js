import { goalXml } from '../game/levelXml';

// Unit 3 of the handwritten version (see blocks.js): negation, built as in
// most logic courses and textbooks (Logic and Proof, Theorem Proving in Lean,
// Formalising Mathematics, forall x): ¬P is the implication P → ⊥, so it is
// proved and used with the moves of unit 1. The new rules are only the
// contradiction itself, "from a contradiction anything follows", and proof
// by contradiction (with its two possibilities).

export const unit3WorldName = 'יחידה 3 - שלילה והוכחה בשלילה';

const contradictionInfo = {
    name: 'סתירה',
    doc: 'טענה ושלילתה לא יכולות להיות נכונות יחד. אם יש בידינו גם P וגם ¬P, הגענו לסתירה (⊥). בבלוק בוחרים אחת מהשתיים, P או ¬P, והבלוק משלים את השנייה.',
};

const exfalsoInfo = {
    name: 'מסתירה נובע הכול',
    doc: 'מסתירה אפשר להסיק כל טענה. לכן כדי להוכיח מטרה כלשהי, די להגיע לסתירה. בכתב יד: "מסתירה נובע הכול, ולכן די להגיע לסתירה".',
};

const byContradictionInfo = {
    name: 'הוכחה בשלילה',
    doc: 'כדי להוכיח P מניחים ש־P לא נכונה (¬P) ומגיעים לסתירה. אם ¬P מובילה לסתירה, היא לא נכונה, ולכן P נכונה. הבלוק מתאים לכל מטרה.',
};

const byCasesInfo = {
    name: 'בדיקת שתי האפשרויות',
    doc: 'כל טענה P נכונה או לא נכונה. לכן אפשר להוכיח את המטרה פעם בהנחה P, ופעם בהנחה ¬P.',
};

const CONTRADICTION = 'סתירה (⊥)';
const CONTRADICTION_BLOCK = '"יש לנו ביד את ? ואת השלילה שלה, וזו סתירה."';

export const unit3Levels = [
    {
        id: 'hw-unit3-1',
        levelNumber: 1,
        totalLevels: 10,
        title: 'טענה ושלילתה',
        name: 'hw_unit3_l1_contradiction',
        variableLine: 'variable {P : Prop}',
        params: '(hp : P) (hn : ¬P)',
        proposition: 'False',
        goalLabel: CONTRADICTION,
        objects: [],
        assumptions: [
            { name: 'hp', prop: 'P' },
            { name: 'hn', prop: '¬P' },
        ],
        toolboxBlocks: ['hw_contradiction', 'hw_forward', 'hw_exact'],
        introduction: `# שלילה וסתירה

הטענה \`¬P\` נקראת "לא P", והיא אומרת ש־P לא נכונה.
טענה ושלילתה לא יכולות להיות נכונות יחד. אם יש בידינו גם P וגם ¬P, הגענו ל*סתירה*, שמסמנים \`⊥\`.

כאן נתונות ההנחות P ו־\`¬P\`, והמטרה היא להגיע לסתירה. בכתב יד: "יש לנו ביד את P ואת השלילה שלה, וזו סתירה".
הבלוק ${CONTRADICTION_BLOCK} עושה זאת. בוחרים בו אחת מהשתיים, P או ¬P, והוא משלים את השנייה.

אפשר להסתכל על שלילה גם אחרת: ¬P אומרת "אם P, אז סתירה", כלומר היא הגרירה \`P → ⊥\`.
לכן אפשר גם ללכת קדימה, כמו ביחידה 1: מהגרירה ¬P ומהתנאי שלה P נובעת סתירה.`,
        newTacticsBlocks: ['hw_contradiction'],
        newTacticsInfo: [contradictionInfo],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${CONTRADICTION_BLOCK} אל תוך בלוק המטרה, ובחרו בו P או ¬P.`,
            'או קדימה: מהגרירה ¬P ומ־P נובע ⊥, וזה בדיוק מה שצריך להוכיח.',
        ],
        conclusion: `¬P אומרת בדיוק ש־P לא נכונה, ולכן שתיהן יחד הן סתירה.
מעכשיו, ¬P היא בשבילנו גם הגרירה P → ⊥: משתמשים בה ומוכיחים אותה כמו בכל גרירה.`,
        startXml: goalXml(CONTRADICTION, 'P,  ¬P'),
    },
    {
        id: 'hw-unit3-2',
        levelNumber: 2,
        totalLevels: 10,
        title: 'מוכיחים שלילה',
        name: 'hw_unit3_l2_modus_tollens',
        variableLine: 'variable {P Q : Prop}',
        params: '(h : (P → Q)) (hnq : ¬Q)',
        proposition: '¬P',
        goalLabel: '¬P',
        objects: [],
        assumptions: [
            { name: 'h', prop: 'P → Q' },
            { name: 'hnq', prop: '¬Q' },
        ],
        toolboxBlocks: ['hw_assume', 'hw_forward', 'hw_contradiction', 'hw_apply_rule', 'hw_exact'],
        introduction: `# מוכיחים שלילה

אם P גוררת את Q, ו־Q לא נכונה, אז גם P לא נכונה. נוכיח את זה.

המטרה היא \`¬P\`, כלומר הגרירה \`P → ⊥\`. לכן מוכיחים אותה כמו כל גרירה: מניחים את התנאי, P, ומגיעים לסתירה.
בכתב יד: "כדי להוכיח ¬P נניח P ונגיע לסתירה". הבלוק "כדי להוכיח את הגרירה, נניח..." מיחידה 1 עושה זאת.

אחרי ההנחה, מ־P → Q ומ־P נובע Q, ויש לנו ביד את Q ואת השלילה שלה.
אפשר גם ללכת אחורה: ¬Q היא הגרירה Q → ⊥, ולכן כדי להגיע לסתירה די להוכיח Q.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "כדי להוכיח את הגרירה, נניח..." אל תוך בלוק המטרה. עכשיו כתוב בו: כדי להוכיח ¬P נניח P ונגיע לסתירה.',
            'מהגרירה P → Q ומ־P נובע Q.',
            'יש לנו ביד את Q ואת השלילה שלה: סתירה. או אחורה: לפי הגרירה ¬Q, כדי להגיע לסתירה די להוכיח Q.',
        ],
        conclusion: `מ־P → Q ומ־¬Q הסקתם ¬P. לכלל הזה קוראים *modus tollens*.
הוכחתם שלילה בדיוק כמו גרירה: הנחתם את P והגעתם לסתירה.`,
        startXml: goalXml('¬P', '(P → Q),  ¬Q'),
    },
    {
        id: 'hw-unit3-3',
        levelNumber: 3,
        totalLevels: 10,
        title: 'שלילה כפולה',
        name: 'hw_unit3_l3_double_negation',
        variableLine: 'variable {P : Prop}',
        params: '',
        proposition: '(P → ¬¬P)',
        goalLabel: '(P → ¬¬P)',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['hw_assume', 'hw_contradiction', 'hw_forward', 'hw_exact'],
        introduction: `# שלילה כפולה

\`¬¬P\` אומרת "לא נכון ש־P לא נכונה". נוכיח שהיא נובעת מ־P.

קודם מניחים את P. אחר כך המטרה היא \`¬¬P\`, כלומר השלילה של \`¬P\`: נניח \`¬P\` וננסה להגיע לסתירה.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'נניח P. המטרה היא ¬¬P.',
            'כדי להוכיח ¬¬P נניח ¬P ונגיע לסתירה.',
            'יש לנו ביד את P ואת השלילה שלה.',
        ],
        conclusion: `הנחתם את ¬P, והגעתם לסתירה עם P, ולכן ¬P לא נכונה: הוכחתם את ¬¬P.
את הכיוון ההפוך, מ־¬¬P ל־P, נוכיח בשלב 7, בהוכחה בשלילה.`,
        startXml: goalXml('(P → ¬¬P)'),
    },
    {
        id: 'hw-unit3-4',
        levelNumber: 4,
        totalLevels: 10,
        title: 'מסתירה נובע הכול',
        name: 'hw_unit3_l4_exfalso',
        variableLine: 'variable {P Q : Prop}',
        params: '(hp : P) (hn : ¬P)',
        proposition: 'Q',
        goalLabel: 'Q',
        objects: [],
        assumptions: [
            { name: 'hp', prop: 'P' },
            { name: 'hn', prop: '¬P' },
        ],
        toolboxBlocks: ['hw_exfalso', 'hw_contradiction'],
        introduction: `# מסתירה נובע הכול

הפעם המטרה היא Q, ואין לנו שום הנחה על Q. אבל ההנחות שלנו סותרות זו את זו.

מסתירה אפשר להסיק כל טענה. לכן, מה שלא תהיה המטרה, די להגיע לסתירה.
בכתב יד: "מסתירה נובע הכול, ולכן כדי להוכיח Q די להגיע לסתירה".`,
        newTacticsBlocks: ['hw_exfalso'],
        newTacticsInfo: [exfalsoInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "מסתירה נובע הכול, ולכן די להגיע לסתירה" אל תוך בלוק המטרה. עכשיו המטרה היא ⊥.',
            'יש לנו ביד את P ואת השלילה שלה.',
        ],
        conclusion: `הוכחתם את Q בלי לדעת עליה דבר, רק מפני שההנחות סותרות.
הבלוק ${CONTRADICTION_BLOCK} לבדו לא היה מספיק: הוא מסיים רק כשהמטרה היא סתירה.`,
        startXml: goalXml('Q', 'P,  ¬P'),
    },
    {
        id: 'hw-unit3-5',
        levelNumber: 5,
        totalLevels: 10,
        title: 'מוציאים אפשרות',
        name: 'hw_unit3_l5_disjunctive_syllogism',
        variableLine: 'variable {P Q : Prop}',
        params: '(h : (P ∨ Q)) (hn : ¬P)',
        proposition: 'Q',
        goalLabel: 'Q',
        objects: [],
        assumptions: [
            { name: 'h', prop: 'P ∨ Q' },
            { name: 'hn', prop: '¬P' },
        ],
        toolboxBlocks: ['hw_or_elim', 'hw_exfalso', 'hw_contradiction', 'hw_exact'],
        introduction: `# מוציאים אפשרות

ידוע ש־P או Q נכונה, וידוע ש־P לא נכונה. לכן Q נכונה.

כדי להשתמש ב־\`P ∨ Q\` מחלקים למקרים, כמו ביחידה 2. במקרה ש־Q נכונה, היא בדיוק המטרה.
במקרה ש־P נכונה, יש לנו ביד את P ואת השלילה שלה. המקרה הזה בלתי אפשרי, ומסתירה נובע הכול, גם Q.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'נחלק למקרים לפי ה"או" P ∨ Q.',
            'במקרה הראשון, נניח P: מסתירה נובע הכול, ולכן די להגיע לסתירה. יש לנו ביד את P ואת השלילה שלה.',
            'במקרה השני, Q בידינו.',
        ],
        conclusion: `במקרה ש־P נכונה הגעתם לסתירה, ולכן במקרה הזה אפשר להסיק כל דבר.
כך "מוציאים" אפשרות שלא מתקיימת: מראים שהיא מובילה לסתירה.`,
        startXml: goalXml('Q', '(P ∨ Q),  ¬P'),
    },
    {
        id: 'hw-unit3-6',
        levelNumber: 6,
        totalLevels: 10,
        title: 'שלילה של "או"',
        name: 'hw_unit3_l6_de_morgan_or',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '(¬(P ∨ Q) → (¬P ∧ ¬Q))',
        goalLabel: '(¬(P ∨ Q) → (¬P ∧ ¬Q))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['hw_assume', 'hw_and_intro', 'hw_apply_rule', 'hw_or_intro', 'hw_exact'],
        introduction: `# שלילה של "או"

אם לא נכון ש"P או Q", אז P לא נכונה וגם Q לא נכונה. זה אחד מחוקי דה מורגן.

אחרי הנחת התנאי \`¬(P ∨ Q)\`, המטרה היא "וגם", ולכן מוכיחים אותה בשני חלקים. כל חלק הוא שלילה, ולכן בכל חלק מניחים ומגיעים לסתירה.
כדי להגיע לסתירה, השתמשו בשלילה \`¬(P ∨ Q)\` שבידינו: היא הגרירה \`(P ∨ Q) → ⊥\`, ולכן די להוכיח \`P ∨ Q\`.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'נניח את התנאי, ¬(P ∨ Q), ונוכיח את ¬P ∧ ¬Q בשני חלקים.',
            'בחלק "נוכיח ¬P": נניח P ונגיע לסתירה. לפי הגרירה ¬(P ∨ Q), כדי להגיע לסתירה די להוכיח P ∨ Q.',
            'כדי להוכיח P ∨ Q די להוכיח P, ו־P בידינו. החלק "נוכיח ¬Q" דומה, עם Q.',
        ],
        conclusion: `"לא (P או Q)" פירושו "לא P וגם לא Q". בכל חלק השתמשתם בשלילה שבהנחה כמו בגרירה, כדי להגיע לסתירה.`,
        startXml: goalXml('(¬(P ∨ Q) → (¬P ∧ ¬Q))'),
    },
    {
        id: 'hw-unit3-7',
        levelNumber: 7,
        totalLevels: 10,
        title: 'הוכחה בשלילה',
        name: 'hw_unit3_l7_by_contradiction',
        variableLine: 'variable {P : Prop}',
        params: '',
        proposition: '(¬¬P → P)',
        goalLabel: '(¬¬P → P)',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['hw_assume', 'hw_by_contradiction', 'hw_contradiction'],
        introduction: `# הוכחה בשלילה

בשלב 3 הוכחתם ש־P גוררת \`¬¬P\`. עכשיו הכיוון ההפוך: אם לא נכון ש־P לא נכונה, אז P נכונה.

המטרה אחרי הנחת התנאי היא P, ולא שלילה, ולכן אי אפשר להניח ולהגיע לסתירה כמו בשלב 3.
*הוכחה בשלילה* עובדת לכל מטרה: מניחים שהמטרה לא נכונה ומגיעים לסתירה. בכתב יד: "נוכיח בשלילה: נניח ¬P ונגיע לסתירה".

שימו לב להבדל: כדי להוכיח ¬P מניחים P. בהוכחה בשלילה של P מניחים ¬P.`,
        newTacticsBlocks: ['hw_by_contradiction'],
        newTacticsInfo: [byContradictionInfo],
        newDefinitions: [],
        hints: [
            'נניח את התנאי, ¬¬P. המטרה היא P.',
            'גררו את הבלוק "נוכיח בשלילה: נניח שהמטרה לא נכונה ונגיע לסתירה". עכשיו כתוב בו: נניח ¬P.',
            'יש לנו ביד את ¬P ואת השלילה שלה, ¬¬P.',
        ],
        conclusion: `הנחתם ש־P לא נכונה, הגעתם לסתירה, והסקתם את P.
יחד עם שלב 3, ¬¬P ו־P שקולות.`,
        startXml: goalXml('(¬¬P → P)'),
    },
    {
        id: 'hw-unit3-8',
        levelNumber: 8,
        totalLevels: 10,
        title: 'הכיוון ההפוך של קונטרה־פוזיציה',
        name: 'hw_unit3_l8_contrapositive',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '((¬Q → ¬P) → (P → Q))',
        goalLabel: '((¬Q → ¬P) → (P → Q))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['hw_assume', 'hw_by_contradiction', 'hw_forward', 'hw_contradiction'],
        introduction: `# קונטרה־פוזיציה

הגרירה \`¬Q → ¬P\` נקראת *הקונטרה־פוזיציה* של \`P → Q\`. משלב 2 נובע שמ־\`P → Q\` נובעת \`¬Q → ¬P\`.
כאן נוכיח את הכיוון ההפוך: מ־\`¬Q → ¬P\` נובעת \`P → Q\`. לכן הגרירה והקונטרה־פוזיציה שלה שקולות.

אחרי שמניחים את \`¬Q → ¬P\` ואת P, המטרה היא Q, ואין דרך ישירה להגיע אליה. נוכיח אותה בשלילה.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'נניח ¬Q → ¬P, ואחר כך נניח P. המטרה היא Q.',
            'נוכיח בשלילה: נניח ¬Q ונגיע לסתירה.',
            'מהגרירה ¬Q → ¬P ומ־¬Q נובע ¬P, ויש לנו ביד את P ואת השלילה שלה.',
        ],
        conclusion: `גרירה והקונטרה־פוזיציה שלה שקולות. זו דרך נפוצה להוכיח גרירה P → Q:
מניחים ש־Q לא נכונה, ומראים ש־P לא נכונה.`,
        startXml: goalXml('((¬Q → ¬P) → (P → Q))'),
    },
    {
        id: 'hw-unit3-9',
        levelNumber: 9,
        totalLevels: 10,
        title: 'שתי אפשרויות',
        name: 'hw_unit3_l9_by_cases',
        variableLine: 'variable {P Q : Prop}',
        params: '(hpq : (P → Q)) (hnpq : (¬P → Q))',
        proposition: 'Q',
        goalLabel: 'Q',
        objects: [],
        assumptions: [
            { name: 'hpq', prop: 'P → Q' },
            { name: 'hnpq', prop: '¬P → Q' },
        ],
        toolboxBlocks: ['hw_by_cases', 'hw_apply_rule', 'hw_forward', 'hw_exact'],
        introduction: `# שתי אפשרויות

Q נובעת מ־P, וגם מ־¬P. אבל לא ידוע אם P נכונה או לא.

כל טענה נכונה או לא נכונה. לכן אפשר לבדוק את שתי האפשרויות, כמו בחלוקה למקרים של יחידה 2:
מוכיחים את Q פעם בהנחה P, ופעם בהנחה ¬P.
בכל מקרה ההנחה החדשה היא התנאי של אחת הגרירות, ולכן אפשר ללכת אחורה או קדימה.`,
        newTacticsBlocks: ['hw_by_cases'],
        newTacticsInfo: [byCasesInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "נבדוק את שתי האפשרויות: הטענה ? נכונה או לא נכונה", ובחרו בו P (בכתיבה ידנית). עכשיו כתוב בו: מקרה ראשון: נניח P, ומקרה שני: נניח ¬P.',
            'במקרה הראשון: לפי הגרירה P → Q, די להוכיח P, ו־P בידינו. או קדימה: מהגרירה P → Q ומ־P נובע Q.',
            'במקרה השני: באותו אופן, בעזרת ¬P → Q ו־¬P.',
        ],
        conclusion: `לא ידעתם אם P נכונה, אבל בשתי האפשרויות Q נכונה, ולכן Q נכונה.`,
        startXml: goalXml('Q', '(P → Q),  (¬P → Q)'),
    },
    {
        id: 'hw-unit3-10',
        levelNumber: 10,
        totalLevels: 10,
        title: 'שלב בונוס: שלילה של "וגם"',
        name: 'hw_unit3_l10_de_morgan_and',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '(¬(P ∧ Q) → (¬P ∨ ¬Q))',
        goalLabel: '(¬(P ∧ Q) → (¬P ∨ ¬Q))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['hw_assume', 'hw_by_cases', 'hw_or_intro', 'hw_apply_rule', 'hw_and_intro', 'hw_and_combine', 'hw_forward', 'hw_exact'],
        introduction: `# בונוס: שלילה של "וגם"

אם לא נכון ש"P וגם Q", אז P לא נכונה או Q לא נכונה. זה חוק דה מורגן השני.

המטרה אחרי הנחת התנאי היא "או". כמו ביחידה 2, אל תבחרו צד מוקדם מדי: לא ידוע איזו מהטענות לא נכונה.
בדקו קודם את שתי האפשרויות לגבי P, ורק בתוך כל מקרה בחרו את הצד שאפשר להוכיח.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'נניח את התנאי, ¬(P ∧ Q), ונבדוק את שתי האפשרויות לגבי P.',
            'במקרה ש־P לא נכונה: כדי להוכיח ¬P ∨ ¬Q די להוכיח ¬P, וזה בידינו.',
            'במקרה ש־P נכונה: די להוכיח ¬Q. נניח Q ונגיע לסתירה: לפי הגרירה ¬(P ∧ Q), די להוכיח P ∧ Q.',
        ],
        conclusion: `סיימתם את יחידה 3, כולל שלב הבונוס! מ"לא (P וגם Q)" הסקתם "לא P או לא Q".
יחד עם שלב 6 אלה חוקי דה מורגן: שלילה הופכת "וגם" ל"או", ו"או" ל"וגם".`,
        startXml: goalXml('(¬(P ∧ Q) → (¬P ∨ ¬Q))'),
    },
];
