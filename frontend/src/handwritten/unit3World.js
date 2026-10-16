import { goalXml } from '../game/levelXml';

// Unit 3 of the handwritten version (see blocks.js): negation, with the
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

export const unit3WorldName = 'יחידה 3 - שלילה והוכחה בשלילה';

const CONTRADICTION = 'סתירה (⊥)';

// The moves as the toolbox shows them, before they are placed.
const CONTRADICTION_BLOCK = '"יש לנו ביד את ? ואת השלילה שלה, וזו סתירה."';
const NOT_INTRO_BLOCK = '"כדי להוכיח את השלילה, נניח את הטענה שהיא שוללת ונגיע לסתירה"';
const NOT_ELIM_BLOCK = '"לפי השלילה ? שיש לנו ביד"';
const EXFALSO_BLOCK = '"מסתירה נובע הכול, ולכן די להגיע לסתירה"';
const BY_CONTRADICTION_BLOCK = '"נוכיח בשלילה: נניח שהמטרה לא נכונה ונגיע לסתירה"';
const CLOSE_BLOCK = '"יש לנו ביד בדיוק את מה שאנחנו רוצים להוכיח."';

const contradictionInfo = {
    name: 'סתירה',
    doc: 'טענה ושלילתה לא יכולות להיות נכונות יחד: מ־A ומ־¬A נובעת סתירה (⊥). בבלוק בוחרים אחת מהשתיים, והבלוק משלים את השנייה. בכתב יד: "יש לנו ביד את A ואת השלילה שלה, וזו סתירה".',
};

const notIntroInfo = {
    name: 'הוכחת שלילה',
    doc: 'כדי להוכיח ¬A מניחים את A ומגיעים לסתירה: אם A מובילה לסתירה, A לא נכונה. בכתב יד: "כדי להוכיח ¬A נניח A ונגיע לסתירה".',
};

const notElimInfo = {
    name: 'שימוש בשלילה',
    doc: 'אם בידינו ¬A, כדי להגיע לסתירה די להוכיח את A: יחד עם ¬A זו סתירה. בכתב יד: "לפי ¬A, כדי להגיע לסתירה די להוכיח A".',
};

const exfalsoInfo = {
    name: 'מסתירה נובע הכול',
    doc: 'מסתירה אפשר להסיק כל טענה. לכן כדי להוכיח מטרה כלשהי, די להגיע לסתירה. בכתב יד: "מסתירה נובע הכול, ולכן די להגיע לסתירה".',
};

const byContradictionInfo = {
    name: 'הוכחה בשלילה',
    doc: 'כדי להוכיח A מניחים ש־A לא נכונה (¬A) ומגיעים לסתירה. אם ¬A מובילה לסתירה, היא לא נכונה, ולכן A נכונה. הבלוק מתאים לכל מטרה.',
};

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

כאן נתונות ההנחות P ו־¬P, והמטרה היא להגיע לסתירה. בכתב יד: "יש לנו ביד את P ואת השלילה שלה, וזו סתירה".
הבלוק ${CONTRADICTION_BLOCK} עושה זאת. בוחרים בו אחת מהשתיים, P או ¬P, והוא משלים את השנייה.`,
        newTacticsBlocks: ['hw_contradiction'],
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
        id: 'hw-unit3-2',
        levelNumber: 2,
        totalLevels: 10,
        title: 'מוכיחים שלילה',
        name: 'hw_unit3_l2_not_intro',
        variableLine: 'variable {P : Prop}',
        params: '(hp : P)',
        proposition: '¬¬P',
        goalLabel: '¬¬P',
        objects: [],
        assumptions: [{ name: 'hp', prop: 'P' }],
        toolboxBlocks: ['hw_not_intro', 'hw_contradiction'],
        introduction: `# מוכיחים שלילה

