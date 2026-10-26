import { prepareLevels } from './levelXml';

// Unit 11 (see blocks/moves.js): partitions, the last of lesson 2, after the
// lecture (01-sets.md, "חלוקות"): the definition, as the course notes write it
// (S ⊆ 𝒫(A) ∖ {∅}, and every element of A belongs to exactly one class), what it
// says about an element and about two classes that share an element, and the
// theorem that a partition contained in a partition of the same set is equal
// to it. A non-empty class is written as having an element (∃x (x ∈ t)), since
// the blocks have no singleton {∅}. Each level offers only the moves of its
// solution.

export const unit11WorldName = 'יחידה 11 - חלוקות';

const SETS = 'variable {obj : Type} {A : Set obj} {S T : Set (Set obj)}';

// The moves as the toolbox shows them, before they are placed.
const SUBSET_INTRO_BLOCK = '"כדי להוכיח הכלה: יהי איבר של הקבוצה המוכלת, ונוכיח שהוא שייך לקבוצה המכילה"';
const SUBSET_ELIM_BLOCK = '"לפי ההכלה ? ומ־ ? נובע שהאיבר שייך לקבוצה המכילה"';
const SET_EQ_BLOCK = '"כדי להוכיח שוויון קבוצות, נוכיח שתי הכלות"';
const UNFOLD_BLOCK = '"לפי ההגדרה, ? פירושו מה שההגדרה אומרת"';
const CLAIM_BLOCK = '"נוכיח קודם את טענת העזר ?..."';
const REWRITE_BLOCK = '"לפי השוויון ? נחליף ... בתוך ?"';
const AND_ELIM_BLOCK = '"מ־ ? נקבל את שני החלקים של ה"וגם"."';
const AND_INTRO_BLOCK = '"נוכיח את שני החלקים של ה"וגם"."';
const EXISTS_INTRO_BLOCK = '"נבחר את העצם ? עלינו להראות שהוא מתאים."';
const EXISTS_ELIM_BLOCK = '"לפי ? ניתן שם לעצם כזה."';
const FORALL_ELIM_BLOCK = '"ב־ ? נציב ? ונקבל מה שהוא אומר על העצם."';
const FORWARD_BLOCK = '"מ־ ? ומ־ ? נקבל את המסקנה של הגרירה."';
const RFL_BLOCK = '"שני הצדדים שווים לפי ההגדרה."';
const CLOSE_BLOCK = '"המטרה בידינו, וזה מה שעלינו להראות."';

const partition = {
    symbol: 'החלוקה',
    doc: 'S חלוקה של A אם כל מחלקה t ∈ S היא תת־קבוצה לא ריקה של A (t ⊆ A ויש בה איבר), וכל איבר a של A שייך למחלקה אחת בדיוק: קיימת t ∈ S עם a ∈ t, וכל t′ ∈ S שמכילה את a שווה ל־t.',
};

const level = (number, fields) => ({
    id: `unit11-${number}`,
    levelNumber: number,
    totalLevels: 3,
    usesSets: true,
    variableLine: SETS,
    params: '',
    objects: [],
    newTacticsBlocks: [],
    newTacticsInfo: [],
    newDefinitions: [],
    ...fields,
});

