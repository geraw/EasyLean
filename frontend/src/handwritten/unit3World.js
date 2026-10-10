import { goalXml } from '../game/levelXml';

// Unit 3 of the handwritten version (see blocks.js): the levels of
// game/unit3World.js, written as a proof is written by hand. Moves that add
// a general fact ("סתירה גוררת כל טענה") ask for a statement, and offer the
// goal and the assumptions in hand.

export const unit3WorldName = 'יחידה 3 - שלילה והוכחה בשלילה';

const contradictionInfo = {
    name: 'סתירה',
    doc: 'טענה ושלילתה לא יכולות להיות נכונות יחד. אם יש בידינו גם P וגם ¬P, הגענו לסתירה (⊥). בכתב יד: "יש לנו ביד את P ואת השלילה שלה, וזו סתירה".',
};

const nonContradictionInfo = {
    name: 'עיקרון הסתירה',
    doc: 'לכל טענה P, הגרירה (P ∧ ¬P) → ⊥ נכונה: טענה ושלילתה יחד הן סתירה. הגרירה מצטרפת להנחות, ומשתמשים בה כמו בכל גרירה, אחורה או קדימה.',
};

const falseImpliesInfo = {
    name: 'סתירה גוררת כל טענה',
    doc: 'הגרירה ⊥ → Q נכונה לכל טענה Q: מסתירה נובע הכול. הגרירה מצטרפת להנחות. כמו בכל גרירה שהמסקנה שלה היא המטרה, אפשר לעבור להוכיח את התנאי שלה, כלומר להגיע לסתירה.',
};

const notIntroInfo = {
    name: 'הוכחת שלילה',
    doc: 'כדי להוכיח ¬P מניחים את P ומגיעים לסתירה: אם P מובילה לסתירה, P לא נכונה. בכתב יד: "כדי להוכיח ¬P נניח P ונגיע לסתירה".',
};

const notElimInfo = {
    name: 'שימוש בשלילה',
    doc: 'אם בידינו ¬P והמטרה היא סתירה, די להוכיח את P: יחד עם ¬P זו סתירה. בכתב יד: "לפי ¬P, כדי להגיע לסתירה די להוכיח P".',
};

const byContradictionInfo = {
    name: 'הוכחה בשלילה',
    doc: 'כדי להוכיח P מניחים ש־P לא נכונה (¬P) ומגיעים לסתירה. אם ¬P מובילה לסתירה, היא לא נכונה, ולכן P נכונה. הבלוק מתאים לכל מטרה.',
};

const byCasesInfo = {
    name: 'בדיקת שתי האפשרויות',
    doc: 'כל טענה P נכונה או לא נכונה (חוק השלישי מן הנמנע). לכן אפשר להוכיח את המטרה פעם בהנחה P, ופעם בהנחה ¬P.',
};

