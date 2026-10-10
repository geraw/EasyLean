import { goalXml } from '../game/levelXml';

// Unit 2 of the handwritten version (see blocks.js): the levels of
// game/unit2World.js, written as a proof is written by hand. A move that
// splits the proof heads each part with what is proved in it ("נוכיח P",
// "מקרה ראשון: נניח P").

export const unit2WorldName = 'יחידה 2 - וגם, או, אם ורק אם';

const andElimInfo = {
    name: 'שימוש ב"וגם"',
    doc: 'מ"P וגם Q" נובעים שני הצדדים שלה, P ו־Q, ושניהם מצטרפים להנחות. בכתב יד: "מ־P ∧ Q נובע P ונובע Q".',
};

const andIntroInfo = {
    name: 'הוכחת "וגם"',
    doc: 'כדי להוכיח "P וגם Q" מוכיחים את שני הצדדים, כל אחד בחלק משלו: בחלק אחד מוכיחים P, ובשני מוכיחים Q.',
};

const andCombineInfo = {
    name: 'צירוף שתי הנחות ל"וגם"',
    doc: 'אם בידינו P וגם Q, נובע "P וגם Q", והוא מצטרף להנחות. זו הוכחת "וגם" קדימה, מההנחות. בכתב יד: "מ־P ומ־Q נובע P ∧ Q".',
};

const orIntroInfo = {
    name: 'הוכחת "או"',
    doc: 'כדי להוכיח "P או Q" די להוכיח אחד מהצדדים. בוחרים את הצד שאפשר להוכיח, ונשאר להוכיח רק אותו. בכתב יד: "כדי להוכיח P ∨ Q די להוכיח P".',
};

const orElimInfo = {
    name: 'חלוקה למקרים לפי "או"',
    doc: 'אם ידוע "P או Q", לא יודעים איזה מהצדדים נכון. לכן מוכיחים את המטרה פעמיים: פעם בהנחה P, ופעם בהנחה Q.',
};

const iffElimInfo = {
    name: 'שימוש ב"אם ורק אם"',
    doc: '"P אם ורק אם Q" אומרת שתי גרירות: P → Q ו־Q → P. שתיהן נובעות ממנה ומצטרפות להנחות, ומשתמשים בהן כמו בכל גרירה.',
};

const iffIntroInfo = {
    name: 'הוכחת "אם ורק אם"',
    doc: 'כדי להוכיח "P אם ורק אם Q" מוכיחים את שני הכיוונים, כל אחד בחלק משלו: את הגרירה P → Q ואת הגרירה Q → P.',
};

// The wrong second move of level 6, already placed: choosing a side of the
// "or" before splitting into cases gets stuck.
const prematureSideXml = `
      <block type="hw_assume">
        <next>
          <block type="hw_or_intro"><field name="SIDE">LEFT</field></block>
        </next>
      </block>`;

const CLOSE = '"יש לנו ביד בדיוק את מה שאנחנו רוצים להוכיח"';

