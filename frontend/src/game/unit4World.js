import { goalXml } from './levelXml';

// Unit 4 (see blocks/moves.js): negation, with the
// rules of the usual natural-deduction courses (forall x, Huth & Ryan, Logic
// and Proof, Theorem Proving in Lean, Formalising Mathematics):
//   ¬E: from A and ¬A, a contradiction ⊥ (and backward: with ¬A in hand,
//       a contradiction only needs A);
//   ¬I: to prove ¬A, assume A and reach a contradiction;
//   explosion: from a contradiction anything follows;
//   proof by contradiction: to prove A, assume ¬A and reach a contradiction.
// The derived rules of those courses are the levels: ¬¬-introduction, modus
// tollens, De Morgan, ruling out a possibility, ¬¬-elimination, the
// contrapositive and P ∨ ¬P. Each level offers only the moves of its solution.

export const unit4WorldName = 'יחידה 4 - שלילה והוכחה בשלילה';

const CONTRADICTION = 'סתירה (⊥)';

// The moves as the toolbox shows them, before they are placed.
// not_intro and by_contradiction wrap: the rest of their proof goes inside
// them, between the opening line and the closing line.
const CONTRADICTION_BLOCK = '"קיבלנו ? וגם את השלילה שלה, בסתירה."';
const NOT_INTRO_BLOCK = '"נניח בשלילה את הטענה שהמטרה שוללת..."';
const NOT_ELIM_BLOCK = '"לפי ? כדי להגיע לסתירה די להוכיח את הטענה שהיא שוללת."';
const EXFALSO_BLOCK = '"מסתירה נובע הכול: די להגיע לסתירה."';
const BY_CONTRADICTION_BLOCK = '"נניח בשלילה שהמטרה לא נכונה..."';
const CLOSE_BLOCK = '"המטרה בידינו, וזה מה שעלינו להראות."';
const ASSUME_BLOCK = '"נניח את התנאי של הגרירה..."';
const FORWARD_BLOCK = '"מ־ ? ומ־ ? נקבל את המסקנה של הגרירה."';
const OR_INTRO_BLOCK = '"כדי להוכיח את ה"או" נוכיח את ?"';

const contradictionInfo = {
    name: 'סתירה',
    doc: 'טענה ושלילתה לא יכולות להיות נכונות יחד: מ־A ומ־¬A נובעת סתירה (⊥). בבלוק בוחרים אחת מהשתיים, והבלוק משלים את השנייה. בהוכחה כתובה: "קיבלנו A וגם ¬A, בסתירה."',
};

const notIntroInfo = {
    name: 'הוכחת שלילה',
    doc: 'כדי להוכיח ¬A מניחים בשלילה את A ומגיעים לסתירה: אם A מובילה לסתירה, A לא נכונה. בהוכחה כתובה: "נניח בשלילה A. עלינו להגיע לסתירה. … קיבלנו סתירה, ולכן ¬A." את הדרך לסתירה בונים בתוך הבלוק, בין שתי השורות.',
};

const notElimInfo = {
    name: 'שימוש בשלילה',
    doc: 'אם בידינו ¬A, כדי להגיע לסתירה די להוכיח את A: יחד עם ¬A זו סתירה. בהוכחה כתובה: "לפי ¬A כדי להגיע לסתירה די להוכיח A."',
};

const exfalsoInfo = {
    name: 'מסתירה נובע הכול',
    doc: 'מסתירה אפשר להסיק כל טענה. לכן כדי להוכיח מטרה Q כלשהי, די להגיע לסתירה. בהוכחה כתובה: "מסתירה נובע הכול: כדי להוכיח Q די להגיע לסתירה."',
};

const byContradictionInfo = {
    name: 'הוכחה בשלילה',
    doc: 'כדי להוכיח A מניחים בשלילה ש־A לא נכונה (¬A) ומגיעים לסתירה. אם ¬A מובילה לסתירה, היא לא נכונה, ולכן A נכונה. בהוכחה כתובה: "נניח בשלילה ¬A. עלינו להגיע לסתירה. … קיבלנו סתירה, ולכן A." הבלוק מתאים לכל מטרה.',
};