const CONTRADICTION = 'סתירה (⊥)';

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
        toolboxBlocks: ['hw_contradiction'],
        introduction: `# שלילה וסתירה

הטענה \`¬P\` נקראת "לא P", והיא אומרת ש־P לא נכונה.

טענה ושלילתה לא יכולות להיות נכונות יחד. אם יש בידינו גם P וגם ¬P, הגענו ל*סתירה*, שמסמנים \`⊥\`.

כאן נתונות ההנחות P ו־\`¬P\`, והמטרה היא להגיע לסתירה. בכתב יד: "יש לנו ביד את P ואת השלילה שלה, וזו סתירה".`,
        newTacticsBlocks: ['hw_contradiction'],
        newTacticsInfo: [contradictionInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "יש לנו ביד את ? ואת השלילה שלה, וזו סתירה." אל תוך בלוק המטרה, ובחרו בו P.',
        ],
        conclusion: `¬P אומרת בדיוק ש־P לא נכונה, ולכן שתיהן יחד הן סתירה.`,
        startXml: goalXml(CONTRADICTION, 'P,  ¬P'),
    },
    {
        id: 'hw-unit3-2',
        levelNumber: 2,
        totalLevels: 10,
        title: 'עיקרון הסתירה',
        name: 'hw_unit3_l2_non_contradiction',
        variableLine: 'variable {P : Prop}',
        params: '(hp : P) (hn : ¬P)',
        proposition: 'False',
        goalLabel: CONTRADICTION,
        objects: [],
        assumptions: [
            { name: 'hp', prop: 'P' },
            { name: 'hn', prop: '¬P' },
        ],
        toolboxBlocks: ['hw_non_contradiction', 'hw_and_combine', 'hw_and_intro', 'hw_apply_rule', 'hw_forward', 'hw_exact'],
        introduction: `# עיקרון הסתירה

בשלב 1 הגעתם לסתירה בבלוק אחד. כאן נגיע לאותה מסקנה מעיקרון כללי, שנכתוב כגרירה:
*עיקרון הסתירה* אומר שטענה ושלילתה לא נכונות יחד, כלומר \`(P ∧ ¬P) → ⊥\`.

הבלוק "לפי עיקרון הסתירה..." מוסיף את הגרירה הזאת להנחות, ומשתמשים בה כמו בכל גרירה, באחת משתי הדרכים:
אחורה: המסקנה שלה היא המטרה ⊥, ולכן די להוכיח את התנאי שלה, \`P ∧ ¬P\`, בשני חלקים.
או קדימה: מ־P ומ־¬P נובע \`P ∧ ¬P\` (כמו ביחידה 2, שלב 3), ומהגרירה ומהתנאי שלה נובעת סתירה.`,
        // Combining into an "and" (hw_and_combine) is introduced in unit 2, level 3.
        newTacticsBlocks: ['hw_non_contradiction'],
        newTacticsInfo: [nonContradictionInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "לפי עיקרון הסתירה, הטענה ? ושלילתה גוררות סתירה", ובחרו בו P. עכשיו כתוב בו: נובע ((P ∧ ¬P) → ⊥).',
            'אחורה: לפי הגרירה (P ∧ ¬P) → ⊥, די להוכיח P ∧ ¬P. הוכיחו אותו בשני חלקים.',
            'או קדימה: מ־P ומ־¬P נובע P ∧ ¬P, ומהגרירה (P ∧ ¬P) → ⊥ ומ־P ∧ ¬P נובעת סתירה.',
        ],
        conclusion: `הגעתם לסתירה מעיקרון הסתירה, כמו מכל גרירה אחרת.
הבלוק "יש לנו ביד את P ואת השלילה שלה" משלב 1 הוא קיצור של אותו עיקרון: מטענה ושלילתה נובעת סתירה בצעד אחד.`,
        startXml: goalXml(CONTRADICTION, 'P,  ¬P'),
    },
    {
        id: 'hw-unit3-3',
        levelNumber: 3,
        totalLevels: 10,
        title: 'מסתירה נובע הכול',
        name: 'hw_unit3_l3_exfalso',
        variableLine: 'variable {P Q : Prop}',
        params: '(hp : P) (hn : ¬P)',
        proposition: 'Q',
        goalLabel: 'Q',
        objects: [],
        assumptions: [
            { name: 'hp', prop: 'P' },
            { name: 'hn', prop: '¬P' },
        ],
        toolboxBlocks: ['hw_false_implies', 'hw_apply_rule', 'hw_forward', 'hw_contradiction', 'hw_exact'],
        introduction: `# מסתירה נובע הכול

הפעם המטרה היא Q, ואין לנו שום הנחה על Q. אבל ההנחות שלנו סותרות זו את זו.

מסתירה אפשר להסיק כל טענה: הגרירה \`⊥ → Q\` ("סתירה גוררת Q") נכונה תמיד, מה ש־Q לא תהיה.
הבלוק "סתירה גוררת כל טענה, ובפרט את ?" מוסיף אותה להנחות. המסקנה שלה היא בדיוק המטרה Q, ולכן, כמו ביחידה 1, די להוכיח את התנאי שלה: להגיע לסתירה.

אפשר גם ללכת קדימה. שלילה היא בעצם גרירה: ¬P אומרת "אם P, אז סתירה", כלומר \`P → ⊥\`.
לכן מהגרירה ¬P ומ־P נובעת סתירה, ומהגרירה \`⊥ → Q\` ומהסתירה נובעת Q.`,
        newTacticsBlocks: ['hw_false_implies'],
        newTacticsInfo: [falseImpliesInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "סתירה גוררת כל טענה, ובפרט את ?" אל תוך בלוק המטרה, ובחרו בו Q. עכשיו כתוב בו: נובע (⊥ → Q).',
            'לפי הגרירה ⊥ → Q, כדי להוכיח Q די להוכיח ⊥.',
            'עכשיו המטרה היא סתירה, כמו בשלב 1.',
            'או קדימה: מהגרירה ¬P ומ־P נובעת סתירה (⊥), ומהגרירה ⊥ → Q ומ־⊥ נובע Q.',
        ],
        conclusion: `הוכחתם את Q בלי לדעת עליה דבר, רק מפני שההנחות סותרות: סתירה גוררת Q, ומההנחות הגעתם לסתירה.
הבלוק "יש לנו ביד את P ואת השלילה שלה" לבדו לא היה מספיק: הוא מסיים רק כשהמטרה היא סתירה.`,
        startXml: goalXml('Q', 'P,  ¬P'),
    },
    {
        id: 'hw-unit3-4',
        levelNumber: 4,
        totalLevels: 10,
        title: 'מוכיחים שלילה',
        name: 'hw_unit3_l4_not_intro',
        variableLine: 'variable {P : Prop}',
        params: '(hp : P)',
        proposition: '¬¬P',
        goalLabel: '¬¬P',
        objects: [],
        assumptions: [{ name: 'hp', prop: 'P' }],
        toolboxBlocks: ['hw_not_intro', 'hw_contradiction', 'hw_forward', 'hw_exact'],
        introduction: `# מוכיחים שלילה

כדי להוכיח ש־P לא נכונה (\`¬P\`), מניחים ש־P כן נכונה ומגיעים לסתירה. אם ההנחה מובילה לסתירה, היא לא נכונה.

כאן המטרה היא \`¬¬P\`: "לא נכון ש־P לא נכונה". זו שלילה של \`¬P\`, ולכן נניח את \`¬P\` וננסה להגיע לסתירה.
בכתב יד: "כדי להוכיח ¬¬P נניח ¬P ונגיע לסתירה". ההנחה P כבר בידינו, ולכן זה לא קשה.`,
        newTacticsBlocks: ['hw_not_intro'],
        newTacticsInfo: [notIntroInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "כדי להוכיח את השלילה, נניח את הטענה שהיא שוללת ונגיע לסתירה" אל תוך בלוק המטרה. עכשיו כתוב בו: נניח ¬P.',
            'יש לנו ביד את P ואת השלילה שלה, ¬P: הגענו לסתירה.',
        ],
        conclusion: `הנחתם את ¬P, והגעתם לסתירה עם P, ולכן ¬P לא נכונה: הוכחתם את ¬¬P.
זו הדרך הישירה להוכיח שלילה: מניחים את הטענה שהיא שוללת ומגיעים לסתירה.

כמו בשלב 3, שלילה היא גם גרירה: ¬P היא P → ⊥.
לכן גם כאן אפשר להסיק קדימה: מהגרירה ¬P ומ־P נובעת סתירה.`,
        startXml: goalXml('¬¬P', 'P'),
    },
    {
        id: 'hw-unit3-5',
        levelNumber: 5,
        totalLevels: 10,
        title: 'משתמשים בשלילה',
        name: 'hw_unit3_l5_modus_tollens',
        variableLine: 'variable {P Q : Prop}',
        params: '(h : (P → Q)) (hnq : ¬Q)',
        proposition: '¬P',
        goalLabel: '¬P',
        objects: [],
        assumptions: [
            { name: 'h', prop: 'P → Q' },
            { name: 'hnq', prop: '¬Q' },
        ],
        toolboxBlocks: ['hw_not_intro', 'hw_not_elim', 'hw_apply_rule', 'hw_forward', 'hw_contradiction', 'hw_exact'],
        introduction: `# משתמשים בשלילה

אם P גוררת את Q, ו־Q לא נכונה, אז גם P לא נכונה. נוכיח את זה.

המטרה היא \`¬P\`, ולכן נניח את P וננסה להגיע לסתירה. אבל אין בידינו P וגם ¬P, אלא ¬Q.
כשהמטרה היא סתירה ויש בידינו שלילה \`¬Q\`, די להוכיח את Q: יחד עם ¬Q זו סתירה.
בכתב יד: "לפי ¬Q, כדי להגיע לסתירה די להוכיח Q".

אפשר גם ללכת קדימה: מ־P → Q ומ־P נובע Q, ואז יש לנו ביד את Q ואת השלילה שלה, כמו בשלב 1.`,
        newTacticsBlocks: ['hw_not_elim'],
        newTacticsInfo: [notElimInfo],
        newDefinitions: [],
        hints: [
            'כדי להוכיח ¬P, נניח P ונגיע לסתירה.',
            'גררו את הבלוק "לפי השלילה ? שיש לנו ביד" ובחרו בו ¬Q. עכשיו כתוב בו: כדי להגיע לסתירה די להוכיח Q.',
            'לפי הגרירה P → Q, כדי להוכיח Q די להוכיח P, ו־P בידינו.',
            'או קדימה: מהגרירה P → Q ומ־P נובע Q, ויש לנו ביד את Q ואת השלילה שלה.',
        ],
        conclusion: `מ־P → Q ומ־¬Q הסקתם ¬P (modus tollens). אחורה, השתמשתם בשלילה ¬Q: הוכחתם את מה שהיא שוללת.
קדימה, הסקתם את Q, והיא ו־¬Q סותרות. בשלבים הבאים יופיעו שלילות של טענות שאין דרך להגיע אליהן קדימה, ושם השימוש בשלילה הכרחי.`,
        startXml: goalXml('¬P', '(P → Q),  ¬Q'),
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
        toolboxBlocks: ['hw_assume', 'hw_and_intro', 'hw_not_intro', 'hw_not_elim', 'hw_or_intro', 'hw_exact'],
        introduction: `# שלילה של "או"

אם לא נכון ש"P או Q", אז P לא נכונה וגם Q לא נכונה. זה אחד מחוקי דה מורגן.

אחרי הנחת התנאי \`¬(P ∨ Q)\`, המטרה היא "וגם", ולכן מוכיחים אותה בשני חלקים. כל חלק הוא שלילה.
בכל חלק, כדי להגיע לסתירה, השתמשו בשלילה \`¬(P ∨ Q)\`: די להוכיח את "P או Q".`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'נניח את התנאי, ¬(P ∨ Q), ונוכיח את ¬P ∧ ¬Q בשני חלקים.',
            'בחלק "נוכיח ¬P": נניח P ונגיע לסתירה. לפי השלילה ¬(P ∨ Q), די להוכיח P ∨ Q.',
            'כדי להוכיח P ∨ Q די להוכיח P, ו־P בידינו. החלק "נוכיח ¬Q" דומה, עם Q.',
        ],
        conclusion: `"לא (P או Q)" פירושו "לא P וגם לא Q". בכל חלק השתמשתם בשלילה שבהנחה כדי להגיע לסתירה.`,
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

