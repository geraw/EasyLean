import { goalXml } from './levelXml';

export const unit2WorldName = 'יחידה 2 - וגם, או, אם ורק אם';

const andElimInfo = {
    name: 'שימוש ב"וגם"',
    doc: 'מהנחה מסוג "P וגם Q" אפשר להסיק את שני הצדדים שלה: גם P וגם Q. נותנים לכל צד שם, ומשתמשים בו כמו בכל הנחה.',
};

const andIntroInfo = {
    name: 'הוכחת "וגם"',
    doc: 'כדי להוכיח "P וגם Q" מוכיחים את שני הצדדים לחוד: הוכחה של P בחלק "צד שמאל", והוכחה של Q בחלק "צד ימין".',
};

const orIntroInfo = {
    name: 'הוכחת "או"',
    doc: 'כדי להוכיח "P או Q" מספיק להוכיח אחד מהצדדים. בוחרים את הצד שאפשר להוכיח, ונשאר להוכיח רק אותו.',
};

const orElimInfo = {
    name: 'חלוקה למקרים לפי "או"',
    doc: 'אם ידוע "P או Q", לא יודעים איזה מהצדדים נכון. לכן מוכיחים את המטרה פעמיים: פעם במקרה ש־P נכון, ופעם במקרה ש־Q נכון.',
};

const iffElimInfo = {
    name: 'שימוש ב"אם ורק אם"',
    doc: '"P אם ורק אם Q" אומרת שתי גרירות: P → Q ו־Q → P. מההנחה מסיקים את שתיהן, ומשתמשים בהן כמו בכל גרירה.',
};

const iffIntroInfo = {
    name: 'הוכחת "אם ורק אם"',
    doc: 'כדי להוכיח "P אם ורק אם Q" מוכיחים את שני הכיוונים לחוד: את הגרירה P → Q ואת הגרירה Q → P.',
};

// The wrong first move of level 6, already placed: choosing a side of the
// "or" before splitting into cases gets stuck.
const prematureSideXml = `
      <block type="tactic_intro">
        <field name="HYPOTHESIS">h</field>
        <next>
          <block type="logic_or_intro_left"></block>
        </next>
      </block>`;