כדי להוכיח ש־A לא נכונה (\`¬A\`), מניחים ש־A כן נכונה ומגיעים לסתירה. אם ההנחה מובילה לסתירה, היא לא נכונה.
בכתב יד: "כדי להוכיח ¬A נניח A ונגיע לסתירה".

כאן נתונה ההנחה P, והמטרה היא \`¬¬P\`: "לא נכון ש־P לא נכונה". זו השלילה של \`¬P\`, ולכן נניח \`¬P\` וננסה להגיע לסתירה.
הבלוק ${NOT_INTRO_BLOCK} עושה זאת. כשהוא במקומו, כתוב בו מה מניחים.`,
        newTacticsBlocks: ['hw_not_intro'],
        newTacticsInfo: [notIntroInfo],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${NOT_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: כדי להוכיח ¬¬P נניח ¬P ונגיע לסתירה.`,
            'במצב ההוכחה: יש בידינו P ו־¬P, והמטרה היא סתירה.',
            `הוסיפו אחריו את הבלוק ${CONTRADICTION_BLOCK}, ובחרו בו P.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "כדי להוכיח ¬¬P נניח ¬P ונגיע לסתירה. יש לנו ביד את P ואת השלילה שלה, וזו סתירה."
הנחתם את ¬P והגעתם לסתירה, ולכן ¬P לא נכונה: הוכחתם את ¬¬P.`,
        startXml: goalXml('¬¬P', 'P'),
    },
    {
        id: 'hw-unit3-3',
        levelNumber: 3,
        totalLevels: 10,
        title: 'שלילה של המסקנה',
        name: 'hw_unit3_l3_modus_tollens',
        variableLine: 'variable {P Q : Prop}',
        params: '(h : (P → Q)) (hnq : ¬Q)',
        proposition: '¬P',
        goalLabel: '¬P',
        objects: [],
        assumptions: [
            { name: 'h', prop: 'P → Q' },
            { name: 'hnq', prop: '¬Q' },
        ],
        toolboxBlocks: ['hw_not_intro', 'hw_forward', 'hw_contradiction'],
        introduction: `# שלילה של המסקנה

נתון ש־P גוררת את Q, ושהמסקנה Q לא נכונה. מכאן נובע שגם P לא נכונה. נוכיח את זה.

המטרה היא \`¬P\`, ולכן, כמו בשלב 2, נניח P וננסה להגיע לסתירה.
אחרי ההנחה יש בידינו את הגרירה \`P → Q\` ואת התנאי שלה, P, ולכן נובע Q (כמו ביחידה 1). ו־¬Q כבר בידינו.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${NOT_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: כדי להוכיח ¬P נניח P ונגיע לסתירה.`,
            'הוסיפו את הבלוק "מהגרירה ? ומ־?", ובחרו בו את P → Q ואת P. עכשיו כתוב בו: נובע Q.',
            `הוסיפו את הבלוק ${CONTRADICTION_BLOCK}, ובחרו בו Q.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "כדי להוכיח ¬P נניח P ונגיע לסתירה. מ־P → Q ומ־P נובע Q. יש לנו ביד את Q ואת השלילה שלה, וזו סתירה."
לכלל "מ־P → Q ומ־¬Q נובע ¬P" קוראים *modus tollens*.`,
        startXml: goalXml('¬P', '(P → Q),  ¬Q'),
    },
    {
        id: 'hw-unit3-4',
        levelNumber: 4,
        totalLevels: 10,
        title: 'משתמשים בשלילה',
        name: 'hw_unit3_l4_not_elim',
        variableLine: 'variable {P Q : Prop}',
        params: '(h : ¬(P ∨ Q))',
        proposition: '¬P',
        goalLabel: '¬P',
        objects: [],
        assumptions: [{ name: 'h', prop: '¬(P ∨ Q)' }],
        toolboxBlocks: ['hw_not_intro', 'hw_not_elim', 'hw_or_intro', 'hw_exact'],
        introduction: `# משתמשים בשלילה

נתון שלא נכון ש"P או Q". מכאן נובע ש־P לא נכונה. נוכיח את זה.

המטרה היא \`¬P\`, ולכן נניח P וננסה להגיע לסתירה. אבל הפעם אין בידינו טענה ושלילתה: יש לנו P ו־\`¬(P ∨ Q)\`.

כשהמטרה היא סתירה ויש בידינו שלילה \`¬A\`, די להוכיח את A: יחד עם ¬A זו סתירה.
בכתב יד: "לפי ¬A, כדי להגיע לסתירה די להוכיח A". הבלוק ${NOT_ELIM_BLOCK} עושה זאת.
כאן השלילה שבידינו היא \`¬(P ∨ Q)\`, ולכן די להוכיח \`P ∨ Q\`, ואת זה כבר אפשר להוכיח, כמו ביחידה 2.`,
        newTacticsBlocks: ['hw_not_elim'],
        newTacticsInfo: [notElimInfo],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${NOT_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: כדי להוכיח ¬P נניח P ונגיע לסתירה.`,
            `הוסיפו את הבלוק ${NOT_ELIM_BLOCK}, ובחרו בו ¬(P ∨ Q). עכשיו כתוב בו: כדי להגיע לסתירה די להוכיח (P ∨ Q).`,
            'הוסיפו את הבלוק "כדי להוכיח את ה"או" די להוכיח את ?", ובחרו בו P.',
            `P בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "כדי להוכיח ¬P נניח P ונגיע לסתירה. לפי ¬(P ∨ Q), די להוכיח P ∨ Q. כדי להוכיח P ∨ Q די להוכיח P, ויש לנו אותה ביד."
השתמשתם בשלילה שבידינו כדי להגיע לסתירה: הוכחתם את הטענה שהיא שוללת.`,
        startXml: goalXml('¬P', '¬(P ∨ Q)'),
    },
    {
        id: 'hw-unit3-5',
        levelNumber: 5,
        totalLevels: 10,
        title: 'שלילה של "או"',
        name: 'hw_unit3_l5_de_morgan_or',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '(¬(P ∨ Q) → (¬P ∧ ¬Q))',
        goalLabel: '(¬(P ∨ Q) → (¬P ∧ ¬Q))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['hw_assume', 'hw_and_intro', 'hw_not_intro', 'hw_not_elim', 'hw_or_intro', 'hw_exact'],
        introduction: `# שלילה של "או"

אם לא נכון ש"P או Q", אז P לא נכונה וגם Q לא נכונה. זה אחד מ*חוקי דה מורגן*.

המטרה היא גרירה, ולכן קודם מניחים את התנאי שלה, \`¬(P ∨ Q)\`. אחר כך המטרה היא \`¬P ∧ ¬Q\`, ומוכיחים אותה בשני חלקים, כמו ביחידה 2.
החלק "נוכיח ¬P" הוא בדיוק שלב 4. החלק "נוכיח ¬Q" דומה, עם Q.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "כדי להוכיח את הגרירה, נניח..." אל תוך בלוק המטרה. עכשיו כתוב בו: נניח ¬(P ∨ Q) ונוכיח (¬P ∧ ¬Q).',
            'הוסיפו את הבלוק "כדי להוכיח את ה"וגם", נוכיח כל צד לחוד". בראש החלקים כתוב: נוכיח ¬P, ונוכיח ¬Q.',
            'בחלק "נוכיח ¬P" בנו את ההוכחה משלב 4: נניח P, לפי ¬(P ∨ Q) די להוכיח P ∨ Q, די להוכיח P, ויש לנו אותה ביד.',
            'בחלק "נוכיח ¬Q" אותו דבר, עם Q. ב"או" בחרו הפעם ב־Q.',
        ],
        conclusion: `"לא (P או Q)" פירושו "לא P וגם לא Q".`,
        startXml: goalXml('(¬(P ∨ Q) → (¬P ∧ ¬Q))'),
    },
    {
        id: 'hw-unit3-6',
        levelNumber: 6,
        totalLevels: 10,
        title: 'מסתירה נובע הכול',
        name: 'hw_unit3_l6_exfalso',
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

הפעם המטרה היא Q, ואין לנו שום הנחה על Q. אבל ההנחות שלנו, P ו־¬P, סותרות זו את זו.

מסתירה אפשר להסיק כל טענה. לכן, מה שלא תהיה המטרה, די להגיע לסתירה.
בכתב יד: "מסתירה נובע הכול, ולכן כדי להוכיח Q די להגיע לסתירה". הבלוק ${EXFALSO_BLOCK} עושה זאת.`,
        newTacticsBlocks: ['hw_exfalso'],
        newTacticsInfo: [exfalsoInfo],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${EXFALSO_BLOCK} אל תוך בלוק המטרה. עכשיו המטרה היא סתירה.`,
            `הוסיפו את הבלוק ${CONTRADICTION_BLOCK}, ובחרו בו P.`,
        ],
        conclusion: `הוכחתם את Q בלי לדעת עליה דבר, רק מפני שההנחות סותרות.
הבלוק ${CONTRADICTION_BLOCK} לבדו לא היה מספיק: הוא מסיים רק כשהמטרה היא סתירה.`,
        startXml: goalXml('Q', 'P,  ¬P'),
    },
    {
        id: 'hw-unit3-7',
        levelNumber: 7,
        totalLevels: 10,
        title: 'מוציאים אפשרות',
        name: 'hw_unit3_l7_disjunctive_syllogism',
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

נתון ש־P או Q נכונה, ושגם P לא נכונה. לכן Q נכונה.

כדי להשתמש ב־\`P ∨ Q\` מחלקים למקרים, כמו ביחידה 2. במקרה ש־Q נכונה, היא בדיוק המטרה.
במקרה ש־P נכונה, יש בידינו גם P וגם ¬P. המקרה הזה סותר את ההנחות, ומסתירה נובע הכול, גם Q.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "נחלק למקרים לפי ה"או" ?" אל תוך בלוק המטרה, ובחרו בו P ∨ Q.',
            `במקרה הראשון (נניח P): הוסיפו את הבלוק ${EXFALSO_BLOCK}, ואחריו ${CONTRADICTION_BLOCK} עם P.`,
            `במקרה השני (נניח Q): Q בידינו. הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `במקרה ש־P נכונה הגעתם לסתירה, ולכן במקרה הזה אפשר להסיק כל דבר.
כך "מוציאים" אפשרות: מראים שהיא סותרת את ההנחות.`,
        startXml: goalXml('Q', '(P ∨ Q),  ¬P'),
    },
    {
        id: 'hw-unit3-8',
        levelNumber: 8,
        totalLevels: 10,
        title: 'הוכחה בשלילה',
        name: 'hw_unit3_l8_by_contradiction',
        variableLine: 'variable {P : Prop}',
        params: '(h : ¬¬P)',
        proposition: 'P',
        goalLabel: 'P',
        objects: [],
        assumptions: [{ name: 'h', prop: '¬¬P' }],
        toolboxBlocks: ['hw_by_contradiction', 'hw_contradiction'],
        introduction: `# הוכחה בשלילה

בשלב 2 הוכחתם ש־\`¬¬P\` נובעת מ־P. עכשיו הכיוון ההפוך: נתון \`¬¬P\`, והמטרה היא P.

המטרה P היא לא שלילה, ולכן אי אפשר להוכיח אותה כמו בשלב 2.
*הוכחה בשלילה* מתאימה לכל מטרה: מניחים שהמטרה לא נכונה ומגיעים לסתירה. אם ההנחה ¬P מובילה לסתירה, היא לא נכונה, ולכן P נכונה.
בכתב יד: "נוכיח בשלילה: נניח ¬P ונגיע לסתירה". הבלוק ${BY_CONTRADICTION_BLOCK} עושה זאת.

שימו לב להבדל: כדי להוכיח ¬A מניחים A. בהוכחה בשלילה של A מניחים ¬A.`,
        newTacticsBlocks: ['hw_by_contradiction'],
        newTacticsInfo: [byContradictionInfo],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${BY_CONTRADICTION_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: נוכיח בשלילה: נניח ¬P ונגיע לסתירה.`,
            'במצב ההוכחה: יש בידינו ¬¬P ו־¬P, והמטרה היא סתירה. ¬¬P היא בדיוק השלילה של ¬P.',
            `הוסיפו את הבלוק ${CONTRADICTION_BLOCK}, ובחרו בו ¬P.`,
        ],
        conclusion: `הנחתם ש־P לא נכונה, הגעתם לסתירה, והסקתם את P.
יחד עם שלב 2, ¬¬P ו־P שקולות: שלילה כפולה מבטלת את עצמה.`,
        startXml: goalXml('P', '¬¬P'),
    },
    {
        id: 'hw-unit3-9',
        levelNumber: 9,
        totalLevels: 10,
        title: 'קונטרה־פוזיציה',
        name: 'hw_unit3_l9_contrapositive',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '((¬Q → ¬P) → (P → Q))',
        goalLabel: '((¬Q → ¬P) → (P → Q))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['hw_assume', 'hw_by_contradiction', 'hw_forward', 'hw_contradiction'],
        introduction: `# קונטרה־פוזיציה

הגרירה \`¬Q → ¬P\` נקראת *הקונטרה־פוזיציה* של \`P → Q\`. נוכיח שמהקונטרה־פוזיציה נובעת הגרירה עצמה.
זו דרך נפוצה להוכיח גרירה P → Q: מניחים ש־Q לא נכונה, ומראים ש־P לא נכונה.

אחרי שמניחים את \`¬Q → ¬P\` ואת P, המטרה היא Q, ואין דרך ישירה להגיע אליה. לכן נוכיח אותה בשלילה.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "כדי להוכיח את הגרירה, נניח..." אל תוך בלוק המטרה, והוסיפו אחריו עוד אחד כזה. עכשיו יש בידינו ¬Q → ¬P ו־P, והמטרה היא Q.',
            `הוסיפו את הבלוק ${BY_CONTRADICTION_BLOCK}. עכשיו כתוב בו: נניח ¬Q.`,
            'הוסיפו את הבלוק "מהגרירה ? ומ־?", ובחרו בו את ¬Q → ¬P ואת ¬Q. עכשיו כתוב בו: נובע ¬P.',
            `הוסיפו את הבלוק ${CONTRADICTION_BLOCK}, ובחרו בו P.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "נניח ¬Q → ¬P, ונניח P. נוכיח בשלילה: נניח ¬Q. מ־¬Q → ¬P ומ־¬Q נובע ¬P. יש לנו ביד את P ואת השלילה שלה, וזו סתירה."`,
        startXml: goalXml('((¬Q → ¬P) → (P → Q))'),
    },
    {
        id: 'hw-unit3-10',
        levelNumber: 10,
        totalLevels: 10,
        title: 'שלב בונוס: P או לא P',
        name: 'hw_unit3_l10_excluded_middle',
        variableLine: 'variable {P : Prop}',
        params: '',
        proposition: '(P ∨ ¬P)',
        goalLabel: '(P ∨ ¬P)',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['hw_by_contradiction', 'hw_not_elim', 'hw_or_intro', 'hw_not_intro', 'hw_exact'],
        introduction: `# בונוס: P או לא P

כל טענה נכונה או לא נכונה: \`P ∨ ¬P\`. לטענה הזאת קוראים *חוק השלישי מן הנמנע*. נוכיח אותה בלי שום הנחה.

אי אפשר לבחור צד מיד: לא ידוע אם P נכונה. לכן נוכיח בשלילה: נניח \`¬(P ∨ ¬P)\` ונגיע לסתירה.
כדי להגיע לסתירה, השתמשו בשלילה הזאת כמו בשלב 4: די להוכיח \`P ∨ ¬P\`. עכשיו כבר אפשר לבחור צד, כי יש בידינו הנחה חדשה.
שימו לב: בהוכחה משתמשים בשלילה \`¬(P ∨ ¬P)\` פעמיים.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${BY_CONTRADICTION_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: נניח ¬(P ∨ ¬P).`,
            `הוסיפו את הבלוק ${NOT_ELIM_BLOCK} עם ¬(P ∨ ¬P): די להוכיח (P ∨ ¬P). בחרו להוכיח ¬P.`,
            'כדי להוכיח ¬P, נניח P ונגיע לסתירה. שוב לפי ¬(P ∨ ¬P), די להוכיח (P ∨ ¬P).',
            `הפעם בחרו להוכיח P. P בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `סיימתם את יחידה 3, כולל שלב הבונוס! הוכחתם את חוק השלישי מן הנמנע בעזרת הוכחה בשלילה.
אתם יודעים להגיע לסתירה, להוכיח שלילה ולהשתמש בה, להסיק מסתירה כל טענה, ולהוכיח בשלילה.`,
        startXml: goalXml('(P ∨ ¬P)'),
    },
];