בשלב 4 הוכחתם ש־P גוררת \`¬¬P\`. עכשיו הכיוון ההפוך: אם לא נכון ש־P לא נכונה, אז P נכונה.

המטרה אחרי הנחת התנאי היא P, ולא שלילה, ולכן אי אפשר להוכיח אותה כמו בשלב 4.
*הוכחה בשלילה* עובדת לכל מטרה: מניחים שהמטרה לא נכונה ומגיעים לסתירה. בכתב יד: "נוכיח בשלילה: נניח ¬P ונגיע לסתירה".

שימו לב להבדל: כדי להוכיח ¬P מניחים P (שלב 4). בהוכחה בשלילה של P מניחים ¬P.`,
        newTacticsBlocks: ['hw_by_contradiction'],
        newTacticsInfo: [byContradictionInfo],
        newDefinitions: [],
        hints: [
            'נניח את התנאי, ¬¬P. המטרה היא P.',
            'גררו את הבלוק "נוכיח בשלילה: נניח שהמטרה לא נכונה ונגיע לסתירה". עכשיו כתוב בו: נניח ¬P.',
            'יש לנו ביד את ¬P ואת השלילה שלה, ¬¬P: הגענו לסתירה.',
        ],
        conclusion: `הנחתם ש־P לא נכונה, הגעתם לסתירה, והסקתם את P.
יחד עם שלב 4, ¬¬P ו־P שקולות.`,
        startXml: goalXml('(¬¬P → P)'),
    },
    {
        id: 'hw-unit3-8',
        levelNumber: 8,
        totalLevels: 10,
        title: 'שתי אפשרויות',
        name: 'hw_unit3_l8_by_cases',
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

כל טענה נכונה או לא נכונה (*חוק השלישי מן הנמנע*, \`P ∨ ¬P\`). לכן אפשר לבדוק את שתי האפשרויות,
כמו בחלוקה למקרים של יחידה 2: מוכיחים את Q פעם בהנחה P, ופעם בהנחה ¬P.
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
        id: 'hw-unit3-9',
        levelNumber: 9,
        totalLevels: 10,
        title: 'תרגיל מסכם: שלילה של "וגם"',
        name: 'hw_unit3_l9_de_morgan_and',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '(¬(P ∧ Q) → (¬P ∨ ¬Q))',
        goalLabel: '(¬(P ∧ Q) → (¬P ∨ ¬Q))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['hw_assume', 'hw_by_cases', 'hw_or_intro', 'hw_not_intro', 'hw_not_elim', 'hw_and_intro', 'hw_and_combine', 'hw_forward', 'hw_exact'],
        introduction: `# תרגיל מסכם: שלילה של "וגם"

אם לא נכון ש"P וגם Q", אז P לא נכונה או Q לא נכונה. זה חוק דה מורגן השני.

המטרה אחרי הנחת התנאי היא "או". כמו ביחידה 2, אל תבחרו צד מוקדם מדי: לא ידוע איזו מהטענות לא נכונה.
בדקו קודם את שתי האפשרויות לגבי P, ורק בתוך כל מקרה בחרו את הצד שאפשר להוכיח.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'נניח את התנאי, ¬(P ∧ Q), ונבדוק את שתי האפשרויות לגבי P.',
            'במקרה ש־P לא נכונה: כדי להוכיח ¬P ∨ ¬Q די להוכיח ¬P, וזה בידינו.',
            'במקרה ש־P נכונה: די להוכיח ¬Q. נניח Q ונגיע לסתירה בעזרת השלילה ¬(P ∧ Q): די להוכיח P ∧ Q.',
        ],
        conclusion: `מ"לא (P וגם Q)" הסקתם "לא P או לא Q", בבדיקת שתי האפשרויות לגבי P.
יחד עם שלב 6 אלה חוקי דה מורגן: שלילה הופכת "וגם" ל"או", ו"או" ל"וגם".`,
        startXml: goalXml('(¬(P ∧ Q) → (¬P ∨ ¬Q))'),
    },
    {
        id: 'hw-unit3-10',
        levelNumber: 10,
        totalLevels: 10,
        title: 'שלב בונוס: שלילה של גרירה',
        name: 'hw_unit3_l10_not_imp',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '(¬(P → Q) → ¬¬P)',
        goalLabel: '(¬(P → Q) → ¬¬P)',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['hw_assume', 'hw_not_intro', 'hw_not_elim', 'hw_false_implies', 'hw_apply_rule', 'hw_contradiction'],
        introduction: `# בונוס: שלילה של גרירה

אם הגרירה \`P → Q\` לא נכונה, אז לא נכון ש־P לא נכונה.
(למה? אם P לא הייתה נכונה, הגרירה הייתה נכונה: מטענה לא נכונה נובע הכול.)

בכל צעד בדקו במצב ההוכחה מה בידכם ומה המטרה.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'נניח את התנאי, ¬(P → Q). כדי להוכיח ¬¬P, נניח ¬P ונגיע לסתירה.',
            'לפי השלילה ¬(P → Q), כדי להגיע לסתירה די להוכיח P → Q.',
            'נניח P. המטרה היא Q, ואין עליה הנחות, אבל P ו־¬P סותרות: סתירה גוררת Q, ולכן די להגיע לסתירה.',
        ],
        conclusion: `סיימתם את יחידה 3, כולל שלב הבונוס! אתם יודעים להגיע לסתירה, להוכיח שלילה ולהשתמש בה,
להוכיח בשלילה ולבדוק את שתי האפשרויות.`,
        startXml: goalXml('(¬(P → Q) → ¬¬P)'),
    },
];