export const unit2Levels = [
    {
        id: 'unit2-1',
        levelNumber: 1,
        totalLevels: 9,
        title: 'משתמשים בהנחה מסוג "וגם"',
        name: 'unit2_l1_and_elim',
        variableLine: 'variable {P Q : Prop}',
        params: '(h : (P ∧ Q))',
        proposition: 'Q',
        goalLabel: 'Q',
        objects: [],
        assumptions: [{ name: 'h', prop: 'P ∧ Q' }],
        toolboxBlocks: ['logic_and_elim', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# "וגם"

הטענה \`P ∧ Q\` נקראת "P וגם Q", והיא אומרת ששתי הטענות נכונות: גם P וגם Q.
P הוא *צד שמאל* שלה, ו־Q הוא *צד ימין* שלה.

כאן נתונה ההנחה \`h : P ∧ Q\`, והמטרה היא Q. אף הנחה לא אומרת בדיוק Q, אבל Q הוא צד ימין של h.
לכן קודם נסיק מ־h את שני הצדדים שלה, ונקבל שתי הנחות חדשות: אחת אומרת P, והשנייה אומרת Q.
אחר כך נסגור את המטרה בעזרת ההנחה שאומרת Q.`,
        newTacticsBlocks: ['logic_and_elim'],
        newTacticsInfo: [andElimInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "מההנחה ? מסוג "וגם" נסיק את שני הצדדים שלה" אל תוך בלוק המטרה, וכתבו בו h. לשני הצדדים תנו שמות, למשל h1 ו־h2.',
            'לחצו על הבלוק ובחרו "אחרי המהלך": יש בידינו h1 : P ו־h2 : Q. הוסיפו "מה שאנחנו רוצים להוכיח זה בדיוק" עם h2.',
        ],
        conclusion: `מההנחה "P וגם Q" הסקתם את שני הצדדים שלה, וסגרתם את המטרה Q בעזרת צד ימין.
כך משתמשים ב"וגם": מפרקים אותו לשני הצדדים, וכל צד הוא הנחה בפני עצמה.`,
        startXml: goalXml('Q', 'h : (P ∧ Q)'),
    },
    {
        id: 'unit2-2',
        levelNumber: 2,
        totalLevels: 9,
        title: 'מוכיחים טענה מסוג "וגם"',
        name: 'unit2_l2_and_intro',
        variableLine: 'variable {P Q : Prop}',
        params: '(h1 : P) (h2 : Q)',
        proposition: '(P ∧ Q)',
        goalLabel: '(P ∧ Q)',
        objects: [],
        assumptions: [
            { name: 'h1', prop: 'P' },
            { name: 'h2', prop: 'Q' },
        ],
        toolboxBlocks: ['logic_and_intro', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# הוכחה בשני חלקים

הפעם המטרה היא \`P ∧ Q\`. כדי להוכיח "P וגם Q" צריך להוכיח את שני הצדדים: גם את P וגם את Q.

הבלוק "נוכיח כל אחד משני הצדדים" מפצל את ההוכחה לשני חלקים, ולכל חלק יש בבלוק מקום משלו:
בחלק "צד שמאל" מוכיחים את P, ובחלק "צד ימין" מוכיחים את Q. כל חלק הוא הוכחה קטנה בפני עצמה.

לחיצה על מהלך בתוך אחד החלקים מראה במצב ההוכחה את המצב באותו חלק בלבד.`,
        newTacticsBlocks: ['logic_and_intro'],
        newTacticsInfo: [andIntroInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "נוכיח כל אחד משני הצדדים של ה"וגם" לחוד" אל תוך בלוק המטרה.',
            'בחלק "צד שמאל" צריך להוכיח P: גררו לשם "מה שאנחנו רוצים להוכיח זה בדיוק" עם h1.',
            'בחלק "צד ימין" צריך להוכיח Q: גררו לשם "מה שאנחנו רוצים להוכיח זה בדיוק" עם h2.',
        ],
        conclusion: `הוכחתם את P ואת Q כל אחד בחלק משלו, ולכן הוכחתם את "P וגם Q".`,
        startXml: goalXml('(P ∧ Q)', 'h1 : P,  h2 : Q'),
    },
    {
        id: 'unit2-3',
        levelNumber: 3,
        totalLevels: 9,
        title: 'מחליפים את הצדדים',
        name: 'unit2_l3_and_comm',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '((P ∧ Q) → (Q ∧ P))',
        goalLabel: '((P ∧ Q) → (Q ∧ P))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['tactic_intro', 'logic_and_elim', 'logic_and_intro', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# מחליפים את הצדדים

המטרה היא גרירה: אם "P וגם Q", אז "Q וגם P". כמו ביחידה 1, מתחילים בהנחת התנאי שלה.

אחרי ההנחה יש בידינו "P וגם Q", והמטרה היא "Q וגם P". כאן משתמשים בשני המהלכים של "וגם":
מסיקים מההנחה את שני הצדדים שלה, ומוכיחים את המטרה בשני חלקים.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'הניחו את התנאי של הגרירה וקראו לו h.',
            'הסיקו מ־h את שני הצדדים שלה: h1 : P ו־h2 : Q.',
            'הוכיחו את "Q וגם P" בשני חלקים: בצד שמאל צריך להוכיח Q, ובצד ימין צריך להוכיח P.',
        ],
        conclusion: `"וגם" לא תלוי בסדר: מ"P וגם Q" נובע "Q וגם P".
בהוכחה השתמשתם ב"וגם" שבהנחה (פירקתם אותו) וגם הוכחתם "וגם" (בשני חלקים).`,
        startXml: goalXml('((P ∧ Q) → (Q ∧ P))'),
    },
    {
        id: 'unit2-4',
        levelNumber: 4,
        totalLevels: 9,
        title: 'מוכיחים טענה מסוג "או"',
        name: 'unit2_l4_or_intro',
        variableLine: 'variable {P Q : Prop}',
        params: '(h : P)',
        proposition: '(Q ∨ P)',
        goalLabel: '(Q ∨ P)',
        objects: [],
        assumptions: [{ name: 'h', prop: 'P' }],
        toolboxBlocks: ['logic_or_intro_left', 'logic_or_intro_right', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# "או"

הטענה \`Q ∨ P\` נקראת "Q או P", והיא אומרת שלפחות אחת משתי הטענות נכונה.

כדי להוכיח "או" מספיק להוכיח צד אחד. אבל צריך לבחור את הצד הנכון: את הצד שאפשר להוכיח ממה שיש בידינו.
כאן נתונה ההנחה \`h : P\`, ולא ידוע לנו דבר על Q. איזה צד כדאי לבחור?`,
        newTacticsBlocks: ['logic_or_intro_left', 'logic_or_intro_right'],
        newTacticsInfo: [orIntroInfo],
        newDefinitions: [],
        hints: [
            'P הוא צד ימין של המטרה, ו־h אומרת P. בחרו בבלוק "כדי להוכיח את ה"או", נוכיח את צד ימין שלו".',
            'עכשיו המטרה היא P. סגרו אותה בעזרת h.',
        ],
        conclusion: `בחרתם להוכיח את צד ימין, P, כי אותו אפשר להוכיח בעזרת h.
אם הייתם בוחרים בצד שמאל, הייתם נתקעים עם המטרה Q, שאין לנו שום דרך להוכיח.`,
        startXml: goalXml('(Q ∨ P)', 'h : P'),
    },
    {
        id: 'unit2-5',
        levelNumber: 5,
        totalLevels: 9,
        title: 'חלוקה למקרים',
        name: 'unit2_l5_or_elim',
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
        toolboxBlocks: ['logic_or_elim', 'tactic_apply_rule', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# חלוקה למקרים

ההנחה \`h : P ∨ Q\` אומרת שלפחות אחת מהטענות P ו־Q נכונה, אבל לא אומרת איזו.
לכן אי אפשר פשוט להשתמש ב־P, וגם לא ב־Q.

במקום זה מחלקים למקרים: מוכיחים את המטרה R פעם אחת במקרה ש־P נכון, ופעם אחת במקרה ש־Q נכון.
אחד המקרים בוודאי מתקיים, ובשניהם R נכונה, ולכן R נכונה.

בכל מקרה יש לנו הנחה חדשה (בתחילת המקרה נותנים לה שם), והמטרה בשני המקרים היא R.`,
        newTacticsBlocks: ['logic_or_elim'],
        newTacticsInfo: [orElimInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "נחלק למקרים לפי ההנחה ? מסוג "או"" אל תוך בלוק המטרה, וכתבו בו h. לשני המקרים תנו שמות, למשל h1 (ההנחה P) ו־h2 (ההנחה Q).',
            'במקרה הראשון: המסקנה של hpr היא R, ולכן עברו להוכיח את התנאי שלה, P, וסגרו בעזרת h1.',
            'במקרה השני: באותו אופן, בעזרת hqr ו־h2.',
        ],
        conclusion: `לא ידעתם איזה צד של "P או Q" נכון, ולכן הוכחתם את R בשני המקרים.
זו הוכחה בחלוקה למקרים: כשמשתמשים ב"או", צריך לטפל בכל אחד מהצדדים שלו.`,
        startXml: goalXml('R', 'hpr : (P → R),  hqr : (Q → R),  h : (P ∨ Q)'),
    },
    {
        id: 'unit2-6',
        levelNumber: 6,
        totalLevels: 9,
        title: 'קודם מקרים, אחר כך צד',
        name: 'unit2_l6_or_comm',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '((P ∨ Q) → (Q ∨ P))',
        goalLabel: '((P ∨ Q) → (Q ∨ P))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['tactic_intro', 'logic_or_elim', 'logic_or_intro_left', 'logic_or_intro_right', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# מתי בוחרים צד?

המטרה: אם "P או Q", אז "Q או P". ההוכחה כבר התחילה: הנחנו את התנאי, h : P ∨ Q, ובחרנו להוכיח את צד שמאל של המטרה, Q.

לחצו על הבלוק השני ובחרו "אחרי המהלך": נשאר להוכיח Q, אבל h לא אומרת ש־Q נכונה, רק שאחת מהטענות P ו־Q נכונה. בחירה בצד ימין, P, הייתה נתקעת באותו אופן.
המהלך לא שגוי, אבל אי אפשר להמשיך ממנו: בחרנו צד מוקדם מדי.

הוציאו את הבלוק השני (גררו אותו לפח). קודם חלקו למקרים לפי h, ורק בתוך כל מקרה בחרו את הצד שאפשר להוכיח בו.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "כדי להוכיח את ה"או", נוכיח את צד שמאל שלו" לפח, והשאירו את "נניח".',
            'הוסיפו אחרי "נניח" חלוקה למקרים לפי h.',
            'במקרה ש־P נכון, P הוא צד ימין של המטרה: בחרו בצד ימין. במקרה ש־Q נכון, בחרו בצד שמאל.',
        ],
        conclusion: `כשמשתמשים ב"או" כדי להוכיח "או", בדרך כלל קודם מחלקים למקרים, ורק בתוך כל מקרה בוחרים צד:
רק שם יודעים איזה צד אפשר להוכיח.`,
        startXml: goalXml('((P ∨ Q) → (Q ∨ P))', 'אין הנחות פתיחה', prematureSideXml),
    },
    {
        id: 'unit2-7',
        levelNumber: 7,
        totalLevels: 9,
        title: 'משתמשים בהנחה מסוג "אם ורק אם"',
        name: 'unit2_l7_iff_elim',
        variableLine: 'variable {P Q : Prop}',
        params: '(h : (P ↔ Q)) (hq : Q)',
        proposition: 'P',
        goalLabel: 'P',
        objects: [],
        assumptions: [
            { name: 'h', prop: 'P ↔ Q' },
            { name: 'hq', prop: 'Q' },
        ],
        toolboxBlocks: ['logic_iff_elim', 'tactic_apply_rule', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# "אם ורק אם"

הטענה \`P ↔ Q\` נקראת "P אם ורק אם Q", והיא אומרת שתי גרירות:
*משמאל לימין*, \`P → Q\` (אם P אז Q), ו*מימין לשמאל*, \`Q → P\` (אם Q אז P).

כאן נתונות ההנחות \`h : P ↔ Q\` ו־\`hq : Q\`, והמטרה היא P.
נסיק מ־h את שתי הגרירות, ונשתמש בזו שהמסקנה שלה היא P, כמו ביחידה 1.`,
        newTacticsBlocks: ['logic_iff_elim'],
        newTacticsInfo: [iffElimInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "מההנחה ? מסוג "אם ורק אם" נסיק את שני הכיוונים שלה", וכתבו בו h. לשני הכיוונים תנו שמות, למשל h1 : P → Q ו־h2 : Q → P.',
            'המסקנה של h2 היא P: עברו להוכיח את התנאי שלה, Q.',
            'סגרו בעזרת hq.',
        ],
        conclusion: `מ"P אם ורק אם Q" הסקתם את שתי הגרירות, והשתמשתם בכיוון מימין לשמאל, Q → P.
"אם ורק אם" הוא בעצם שתי גרירות, ומשתמשים בכל אחת מהן כמו בכל גרירה.`,
        startXml: goalXml('P', 'h : (P ↔ Q),  hq : Q'),
    },
    {
        id: 'unit2-8',
        levelNumber: 8,
        totalLevels: 9,
        title: 'מוכיחים טענה מסוג "אם ורק אם"',
        name: 'unit2_l8_iff_intro',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '((P ∧ Q) ↔ (Q ∧ P))',
        goalLabel: '((P ∧ Q) ↔ (Q ∧ P))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['logic_iff_intro', 'tactic_intro', 'logic_and_elim', 'logic_and_intro', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# תרגיל מסכם: שני כיוונים

כדי להוכיח "P אם ורק אם Q" מוכיחים את שני הכיוונים: את הגרירה \`P → Q\` ואת הגרירה \`Q → P\`.
הבלוק "נוכיח את שני הכיוונים" מפצל את ההוכחה לשני חלקים, כמו בהוכחת "וגם".

כאן המטרה היא \`(P ∧ Q) ↔ (Q ∧ P)\`. כל כיוון הוא גרירה, ולכן כל חלק מתחיל בהנחת התנאי.
כל כיוון דומה להוכחה משלב 3.`,
        newTacticsBlocks: ['logic_iff_intro'],
        newTacticsInfo: [iffIntroInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "נוכיח את שני הכיוונים של ה"אם ורק אם" לחוד" אל תוך בלוק המטרה.',
            'בכיוון הראשון המטרה היא (P ∧ Q) → (Q ∧ P): הניחו את התנאי, הסיקו ממנו את שני הצדדים, והוכיחו את Q ∧ P בשני חלקים.',
            'הכיוון השני זהה, עם P ו־Q בתפקידים הפוכים.',
        ],
        conclusion: `אתם יודעים להשתמש ב"וגם", ב"או" וב"אם ורק אם" שבהנחות, ולהוכיח כל אחד מהם:
"וגם" בשני חלקים, "או" בבחירת צד (אחרי חלוקה למקרים, אם צריך), ו"אם ורק אם" בשני כיוונים.
בשלב הבונוס תשלבו את כל הכללים בהוכחה אחת.`,
        startXml: goalXml('((P ∧ Q) ↔ (Q ∧ P))'),
    },
    {
        id: 'unit2-9',
        levelNumber: 9,
        totalLevels: 9,
        title: 'שלב בונוס: פילוג',
        name: 'unit2_l9_distributivity',
        variableLine: 'variable {P Q R : Prop}',
        params: '',
        proposition: '((P ∧ (Q ∨ R)) → ((P ∧ Q) ∨ (P ∧ R)))',
        goalLabel: '((P ∧ (Q ∨ R)) → ((P ∧ Q) ∨ (P ∧ R)))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['tactic_intro', 'logic_and_elim', 'logic_and_intro', 'logic_or_elim', 'logic_or_intro_left', 'logic_or_intro_right', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# בונוס: פילוג

הטענה הזאת אומרת ש"וגם" מתפלג על "או": אם P נכונה, וגם Q או R נכונה,
אז "P וגם Q" נכונה, או "P וגם R" נכונה.

בהוכחה תשתמשו כמעט בכל מה שלמדתם ביחידה: הנחת תנאי, שימוש ב"וגם", חלוקה למקרים, בחירת צד של "או", והוכחת "וגם".
כדאי לבנות את ההוכחה צעד אחר צעד, ולבדוק במצב ההוכחה מה נשאר להוכיח בכל חלק.

שימו לב לשמות: כל הנחה צריכה שם משלה. אם ההנחות h1 ו־h2 כבר בידכם, תנו למקרים שמות אחרים.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'הניחו את התנאי וקראו לו h, והסיקו ממנו את שני הצדדים: h1 : P ו־h2 : Q ∨ R.',
            'חלקו למקרים לפי h2, ותנו למקרים שמות חדשים, למשל hq ו־hr.',
            'במקרה ש־Q נכון, אפשר להוכיח את צד שמאל של המטרה, P ∧ Q: בחרו בו, והוכיחו אותו בשני חלקים בעזרת h1 ו־hq.',
            'במקרה ש־R נכון, בחרו בצד ימין, P ∧ R, והוכיחו אותו באותו אופן בעזרת h1 ו־hr.',
        ],
        conclusion: `סיימתם את יחידה 2, כולל שלב הבונוס! בהוכחה אחת השתמשתם ב"וגם" ובחלוקה למקרים,
בחרתם צד של "או" בתוך כל מקרה, והוכחתם "וגם" בשני חלקים.`,
        startXml: goalXml('((P ∧ (Q ∨ R)) → ((P ∧ Q) ∨ (P ∧ R)))'),
    },
];