export const unit4Levels = [
    {
        id: 'unit4-1',
        levelNumber: 1,
        totalLevels: 10,
        title: 'טענה ושלילתה',
        name: 'unit4_l1_contradiction',
        variableLine: 'variable {P : Prop}',
        params: '(hp : P) (hn : ¬P)',
        proposition: 'False',
        goalLabel: CONTRADICTION,
        objects: [],
        assumptions: [
            { name: 'hp', prop: 'P' },
            { name: 'hn', prop: '¬P' },
        ],
        toolboxBlocks: ['contradiction'],
        introduction: `# שלילה וסתירה

הטענה \`¬P\` נקראת "לא P", והיא אומרת ש־P לא נכונה.
טענה ושלילתה לא יכולות להיות נכונות יחד. אם יש בידינו גם P וגם ¬P, הגענו ל*סתירה*, שמסמנים \`⊥\`.

כאן נתונות ההנחות P ו־¬P, והמטרה היא להגיע לסתירה. בהוכחה כתובה: "קיבלנו P וגם ¬P, בסתירה".
הבלוק ${CONTRADICTION_BLOCK} עושה זאת. בוחרים בו אחת מהשתיים, P או ¬P, והוא משלים את השנייה.`,
        newTacticsBlocks: ['contradiction'],
        newTacticsInfo: [contradictionInfo],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${CONTRADICTION_BLOCK} אל תוך בלוק המטרה, ובחרו בו P.`,
            'לחצו על "בדוק הוכחה".',
        ],
        conclusion: `P ו־¬P לא יכולות להיות נכונות יחד, ולכן שתיהן יחד הן סתירה.
בשלבים הבאים נגיע לסתירה מהנחות שנוסיף בעצמנו.`,
        startXml: goalXml(CONTRADICTION, 'P,  ¬P'),
    },
    {
        id: 'unit4-2',
        levelNumber: 2,
        totalLevels: 10,
        title: 'מוכיחים שלילה',
        name: 'unit4_l2_not_intro',
        variableLine: 'variable {P : Prop}',
        params: '(hp : P)',
        proposition: '¬¬P',
        goalLabel: '¬¬P',
        objects: [],
        assumptions: [{ name: 'hp', prop: 'P' }],
        toolboxBlocks: ['not_intro', 'contradiction'],
        introduction: `# מוכיחים שלילה

כדי להוכיח ש־A לא נכונה (\`¬A\`), מניחים בשלילה ש־A כן נכונה ומגיעים לסתירה. אם ההנחה מובילה לסתירה, היא לא נכונה.
בהוכחה כתובה: "נניח בשלילה A. עלינו להגיע לסתירה.", ובסוף: "קיבלנו סתירה, ולכן ¬A."

כאן נתונה ההנחה P, והמטרה היא \`¬¬P\`: "לא נכון ש־P לא נכונה". זו השלילה של \`¬P\`, ולכן נניח בשלילה \`¬P\` וננסה להגיע לסתירה.
הבלוק ${NOT_INTRO_BLOCK} עושה זאת. כשהוא במקומו, כתוב בו מה מניחים, ואת הדרך לסתירה בונים בתוכו.`,
        newTacticsBlocks: ['not_intro'],
        newTacticsInfo: [notIntroInfo],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${NOT_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: נניח בשלילה ¬P. עלינו להגיע לסתירה.`,
            'במצב ההוכחה: יש בידינו P ו־¬P, והמטרה היא סתירה.',
            `גררו לתוך הבלוק את הבלוק ${CONTRADICTION_BLOCK}, ובחרו בו P.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "נניח בשלילה ¬P. עלינו להגיע לסתירה. קיבלנו P וגם ¬P, בסתירה. קיבלנו סתירה, ולכן ¬¬P."
הנחתם את ¬P והגעתם לסתירה, ולכן ¬P לא נכונה: הוכחתם את ¬¬P.`,
        startXml: goalXml('¬¬P', 'P'),
    },
    {
        id: 'unit4-3',
        levelNumber: 3,
        totalLevels: 10,
        title: 'שלילה של המסקנה',
        name: 'unit4_l3_modus_tollens',
        variableLine: 'variable {P Q : Prop}',
        params: '(h : (P → Q)) (hnq : ¬Q)',
        proposition: '¬P',
        goalLabel: '¬P',
        objects: [],
        assumptions: [
            { name: 'h', prop: 'P → Q' },
            { name: 'hnq', prop: '¬Q' },
        ],
        toolboxBlocks: ['not_intro', 'forward', 'contradiction'],
        introduction: `# שלילה של המסקנה

נתון ש־P גוררת את Q, ושהמסקנה Q לא נכונה. מכאן נובע שגם P לא נכונה. נוכיח את זה.

המטרה היא \`¬P\`, ולכן, כמו בשלב 2, נניח בשלילה P וננסה להגיע לסתירה.
אחרי ההנחה יש בידינו את הגרירה \`P → Q\` ואת התנאי שלה, P, ולכן נקבל Q (כמו ביחידה 2). ו־¬Q כבר בידינו.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${NOT_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: נניח בשלילה P. עלינו להגיע לסתירה.`,
            `גררו לתוך הבלוק את הבלוק ${FORWARD_BLOCK}, ובחרו בו את P → Q ואת P. עכשיו כתוב בו: מ־P → Q ומ־P נקבל Q.`,
            `הוסיפו אחריו את הבלוק ${CONTRADICTION_BLOCK}, ובחרו בו Q.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "נניח בשלילה P. עלינו להגיע לסתירה. מ־P → Q ומ־P נקבל Q. קיבלנו Q וגם ¬Q, בסתירה. קיבלנו סתירה, ולכן ¬P."
לכלל "מ־P → Q ומ־¬Q נובע ¬P" קוראים *modus tollens*.`,
        startXml: goalXml('¬P', '(P → Q),  ¬Q'),
    },
    {
        id: 'unit4-4',
        levelNumber: 4,
        totalLevels: 10,
        title: 'משתמשים בשלילה',
        name: 'unit4_l4_not_elim',
        variableLine: 'variable {P Q : Prop}',
        params: '(h : ¬(P ∨ Q))',
        proposition: '¬P',
        goalLabel: '¬P',
        objects: [],
        assumptions: [{ name: 'h', prop: '¬(P ∨ Q)' }],
        toolboxBlocks: ['not_intro', 'not_elim', 'or_intro', 'exact'],
        introduction: `# משתמשים בשלילה

נתון שלא נכון ש"P או Q". מכאן נובע ש־P לא נכונה. נוכיח את זה.

המטרה היא \`¬P\`, ולכן נניח בשלילה P וננסה להגיע לסתירה. אבל הפעם אין בידינו טענה ושלילתה: יש לנו P ו־\`¬(P ∨ Q)\`.

כשהמטרה היא סתירה ויש בידינו שלילה \`¬A\`, די להוכיח את A: יחד עם ¬A זו סתירה.
בהוכחה כתובה: "לפי ¬A כדי להגיע לסתירה די להוכיח A". הבלוק ${NOT_ELIM_BLOCK} עושה זאת.
כאן השלילה שבידינו היא \`¬(P ∨ Q)\`, ולכן די להוכיח \`P ∨ Q\`, ואת זה כבר אפשר להוכיח, כמו ביחידה 3.`,
        newTacticsBlocks: ['not_elim'],
        newTacticsInfo: [notElimInfo],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${NOT_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: נניח בשלילה P. עלינו להגיע לסתירה.`,
            `גררו לתוך הבלוק את הבלוק ${NOT_ELIM_BLOCK}, ובחרו בו ¬(P ∨ Q). עכשיו כתוב בו: לפי ¬(P ∨ Q) כדי להגיע לסתירה די להוכיח (P ∨ Q).`,
            `הוסיפו אחריו את הבלוק ${OR_INTRO_BLOCK}, ובחרו בו P.`,
            `P בידינו: גררו לתוך בלוק ה"או" את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "נניח בשלילה P. עלינו להגיע לסתירה. לפי ¬(P ∨ Q) כדי להגיע לסתירה די להוכיח P ∨ Q. כדי להוכיח P ∨ Q נוכיח את P. P בידינו, וזה מה שעלינו להראות. לכן P ∨ Q. קיבלנו סתירה, ולכן ¬P."
השתמשתם בשלילה שבידינו כדי להגיע לסתירה: הוכחתם את הטענה שהיא שוללת.`,
        startXml: goalXml('¬P', '¬(P ∨ Q)'),
    },
    {
        id: 'unit4-5',
        levelNumber: 5,
        totalLevels: 10,
        title: 'שלילה של "או"',
        name: 'unit4_l5_de_morgan_or',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '(¬(P ∨ Q) → (¬P ∧ ¬Q))',
        goalLabel: '(¬(P ∨ Q) → (¬P ∧ ¬Q))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['assume', 'and_intro', 'not_intro', 'not_elim', 'or_intro', 'exact'],
        introduction: `# שלילה של "או"

אם לא נכון ש"P או Q", אז P לא נכונה וגם Q לא נכונה. זה אחד מ*חוקי דה מורגן*.

המטרה היא גרירה, ולכן קודם מניחים את התנאי שלה, \`¬(P ∨ Q)\`. אחר כך המטרה היא \`¬P ∧ ¬Q\`, ומוכיחים אותה בשני חלקים, כמו ביחידה 3.
החלק הראשון, \`¬P\`, הוא בדיוק שלב 4. החלק השני, \`¬Q\`, דומה, עם Q.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: נניח ¬(P ∨ Q). עלינו להראות (¬P ∧ ¬Q).`,
            'גררו לתוך הבלוק את הבלוק "נוכיח את שני החלקים של ה"וגם".". בראש החלקים כתוב: החלק הראשון: ¬P, והחלק השני: ¬Q.',
            'בחלק הראשון בנו את ההוכחה משלב 4: נניח בשלילה P, לפי ¬(P ∨ Q) די להוכיח P ∨ Q, נוכיח את P, והיא בידינו.',
            'בחלק השני אותו דבר, עם Q. ב"או" בחרו הפעם ב־Q.',
        ],
        conclusion: `"לא (P או Q)" פירושו "לא P וגם לא Q".`,
        startXml: goalXml('(¬(P ∨ Q) → (¬P ∧ ¬Q))'),
    },
    {
        id: 'unit4-6',
        levelNumber: 6,
        totalLevels: 10,
        title: 'מסתירה נובע הכול',
        name: 'unit4_l6_exfalso',
        variableLine: 'variable {P Q : Prop}',
        params: '(hp : P) (hn : ¬P)',
        proposition: 'Q',
        goalLabel: 'Q',
        objects: [],
        assumptions: [
            { name: 'hp', prop: 'P' },
            { name: 'hn', prop: '¬P' },
        ],
        toolboxBlocks: ['exfalso', 'contradiction'],
        introduction: `# מסתירה נובע הכול

הפעם המטרה היא Q, ואין לנו שום הנחה על Q. אבל ההנחות שלנו, P ו־¬P, סותרות זו את זו.

מסתירה אפשר להסיק כל טענה. לכן, מה שלא תהיה המטרה, די להגיע לסתירה.
בהוכחה כתובה: "מסתירה נובע הכול: כדי להוכיח Q די להגיע לסתירה". הבלוק ${EXFALSO_BLOCK} עושה זאת.`,
        newTacticsBlocks: ['exfalso'],
        newTacticsInfo: [exfalsoInfo],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${EXFALSO_BLOCK} אל תוך בלוק המטרה. עכשיו המטרה היא סתירה.`,
            `הוסיפו אחריו את הבלוק ${CONTRADICTION_BLOCK}, ובחרו בו P.`,
        ],
        conclusion: `הוכחתם את Q בלי לדעת עליה דבר, רק מפני שההנחות סותרות.
הבלוק ${CONTRADICTION_BLOCK} לבדו לא היה מספיק: הוא מסיים רק כשהמטרה היא סתירה.`,
        startXml: goalXml('Q', 'P,  ¬P'),
    },
    {
        id: 'unit4-7',
        levelNumber: 7,
        totalLevels: 10,
        title: 'מוציאים אפשרות',
        name: 'unit4_l7_disjunctive_syllogism',
        variableLine: 'variable {P Q : Prop}',
        params: '(h : (P ∨ Q)) (hn : ¬P)',
        proposition: 'Q',
        goalLabel: 'Q',
        objects: [],
        assumptions: [
            { name: 'h', prop: 'P ∨ Q' },
            { name: 'hn', prop: '¬P' },
        ],
        toolboxBlocks: ['or_elim', 'exfalso', 'contradiction', 'exact'],
        introduction: `# מוציאים אפשרות

נתון ש־P או Q נכונה, ושגם P לא נכונה. לכן Q נכונה.

כדי להשתמש ב־\`P ∨ Q\` מחלקים למקרים, כמו ביחידה 3. במקרה ש־Q נכונה, היא בדיוק המטרה.
במקרה ש־P נכונה, יש בידינו גם P וגם ¬P. המקרה הזה סותר את ההנחות, ומסתירה נובע הכול, גם Q.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "נחלק למקרים לפי ?" אל תוך בלוק המטרה, ובחרו בו P ∨ Q.',
            `ב"מקרה 1: P": גררו לתוכו את הבלוק ${EXFALSO_BLOCK}, ואחריו ${CONTRADICTION_BLOCK} עם P.`,
            `ב"מקרה 2: Q": Q בידינו. גררו לתוכו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `במקרה ש־P נכונה הגעתם לסתירה, ולכן במקרה הזה אפשר להסיק כל דבר.
כך "מוציאים" אפשרות: מראים שהיא סותרת את ההנחות.`,
        startXml: goalXml('Q', '(P ∨ Q),  ¬P'),
    },
    {
        id: 'unit4-8',
        levelNumber: 8,
        totalLevels: 10,
        title: 'הוכחה בשלילה',
        name: 'unit4_l8_by_contradiction',
        variableLine: 'variable {P : Prop}',
        params: '(h : ¬¬P)',
        proposition: 'P',
        goalLabel: 'P',
        objects: [],
        assumptions: [{ name: 'h', prop: '¬¬P' }],
        toolboxBlocks: ['by_contradiction', 'contradiction'],
        introduction: `# הוכחה בשלילה

בשלב 2 הוכחתם ש־\`¬¬P\` נובעת מ־P. עכשיו הכיוון ההפוך: נתון \`¬¬P\`, והמטרה היא P.

המטרה P היא לא שלילה, ולכן אי אפשר להוכיח אותה כמו בשלב 2.
*הוכחה בשלילה* מתאימה לכל מטרה: מניחים בשלילה שהמטרה לא נכונה ומגיעים לסתירה. אם ההנחה ¬P מובילה לסתירה, היא לא נכונה, ולכן P נכונה.
בהוכחה כתובה: "נניח בשלילה ¬P. עלינו להגיע לסתירה.", ובסוף: "קיבלנו סתירה, ולכן P." הבלוק ${BY_CONTRADICTION_BLOCK} עושה זאת.

שימו לב להבדל: גם הוכחת שלילה נפתחת ב"נניח בשלילה" ונסגרת ב"קיבלנו סתירה". ההבדל הוא במה שמניחים: כדי להוכיח ¬A מניחים A, וכדי להוכיח A בשלילה מניחים ¬A.`,
        newTacticsBlocks: ['by_contradiction'],
        newTacticsInfo: [byContradictionInfo],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${BY_CONTRADICTION_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: נניח בשלילה ¬P. עלינו להגיע לסתירה.`,
            'במצב ההוכחה: יש בידינו ¬¬P ו־¬P, והמטרה היא סתירה. ¬¬P היא בדיוק השלילה של ¬P.',
            `גררו לתוך הבלוק את הבלוק ${CONTRADICTION_BLOCK}, ובחרו בו ¬P.`,
        ],
        conclusion: `הנחתם ש־P לא נכונה, הגעתם לסתירה, והסקתם את P.
יחד עם שלב 2, ¬¬P ו־P שקולות: שלילה כפולה מבטלת את עצמה.`,
        startXml: goalXml('P', '¬¬P'),
    },
    {
        id: 'unit4-9',
        levelNumber: 9,
        totalLevels: 10,
        title: 'קונטרה־פוזיציה',
        name: 'unit4_l9_contrapositive',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '((¬Q → ¬P) → (P → Q))',
        goalLabel: '((¬Q → ¬P) → (P → Q))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['assume', 'by_contradiction', 'forward', 'contradiction'],
        introduction: `# קונטרה־פוזיציה

הגרירה \`¬Q → ¬P\` נקראת *הקונטרה־פוזיציה* של \`P → Q\`. נוכיח שמהקונטרה־פוזיציה נובעת הגרירה עצמה.
זו דרך נפוצה להוכיח גרירה P → Q: מניחים ש־Q לא נכונה, ומראים ש־P לא נכונה.

אחרי שמניחים את \`¬Q → ¬P\` ואת P, המטרה היא Q, ואין דרך ישירה להגיע אליה. לכן נוכיח אותה בשלילה.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה, וגררו לתוכו עוד אחד כזה. עכשיו יש בידינו ¬Q → ¬P ו־P, והמטרה היא Q.`,
            `גררו לתוך הבלוק הפנימי את הבלוק ${BY_CONTRADICTION_BLOCK}. עכשיו כתוב בו: נניח בשלילה ¬Q. עלינו להגיע לסתירה.`,
            `גררו לתוכו את הבלוק ${FORWARD_BLOCK}, ובחרו בו את ¬Q → ¬P ואת ¬Q. עכשיו כתוב בו: מ־¬Q → ¬P ומ־¬Q נקבל ¬P.`,
            `הוסיפו אחריו את הבלוק ${CONTRADICTION_BLOCK}, ובחרו בו P.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "נניח ¬Q → ¬P. עלינו להראות P → Q. נניח P. עלינו להראות Q. נניח בשלילה ¬Q. עלינו להגיע לסתירה. מ־¬Q → ¬P ומ־¬Q נקבל ¬P. קיבלנו P וגם ¬P, בסתירה. קיבלנו סתירה, ולכן Q. לכן P → Q. לכן (¬Q → ¬P) → (P → Q)."`,
        startXml: goalXml('((¬Q → ¬P) → (P → Q))'),
    },
    {
        id: 'unit4-10',
        levelNumber: 10,
        totalLevels: 10,
        title: 'שלב בונוס: P או לא P',
        name: 'unit4_l10_excluded_middle',
        variableLine: 'variable {P : Prop}',
        params: '',
        proposition: '(P ∨ ¬P)',
        goalLabel: '(P ∨ ¬P)',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['by_contradiction', 'not_elim', 'or_intro', 'not_intro', 'exact'],
        introduction: `# בונוס: P או לא P

כל טענה נכונה או לא נכונה: \`P ∨ ¬P\`. לטענה הזאת קוראים *חוק השלישי מן הנמנע*. נוכיח אותה בלי שום הנחה.

אי אפשר לבחור צד מיד: לא ידוע אם P נכונה. לכן נוכיח אותה בשלילה: נניח \`¬(P ∨ ¬P)\` ונגיע לסתירה.
כדי להגיע לסתירה, השתמשו בשלילה הזאת כמו בשלב 4: די להוכיח \`P ∨ ¬P\`. עכשיו כבר אפשר לבחור צד, כי יש בידינו הנחה חדשה.
שימו לב: בהוכחה משתמשים בשלילה \`¬(P ∨ ¬P)\` פעמיים.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${BY_CONTRADICTION_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: נניח בשלילה ¬(P ∨ ¬P). עלינו להגיע לסתירה.`,
            `גררו לתוכו את הבלוק ${NOT_ELIM_BLOCK} עם ¬(P ∨ ¬P): די להוכיח (P ∨ ¬P). הוסיפו אחריו את הבלוק ${OR_INTRO_BLOCK}, ובחרו בו ¬P.`,
            'כדי להוכיח ¬P, בתוך בלוק ה"או" נניח בשלילה P ונגיע לסתירה. שוב לפי ¬(P ∨ ¬P), די להוכיח (P ∨ ¬P).',
            `הפעם בחרו להוכיח P. P בידינו: גררו לתוך בלוק ה"או" הפנימי את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `סיימתם את יחידה 4, כולל שלב הבונוס! הוכחתם את חוק השלישי מן הנמנע בעזרת הוכחה בשלילה.
אתם יודעים להגיע לסתירה, להוכיח שלילה ולהשתמש בה, להסיק מסתירה כל טענה, ולהוכיח בשלילה.`,
        startXml: goalXml('(P ∨ ¬P)'),
    },
];