export const unit2Levels = [
    {
        id: 'hw-unit2-1',
        levelNumber: 1,
        totalLevels: 9,
        title: 'משתמשים בהנחה מסוג "וגם"',
        name: 'hw_unit2_l1_and_elim',
        variableLine: 'variable {P Q : Prop}',
        params: '(h : (P ∧ Q))',
        proposition: 'Q',
        goalLabel: 'Q',
        objects: [],
        assumptions: [{ name: 'h', prop: 'P ∧ Q' }],
        toolboxBlocks: ['hw_and_elim', 'hw_exact'],
        introduction: `# "וגם"

הטענה \`P ∧ Q\` נקראת "P וגם Q", והיא אומרת ששתי הטענות נכונות: גם P וגם Q.
P הוא *צד שמאל* שלה, ו־Q הוא *צד ימין* שלה.

כאן נתונה ההנחה \`P ∧ Q\`, והמטרה היא Q. אף הנחה לא אומרת בדיוק Q, אבל Q הוא צד ימין של ההנחה.
בכתב יד: "מ־P ∧ Q נובע P ונובע Q". הבלוק "מה"וגם" ?..." עושה זאת: שני הצדדים מצטרפים להנחות, ואחד מהם הוא בדיוק המטרה.`,
        newTacticsBlocks: ['hw_and_elim'],
        newTacticsInfo: [andElimInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "מה"וגם" ? נובעים שני הצדדים שלו" אל תוך בלוק המטרה, ובחרו בו את P ∧ Q. עכשיו כתוב בו: נובע P ונובע Q.',
            `עכשיו Q בידינו. הוסיפו את הבלוק ${CLOSE}.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "מ־P ∧ Q נובע P ונובע Q. יש לנו ביד בדיוק את מה שאנחנו רוצים להוכיח."
כך משתמשים ב"וגם": מפרקים אותו לשני הצדדים, וכל צד הוא הנחה בפני עצמה.`,
        startXml: goalXml('Q', '(P ∧ Q)'),
    },
    {
        id: 'hw-unit2-2',
        levelNumber: 2,
        totalLevels: 9,
        title: 'מוכיחים טענה מסוג "וגם"',
        name: 'hw_unit2_l2_and_intro',
        variableLine: 'variable {P Q : Prop}',
        params: '(h1 : P) (h2 : Q)',
        proposition: '(P ∧ Q)',
        goalLabel: '(P ∧ Q)',
        objects: [],
        assumptions: [
            { name: 'h1', prop: 'P' },
            { name: 'h2', prop: 'Q' },
        ],
        toolboxBlocks: ['hw_and_intro', 'hw_exact'],
        introduction: `# הוכחה בשני חלקים

הפעם המטרה היא \`P ∧ Q\`. כדי להוכיח "P וגם Q" צריך להוכיח את שני הצדדים: גם את P וגם את Q.

הבלוק "כדי להוכיח את ה"וגם", נוכיח כל צד לחוד" מפצל את ההוכחה לשני חלקים, ולכל חלק יש בבלוק מקום משלו.
כשהבלוק במקומו, בראש כל חלק כתוב מה מוכיחים בו: "נוכיח P" ו"נוכיח Q". כל חלק הוא הוכחה קטנה בפני עצמה.

לחיצה על מהלך בתוך אחד החלקים מראה במצב ההוכחה את המצב באותו חלק בלבד.`,
        newTacticsBlocks: ['hw_and_intro'],
        newTacticsInfo: [andIntroInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "כדי להוכיח את ה"וגם", נוכיח כל צד לחוד" אל תוך בלוק המטרה.',
            `בחלק "נוכיח P", P כבר בידינו: גררו לשם את הבלוק ${CLOSE}.`,
            'גם בחלק "נוכיח Q", Q כבר בידינו.',
        ],
        conclusion: `הוכחתם את P ואת Q כל אחד בחלק משלו, ולכן הוכחתם את "P וגם Q".
בכתב יד: "נוכיח כל צד לחוד. נוכיח P: יש לנו אותה ביד. נוכיח Q: יש לנו אותה ביד."`,
        startXml: goalXml('(P ∧ Q)', 'P,  Q'),
    },
    {
        id: 'hw-unit2-3',
        levelNumber: 3,
        totalLevels: 9,
        title: 'מחליפים את הצדדים',
        name: 'hw_unit2_l3_and_comm',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '((P ∧ Q) → (Q ∧ P))',
        goalLabel: '((P ∧ Q) → (Q ∧ P))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['hw_assume', 'hw_and_elim', 'hw_and_intro', 'hw_and_combine', 'hw_exact'],
        introduction: `# מחליפים את הצדדים

המטרה היא גרירה: אם "P וגם Q", אז "Q וגם P". כמו ביחידה 1, מתחילים בהנחת התנאי שלה.

אחרי ההנחה יש בידינו \`P ∧ Q\`, והמטרה היא \`Q ∧ P\`. כאן משתמשים בשני המהלכים של "וגם":
מסיקים מההנחה את שני הצדדים שלה, ומוכיחים את המטרה בשני חלקים.

אפשר גם ללכת קדימה: אחרי שהסקתם את שני הצדדים, צרפו אותם בסדר ההפוך.
בכתב יד: "מ־Q ומ־P נובע Q ∧ P", וזו בדיוק המטרה.`,
        newTacticsBlocks: ['hw_and_combine'],
        newTacticsInfo: [andCombineInfo],
        newDefinitions: [],
        hints: [
            'נניח את התנאי של הגרירה, P ∧ Q.',
            'מ־P ∧ Q נובע P ונובע Q.',
            'הוכיחו את Q ∧ P בשני חלקים: בכל חלק, מה שמוכיחים כבר בידינו. או קדימה: מ־Q ומ־P נובע Q ∧ P, וזו המטרה.',
        ],
        conclusion: `"וגם" לא תלוי בסדר: מ"P וגם Q" נובע "Q וגם P".
בהוכחה השתמשתם ב"וגם" שבהנחה (פירקתם אותו) וגם הוכחתם "וגם" (בשני חלקים, או קדימה).`,
        startXml: goalXml('((P ∧ Q) → (Q ∧ P))'),
    },
    {
        id: 'hw-unit2-4',
        levelNumber: 4,
        totalLevels: 9,
        title: 'מוכיחים טענה מסוג "או"',
        name: 'hw_unit2_l4_or_intro',
        variableLine: 'variable {P Q : Prop}',
        params: '(h : P)',
        proposition: '(Q ∨ P)',
        goalLabel: '(Q ∨ P)',
        objects: [],
        assumptions: [{ name: 'h', prop: 'P' }],
        toolboxBlocks: ['hw_or_intro', 'hw_exact'],
        introduction: `# "או"

הטענה \`Q ∨ P\` נקראת "Q או P", והיא אומרת שלפחות אחת משתי הטענות נכונה.

כדי להוכיח "או" די להוכיח צד אחד. אבל צריך לבחור את הצד הנכון: את הצד שאפשר להוכיח ממה שיש בידינו.
כאן נתונה ההנחה P, ולא ידוע לנו דבר על Q, ולכן נבחר להוכיח את P. בכתב יד: "כדי להוכיח Q ∨ P די להוכיח P".

בבלוק "כדי להוכיח את ה"או" די להוכיח את ?" בוחרים את הצד מהרשימה. כשהבלוק במקומו, ברשימה מופיעים שני הצדדים של המטרה.`,
        newTacticsBlocks: ['hw_or_intro'],
        newTacticsInfo: [orIntroInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "כדי להוכיח את ה"או" די להוכיח את ?" אל תוך בלוק המטרה, ובחרו בו P.',
            'עכשיו המטרה היא P, ו־P בידינו.',
        ],
        conclusion: `בחרתם להוכיח את P, כי היא בידינו. בכתב יד: "כדי להוכיח Q ∨ P די להוכיח P, ויש לנו אותה ביד."
אם הייתם בוחרים ב־Q, הייתם נתקעים עם המטרה Q, שאין לנו שום דרך להוכיח.`,
        startXml: goalXml('(Q ∨ P)', 'P'),
    },
    {
        id: 'hw-unit2-5',
        levelNumber: 5,
        totalLevels: 9,
        title: 'חלוקה למקרים',
        name: 'hw_unit2_l5_or_elim',
        variableLine: 'variable {P Q R : Prop}',
        params: '(hpr : (P → R)) (hqr : (Q → R)) (h : (P ∨ Q))',
        proposition: 'R',
        goalLabel: 'R',
        objects: [],
        assumptions: [
            { name: 'hpr', prop: 'P → R' },
            { name: 'hqr', prop: 'Q → R' },
            { name: 'h', prop: 'P ∨ Q' },
        ],
        toolboxBlocks: ['hw_or_elim', 'hw_apply_rule', 'hw_forward', 'hw_exact'],
        introduction: `# חלוקה למקרים

ההנחה \`P ∨ Q\` אומרת שלפחות אחת מהטענות P ו־Q נכונה, אבל לא אומרת איזו.
לכן אי אפשר פשוט להשתמש ב־P, וגם לא ב־Q.

במקום זה מחלקים למקרים: מוכיחים את המטרה R פעם אחת בהנחה ש־P נכונה, ופעם אחת בהנחה ש־Q נכונה.
אחד המקרים בוודאי מתקיים, ובשניהם R נכונה, ולכן R נכונה.

בבלוק "נחלק למקרים לפי ה"או" ?" בוחרים את ה"או", ולכל מקרה יש בבלוק מקום משלו: "מקרה ראשון: נניח P" ו"מקרה שני: נניח Q".
בכל מקרה ההנחה החדשה היא בדיוק התנאי של אחת הגרירות, ולכן אפשר ללכת אחורה מהמטרה או קדימה מההנחה.`,
        newTacticsBlocks: ['hw_or_elim'],
        newTacticsInfo: [orElimInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "נחלק למקרים לפי ה"או" ?" אל תוך בלוק המטרה, ובחרו בו P ∨ Q.',
            'במקרה הראשון: לפי הגרירה P → R, די להוכיח P, ו־P בידינו. או קדימה: מהגרירה P → R ומ־P נובע R.',
            'במקרה השני: באותו אופן, בעזרת Q → R ו־Q.',
        ],
        conclusion: `לא ידעתם איזה צד של "P או Q" נכון, ולכן הוכחתם את R בשני המקרים.
זו הוכחה בחלוקה למקרים: כשמשתמשים ב"או", צריך לטפל בכל אחד מהצדדים שלו.`,
        startXml: goalXml('R', '(P → R),  (Q → R),  (P ∨ Q)'),
    },
    {
        id: 'hw-unit2-6',
        levelNumber: 6,
        totalLevels: 9,
        title: 'קודם מקרים, אחר כך צד',
        name: 'hw_unit2_l6_or_comm',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '((P ∨ Q) → (Q ∨ P))',
        goalLabel: '((P ∨ Q) → (Q ∨ P))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['hw_assume', 'hw_or_elim', 'hw_or_intro', 'hw_exact'],
        introduction: `# מתי בוחרים צד?

המטרה: אם "P או Q", אז "Q או P". ההוכחה כבר התחילה: הנחנו את התנאי, \`P ∨ Q\`, ובחרנו להוכיח את Q, צד שמאל של המטרה.

לחצו על הבלוק השני ובחרו "אחרי המהלך": נשאר להוכיח Q, אבל \`P ∨ Q\` לא אומרת ש־Q נכונה, רק שאחת מהטענות P ו־Q נכונה. בחירה ב־P הייתה נתקעת באותו אופן.
המהלך לא שגוי, אבל אי אפשר להמשיך ממנו: בחרנו צד מוקדם מדי.

הוציאו את הבלוק השני (גררו אותו לפח). קודם חלקו למקרים לפי \`P ∨ Q\`, ורק בתוך כל מקרה בחרו את הצד שאפשר להוכיח בו.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "כדי להוכיח (Q ∨ P) די להוכיח Q" לפח, והשאירו את "נניח".',
            'הוסיפו אחרי "נניח" חלוקה למקרים לפי P ∨ Q.',
            'במקרה ש־P נכונה, די להוכיח P. במקרה ש־Q נכונה, די להוכיח Q.',
        ],
        conclusion: `כשמשתמשים ב"או" כדי להוכיח "או", בדרך כלל קודם מחלקים למקרים, ורק בתוך כל מקרה בוחרים צד:
רק שם יודעים איזה צד אפשר להוכיח.`,
        startXml: goalXml('((P ∨ Q) → (Q ∨ P))', 'אין הנחות פתיחה', prematureSideXml),
    },
    {
        id: 'hw-unit2-7',
        levelNumber: 7,
        totalLevels: 9,
        title: 'משתמשים בהנחה מסוג "אם ורק אם"',
        name: 'hw_unit2_l7_iff_elim',
        variableLine: 'variable {P Q : Prop}',
        params: '(h : (P ↔ Q)) (hq : Q)',
        proposition: 'P',
        goalLabel: 'P',
        objects: [],
        assumptions: [
            { name: 'h', prop: 'P ↔ Q' },
            { name: 'hq', prop: 'Q' },
        ],
        toolboxBlocks: ['hw_iff_elim', 'hw_apply_rule', 'hw_forward', 'hw_exact'],
        introduction: `# "אם ורק אם"

הטענה \`P ↔ Q\` נקראת "P אם ורק אם Q", והיא אומרת שתי גרירות:
\`P → Q\` (אם P אז Q), ו־\`Q → P\` (אם Q אז P).

כאן נתונות ההנחות \`P ↔ Q\` ו־Q, והמטרה היא P. בכתב יד: "מ־P ↔ Q נובע P → Q ונובע Q → P".
אחר כך נשתמש בגרירה שהמסקנה שלה היא P, כמו ביחידה 1: אחורה מהמטרה, או קדימה, כי התנאי שלה, Q, כבר בידינו.`,
        newTacticsBlocks: ['hw_iff_elim'],
        newTacticsInfo: [iffElimInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "מה"אם ורק אם" ? נובעים שני הכיוונים שלו" אל תוך בלוק המטרה, ובחרו בו P ↔ Q.',
            'המסקנה של Q → P היא P: לפי הגרירה Q → P, די להוכיח Q.',
            'Q בידינו. או קדימה: מהגרירה Q → P ומ־Q נובע P.',
        ],
        conclusion: `מ"P אם ורק אם Q" הסקתם את שתי הגרירות, והשתמשתם ב־Q → P.
"אם ורק אם" הוא בעצם שתי גרירות, ומשתמשים בכל אחת מהן כמו בכל גרירה.`,
        startXml: goalXml('P', '(P ↔ Q),  Q'),
    },
    {
        id: 'hw-unit2-8',
        levelNumber: 8,
        totalLevels: 9,
        title: 'מוכיחים טענה מסוג "אם ורק אם"',
        name: 'hw_unit2_l8_iff_intro',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '((P ∧ Q) ↔ (Q ∧ P))',
        goalLabel: '((P ∧ Q) ↔ (Q ∧ P))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['hw_iff_intro', 'hw_assume', 'hw_and_elim', 'hw_and_intro', 'hw_and_combine', 'hw_exact'],
        introduction: `# תרגיל מסכם: שני כיוונים

כדי להוכיח "P אם ורק אם Q" מוכיחים את שני הכיוונים: את הגרירה \`P → Q\` ואת הגרירה \`Q → P\`.
הבלוק "כדי להוכיח את ה"אם ורק אם", נוכיח את שני הכיוונים" מפצל את ההוכחה לשני חלקים, כמו בהוכחת "וגם", ובראש כל חלק כתוב איזה כיוון מוכיחים בו.

כאן המטרה היא \`(P ∧ Q) ↔ (Q ∧ P)\`. כל כיוון הוא גרירה, ולכן כל חלק מתחיל בהנחת התנאי.
כל כיוון דומה להוכחה משלב 3.`,
        newTacticsBlocks: ['hw_iff_intro'],
        newTacticsInfo: [iffIntroInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "כדי להוכיח את ה"אם ורק אם", נוכיח את שני הכיוונים" אל תוך בלוק המטרה.',
            'בכיוון הראשון נוכיח (P ∧ Q) → (Q ∧ P): נניח את התנאי, ומ־P ∧ Q נובע P ונובע Q. אחר כך הוכיחו את Q ∧ P בשני חלקים, או קדימה.',
            'הכיוון השני זהה, עם P ו־Q בתפקידים הפוכים.',
        ],
        conclusion: `אתם יודעים להשתמש ב"וגם", ב"או" וב"אם ורק אם" שבהנחות, ולהוכיח כל אחד מהם:
"וגם" בשני חלקים, "או" בבחירת צד (אחרי חלוקה למקרים, אם צריך), ו"אם ורק אם" בשני כיוונים.
בשלב הבונוס תשלבו את כל הכללים בהוכחה אחת.`,
        startXml: goalXml('((P ∧ Q) ↔ (Q ∧ P))'),
    },
    {
        id: 'hw-unit2-9',
        levelNumber: 9,
        totalLevels: 9,
        title: 'שלב בונוס: פילוג',
        name: 'hw_unit2_l9_distributivity',
        variableLine: 'variable {P Q R : Prop}',
        params: '',
        proposition: '((P ∧ (Q ∨ R)) → ((P ∧ Q) ∨ (P ∧ R)))',
        goalLabel: '((P ∧ (Q ∨ R)) → ((P ∧ Q) ∨ (P ∧ R)))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['hw_assume', 'hw_and_elim', 'hw_and_intro', 'hw_and_combine', 'hw_or_elim', 'hw_or_intro', 'hw_exact'],
        introduction: `# בונוס: פילוג

הטענה הזאת אומרת ש"וגם" מתפלג על "או": אם P נכונה, וגם Q או R נכונה,
אז "P וגם Q" נכונה, או "P וגם R" נכונה.

בהוכחה תשתמשו כמעט בכל מה שלמדתם ביחידה: הנחת תנאי, שימוש ב"וגם", חלוקה למקרים, בחירת צד של "או", והוכחת "וגם".
כדאי לבנות את ההוכחה צעד אחר צעד, ולבדוק במצב ההוכחה מה נשאר להוכיח בכל חלק.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'נניח את התנאי, ומ־P ∧ (Q ∨ R) נובע P ונובע Q ∨ R.',
            'נחלק למקרים לפי Q ∨ R.',
            'במקרה ש־Q נכונה, די להוכיח P ∧ Q: בחרו בו, והוכיחו אותו בשני חלקים. או קדימה: מ־P ומ־Q נובע P ∧ Q.',
            'במקרה ש־R נכונה, די להוכיח P ∧ R, באותו אופן.',
        ],
        conclusion: `סיימתם את יחידה 2, כולל שלב הבונוס! בהוכחה אחת השתמשתם ב"וגם" ובחלוקה למקרים,
בחרתם צד של "או" בתוך כל מקרה, והוכחתם "וגם".`,
        startXml: goalXml('((P ∧ (Q ∨ R)) → ((P ∧ Q) ∨ (P ∧ R)))'),
    },
];
