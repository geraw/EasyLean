import { prepareLevels } from './levelXml';

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
const SEPARATION = 'variable {obj : Type} {A : Set obj} {P : obj → Prop}';
const TEMPLATE = 'variable {obj : Type} {A : Set obj} {f : obj → obj}';

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
const RFL_BLOCK = '"שני הצדדים שווים לפי ההגדרה."';
const REPLACE_BLOCK = '"לפי השקילות ? נחליף ..."';

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
const rflInfo = {
    name: 'שני הצדדים שווים',
    doc: 'סוגר מטרה a = b כששני הצדדים הם אותו עצם, כמו f(a) = f(a).',
};
const unfoldInfo = {
    name: 'לפי ההגדרה',
    doc: 'שייכות לקבוצה פירושה טענה לוגית, לפי הגדרת הקבוצה: למשל a ∈ {x ∈ A | P(x)} פירושו a ∈ A ∧ P(a). בוחרים בבלוק את טענת השייכות, מהמטרה או ממה שבידינו, והבלוק כותב לפי איזו הגדרה ומה היא אומרת.',
};
// The laws level 4 uses, as cards (as in unit 6).
const law = (symbol, doc) => ({ label: 'שקילות', symbol, doc });
const subsetDef = law('הגדרת ההכלה', 'A ⊆ B ≡ ∀x (x ∈ A → x ∈ B): A מוכלת ב־B אם כל איבר של A הוא גם איבר של B.');
const notForall = law('שלילה של "לכל"', '¬∀x (P(x)) ≡ ∃x (¬P(x)), מיחידה 6.');
const notImp = law('שלילה של גרירה', '¬(A → B) ≡ (A ∧ ¬B), מיחידה 6.');
const empty = { symbol: 'הקבוצה הריקה', doc: 'אין לה איברים כלל: ∀x (x ∉ ∅). לכן x ∈ ∅ פירושו סתירה (⊥).' };

const level = (number, fields) => ({
    id: `unit8-${number}`,
    levelNumber: number,
    totalLevels: 8,
    usesSets: true,
    variableLine: SETS,
    params: '',
    objects: [],
    newTacticsBlocks: [],
    newTacticsInfo: [],
    newDefinitions: [],
    ...fields,
});

