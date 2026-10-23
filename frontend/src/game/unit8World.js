import { goalXml } from './levelXml';

// Unit 8, the first of lesson 2 (see blocks/moves.js): sets of objects and
// inclusion, in the order of the lecture (01-sets.md, "יחסים בין קבוצות" and
// "הקבוצה הריקה"): A ⊆ A, using an inclusion, its transitivity, its negation,
// equality as mutual inclusion, and ∅ ⊆ A. An inclusion is proved by taking
// an arbitrary element, "יהי x ∈ A", as the lecture writes it (a set's element
// keeps the variable's name, x₀ only when x is taken), and used by its
// element. The operations on sets are unit 9, sets of sets unit 10. Each
// level offers only the moves of its solution.

export const unit8WorldName = 'יחידה 8 - קבוצות והכלה';

const SETS = 'variable {obj : Type} {A B C : Set obj}';

// The moves as the toolbox shows them, before they are placed.
const SUBSET_INTRO_BLOCK = '"כדי להוכיח הכלה: יהי איבר של הקבוצה המוכלת, ונוכיח שהוא שייך לקבוצה המכילה"';
const SUBSET_ELIM_BLOCK = '"לפי ההכלה ? ומ־ ? נובע שהאיבר שייך לקבוצה המכילה"';
const SET_EQ_BLOCK = '"כדי להוכיח שוויון קבוצות, נוכיח שתי הכלות"';
const UNFOLD_BLOCK = '"לפי ההגדרה, ? פירושו מה שההגדרה אומרת"';
const ASSUME_BLOCK = '"נניח את התנאי של הגרירה..."';
const AND_ELIM_BLOCK = '"מ־ ? נקבל את שני החלקים של ה"וגם"."';
const AND_INTRO_BLOCK = '"נוכיח את שני החלקים של ה"וגם"."';
const BY_CONTRADICTION_BLOCK = '"נניח בשלילה שהמטרה לא נכונה..."';
const NOT_ELIM_BLOCK = '"לפי ? כדי להגיע לסתירה די להוכיח את הטענה שהיא שוללת."';
const EXISTS_INTRO_BLOCK = '"נבחר את העצם ? עלינו להראות שהוא מתאים."';
const EXFALSO_BLOCK = '"מסתירה נובע הכול: די להגיע לסתירה."';
const CLOSE_BLOCK = '"המטרה בידינו, וזה מה שעלינו להראות."';

const subsetIntroInfo = {
    name: 'הוכחת הכלה',
    doc: 'A ⊆ B פירושו ∀x (x ∈ A → x ∈ B). לכן כדי להוכיח A ⊆ B לוקחים איבר כלשהו x של A, ומוכיחים ש־x ∈ B. בהוכחה כתובה: "יהי x ∈ A. … לכן x ∈ B."',
};
const subsetElimInfo = {
    name: 'שימוש בהכלה',
    doc: 'A ⊆ B אומרת שכל איבר של A הוא גם איבר של B. לכן מ־A ⊆ B ומ־x ∈ A נובע x ∈ B. בהוכחה כתובה: "מהנתון A ⊆ B נובע כי x ∈ B."',
};
const setEqInfo = {
    name: 'שוויון קבוצות',
    doc: 'שתי קבוצות שוות אם ורק אם יש להן בדיוק אותם איברים, כלומר אם כל אחת מוכלת בשנייה: מוכיחים A ⊆ B וגם B ⊆ A, כל הכלה בחלק משלה.',
};
const unfoldInfo = {
    name: 'לפי ההגדרה',
    doc: 'שייכות לקבוצה פירושה טענה לוגית, לפי הגדרת הקבוצה. בוחרים בבלוק את טענת השייכות, מהמטרה או ממה שבידינו, והבלוק כותב לפי איזו הגדרה ומה היא אומרת.',
};
const empty = { symbol: 'הקבוצה הריקה', doc: 'אין לה איברים כלל: ∀x (x ∉ ∅). לכן x ∈ ∅ פירושו סתירה (⊥).' };

const level = (number, fields) => ({
    id: `unit8-${number}`,
    levelNumber: number,
    totalLevels: 6,
    usesSets: true,
    variableLine: SETS,
    params: '',
    objects: [],
    assumptions: [],
    newTacticsBlocks: [],
    newTacticsInfo: [],
    newDefinitions: [],
    ...fields,
});

