import { goalXml } from './levelXml';

export const unit3WorldName = 'יחידה 3 - שלילה והוכחה בשלילה';

const contradictionInfo = {
    name: 'סתירה',
    doc: 'טענה ושלילתה לא יכולות להיות נכונות יחד. אם יש בידינו גם P וגם ¬P, הגענו לסתירה (⊥).',
};

const falseImpliesInfo = {
    name: 'סתירה גוררת כל טענה',
    doc: 'הגרירה ⊥ → Q נכונה לכל טענה Q: מסתירה נובע הכול. כמו בכל גרירה שהמסקנה שלה היא המטרה, אפשר לעבור להוכיח את התנאי שלה, כלומר להגיע לסתירה.',
};

const nonContradictionInfo = {
    name: 'עיקרון הסתירה',
    doc: 'לכל טענה P, הגרירה (P ∧ ¬P) → ⊥ נכונה: טענה ושלילתה יחד הן סתירה. משתמשים בה כמו בכל גרירה, אחורה או קדימה.',
};

const notIntroInfo = {
    name: 'הוכחת שלילה',
    doc: 'כדי להוכיח ¬P מניחים את P ומגיעים לסתירה: אם P מובילה לסתירה, P לא נכונה.',
};

const notElimInfo = {
    name: 'שימוש בשלילה',
    doc: 'אם בידינו ¬P והמטרה היא סתירה, מספיק להוכיח את P: יחד עם ¬P זו סתירה.',
};

const byContradictionInfo = {
    name: 'הוכחה בשלילה',
    doc: 'כדי להוכיח P מניחים ש־P לא נכונה (¬P) ומגיעים לסתירה. זה עיקרון של הלוגיקה הקלאסית: מכך ש־¬P מובילה לסתירה מסיקים את P עצמה.',
};

const byCasesInfo = {
    name: 'בדיקת שתי האפשרויות',
    doc: 'כל טענה P נכונה או לא נכונה (חוק השלישי מן הנמנע). לכן אפשר להוכיח את המטרה פעם בהנחה P, ופעם בהנחה ¬P. גם זה עיקרון של הלוגיקה הקלאסית.',
};

// Shown with the levels that use classical logic, as forall x and Logic and
// Proof flag them: not everything is provable without these principles.
const CLASSICAL_NOTE = '*עיקרון קלאסי:* בשלב הזה משתמשים בעיקרון שלא נובע מהכללים הקודמים. הלוגיקה שלומדים בקורס מקבלת אותו, אבל כדאי לדעת מתי משתמשים בו.';

