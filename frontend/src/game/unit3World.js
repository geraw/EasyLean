import { goalXml } from './levelXml';

// Unit 3 (see blocks/moves.js): "and", "or" and "iff", in moves that read
// like a proof written by hand. A move that
// splits the proof heads each part with what is proved in it ("החלק הראשון: P",
// "מקרה 1: P") and ends with what was proved ("המקרים מכסים את כל האפשרויות, ובשניהם R."). Proving an
// "or" holds the rest of its proof inside it, between an opening and a
// closing line ("כדי להוכיח Q ∨ P נוכיח את P" ... "לכן Q ∨ P.").

export const unit3WorldName = 'יחידה 3 - וגם, או, אם ורק אם';

const andElimInfo = {
    name: 'שימוש ב"וגם"',
    doc: 'מ"P וגם Q" נקבל את שני הצדדים שלה, P ו־Q, ושניהם מצטרפים להנחות. בהוכחה כתובה: "מ־P ∧ Q נקבל P וגם Q".',
};

const andIntroInfo = {
    name: 'הוכחת "וגם"',
    doc: 'כדי להוכיח "P וגם Q" מוכיחים את שני הצדדים, כל אחד בחלק משלו: בחלק הראשון מוכיחים P, ובחלק השני מוכיחים Q. אחריהם: "הוכחנו את שני החלקים, ולכן P ∧ Q".',
};

const andCombineInfo = {
    name: 'צירוף שתי הנחות ל"וגם"',
    doc: 'אם בידינו P וגם Q, נקבל "P וגם Q", והוא מצטרף להנחות. זו הוכחת "וגם" קדימה, מההנחות. בהוכחה כתובה: "מ־P ומ־Q נקבל P ∧ Q".',
};

const OR_BY_NEGATION_BLOCK = '"נניח ... עלינו להראות את הצד השני."';

const orByNegationInfo = {
    name: 'הוכחת "או", כמו בהרצאה',
    doc: 'כדי להוכיח "P או Q" מניחים את השלילה של צד אחד, ומוכיחים את הצד השני: אם הצד הראשון נכון, ה"או" נכון, ואם לא, הוכחנו שהשני נכון (השקילות של ¬α → β ו־α ∨ β, יחידה 1, שלב 3). בבלוק בוחרים איזה צד לשלול. בהוכחה כתובה: "נניח ¬P. עלינו להראות Q. … הוכחנו ¬P → Q, ולכן P ∨ Q."',
};

const orIntroInfo = {
    name: 'הוכחת "או" בקיצור',
    doc: 'כשאחד הצדדים כבר ניתן להוכחה ממה שבידינו, די להוכיח אותו, בלי להניח דבר. בוחרים את הצד, ונשאר להוכיח רק אותו, בתוך הבלוק. בהוכחה כתובה: "כדי להוכיח P ∨ Q נוכיח את P. ... לכן P ∨ Q."',
};

const orElimInfo = {
    name: 'חלוקה למקרים לפי "או"',
    doc: 'אם ידוע "P או Q", לא יודעים איזה מהצדדים נכון. לכן מוכיחים את המטרה פעמיים: פעם בהנחה P (מקרה 1), ופעם בהנחה Q (מקרה 2). אחריהם: "בכל המקרים" המטרה נכונה.',
};

const iffElimInfo = {
    name: 'שימוש ב"אם ורק אם"',
    doc: '"P אם ורק אם Q" אומרת שתי גרירות: P → Q ו־Q → P. נקבל ממנה את שתיהן, והן מצטרפות להנחות, ומשתמשים בהן כמו בכל גרירה. בהוכחה כתובה: "מ־P ↔ Q נקבל P → Q וגם Q → P".',
};

const iffIntroInfo = {
    name: 'הוכחת "אם ורק אם"',
    doc: 'כדי להוכיח "P אם ורק אם Q" מוכיחים את שני הכיוונים, כל אחד בחלק משלו: את הגרירה P → Q ואת הגרירה Q → P. אחריהם: "הוכחנו את שני הכיוונים, ולכן P ↔ Q".',
};