export const unit11Levels = prepareLevels([
    level(1, {
        title: 'כל איבר שייך למחלקה',
        name: 'unit11_l1_partition_exists',
        params: '(a : obj) (hS : partition S A) (ha : a ∈ A)',
        proposition: '∃ t, t ∈ S ∧ a ∈ t',
        objects: [{ name: 'a', type: 'obj' }],
        toolboxBlocks: ['unfold', 'and_elim', 'forall_elim', 'forward', 'exists_elim', 'exists_intro', 'and_intro', 'exact'],
        introduction: `# חלוקה של קבוצה

*חלוקה* של A היא קבוצה S של תת־קבוצות לא ריקות של A, כך שכל איבר של A שייך *למחלקה אחת בדיוק*. בהגדרה של הקורס: \`S ⊆ 𝒫(A) ∖ {∅}\` וגם \`∀a ∈ A ∃!t ∈ S (a ∈ t)\`.

כאן כותבים אותה במפורש: כל מחלקה t ∈ S מקיימת t ⊆ A ויש בה איבר, וכל a ∈ A שייך למחלקה t ∈ S, וכל מחלקה t′ ∈ S שמכילה את a שווה ל־t. ה"קיים אחד בדיוק" הוא קיום ויחידות.

כאן נתון ש־S חלוקה של A ושאיבר a שייך ל־A, והמטרה: a שייך לאיזושהי מחלקה. את ההגדרה פותחים בבלוק ${UNFOLD_BLOCK}, ומשתמשים בחלק של ה"לכל a ∈ A".`,
        newDefinitions: [partition],
        hints: [
            `גררו את הבלוק ${UNFOLD_BLOCK} אל תוך בלוק המטרה, ובחרו בו את partition(S, A). עכשיו כתוב בו מה פירוש החלוקה.`,
            `${AND_ELIM_BLOCK}: מההגדרה נקבל את שני חלקיה. החלק השני הוא טענת "לכל a ∈ A".`,
            `${FORALL_ELIM_BLOCK} עם ה"לכל" של a ∈ A ועם העצם a, ואחריו ${FORWARD_BLOCK} עם a ∈ A.`,
            `${EXISTS_ELIM_BLOCK} נותן מחלקה t₀ עם t₀ ∈ S ∧ a ∈ t₀ ∧ (…). פרקו את ה"וגם", ובחרו t₀ ב־${EXISTS_INTRO_BLOCK}.`,
        ],
        conclusion: 'a שייך למחלקה t₀ ∈ S, כמו שההגדרה אומרת: "כל איבר של A שייך למחלקה". את החלק השני של ההגדרה, היחידות, נשתמש בשלב הבא.',
    }),
    level(2, {
        title: 'שתי מחלקות עם איבר משותף',
        name: 'unit11_l2_partition_unique',
        params: '(a : obj) (C D : Set obj) (hT : partition T A) (ha : a ∈ A) (hC : C ∈ T) (hD : D ∈ T) (hCa : a ∈ C) (hDa : a ∈ D)',
        proposition: 'D = C',
        objects: [{ name: 'a', type: 'obj' }],
        toolboxBlocks: ['unfold', 'and_elim', 'forall_elim', 'forward', 'exists_elim', 'rewrite', 'rfl'],
        introduction: `# שתי מחלקות עם איבר משותף

היחידות בהגדרת החלוקה אומרת: אם איבר a שייך לשתי מחלקות של אותה חלוקה, המחלקות שוות.

כאן C, D ∈ T ושתיהן מכילות את a. לפי ההגדרה יש מחלקה t₀ ∈ T עם a ∈ t₀ וכל מחלקה של T שמכילה את a שווה ל־t₀. לכן D = t₀ וגם C = t₀. משני השוויונות נובע D = C: מחליפים את D ב־t₀ ואת C ב־t₀, ושני הצדדים שווים.

ההחלפה לפי שוויון היא המהלך מ־9.7, ו"שני הצדדים שווים" הוא המהלך מ־8.2.`,
        hints: [
            `פתחו את ההגדרה של partition(T, A), פרקו את ה"וגם", והציבו a בחלק של ה"לכל a ∈ A", עם a ∈ A.`,
            `${EXISTS_ELIM_BLOCK} נותן t₀, ופרקו את ה"וגם" פעמיים. עכשיו בידינו: לכל t′ ∈ T, אם a ∈ t′ אז t′ = t₀.`,
            `הציבו D, ו־${FORWARD_BLOCK} עם D ∈ T ואחר כך עם a ∈ D: מקבלים D = t₀. באותו אופן עם C: מקבלים C = t₀.`,
            `${REWRITE_BLOCK} עם D = t₀ במטרה, ואחר כך עם C = t₀, ו־${RFL_BLOCK}.`,
        ],
        conclusion: 'מחלקה נקבעת על ידי כל אחד מאיבריה: שתי מחלקות שחולקות איבר שוות. זו היחידות בהגדרת החלוקה.',
    }),
    level(3, {
        title: 'חלוקה המוכלת בחלוקה שווה לה',
        name: 'unit11_l3_partition_subset_eq',
        params: '(hS : partition S A) (hT : partition T A) (hST : S ⊆ T)',
        proposition: 'S = T',
        toolboxBlocks: ['set_eq', 'subset_intro', 'unfold', 'and_elim', 'forall_elim', 'forward', 'exists_elim', 'subset_elim', 'rewrite', 'exact'],
        introduction: `# חלוקה המוכלת בחלוקה שווה לה

המשפט מההרצאה: אם S ו־T חלוקות של A, ו־S ⊆ T, אז S = T.

ההוכחה, כמו בהרצאה: נתון S ⊆ T, ולכן נותר להוכיח T ⊆ S. תהי t ∈ T. מכיוון שמחלקה היא לא ריקה, יש בה איבר x, ו־x ∈ A. S חלוקה של A, ולכן קיימת s ∈ S עם x ∈ s, ומ־S ⊆ T גם s ∈ T. כעת s ו־t שתיהן מחלקות של T המכילות את x, ולכן, מיחידות המחלקה של x בחלוקה **T**, s = t. לכן t = s ∈ S.

זה שימוש בכל מה שלמדנו בחלוקות: איבר במחלקה לא ריקה, מחלקה של איבר, ויחידות.`,
        hints: [
            `גררו את הבלוק ${SET_EQ_BLOCK}. בחלק הראשון S ⊆ T כבר בידינו. בחלק השני, ${SUBSET_INTRO_BLOCK}: מחלקה x ∈ T, ונוכיח x ∈ S.`,
            `פתחו את ההגדרה של partition(T, A), ופרקו את ה"וגם". הציבו את x בחלק של "לכל מחלקה", וקבלו x ⊆ A ויש איבר בתוך x; ${EXISTS_ELIM_BLOCK} נותן y₀ ∈ x. מ־x ⊆ A ומ־y₀ ∈ x נקבל y₀ ∈ A.`,
            `פתחו את ההגדרה של partition(S, A), והציבו y₀ בחלק של ה"לכל a ∈ A", עם y₀ ∈ A: מקבלים מחלקה t₀ ∈ S עם y₀ ∈ t₀. מ־S ⊆ T נקבל t₀ ∈ T.`,
            `עכשיו משתמשים בחלוקה T: בחלק של ה"לכל a ∈ A", עם y₀ ∈ A, מקבלים מחלקה t₁ ∈ T המכילה את y₀, וכל מחלקה של T המכילה את y₀ שווה ל־t₁. הציבו t₀ ואחר כך x: מקבלים t₀ = t₁ וגם x = t₁.`,
            `${REWRITE_BLOCK}: החליפו את x ב־t₁ במטרה, ואחר כך את t₁ ב־t₀ (לפי t₀ = t₁), ו־t₀ ∈ S בידינו.`,
        ],
        conclusion: `זה המשפט מההרצאה. שימו לב שהיחידות שבה השתמשנו היא של החלוקה **T**: s ו־t שתיהן ב־T. אילו s היה רק ב־S, לא הייתה סיבה לשוויון.
התנאי שמחלקה לא ריקה נחוץ: בלעדיו אפשר להוסיף ל־T את ∅ ולקבל S ⊊ T, עם אותה הגדרה של "כל איבר שייך למחלקה אחת בדיוק".`,
    }),
]);