export const unit8Levels = prepareLevels([
    level(1, {
        title: 'קבוצה לפי הפרדה',
        name: 'unit8_l1_separation',
        variableLine: SEPARATION,
        params: '(a : obj) (ha : a ∈ A) (hp : P a)',
        proposition: 'a ∈ Set.sep A P',
        objects: [{ name: 'a', type: 'obj' }],
        toolboxBlocks: ['unfold', 'and_intro', 'exact'],
        introduction: `# קבוצות: הגדרה לפי הפרדה

*קבוצה* היא אוסף של עצמים, ו־\`x ∈ A\` אומרת ש־x *שייך* ל־A. ביחידות 8–10, הנושאים של השיעור השני, נוכיח טענות על קבוצות בכלים של השיעור הראשון.

בדרך כלל מגדירים קבוצה באמצעות תנאי. *הפרדה* בוחרת מתוך קבוצה נתונה A את האיברים שמקיימים תנאי P: \`{x ∈ A | P(x)}\`. המשתנה x קשור, ו־A חופשית. איבר שייך לקבוצה כזאת אם ורק אם הוא שייך ל־A ומקיים את התנאי: \`y ∈ {x ∈ A | P(x)} ⟺ y ∈ A ∧ P(y)\`.

כאן נתון ש־a ∈ A ושהתנאי P מתקיים על a, ועלינו להוכיח ש־a שייך לקבוצה. את השייכות לקבוצה פותחים לפי ההגדרה שלה, בבלוק ${UNFOLD_BLOCK}: בוחרים בו את טענת השייכות, והוא כותב מה היא אומרת ומה נשאר להוכיח.`,
        newTacticsBlocks: ['unfold'],
        newTacticsInfo: [unfoldInfo],
        hints: [
            `גררו את הבלוק ${UNFOLD_BLOCK} אל תוך בלוק המטרה, ובחרו בו את a ∈ {x ∈ A | P(x)}. עכשיו כתוב בו: כדי להוכיח את זה די להוכיח a ∈ A ∧ P(a).`,
            `הוסיפו את הבלוק ${AND_INTRO_BLOCK}: שני החלקים, a ∈ A ו־P(a), כבר בידינו.`,
            `בכל חלק הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `זו ההפרדה: a ∈ {x ∈ A | P(x)} אם ורק אם a ∈ A וגם P(a). שימו לב ש־A היא חלק מהתנאי: בלי a ∈ A אין שייכות, גם כש־P(a) מתקיים.
הבלוק "לפי ההגדרה" יעבוד כך על כל קבוצה שמוגדרת בפעולה, ובשלבים הבאים נשתמש בו שוב.`,
    }),
    level(2, {
        title: 'קבוצה לפי תבנית',
        name: 'unit8_l2_template',
        variableLine: TEMPLATE,
        params: '(a : obj) (ha : a ∈ A)',
        proposition: 'f a ∈ Set.repl f A',
        objects: [{ name: 'a', type: 'obj' }],
        toolboxBlocks: ['unfold', 'exists_intro', 'and_intro', 'rfl', 'exact'],
        introduction: `# קבוצה לפי תבנית

דרך נוספת להגדיר קבוצה: מפעילים תבנית f על כל איברי קבוצה נתונה A, \`{f(x) | x ∈ A}\`. המשתנה הקשור x מופיע מימין ל־"|", ואילו בהפרדה הוא מופיע משמאל.

כאן השייכות היא טענת "קיים": \`y ∈ {f(x) | x ∈ A} ⟺ ∃x (x ∈ A ∧ f(x) = y)\`. כדי להוכיח שייכות צריך עד, איבר x של A ש־f(x) הוא y. זו טעות נפוצה לחשוב שזו טענת "לכל".

המטרה: f(a) שייך ל־{f(x) | x ∈ A}, כשנתון a ∈ A. העד הוא a עצמו. הבלוק ${RFL_BLOCK} סוגר שוויון ששני צדדיו אותו עצם.`,
        newTacticsBlocks: ['rfl'],
        newTacticsInfo: [rflInfo],
        hints: [
            `גררו את הבלוק ${UNFOLD_BLOCK} אל תוך בלוק המטרה, ובחרו בו את f(a) ∈ {f(x) | x ∈ A}. עכשיו כתוב בו: די להוכיח ∃x (x ∈ A ∧ f(x) = f(a)).`,
            `הוסיפו את הבלוק ${EXISTS_INTRO_BLOCK} ובחרו בו את a.`,
            `הוסיפו את הבלוק ${AND_INTRO_BLOCK}. בחלק הראשון, a ∈ A כבר בידינו: ${CLOSE_BLOCK}`,
            `בחלק השני צריך להוכיח f(a) = f(a): הוסיפו את הבלוק ${RFL_BLOCK}.`,
        ],
        conclusion: `כך מוכיחים שייכות לקבוצה שמוגדרת בתבנית: מוצאים עד. f(a) שייך ל־{f(x) | x ∈ A} בזכות העד a.
תבנית היא בעצם כתיב מקוצר להפרדה: {f(x) | x ∈ A} פירושו {y | ∃x ∈ A (y = f(x))}.`,
    }),
    level(3, {
        title: 'כל קבוצה מוכלת בעצמה',
        name: 'unit8_l1_subset_refl',
        proposition: 'A ⊆ A',
        toolboxBlocks: ['subset_intro', 'exact'],
        introduction: `# יחס ההכלה

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
    }),
    level(4, {
        title: 'משתמשים בהכלה',
        name: 'unit8_l2_subset_elim',
        params: '(x : obj) (h : A ⊆ B) (hx : x ∈ A)',
        proposition: 'x ∈ B',
        objects: [{ name: 'x', type: 'obj' }],
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
    }),
    level(5, {
        title: 'שלילת יחס ההכלה',
        name: 'unit8_l4_not_subset',
        proposition: '¬(A ⊆ B) → ∃ x, x ∈ A ∧ ¬x ∈ B',
        laws: ['easylean_subset_def', 'easylean_not_forall', 'easylean_not_imp'],
        toolboxBlocks: ['assume', 'replace', 'exact'],
        introduction: `# שלילת יחס ההכלה

בהרצאה: A *אינה מוכלת* ב־B, ונסמן A ⊈ B (במערכת נכתב ¬(A ⊆ B)), אם קיים איבר ב־A שאינו נמצא ב־B: \`A ⊈ B ⟺ ∃x (x ∈ A ∧ x ∉ B)\`.

ההרצאה מפתחת את זה מההגדרה, בשלוש החלפות של טענה בטענה ששקולה לה, כמו ביחידה 6:
- A ⊈ B היא השלילה של A ⊆ B, כלומר, לפי הגדרת ההכלה, \`¬∀x (x ∈ A → x ∈ B)\`.
- לפי שלילת כמת כולל: \`∃x (x ∉ A → x ∈ B)\`.
- לפי שלילת גרירה: \`∃x (x ∈ A ∧ x ∉ B)\`.

כל החלפה עושה הבלוק ${REPLACE_BLOCK} מיחידה 6. להגדרת ההכלה יש כאן שקילות משלה: A ⊆ B ≡ ∀x (x ∈ A → x ∈ B).`,
        newDefinitions: [subsetDef, notForall, notImp],
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה. עכשיו בידינו ¬(A ⊆ B).`,
            `בתוכו, ${REPLACE_BLOCK} עם הגדרת ההכלה, בהנחה ¬(A ⊆ B): "נחליף את A ⊆ B ב־∀x (x ∈ A → x ∈ B)".`,
            `אחריו, לפי השלילה של "לכל", בהנחה החדשה: "נחליף את ¬∀x (x ∈ A → x ∈ B) ב־∃x (x ∉ A → x ∈ B)".`,
            `ולבסוף, לפי השלילה של גרירה: "נחליף את x ∉ A → x ∈ B ב־(x ∈ A ∧ x ∉ B)". זו המטרה: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `זה הפיתוח של השקף, שורה אחר שורה: "A ⊈ B היא השלילה של A ⊆ B, כלומר ¬∀x (x ∈ A → x ∈ B). לפי שלילת כמת כולל, ∃x (x ∉ A → x ∈ B). לפי שלילת גרירה, ∃x (x ∈ A ∧ x ∉ B)."
בדרך הזאת לא לוקחים איבר ולא מוכיחים בשלילה: מחליפים טענה בטענה ששקולה לה, עד שמגיעים למטרה.`,
    }),
    level(6, {
        title: 'טרנזיטיביות ההכלה',
        name: 'unit8_l3_subset_trans',
        proposition: '(A ⊆ B ∧ B ⊆ C) → A ⊆ C',
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
    }),
    level(7, {
        title: 'שוויון והכלה הדדית',
        name: 'unit8_l5_set_eq',
        proposition: '(A ⊆ B ∧ B ⊆ A) → A = B',
        toolboxBlocks: ['assume', 'and_elim', 'set_eq', 'exact'],
        introduction: `# שוויון והכלה הדדית

לפי הגדרת השוויון, שתי קבוצות שוות אם ורק אם יש להן בדיוק אותם איברים: \`A = B ⟺ ∀x (x ∈ A ↔ x ∈ B)\`.

בהרצאה הוכחנו מזה שהשוויון שקול להכלה הדדית. את הכיוון ⇐: משתי ההכלות נקבל ∀x (x ∈ A ↔ x ∈ B), ולכן, לפי הגדרת השוויון, A = B.

מעכשיו זו תבנית: כדי להוכיח שוויון קבוצות מוכיחים שתי הכלות, כל אחת בחלק משלה. הבלוק ${SET_EQ_BLOCK} עושה זאת, וכאן משתמשים בו לראשונה, על הטענה עצמה.`,
        newTacticsBlocks: ['set_eq'],
        newTacticsInfo: [setEqInfo],
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה, ולתוכו את הבלוק ${AND_ELIM_BLOCK} עם (A ⊆ B ∧ B ⊆ A).`,
            `הוסיפו את הבלוק ${SET_EQ_BLOCK}. בראש החלקים כתוב: נוכיח A ⊆ B, ונוכיח B ⊆ A.`,
            `בכל חלק, ההכלה כבר בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: 'מעכשיו, כדי להוכיח ששתי קבוצות שוות, מוכיחים שתי הכלות: יהי x באגף שמאל ונוכיח שהוא באגף ימין, ולהפך. זו התבנית של כל הוכחות השוויון ביחידות הבאות.',
    }),
    level(8, {
        title: 'הקבוצה הריקה',
        name: 'unit8_l6_empty_subset',
        proposition: '∅ ⊆ A',
        toolboxBlocks: ['subset_intro', 'unfold', 'exfalso', 'exact'],
        introduction: `# הקבוצה הריקה

קיימת קבוצה, שנסמנה \`∅\`, שאין לה איברים כלל: \`∀x (x ∉ ∅)\`. לכן \`x ∈ ∅\` פירושו סתירה (⊥).

הטענה מההרצאה: הקבוצה הריקה מוכלת בכל קבוצה. ניקח איבר של ∅, אבל אין כזה: ההנחה עליו היא סתירה, ומסתירה נובע הכול (יחידה 4).
כדי להשתמש בהגדרה של הקבוצה הריקה משתמשים שוב בבלוק ${UNFOLD_BLOCK}, מהשלב הראשון. ביחידה הבאה תשתמשו בו בכל הפעולות על קבוצות.`,
        newDefinitions: [empty],
        hints: [
            `גררו את הבלוק ${SUBSET_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: כדי להוכיח ∅ ⊆ A יהי x ∈ ∅ ונוכיח x ∈ A.`,
            `הוסיפו את הבלוק ${UNFOLD_BLOCK}, ובחרו בו x ∈ ∅. עכשיו כתוב בו: לפי הגדרת הקבוצה הריקה, x ∈ ∅ פירושו ⊥.`,
            `הוסיפו את הבלוק ${EXFALSO_BLOCK}. הסתירה כבר בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `סיימתם את יחידה 8! ∅ ⊆ A לכל קבוצה A, כי אין ב־∅ איבר שיכול להפריך את ההכלה.
בהרצאה הוכחנו את זה בשלילה: אם ∅ ⊈ A, יש איבר x ∈ ∅, וזו סתירה. כאן הסתירה הופיעה ישר מההגדרה. מזה נובע גם שיש רק קבוצה ריקה אחת: שתי קבוצות ריקות מוכלות זו בזו, ולכן שוות.`,
    }),
]);