// The wrong second move of level 6, already placed: choosing a side of the
// "or" before splitting into cases gets stuck.
const prematureSideXml = `
      <block type="assume">
        <statement name="BODY">
          <block type="or_intro"><field name="SIDE">LEFT</field></block>
        </statement>
      </block>`;

const CLOSE = '"המטרה בידינו, וזה מה שעלינו להראות."';

export const unit3Levels = [
    {
        id: 'unit3-1',
        levelNumber: 1,
        totalLevels: 9,
        title: 'משתמשים בהנחה מסוג "וגם"',
        name: 'unit3_l1_and_elim',
        variableLine: 'variable {P Q : Prop}',
        params: '(h : (P ∧ Q))',
        proposition: 'Q',
        goalLabel: 'Q',
        objects: [],
        assumptions: [{ name: 'h', prop: 'P ∧ Q' }],
        toolboxBlocks: ['and_elim', 'exact'],
        introduction: `# "וגם"

הטענה \`P ∧ Q\` נקראת "P וגם Q", והיא אומרת ששתי הטענות נכונות: גם P וגם Q.
P הוא *צד שמאל* שלה, ו־Q הוא *צד ימין* שלה.

כאן נתונה ההנחה \`P ∧ Q\`, והמטרה היא Q. אף הנחה לא אומרת בדיוק Q, אבל Q הוא צד ימין של ההנחה.
בהוכחה כתובה: "מ־P ∧ Q נקבל P וגם Q". הבלוק "מ־ ? נקבל את שני החלקים..." עושה זאת: שני הצדדים מצטרפים להנחות, ואחד מהם הוא בדיוק המטרה.`,
        newTacticsBlocks: ['and_elim'],
        newTacticsInfo: [andElimInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "מ־ ? נקבל את שני החלקים..." אל תוך בלוק המטרה, ובחרו בו את P ∧ Q. עכשיו כתוב בו: מ־ P ∧ Q נקבל P וגם Q.',
            `עכשיו Q בידינו. הוסיפו אחריו את הבלוק ${CLOSE}`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "מ־P ∧ Q נקבל P וגם Q. Q בידינו, וזה מה שעלינו להראות."
כך משתמשים ב"וגם": מפרקים אותו לשני הצדדים, וכל צד הוא הנחה בפני עצמה.`,
        startXml: goalXml('Q', '(P ∧ Q)'),
    },
    {
        id: 'unit3-2',
        levelNumber: 2,
        totalLevels: 9,
        title: 'מוכיחים טענה מסוג "וגם"',
        name: 'unit3_l2_and_intro',
        variableLine: 'variable {P Q : Prop}',
        params: '(h1 : P) (h2 : Q)',
        proposition: '(P ∧ Q)',
        goalLabel: '(P ∧ Q)',
        objects: [],
        assumptions: [
            { name: 'h1', prop: 'P' },
            { name: 'h2', prop: 'Q' },
        ],
        toolboxBlocks: ['and_intro', 'exact'],
        introduction: `# הוכחה בשני חלקים

הפעם המטרה היא \`P ∧ Q\`. כדי להוכיח "P וגם Q" צריך להוכיח את שני הצדדים: גם את P וגם את Q.

הבלוק "נוכיח את שני החלקים של ה"וגם"" מפצל את ההוכחה לשני חלקים, ולכל חלק יש בבלוק מקום משלו.
כשהבלוק במקומו, בראש כל חלק כתוב מה מוכיחים בו: "החלק הראשון: P" ו"החלק השני: Q". כל חלק הוא הוכחה קטנה בפני עצמה.
בתחתית הבלוק כתוב מה הוכחנו בסוף: "הוכחנו את שני החלקים, ולכן P ∧ Q."

לחיצה על מהלך בתוך אחד החלקים מראה במצב ההוכחה את המצב באותו חלק בלבד.`,
        newTacticsBlocks: ['and_intro'],
        newTacticsInfo: [andIntroInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "נוכיח את שני החלקים..." אל תוך בלוק המטרה.',
            `בחלק הראשון, P כבר בידינו: גררו לשם את הבלוק ${CLOSE}`,
            'גם בחלק השני, Q כבר בידינו.',
        ],
        conclusion: `הוכחתם את P ואת Q כל אחד בחלק משלו, ולכן הוכחתם את "P וגם Q".
בהוכחה כתובה: "נוכיח את שני החלקים של P ∧ Q. החלק הראשון: P בידינו, וזה מה שעלינו להראות. החלק השני: Q בידינו, וזה מה שעלינו להראות. הוכחנו את שני החלקים, ולכן P ∧ Q."`,
        startXml: goalXml('(P ∧ Q)', 'P,  Q'),
    },
    {
        id: 'unit3-3',
        levelNumber: 3,
        totalLevels: 9,
        title: 'מחליפים את הצדדים',
        name: 'unit3_l3_and_comm',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '((P ∧ Q) → (Q ∧ P))',
        goalLabel: '((P ∧ Q) → (Q ∧ P))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['assume', 'and_elim', 'and_intro', 'and_combine', 'exact'],
        introduction: `# מחליפים את הצדדים

המטרה היא גרירה: אם "P וגם Q", אז "Q וגם P". כמו ביחידה 2, מתחילים בהנחת התנאי שלה, ואת שאר ההוכחה בונים בתוך "נניח".

אחרי ההנחה יש בידינו \`P ∧ Q\`, והמטרה היא \`Q ∧ P\`. כאן משתמשים בשני המהלכים של "וגם":
מקבלים מההנחה את שני הצדדים שלה, ומוכיחים את המטרה בשני חלקים.

אפשר גם ללכת קדימה: אחרי שקיבלתם את שני הצדדים, צרפו אותם בסדר ההפוך.
בהוכחה כתובה: "מ־Q ומ־P נקבל Q ∧ P", וזו בדיוק המטרה.`,
        newTacticsBlocks: ['and_combine'],
        newTacticsInfo: [andCombineInfo],
        newDefinitions: [],
        hints: [
            'נניח את התנאי של הגרירה, P ∧ Q. את שאר ההוכחה בונים בתוך הבלוק "נניח".',
            'בתוך "נניח": מ־P ∧ Q נקבל P וגם Q.',
            'הוכיחו את Q ∧ P בשני חלקים: בכל חלק, מה שמוכיחים כבר בידינו. או קדימה: מ־Q ומ־P נקבל Q ∧ P, וזו המטרה.',
        ],
        conclusion: `"וגם" לא תלוי בסדר: מ"P וגם Q" נובע "Q וגם P".
בהוכחה השתמשתם ב"וגם" שבהנחה (פירקתם אותו) וגם הוכחתם "וגם" (בשני חלקים, או קדימה).`,
        startXml: goalXml('((P ∧ Q) → (Q ∧ P))'),
    },
    {
        id: 'unit3-4',
        levelNumber: 4,
        totalLevels: 9,
        title: 'מוכיחים טענה מסוג "או"',
        name: 'unit3_l4_or_intro',
        variableLine: 'variable {P Q : Prop}',
        params: '(h : P)',
        proposition: '(Q ∨ P)',
        goalLabel: '(Q ∨ P)',
        objects: [],
        assumptions: [{ name: 'h', prop: 'P' }],
        toolboxBlocks: ['or_by_negation', 'or_intro', 'exact'],
        introduction: `# "או"

הטענה \`Q ∨ P\` נקראת "Q או P", והיא אומרת שלפחות אחת משתי הטענות נכונה.

בהרצאה מוכיחים "או" כך: *מניחים את השלילה של צד אחד, ומוכיחים את הצד השני*. אם הצד הראשון נכון, ה"או" נכון; ואם לא, הוכחנו שהשני נכון. זו השקילות של \`¬α → β\` ו־\`α ∨ β\` מיחידה 1, שלב 3.
כאן נתונה ההנחה P, ולכן נניח ¬Q ונוכיח P, שכבר בידינו. בהוכחה כתובה: "נניח ¬Q. עלינו להראות P. ... הוכחנו ¬Q → P, ולכן Q ∨ P." הבלוק ${OR_BY_NEGATION_BLOCK} עושה זאת: בוחרים בו איזה צד לשלול, ואת ההוכחה של הצד השני בונים בתוך הבלוק.

כשצד אחד כבר ניתן להוכחה, כמו כאן, יש גם קיצור: להוכיח אותו ישר, בלי ההנחה. הבלוק "כדי להוכיח את ה"או" נוכיח את ?" עושה זאת. כאן ההנחה ¬Q לא נחוצה, אבל ביחידה 4 נראה טענות "או" שאי אפשר להוכיח בלעדיה.`,
        newTacticsBlocks: ['or_by_negation', 'or_intro'],
        newTacticsInfo: [orByNegationInfo, orIntroInfo],
        newDefinitions: [],
        hints: [
            `גררו את הבלוק ${OR_BY_NEGATION_BLOCK} אל תוך בלוק המטרה, ובחרו בו ¬Q. עכשיו כתוב בו: נניח ¬Q. עלינו להראות P.`,
            'עכשיו המטרה היא P, ו־P בידינו. את המהלך הבא גוררים לתוך הבלוק.',
            'או בקיצור: הבלוק "כדי להוכיח את ה"או" נוכיח את ?", ובחרו בו P.',
        ],
        conclusion: `ההוכחה, כמו בהרצאה: "נניח ¬Q. עלינו להראות P, וזה בידינו. הוכחנו ¬Q → P, ולכן Q ∨ P." או בקיצור: "כדי להוכיח Q ∨ P נוכיח את P. P בידינו. לכן Q ∨ P."
שימו לב איזה צד שוללים: אם הייתם שוללים את P, הייתם צריכים להוכיח את Q, שאין לנו שום דרך להוכיח.
בכל שלב שמוכיחים בו "או" יש בארגז את שתי הדרכים.`,
        startXml: goalXml('(Q ∨ P)', 'P'),
    },
    {
        id: 'unit3-5',
        levelNumber: 5,
        totalLevels: 9,
        title: 'חלוקה למקרים',
        name: 'unit3_l5_or_elim',
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
        toolboxBlocks: ['or_elim', 'apply_rule', 'forward', 'exact'],
        introduction: `# חלוקה למקרים

ההנחה \`P ∨ Q\` אומרת שלפחות אחת מהטענות P ו־Q נכונה, אבל לא אומרת איזו.
לכן אי אפשר פשוט להשתמש ב־P, וגם לא ב־Q.

במקום זה מחלקים למקרים: מוכיחים את המטרה R פעם אחת בהנחה ש־P נכונה, ופעם אחת בהנחה ש־Q נכונה.
אחד המקרים בוודאי מתקיים, ובשניהם R נכונה, ולכן R נכונה.

בבלוק "נחלק למקרים לפי ?" בוחרים את ה"או", ולכל מקרה יש בבלוק מקום משלו: "מקרה 1: P" ו"מקרה 2: Q". בכל מקרה מניחים את הצד שלו.
ההנחה החדשה היא בדיוק התנאי של אחת הגרירות, ולכן אפשר ללכת אחורה מהמטרה או קדימה מההנחה.
בתחתית הבלוק כתוב מה הוכחנו בסוף: "המקרים מכסים את כל האפשרויות, ובשניהם R."`,
        newTacticsBlocks: ['or_elim'],
        newTacticsInfo: [orElimInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "נחלק למקרים לפי ?" אל תוך בלוק המטרה, ובחרו בו P ∨ Q.',
            'במקרה 1: לפי P → R כדי להוכיח R די להוכיח P, ו־P בידינו. או קדימה: מ־P → R ומ־P נקבל R.',
            'במקרה 2: באותו אופן, בעזרת Q → R ו־Q.',
        ],
        conclusion: `לא ידעתם איזה צד של "P או Q" נכון, ולכן הוכחתם את R בשני המקרים.
זו הוכחה בחלוקה למקרים: כשמשתמשים ב"או", צריך לטפל בכל אחד מהצדדים שלו.`,
        startXml: goalXml('R', '(P → R),  (Q → R),  (P ∨ Q)'),
    },
    {
        id: 'unit3-6',
        levelNumber: 6,
        totalLevels: 9,
        title: 'קודם מקרים, אחר כך צד',
        name: 'unit3_l6_or_comm',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '((P ∨ Q) → (Q ∨ P))',
        goalLabel: '((P ∨ Q) → (Q ∨ P))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['assume', 'or_elim', 'or_by_negation', 'or_intro', 'exact'],
        introduction: `# מתי בוחרים צד?

המטרה: אם "P או Q", אז "Q או P". ההוכחה כבר התחילה: הנחנו את התנאי, \`P ∨ Q\`, ובתוך "נניח" בחרנו להוכיח את Q, צד שמאל של המטרה: "כדי להוכיח Q ∨ P נוכיח את Q".

לחצו על הבלוק השני ובחרו "אחרי המהלך": נשאר להוכיח Q, אבל \`P ∨ Q\` לא אומרת ש־Q נכונה, רק שאחת מהטענות P ו־Q נכונה. בחירה ב־P הייתה נתקעת באותו אופן.
המהלך לא שגוי, אבל אי אפשר להמשיך ממנו: בחרנו צד מוקדם מדי.

הוציאו את הבלוק השני (גררו אותו לפח). קודם חלקו למקרים לפי \`P ∨ Q\`, בתוך "נניח", ורק בתוך כל מקרה בחרו את הצד שאפשר להוכיח בו.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "כדי להוכיח Q ∨ P נוכיח את Q" לפח, והשאירו את "נניח".',
            'גררו לתוך "נניח" חלוקה למקרים לפי P ∨ Q.',
            'במקרה 1, P נכונה: כדי להוכיח Q ∨ P נוכיח את P. במקרה 2, Q נכונה: נוכיח את Q.',
        ],
        conclusion: `כשמשתמשים ב"או" כדי להוכיח "או", בדרך כלל קודם מחלקים למקרים, ורק בתוך כל מקרה בוחרים צד:
רק שם יודעים איזה צד אפשר להוכיח.`,
        startXml: goalXml('((P ∨ Q) → (Q ∨ P))', 'אין הנחות פתיחה', prematureSideXml),
    },
    {
        id: 'unit3-7',
        levelNumber: 7,
        totalLevels: 9,
        title: 'משתמשים בהנחה מסוג "אם ורק אם"',
        name: 'unit3_l7_iff_elim',
        variableLine: 'variable {P Q : Prop}',
        params: '(h : (P ↔ Q)) (hq : Q)',
        proposition: 'P',
        goalLabel: 'P',
        objects: [],
        assumptions: [
            { name: 'h', prop: 'P ↔ Q' },
            { name: 'hq', prop: 'Q' },
        ],
        toolboxBlocks: ['iff_elim', 'apply_rule', 'forward', 'exact'],
        introduction: `# "אם ורק אם"

הטענה \`P ↔ Q\` נקראת "P אם ורק אם Q", והיא אומרת שתי גרירות:
\`P → Q\` (אם P אז Q), ו־\`Q → P\` (אם Q אז P).

כאן נתונות ההנחות \`P ↔ Q\` ו־Q, והמטרה היא P. בהוכחה כתובה: "מ־P ↔ Q נקבל P → Q וגם Q → P".
אחר כך נשתמש בגרירה שהמסקנה שלה היא P, כמו ביחידה 2: אחורה מהמטרה, או קדימה, כי התנאי שלה, Q, כבר בידינו.`,
        newTacticsBlocks: ['iff_elim'],
        newTacticsInfo: [iffElimInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "מ־ ? נקבל את שני הכיוונים שלו" אל תוך בלוק המטרה, ובחרו בו P ↔ Q.',
            'המסקנה של Q → P היא P: לפי Q → P כדי להוכיח P די להוכיח Q.',
            'Q בידינו. או קדימה: מ־Q → P ומ־Q נקבל P.',
        ],
        conclusion: `מ"P אם ורק אם Q" קיבלתם את שתי הגרירות, והשתמשתם ב־Q → P.
"אם ורק אם" הוא בעצם שתי גרירות, ומשתמשים בכל אחת מהן כמו בכל גרירה.`,
        startXml: goalXml('P', '(P ↔ Q),  Q'),
    },
    {
        id: 'unit3-8',
        levelNumber: 8,
        totalLevels: 9,
        title: 'מוכיחים טענה מסוג "אם ורק אם"',
        name: 'unit3_l8_iff_intro',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '((P ∧ Q) ↔ (Q ∧ P))',
        goalLabel: '((P ∧ Q) ↔ (Q ∧ P))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['iff_intro', 'assume', 'and_elim', 'and_intro', 'and_combine', 'exact'],
        introduction: `# תרגיל מסכם: שני כיוונים

כדי להוכיח "P אם ורק אם Q" מוכיחים את שני הכיוונים: את הגרירה \`P → Q\` ואת הגרירה \`Q → P\`.
הבלוק "נוכיח את שני הכיוונים של ה"אם ורק אם"" מפצל את ההוכחה לשני חלקים, כמו בהוכחת "וגם", ובראש כל חלק כתוב איזה כיוון מוכיחים בו ("הכיוון הראשון: ...", "הכיוון השני: ...").

כאן המטרה היא \`(P ∧ Q) ↔ (Q ∧ P)\`. כל כיוון הוא גרירה, ולכן כל חלק מתחיל בהנחת התנאי, ושאר ההוכחה של הכיוון נבנית בתוך "נניח".
כל כיוון דומה להוכחה משלב 3.`,
        newTacticsBlocks: ['iff_intro'],
        newTacticsInfo: [iffIntroInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "נוכיח את שני הכיוונים..." אל תוך בלוק המטרה.',
            'בכיוון הראשון נוכיח (P ∧ Q) → (Q ∧ P): נניח את התנאי, ובתוך "נניח": מ־P ∧ Q נקבל P וגם Q. אחר כך הוכיחו את Q ∧ P בשני חלקים, או קדימה.',
            'הכיוון השני זהה, עם P ו־Q בתפקידים הפוכים.',
        ],
        conclusion: `אתם יודעים להשתמש ב"וגם", ב"או" וב"אם ורק אם" שבהנחות, ולהוכיח כל אחד מהם:
"וגם" בשני חלקים, "או" בבחירת צד (אחרי חלוקה למקרים, אם צריך), ו"אם ורק אם" בשני כיוונים.
בשלב הבונוס תשלבו את כל הכללים בהוכחה אחת.`,
        startXml: goalXml('((P ∧ Q) ↔ (Q ∧ P))'),
    },
    {
        id: 'unit3-9',
        levelNumber: 9,
        totalLevels: 9,
        title: 'שלב בונוס: פילוג',
        name: 'unit3_l9_distributivity',
        variableLine: 'variable {P Q R : Prop}',
        params: '',
        proposition: '((P ∧ (Q ∨ R)) → ((P ∧ Q) ∨ (P ∧ R)))',
        goalLabel: '((P ∧ (Q ∨ R)) → ((P ∧ Q) ∨ (P ∧ R)))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['assume', 'and_elim', 'and_intro', 'and_combine', 'or_elim', 'or_by_negation', 'or_intro', 'exact'],
        introduction: `# בונוס: פילוג

הטענה הזאת אומרת ש"וגם" מתפלג על "או": אם P נכונה, וגם Q או R נכונה,
אז "P וגם Q" נכונה, או "P וגם R" נכונה.

בהוכחה תשתמשו כמעט בכל מה שלמדתם ביחידה: הנחת תנאי, שימוש ב"וגם", חלוקה למקרים, בחירת צד של "או", והוכחת "וגם" (בשני חלקים, או קדימה, בצירוף שני הצדדים).
כדאי לבנות את ההוכחה צעד אחר צעד, ולבדוק במצב ההוכחה מה נשאר להוכיח בכל חלק.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'נניח את התנאי, ובתוך "נניח": מ־P ∧ (Q ∨ R) נקבל P וגם Q ∨ R.',
            'נחלק למקרים לפי Q ∨ R.',
            'במקרה 1, Q נכונה: כדי להוכיח את ה"או" נוכיח את P ∧ Q. בחרו בו, ובתוך הבלוק הוכיחו אותו בשני חלקים. או קדימה: מ־P ומ־Q נקבל P ∧ Q.',
            'במקרה 2, R נכונה: נוכיח את P ∧ R, באותו אופן.',
        ],
        conclusion: `סיימתם את יחידה 3, כולל שלב הבונוס! בהוכחה אחת השתמשתם ב"וגם" ובחלוקה למקרים,
בחרתם צד של "או" בתוך כל מקרה, והוכחתם "וגם".`,
        startXml: goalXml('((P ∧ (Q ∨ R)) → ((P ∧ Q) ∨ (P ∧ R)))'),
    },
];