export const unit8Levels = [
    level(1, {
        title: 'כל קבוצה מוכלת בעצמה',
        name: 'unit8_l1_subset_refl',
        proposition: 'A ⊆ A',
        goalLabel: 'A ⊆ A',
        toolboxBlocks: ['subset_intro', 'exact'],
        introduction: `# קבוצות והכלה

*קבוצה* היא אוסף של עצמים, ו־\`x ∈ A\` אומרת ש־x *שייך* ל־A. ביחידות 8–10, הנושאים של השיעור השני, נוכיח טענות על קבוצות בכלים של השיעור הראשון.

עבור קבוצות S ו־T נאמר ש־S *מוכלת* ב־T, ונסמן \`S ⊆ T\`, אם כל איבר של S הוא גם איבר של T: \`S ⊆ T ⟺ ∀x (x ∈ S → x ∈ T)\`.

לכן כדי להוכיח הכלה לוקחים איבר כלשהו של הקבוצה המוכלת, ומוכיחים שהוא שייך לקבוצה המכילה, כמו ב"יהי x₀ שרירותי" של יחידה 5. בהוכחה כתובה: "יהי x ∈ A". הבלוק ${SUBSET_INTRO_BLOCK} עושה זאת, והאיבר x וההנחה x ∈ A מצטרפים למה שבידינו.

הטענה הראשונה, מהתרגילים הפתורים בהרצאה: כל קבוצה מוכלת בעצמה.`,
        newTacticsBlocks: ['subset_intro'],
        newTacticsInfo: [subsetIntroInfo],
        hints: [
            `גררו את הבלוק ${SUBSET_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: כדי להוכיח A ⊆ A יהי x ∈ A ונוכיח x ∈ A.`,
            `x ∈ A בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `ההוכחה מההרצאה: "יהי x איבר כלשהו, ונניח ש־x ∈ A. מההנחה נובע ישירות ש־x ∈ A. לכן A ⊆ A."
בשמו של האיבר אין צורך באינדקס: הוא הראשון שנקרא x. אם כבר יש בידינו x, האיבר החדש נקרא x₀.`,
        startXml: goalXml('A ⊆ A'),
    }),
    level(2, {
        title: 'משתמשים בהכלה',
        name: 'unit8_l2_subset_elim',
        params: '(x : obj) (h : A ⊆ B) (hx : x ∈ A)',
        proposition: 'x ∈ B',
        goalLabel: 'x ∈ B',
        objects: [{ name: 'x', type: 'obj' }],
        assumptions: [{ name: 'h', prop: 'A ⊆ B' }, { name: 'hx', prop: 'x ∈ A' }],
        toolboxBlocks: ['subset_elim', 'exact'],
        introduction: `# משתמשים בהכלה

כאן נתון ש־\`A ⊆ B\` וש־\`x ∈ A\`, והמטרה היא \`x ∈ B\`. ההכלה אומרת שכל איבר של A הוא גם איבר של B, ובפרט x.

בהוכחה כתובה, כמו בהרצאה: "מהנתון A ⊆ B נובע כי x ∈ B". הבלוק ${SUBSET_ELIM_BLOCK} עושה זאת: בוחרים בו את ההכלה ואת השייכות.`,
        newTacticsBlocks: ['subset_elim'],
        newTacticsInfo: [subsetElimInfo],
        hints: [
            `גררו את הבלוק ${SUBSET_ELIM_BLOCK} אל תוך בלוק המטרה, ובחרו בו A ⊆ B ואת x ∈ A. עכשיו כתוב בו: נובע x ∈ B.`,
            `x ∈ B בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: 'מההכלה ומהשייכות ל־A הסקתם את השייכות ל־B: מה שנכון לכל איבר של A נכון גם ל־x. זו הצבה בטענת "לכל" שבהגדרת ההכלה.',
        startXml: goalXml('x ∈ B', 'A ⊆ B,  x ∈ A'),
    }),
    level(3, {
        title: 'טרנזיטיביות ההכלה',
        name: 'unit8_l3_subset_trans',
        proposition: '(A ⊆ B ∧ B ⊆ C) → A ⊆ C',
        goalLabel: '((A ⊆ B ∧ B ⊆ C) → A ⊆ C)',
        toolboxBlocks: ['assume', 'and_elim', 'subset_intro', 'subset_elim', 'exact'],
        introduction: `# טרנזיטיביות ההכלה

הטענה מההרצאה: לכל שלוש קבוצות A, B, C, אם A ⊆ B וגם B ⊆ C, אז A ⊆ C.

ההוכחה מההרצאה: נניח A ⊆ B וגם B ⊆ C. כדי להוכיח A ⊆ C, עלינו להראות שכל איבר ב־A הוא גם איבר ב־C. יהי x ∈ A. מהנתון A ⊆ B נובע כי x ∈ B, ומהנתון B ⊆ C נובע כי x ∈ C.`,
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה, ולתוכו את הבלוק ${AND_ELIM_BLOCK} עם (A ⊆ B ∧ B ⊆ C).`,
            `הוסיפו את הבלוק ${SUBSET_INTRO_BLOCK}. עכשיו כתוב בו: כדי להוכיח A ⊆ C יהי x ∈ A ונוכיח x ∈ C.`,
            `הוסיפו את הבלוק ${SUBSET_ELIM_BLOCK} עם A ⊆ B ועם x ∈ A, ואחריו עוד אחד כזה עם B ⊆ C ועם x ∈ B.`,
            `x ∈ C בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: 'ההוכחה, כמו בהרצאה: "נניח A ⊆ B וגם B ⊆ C. יהי x ∈ A. מהנתון A ⊆ B נובע כי x ∈ B. מהנתון B ⊆ C נובע כי x ∈ C. הראינו שאם x ∈ A אז x ∈ C, ולכן A ⊆ C."',
        startXml: goalXml('((A ⊆ B ∧ B ⊆ C) → A ⊆ C)'),
    }),
    level(4, {
        title: 'שלילת יחס ההכלה',
        name: 'unit8_l4_not_subset',
        proposition: '¬(A ⊆ B) → ∃ x, x ∈ A ∧ ¬x ∈ B',
        goalLabel: '(¬(A ⊆ B) → ∃x (x ∈ A ∧ ¬x ∈ B))',
        toolboxBlocks: ['assume', 'by_contradiction', 'not_elim', 'subset_intro', 'exists_intro', 'and_intro', 'exact'],
        introduction: `# שלילת יחס ההכלה

בהרצאה: A *אינה מוכלת* ב־B, ונסמן A ⊈ B, אם קיים איבר ב־A שאינו נמצא ב־B: \`A ⊈ B ⟺ ∃x (x ∈ A ∧ x ∉ B)\`. בהרצאה זה פותח מההגדרה בשקילויות: שלילת כמת כולל, ואחר כך שלילת גרירה.

כאן נוכיח את הכיוון ⇐ בלי שקילויות, בהוכחה בשלילה (יחידה 4): נניח שאין איבר כזה, ונוכיח A ⊆ B, בסתירה להנחה ¬(A ⊆ B).
בתוך ההכלה, יהי x ∈ A. אם x ∉ B, x הוא בדיוק האיבר שאמרנו שאינו קיים. לכן גם שם נוכיח בשלילה.`,
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה, ולתוכו את הבלוק ${BY_CONTRADICTION_BLOCK}. עכשיו כתוב בו: נניח בשלילה ¬∃x (x ∈ A ∧ ¬x ∈ B). עלינו להגיע לסתירה.`,
            `גררו לתוכו את הבלוק ${NOT_ELIM_BLOCK} עם ¬(A ⊆ B): די להוכיח A ⊆ B. אחריו הוסיפו את הבלוק ${SUBSET_INTRO_BLOCK}: יהי x ∈ A ונוכיח x ∈ B.`,
            `הוסיפו שוב את הבלוק ${BY_CONTRADICTION_BLOCK}: נניח בשלילה ¬x ∈ B. ובתוכו ${NOT_ELIM_BLOCK} עם ¬∃x (x ∈ A ∧ ¬x ∈ B): די להוכיח שקיים איבר כזה.`,
            `הוסיפו את הבלוק ${EXISTS_INTRO_BLOCK}, ובחרו בו את x. בתוכו ${AND_INTRO_BLOCK}: בכל חלק, מה שמוכיחים כבר בידינו.`,
        ],
        conclusion: `הוכחתם שמ־A ⊈ B נובע שקיים איבר ב־A שאינו ב־B. הכיוון השני קל יותר: איבר כזה מראה שלא כל איבר של A שייך ל־B.
זו השקילות של ההרצאה, ¬∀x (x ∈ A → x ∈ B) ⟺ ∃x (x ∈ A ∧ x ∉ B): שלילת "לכל" ושלילת גרירה, שתיהן מיחידה 6.`,
        startXml: goalXml('(¬(A ⊆ B) → ∃x (x ∈ A ∧ ¬x ∈ B))'),
    }),
    level(5, {
        title: 'שוויון והכלה הדדית',
        name: 'unit8_l5_set_eq',
        proposition: '(A ⊆ B ∧ B ⊆ A) → A = B',
        goalLabel: '((A ⊆ B ∧ B ⊆ A) → A = B)',
        toolboxBlocks: ['assume', 'and_elim', 'set_eq', 'exact'],
        introduction: `# שוויון והכלה הדדית

לפי אקסיומת ההיקפיות, שתי קבוצות שוות אם ורק אם יש להן בדיוק אותם איברים: \`A = B ⟺ ∀x (x ∈ A ↔ x ∈ B)\`.

בהרצאה הוכחנו שזה שקול להכלה הדדית: A = B אם ורק אם A ⊆ B וגם B ⊆ A. לכן כדי להוכיח שוויון קבוצות מוכיחים שתי הכלות, כל אחת בחלק משלה. הבלוק ${SET_EQ_BLOCK} עושה זאת.

כאן נוכיח את הכיוון ⇐ מההרצאה: מהכלה הדדית נובע שוויון.`,
        newTacticsBlocks: ['set_eq'],
        newTacticsInfo: [setEqInfo],
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה, ולתוכו את הבלוק ${AND_ELIM_BLOCK} עם (A ⊆ B ∧ B ⊆ A).`,
            `הוסיפו את הבלוק ${SET_EQ_BLOCK}. בראש החלקים כתוב: נוכיח A ⊆ B, ונוכיח B ⊆ A.`,
            `בכל חלק, ההכלה כבר בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: 'מעכשיו, כדי להוכיח ששתי קבוצות שוות, מוכיחים שתי הכלות: יהי x באגף שמאל ונוכיח שהוא באגף ימין, ולהפך. זו התבנית של כל הוכחות השוויון ביחידות הבאות.',
        startXml: goalXml('((A ⊆ B ∧ B ⊆ A) → A = B)'),
    }),
    level(6, {
        title: 'הקבוצה הריקה',
        name: 'unit8_l6_empty_subset',
        proposition: '∅ ⊆ A',
        goalLabel: '∅ ⊆ A',
        toolboxBlocks: ['subset_intro', 'unfold', 'exfalso', 'exact'],
        introduction: `# הקבוצה הריקה

קיימת קבוצה, שנסמנה \`∅\`, שאין לה איברים כלל: \`∀x (x ∉ ∅)\`. לכן \`x ∈ ∅\` פירושו סתירה (⊥).

הטענה מההרצאה: הקבוצה הריקה מוכלת בכל קבוצה. ניקח איבר של ∅, אבל אין כזה: ההנחה עליו היא סתירה, ומסתירה נובע הכול (יחידה 4).
כדי להשתמש בהגדרה יש מהלך חדש, ${UNFOLD_BLOCK}: בוחרים בו טענת שייכות, והוא כותב לפי איזו הגדרה ומה היא אומרת. ביחידה הבאה תשתמשו בו בכל הפעולות על קבוצות.`,
        newTacticsBlocks: ['unfold'],
        newTacticsInfo: [unfoldInfo],
        newDefinitions: [empty],
        hints: [
            `גררו את הבלוק ${SUBSET_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: כדי להוכיח ∅ ⊆ A יהי x ∈ ∅ ונוכיח x ∈ A.`,
            `הוסיפו את הבלוק ${UNFOLD_BLOCK}, ובחרו בו x ∈ ∅. עכשיו כתוב בו: לפי הגדרת הקבוצה הריקה, x ∈ ∅ פירושו ⊥.`,
            `הוסיפו את הבלוק ${EXFALSO_BLOCK}. הסתירה כבר בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `סיימתם את יחידה 8! ∅ ⊆ A לכל קבוצה A, כי אין ב־∅ איבר שיכול להפריך את ההכלה.
בהרצאה הוכחנו את זה בשלילה: אם ∅ ⊈ A, יש איבר x ∈ ∅, וזו סתירה. כאן הסתירה הופיעה ישר מההגדרה. מזה נובע גם שיש רק קבוצה ריקה אחת: שתי קבוצות ריקות מוכלות זו בזו, ולכן שוות.`,
        startXml: goalXml('∅ ⊆ A'),
    }),
];