export const unit3Levels = [
    {
        id: 'unit3-1',
        levelNumber: 1,
        totalLevels: 10,
        title: 'טענה ושלילתה',
        name: 'unit3_l1_contradiction',
        variableLine: 'variable {P : Prop}',
        params: '(hp : P) (hn : ¬P)',
        proposition: 'False',
        goalLabel: 'סתירה (⊥)',
        objects: [],
        assumptions: [
            { name: 'hp', prop: 'P' },
            { name: 'hn', prop: '¬P' },
        ],
        toolboxBlocks: ['logic_contradiction'],
        introduction: `# שלילה וסתירה

הטענה \`¬P\` נקראת "לא P", והיא אומרת ש־P לא נכונה.

טענה ושלילתה לא יכולות להיות נכונות יחד. אם יש בידינו גם P וגם ¬P, הגענו ל*סתירה*, שמסמנים \`⊥\`.

כאן נתונות ההנחות \`hp : P\` ו־\`hn : ¬P\`, והמטרה היא להגיע לסתירה.`,
        newTacticsBlocks: ['logic_contradiction'],
        newTacticsInfo: [contradictionInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "ההנחה ? היא השלילה של ההנחה ?, ולכן הגענו לסתירה" אל תוך בלוק המטרה, וכתבו בו hn ו־hp.',
        ],
        conclusion: `hn אומרת בדיוק ש־hp לא נכונה, ולכן שתיהן יחד הן סתירה.`,
        startXml: goalXml('סתירה (⊥)', 'hp : P,  hn : ¬P'),
    },
    {
        id: 'unit3-2',
        levelNumber: 2,
        totalLevels: 10,
        title: 'עיקרון הסתירה',
        name: 'unit3_l2_non_contradiction',
        variableLine: 'variable {P : Prop}',
        params: '(hp : P) (hn : ¬P)',
        proposition: 'False',
        goalLabel: 'סתירה (⊥)',
        objects: [],
        assumptions: [
            { name: 'hp', prop: 'P' },
            { name: 'hn', prop: '¬P' },
        ],
        toolboxBlocks: ['logic_non_contradiction', 'logic_and_combine', 'logic_and_intro', 'tactic_apply_rule', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# עיקרון הסתירה

בשלב 1 הגעתם לסתירה בבלוק אחד. כאן נגיע לאותה מסקנה מעיקרון כללי, שנכתוב כגרירה:
*עיקרון הסתירה* אומר שטענה ושלילתה לא נכונות יחד, כלומר \`(P ∧ ¬P) → ⊥\`.

נוסיף את העיקרון להנחות, ונשתמש בו כמו בכל גרירה, באחת משתי הדרכים:
אחורה: המסקנה שלו היא המטרה ⊥, ולכן נעבור להוכיח את התנאי שלו, \`P ∧ ¬P\`, בשני חלקים.
או קדימה: נצרף את hp ואת hn להנחה אחת, \`P ∧ ¬P\` (כמו ביחידה 2, שלב 3), ומהעיקרון ומהתנאי שלו נסיק סתירה.`,
        // "צירוף ל'וגם'" (logic_and_combine) is introduced in unit 2, level 3.
        newTacticsBlocks: ['logic_non_contradiction'],
        newTacticsInfo: [nonContradictionInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "נשתמש בעיקרון הסתירה: הטענה ? ושלילתה גוררות סתירה", וכתבו בו P ושם לגרירה, למשל hc. יש בידינו hc : (P ∧ ¬P) → ⊥.',
            'אחורה: המסקנה של hc היא ⊥, ולכן עברו להוכיח את התנאי שלה, P ∧ ¬P, והוכיחו אותו בשני חלקים בעזרת hp ו־hn.',
            'או קדימה: צרפו את hp ואת hn להנחה אחת (למשל hpn : P ∧ ¬P), הסיקו מ־hc ומ־hpn סתירה, וסגרו בעזרתה.',
        ],
        conclusion: `הגעתם לסתירה מעיקרון הסתירה, כמו מכל גרירה אחרת.
הבלוק "הגענו לסתירה" משלב 1 הוא קיצור של אותו עיקרון: מטענה ושלילתה נובעת סתירה בצעד אחד.`,
        startXml: goalXml('סתירה (⊥)', 'hp : P,  hn : ¬P'),
    },
    {
        id: 'unit3-3',
        levelNumber: 3,
        totalLevels: 10,
        title: 'מסתירה נובע הכול',
        name: 'unit3_l2_exfalso',
        variableLine: 'variable {P Q : Prop}',
        params: '(hp : P) (hn : ¬P)',
        proposition: 'Q',
        goalLabel: 'Q',
        objects: [],
        assumptions: [
            { name: 'hp', prop: 'P' },
            { name: 'hn', prop: '¬P' },
        ],
        toolboxBlocks: ['logic_false_implies', 'tactic_apply_rule', 'logic_modus_ponens', 'logic_contradiction', 'tactic_exact'],
        introduction: `# מסתירה נובע הכול

הפעם המטרה היא Q, ואין לנו שום הנחה על Q. אבל ההנחות שלנו סותרות זו את זו.

מסתירה אפשר להסיק כל טענה: הגרירה \`⊥ → Q\` ("סתירה גוררת Q") נכונה תמיד, מה ש־Q לא תהיה.
נוסיף אותה להנחות. המסקנה שלה היא בדיוק המטרה Q, ולכן, כמו ביחידה 1, אפשר לעבור להוכיח את התנאי שלה: להגיע לסתירה.

אפשר גם ללכת קדימה. שלילה היא בעצם גרירה: ¬P אומרת "אם P, אז סתירה", כלומר \`P → ⊥\`.
לכן מהגרירה hn ומהתנאי שלה hp נובעת סתירה, ומהסתירה ומהגרירה \`⊥ → Q\` נובעת Q.`,
        newTacticsBlocks: ['logic_false_implies'],
        newTacticsInfo: [falseImpliesInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "נשתמש בגרירה: סתירה גוררת ?, ונקרא לה ?", וכתבו בו Q ושם לגרירה, למשל hf. יש בידינו hf : ⊥ → Q.',
            'המסקנה של hf היא Q: השתמשו בבלוק המעבר לתנאי של גרירה עם hf. המטרה תהיה ⊥.',
            'עכשיו המטרה היא סתירה, כמו בשלב 1.',
            'או קדימה: מ־hn ומ־hp הסיקו סתירה (למשל hb : ⊥), ומ־hf ומ־hb הסיקו את Q, וסגרו בעזרתה.',
        ],
        conclusion: `הוכחתם את Q בלי לדעת עליה דבר, רק מפני שההנחות סותרות: סתירה גוררת Q, ומההנחות הגעתם לסתירה.
הבלוק "הגענו לסתירה" לבדו לא היה מספיק: הוא סוגר רק מטרה שהיא סתירה.`,
        startXml: goalXml('Q', 'hp : P,  hn : ¬P'),
    },
    {
        id: 'unit3-4',
        levelNumber: 4,
        totalLevels: 10,
        title: 'מוכיחים שלילה',
        name: 'unit3_l3_not_intro',
        variableLine: 'variable {P : Prop}',
        params: '(hp : P)',
        proposition: '¬¬P',
        goalLabel: '¬¬P',
        objects: [],
        assumptions: [{ name: 'hp', prop: 'P' }],
        toolboxBlocks: ['logic_not_intro', 'logic_contradiction', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# מוכיחים שלילה

כדי להוכיח ש־P לא נכונה (\`¬P\`), מניחים ש־P כן נכונה ומגיעים לסתירה. אם ההנחה מובילה לסתירה, היא לא נכונה.

כאן המטרה היא \`¬¬P\`: "לא נכון ש־P לא נכונה". זו שלילה של \`¬P\`, ולכן נניח את \`¬P\` וננסה להגיע לסתירה.
ההנחה hp אומרת P, ולכן זה לא קשה.`,
        newTacticsBlocks: ['logic_not_intro'],
        newTacticsInfo: [notIntroInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "נוכיח את השלילה: נניח את הטענה שהיא שוללת" וקראו להנחה hn. יש בידינו hn : ¬P, והמטרה היא סתירה.',
            'hn היא השלילה של hp: השתמשו בבלוק "הגענו לסתירה".',
        ],
        conclusion: `הנחתם את ¬P, והגעתם לסתירה עם hp, ולכן ¬P לא נכונה: הוכחתם את ¬¬P.
זו הדרך הישירה להוכיח שלילה: מניחים את הטענה שהיא שוללת ומגיעים לסתירה.

כמו בשלב 3, שלילה היא גם גרירה: ¬P היא P → ⊥.
לכן גם כאן אפשר להסיק קדימה: מהגרירה hn ומהתנאי שלה hp נובעת סתירה. הבלוק "הגענו לסתירה" עושה את אותו הדבר בצעד אחד.`,
        startXml: goalXml('¬¬P', 'hp : P'),
    },
    {
        id: 'unit3-5',
        levelNumber: 5,
        totalLevels: 10,
        title: 'משתמשים בשלילה',
        name: 'unit3_l4_modus_tollens',
        variableLine: 'variable {P Q : Prop}',
        params: '(h : (P → Q)) (hnq : ¬Q)',
        proposition: '¬P',
        goalLabel: '¬P',
        objects: [],
        assumptions: [
            { name: 'h', prop: 'P → Q' },
            { name: 'hnq', prop: '¬Q' },
        ],
        toolboxBlocks: ['logic_not_intro', 'logic_not_elim', 'tactic_apply_rule', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# משתמשים בשלילה

אם P גוררת את Q, ו־Q לא נכונה, אז גם P לא נכונה. נוכיח את זה.

המטרה היא \`¬P\`, ולכן נניח את P וננסה להגיע לסתירה. אבל אין בידינו P וגם ¬P, אלא ¬Q.
כשהמטרה היא סתירה ויש בידינו שלילה \`¬Q\`, מספיק להוכיח את Q: יחד עם ¬Q זו סתירה.`,
        newTacticsBlocks: ['logic_not_elim'],
        newTacticsInfo: [notElimInfo],
        newDefinitions: [],
        hints: [
            'הניחו את P (בבלוק הוכחת השלילה) וקראו לה hp.',
            'השתמשו בבלוק "נגיע לסתירה בעזרת השלילה ?" עם hnq. המטרה תהיה Q.',
            'המסקנה של h היא Q: עברו להוכיח את התנאי שלה, P, וסגרו בעזרת hp.',
        ],
        conclusion: `מ־P → Q ומ־¬Q הסקתם ¬P. כדי להגיע לסתירה השתמשתם בשלילה ¬Q: הוכחתם את מה שהיא שוללת.
אפשר גם להסיק קדימה: מ־h ומ־hp נובע Q, וההנחה hnq היא השלילה שלה.`,
        startXml: goalXml('¬P', 'h : (P → Q),  hnq : ¬Q'),
    },
    {
        id: 'unit3-6',
        levelNumber: 6,
        totalLevels: 10,
        title: 'שלילה של "או"',
        name: 'unit3_l5_de_morgan_or',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '(¬(P ∨ Q) → (¬P ∧ ¬Q))',
        goalLabel: '(¬(P ∨ Q) → (¬P ∧ ¬Q))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['tactic_intro', 'logic_and_intro', 'logic_not_intro', 'logic_not_elim', 'logic_or_intro_left', 'logic_or_intro_right', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# שלילה של "או"

אם לא נכון ש"P או Q", אז P לא נכונה וגם Q לא נכונה. זה אחד מחוקי דה מורגן.

אחרי הנחת התנאי \`¬(P ∨ Q)\`, המטרה היא "וגם", ולכן מוכיחים אותה בשני חלקים. כל חלק הוא שלילה.
בכל חלק, כדי להגיע לסתירה, השתמשו בשלילה \`¬(P ∨ Q)\`: הוכיחו את "P או Q".`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'הניחו את התנאי וקראו לו h, והוכיחו את ¬P ∧ ¬Q בשני חלקים.',
            'בצד שמאל: הניחו את P (hp), והגיעו לסתירה בעזרת השלילה h. המטרה תהיה P ∨ Q.',
            'כדי להוכיח את P ∨ Q, בחרו בצד שמאל וסגרו בעזרת hp. צד ימין דומה, עם Q.',
        ],
        conclusion: `"לא (P או Q)" פירושו "לא P וגם לא Q". בכל חלק השתמשתם בשלילה שבהנחה כדי להגיע לסתירה.`,
        startXml: goalXml('(¬(P ∨ Q) → (¬P ∧ ¬Q))'),
    },
    {
        id: 'unit3-7',
        levelNumber: 7,
        totalLevels: 10,
        title: 'הוכחה בשלילה',
        name: 'unit3_l6_by_contradiction',
        variableLine: 'variable {P : Prop}',
        params: '',
        proposition: '(¬¬P → P)',
        goalLabel: '(¬¬P → P)',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['tactic_intro', 'logic_not_intro', 'logic_by_contradiction', 'logic_contradiction'],
        introduction: `# הוכחה בשלילה

בשלב 4 הוכחתם \`P → ¬¬P\`. עכשיו הכיוון ההפוך: אם לא נכון ש־P לא נכונה, אז P נכונה.

המטרה אחרי הנחת התנאי היא P, ולא שלילה, ולכן הבלוק של הוכחת שלילה לא מתאים.
*הוכחה בשלילה* עובדת לכל מטרה: מניחים שהמטרה לא נכונה ומגיעים לסתירה.

${CLASSICAL_NOTE}

שימו לב להבדל: כדי להוכיח ¬P מניחים P (שלב 4). בהוכחה בשלילה של P מניחים ¬P. כשהמטרה היא שלילה, אין צורך בהוכחה בשלילה.`,
        newTacticsBlocks: ['logic_by_contradiction'],
        newTacticsInfo: [byContradictionInfo],
        newDefinitions: [],
        hints: [
            'הניחו את התנאי וקראו לו h. יש בידינו h : ¬¬P, והמטרה היא P.',
            'השתמשו בבלוק "נוכיח בשלילה" וקראו להנחה hn. יש בידינו hn : ¬P, והמטרה היא סתירה.',
            'h היא השלילה של hn: הגיעו לסתירה.',
        ],
        conclusion: `הנחתם ש־P לא נכונה, הגעתם לסתירה, והסקתם את P.
יחד עם שלב 4, ¬¬P ו־P שקולות. הכיוון הזה דורש את עיקרון ההוכחה בשלילה.`,
        startXml: goalXml('(¬¬P → P)'),
    },
    {
        id: 'unit3-8',
        levelNumber: 8,
        totalLevels: 10,
        title: 'שתי אפשרויות',
        name: 'unit3_l7_by_cases',
        variableLine: 'variable {P Q : Prop}',
        params: '(hpq : (P → Q)) (hnpq : (¬P → Q))',
        proposition: 'Q',
        goalLabel: 'Q',
        objects: [],
        assumptions: [
            { name: 'hpq', prop: 'P → Q' },
            { name: 'hnpq', prop: '¬P → Q' },
        ],
        toolboxBlocks: ['logic_by_cases', 'tactic_apply_rule', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# שתי אפשרויות

Q נובעת מ־P, וגם מ־¬P. אבל לא ידוע אם P נכונה או לא.

כל טענה נכונה או לא נכונה (*חוק השלישי מן הנמנע*, \`P ∨ ¬P\`). לכן אפשר לבדוק את שתי האפשרויות,
כמו בחלוקה למקרים של יחידה 2: מוכיחים את Q פעם בהנחה P, ופעם בהנחה ¬P.
בכל מקרה ההנחה החדשה היא התנאי של אחת הגרירות, ולכן אפשר ללכת אחורה או קדימה.

${CLASSICAL_NOTE}`,
        newTacticsBlocks: ['logic_by_cases'],
        newTacticsInfo: [byCasesInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "נבדוק את שתי האפשרויות: הטענה ? נכונה או לא נכונה" וכתבו בו P. לשני המקרים תנו שמות, למשל h1 : P ו־h2 : ¬P.',
            'במקרה הראשון: המסקנה של hpq היא Q, ולכן עברו להוכיח את התנאי שלה, וסגרו בעזרת h1. או קדימה: מ־hpq ומ־h1 הסיקו את Q, וסגרו בעזרתה.',
            'במקרה השני: באותו אופן, בעזרת hnpq ו־h2.',
        ],
        conclusion: `לא ידעתם אם P נכונה, אבל בשתי האפשרויות Q נכונה, ולכן Q נכונה.`,
        startXml: goalXml('Q', 'hpq : (P → Q),  hnpq : (¬P → Q)'),
    },
    {
        id: 'unit3-9',
        levelNumber: 9,
        totalLevels: 10,
        title: 'תרגיל מסכם: שלילה של "וגם"',
        name: 'unit3_l8_de_morgan_and',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '(¬(P ∧ Q) → (¬P ∨ ¬Q))',
        goalLabel: '(¬(P ∧ Q) → (¬P ∨ ¬Q))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['tactic_intro', 'logic_by_cases', 'logic_or_intro_left', 'logic_or_intro_right', 'logic_not_intro', 'logic_not_elim', 'logic_and_intro', 'logic_and_combine', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# תרגיל מסכם: שלילה של "וגם"

אם לא נכון ש"P וגם Q", אז P לא נכונה או Q לא נכונה. זה חוק דה מורגן השני.

המטרה אחרי הנחת התנאי היא "או". כמו ביחידה 2, אל תבחרו צד מוקדם מדי: לא ידוע איזו מהטענות לא נכונה.
בדקו קודם את שתי האפשרויות לגבי P, ורק בתוך כל מקרה בחרו את הצד שאפשר להוכיח.

${CLASSICAL_NOTE}`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'הניחו את התנאי וקראו לו h, ובדקו את שתי האפשרויות לגבי P.',
            'במקרה ש־P לא נכונה (h2 : ¬P), צד שמאל של המטרה הוא בדיוק h2.',
            'במקרה ש־P נכונה (h1 : P), בחרו בצד ימין, ¬Q: הניחו את Q (hq), והגיעו לסתירה בעזרת השלילה h. נשאר להוכיח P ∧ Q.',
        ],
        conclusion: `מ"לא (P וגם Q)" הסקתם "לא P או לא Q", בבדיקת שתי האפשרויות לגבי P.
יחד עם שלב 6 אלה חוקי דה מורגן: שלילה הופכת "וגם" ל"או", ו"או" ל"וגם".`,
        startXml: goalXml('(¬(P ∧ Q) → (¬P ∨ ¬Q))'),
    },
    {
        id: 'unit3-10',
        levelNumber: 10,
        totalLevels: 10,
        title: 'שלב בונוס: שלילה של גרירה',
        name: 'unit3_l9_not_imp',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '(¬(P → Q) → ¬¬P)',
        goalLabel: '(¬(P → Q) → ¬¬P)',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['tactic_intro', 'logic_not_intro', 'logic_not_elim', 'logic_false_implies', 'tactic_apply_rule', 'logic_contradiction'],
        introduction: `# בונוס: שלילה של גרירה

אם הגרירה \`P → Q\` לא נכונה, אז לא נכון ש־P לא נכונה.
(למה? אם P לא הייתה נכונה, הגרירה הייתה נכונה: מטענה לא נכונה נובע הכול.)

השלב הזה לא דורש עיקרון קלאסי: מספיקים הכללים של שלבים 1 עד 5. בכל צעד בדקו במצב ההוכחה מה בידכם ומה המטרה.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'הניחו את התנאי (h), והוכיחו את ¬¬P: הניחו את ¬P (hnp) והגיעו לסתירה.',
            'הגיעו לסתירה בעזרת השלילה h. המטרה תהיה P → Q.',
            'הניחו את P (hp). המטרה היא Q, ואין עליה הנחות, אבל hp ו־hnp סותרות: השתמשו בגרירה "סתירה גוררת Q" ועברו להוכיח את התנאי שלה.',
        ],
        conclusion: `סיימתם את יחידה 3, כולל שלב הבונוס! אתם יודעים להגיע לסתירה, להוכיח שלילה ולהשתמש בה,
ומתי צריך את העקרונות הקלאסיים: הוכחה בשלילה ובדיקת שתי האפשרויות.`,
        startXml: goalXml('(¬(P → Q) → ¬¬P)'),
    },
];
