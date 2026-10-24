import { goalXml } from './levelXml';

// Unit 10 (see blocks/moves.js): sets of sets, in the order of the lecture
// (01-sets.md, "קבוצת החזקה" and "פעולות אונריות"): the power set, the claims
// A ⊆ B ⟺ 𝒫(A) ⊆ 𝒫(B) (each direction a level; the second through the
// helper claim A ∈ 𝒫(A), as the blocks have no singletons {x}),
// 𝒫(A ∩ B) = 𝒫(A) ∩ 𝒫(B) and 𝒫(A) ∪ 𝒫(B) ⊆ 𝒫(A ∪ B), and the unary union and
// intersection of a set of sets X, ⋂X ⊆ A ⊆ ⋃X for A ∈ X, and ⋃𝒫(A) = A.
// Their definitions are read with the move of unit 8 ("לפי ההגדרה"), and
// what they say is a "for all" or a "there exists" over sets, used with the
// moves of unit 5. Each level offers only the moves of its solutions.

export const unit10WorldName = 'יחידה 10 - קבוצת החזקה ופעולות אונריות';

const SETS = 'variable {obj : Type} {A B : Set obj}';
const SET_OF_SETS = 'variable {obj : Type} {A : Set obj} {X : Set (Set obj)}';

// The moves as the toolbox shows them, before they are placed.
const SUBSET_INTRO_BLOCK = '"כדי להוכיח הכלה: יהי איבר של הקבוצה המוכלת, ונוכיח שהוא שייך לקבוצה המכילה"';
const SUBSET_ELIM_BLOCK = '"לפי ההכלה ? ומ־ ? נובע שהאיבר שייך לקבוצה המכילה"';
const SET_EQ_BLOCK = '"כדי להוכיח שוויון קבוצות, נוכיח שתי הכלות"';
const UNFOLD_BLOCK = '"לפי ההגדרה, ? פירושו מה שההגדרה אומרת"';
const CLAIM_BLOCK = '"נוכיח קודם את טענת העזר ?..."';
const ASSUME_BLOCK = '"נניח את התנאי של הגרירה..."';
const AND_ELIM_BLOCK = '"מ־ ? נקבל את שני החלקים של ה"וגם"."';
const AND_INTRO_BLOCK = '"נוכיח את שני החלקים של ה"וגם"."';
const OR_INTRO_BLOCK = '"כדי להוכיח את ה"או" נוכיח את ?"';
const OR_ELIM_BLOCK = '"נחלק למקרים לפי ?"';
const EXFALSO_BLOCK = '"מסתירה נובע הכול: די להגיע לסתירה."';
const EXISTS_INTRO_BLOCK = '"נבחר את העצם ? עלינו להראות שהוא מתאים."';
const EXISTS_ELIM_BLOCK = '"לפי ? ניתן שם לעצם כזה."';
const FORALL_ELIM_BLOCK = '"ב־ ? נציב ? ונקבל מה שהוא אומר על העצם."';
const FORWARD_BLOCK = '"מ־ ? ומ־ ? נקבל את המסקנה של הגרירה."';
const CLOSE_BLOCK = '"המטרה בידינו, וזה מה שעלינו להראות."';

const claimInfo = {
    name: 'טענת עזר',
    doc: 'בהוכחה כתובה מוכיחים לפעמים קודם טענה שתעזור בהמשך: "נוכיח קודם ש...". בוחרים את הטענה בבלוק, מוכיחים אותה בחלק שבתוכו, ומעכשיו היא בידינו.',
};

const powerset = { symbol: 'קבוצת החזקה', doc: '𝒫(A) = {X | X ⊆ A}: הקבוצה שאיבריה הם כל תת־הקבוצות של A. לכן X ∈ 𝒫(A) פירושו X ⊆ A.' };
const union = { symbol: 'האיחוד', doc: 'x ∈ (A ∪ B) פירושו x ∈ A ∨ x ∈ B.' };
const inter = { symbol: 'החיתוך', doc: 'x ∈ (A ∩ B) פירושו x ∈ A ∧ x ∈ B.' };
const sUnion = { symbol: 'האיחוד האונרי', doc: '⋃X = {a | ∃A ∈ X (a ∈ A)}: האיברים הנמצאים באיזושהי קבוצה של X. לכן x ∈ ⋃X פירושו ∃S (S ∈ X ∧ x ∈ S).' };
const sInter = { symbol: 'החיתוך האונרי', doc: '⋂X = {a | ∀A ∈ X (a ∈ A)}: האיברים המשותפים לכל הקבוצות של X. לכן x ∈ ⋂X פירושו ∀S (S ∈ X → x ∈ S).' };

const level = (number, fields) => ({
    id: `unit10-${number}`,
    levelNumber: number,
    totalLevels: 9,
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

export const unit10Levels = [
    level(1, {
        title: 'קבוצת החזקה',
        name: 'unit10_l1_self_mem_powerset',
        proposition: 'A ∈ 𝒫 A',
        goalLabel: 'A ∈ 𝒫(A)',
        toolboxBlocks: ['unfold', 'subset_intro', 'exact'],
        introduction: `# קבוצת החזקה

בהינתן קבוצה A, *קבוצת החזקה* של A, \`𝒫(A)\`, היא הקבוצה שאיבריה הם *כל תת־הקבוצות* של A: \`𝒫(A) = {X | X ⊆ A}\`. התכונה המרכזית מההרצאה: \`X ∈ 𝒫(A) ⟺ X ⊆ A\`.

עד עכשיו האיברים של הקבוצות היו עצמים. האיברים של 𝒫(A) הם *קבוצות*.

כאן המטרה היא \`A ∈ 𝒫(A)\`. פותחים את הגדרת קבוצת החזקה במטרה, ונשארת ההכלה A ⊆ A, מהשלב הראשון של יחידה 8.`,
        newDefinitions: [powerset],
        hints: [
            `גררו את הבלוק ${UNFOLD_BLOCK} אל תוך בלוק המטרה, ובחרו בו את המטרה A ∈ 𝒫(A). עכשיו כתוב בו: לפי הגדרת קבוצת החזקה, כדי להוכיח A ∈ 𝒫(A) די להוכיח A ⊆ A.`,
            `הוסיפו את הבלוק ${SUBSET_INTRO_BLOCK}: יהי x ∈ A, והוא בידינו.`,
        ],
        conclusion: 'כל קבוצה היא איבר של קבוצת החזקה שלה, כי היא תת־קבוצה של עצמה. בהמשך תשתמשו בזה כטענת עזר.',
        startXml: goalXml('A ∈ 𝒫(A)'),
    }),
    level(2, {
        title: 'הקבוצה הריקה בקבוצת החזקה',
        name: 'unit10_l2_empty_mem_powerset',
        proposition: '∅ ∈ 𝒫 A',
        goalLabel: '∅ ∈ 𝒫(A)',
        toolboxBlocks: ['unfold', 'subset_intro', 'exfalso', 'exact'],
        introduction: `# הקבוצה הריקה בקבוצת החזקה

בהרצאה: \`𝒫(∅) = {∅}\`, ו־\`𝒫({∅}) = {∅, {∅}}\`. בשתי הדוגמאות ∅ היא איבר של קבוצת החזקה, וזה נכון לכל קבוצה: הקבוצה הריקה מוכלת בכל קבוצה (יחידה 8), ולכן היא איבר של כל קבוצת חזקה.

פותחים את הגדרת קבוצת החזקה במטרה, ונשארת ההכלה ∅ ⊆ A.`,
        hints: [
            `גררו את הבלוק ${UNFOLD_BLOCK}, ובחרו בו את המטרה ∅ ∈ 𝒫(A). נשאר להוכיח ∅ ⊆ A.`,
            `${SUBSET_INTRO_BLOCK}: יהי x ∈ ∅. פתחו את ההגדרה בהנחה x ∈ ∅: פירושו ⊥.`,
            `הוסיפו את הבלוק ${EXFALSO_BLOCK}. הסתירה כבר בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: '∅ ∈ 𝒫(A) לכל קבוצה A: קבוצת החזקה אף פעם אינה ריקה. לכן גם בדוגמאות של ההרצאה, ∅ היא תמיד אחד האיברים.',
        startXml: goalXml('∅ ∈ 𝒫(A)'),
    }),
    level(3, {
        title: 'אם A ⊆ B אז 𝒫(A) ⊆ 𝒫(B)',
        name: 'unit10_l3_powerset_mono',
        proposition: '(A ⊆ B) → (𝒫 A ⊆ 𝒫 B)',
        goalLabel: '((A ⊆ B) → (𝒫(A) ⊆ 𝒫(B)))',
        toolboxBlocks: ['assume', 'subset_intro', 'unfold', 'subset_elim', 'exact'],
        introduction: `# אם A ⊆ B אז 𝒫(A) ⊆ 𝒫(B)

התרגיל מההרצאה: \`A ⊆ B\` אם ורק אם \`𝒫(A) ⊆ 𝒫(B)\`. זה "אם ורק אם", ולכן מוכיחים שתי גרירות, כאן ובשלב הבא.

הכיוון הראשון, כמו בהרצאה: "נניח A ⊆ B. תהי X קבוצה כך ש־X ∈ 𝒫(A). מהגדרת קבוצת החזקה X ⊆ A. מאחר ש־A ⊆ B, מטרנזיטיביות ההכלה X ⊆ B, ולכן X ∈ 𝒫(B)."
כאן נוכיח את הטרנזיטיביות במקום: יהי x ∈ X, ונשתמש בשתי ההכלות, כמו ביחידה 8.`,
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה, ולתוכו את הבלוק ${SUBSET_INTRO_BLOCK}: יהי X ∈ 𝒫(A) ונוכיח X ∈ 𝒫(B).`,
            `פתחו את ההגדרה בהנחה X ∈ 𝒫(A) (פירושו X ⊆ A) ובמטרה X ∈ 𝒫(B) (די להוכיח X ⊆ B).`,
            `שוב ${SUBSET_INTRO_BLOCK}: יהי x ∈ X. אחר כך ${SUBSET_ELIM_BLOCK} עם X ⊆ A ועם x ∈ X, ואחריו עוד אחד עם A ⊆ B ועם x ∈ A.`,
        ],
        conclusion: 'האיברים של 𝒫(A) הם קבוצות, ולכן לקחתם *קבוצה* X ∈ 𝒫(A), ובתוכה איבר x ∈ X. אותה תבנית הכלה, ברמה אחת מעל.',
        startXml: goalXml('((A ⊆ B) → (𝒫(A) ⊆ 𝒫(B)))'),
    }),
    level(4, {
        title: 'הכיוון השני: טענת עזר',
        name: 'unit10_l4_powerset_mono_back',
        proposition: '(𝒫 A ⊆ 𝒫 B) → (A ⊆ B)',
        goalLabel: '(𝒫(A) ⊆ 𝒫(B) → A ⊆ B)',
        claims: ['A ∈ 𝒫 A', 'B ∈ 𝒫 B', 'A ∈ 𝒫 B'],
        toolboxBlocks: ['assume', 'claim', 'unfold', 'subset_intro', 'subset_elim', 'exact'],
        newTacticsBlocks: ['claim'],
        newTacticsInfo: [claimInfo],
        introduction: `# הכיוון השני: טענת עזר

הכיוון השני של התרגיל: אם \`𝒫(A) ⊆ 𝒫(B)\`, אז \`A ⊆ B\`.

ההכלה 𝒫(A) ⊆ 𝒫(B) מדברת על *תת־קבוצות* של A, ולכן כדי להשתמש בה צריך תת־קבוצה של A. בהרצאה לוקחים את היחידון {x}: הוא מוכל ב־A, ולכן מוכל גם ב־B. כאן ניקח תת־קבוצה אחרת: את A עצמה, שהיא איבר של 𝒫(A) (שלב 1).
בהוכחה כתובה כותבים: "נוכיח קודם ש־A ∈ 𝒫(A)", מוכיחים, וממשיכים. בשביל זה יש מהלך חדש: *טענת עזר*. מוכיחים אותה בחלק שבתוך הבלוק, ומעכשיו היא בידינו.`,
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה.`,
            `הוסיפו את הבלוק ${CLAIM_BLOCK}, ובחרו בו את A ∈ 𝒫(A).`,
            `בתוך הבלוק: פתחו את ההגדרה במטרה A ∈ 𝒫(A) (נשאר להוכיח A ⊆ A), ואחר כך ${SUBSET_INTRO_BLOCK}: יהי x ∈ A, והוא בידינו.`,
            `אחרי הבלוק A ∈ 𝒫(A) בידינו: ${SUBSET_ELIM_BLOCK} עם 𝒫(A) ⊆ 𝒫(B) ועם A ∈ 𝒫(A) נותן A ∈ 𝒫(B).`,
            'פתחו את ההגדרה ב־A ∈ 𝒫(B): פירושו A ⊆ B, וזו המטרה.',
        ],
        conclusion: `יחד עם השלב הקודם: A ⊆ B אם ורק אם 𝒫(A) ⊆ 𝒫(B). ומכאן, כמו בהרצאה, גם A = B אם ורק אם 𝒫(A) = 𝒫(B): שוויון הוא הכלה בשני הכיוונים.
טענת העזר A ∈ 𝒫(A) היא הרעיון של ההוכחה, ולכן כותבים אותה במפורש.`,
        startXml: goalXml('(𝒫(A) ⊆ 𝒫(B) → A ⊆ B)'),
    }),
    level(5, {
        title: '𝒫(A ∩ B) = 𝒫(A) ∩ 𝒫(B)',
        name: 'unit10_l5_powerset_inter',
        proposition: '𝒫 (A ∩ B) = 𝒫 A ∩ 𝒫 B',
        goalLabel: '𝒫(A ∩ B) = 𝒫(A) ∩ 𝒫(B)',
        toolboxBlocks: ['set_eq', 'subset_intro', 'unfold', 'and_elim', 'and_intro', 'subset_elim', 'exact'],
        introduction: `# 𝒫(A ∩ B) = 𝒫(A) ∩ 𝒫(B)

הטענה מההרצאה. מוכיחים הכלה בשני הכיוונים, בתבנית של השקף:
- **(⊆)** תהי X ∈ 𝒫(A ∩ B). לפי הגדרת קבוצת החזקה, X ⊆ A ∩ B. לכן X ⊆ A ו־X ⊆ B, כלומר X ∈ 𝒫(A) ו־X ∈ 𝒫(B), ולפי הגדרת החיתוך X ∈ 𝒫(A) ∩ 𝒫(B).
- **(⊇)** תהי X ∈ 𝒫(A) ∩ 𝒫(B). לפי הגדרת החיתוך, X ∈ 𝒫(A) ו־X ∈ 𝒫(B), כלומר X ⊆ A ו־X ⊆ B. לכן X ⊆ A ∩ B, ו־X ∈ 𝒫(A ∩ B).

בהרצאה המעבר בין X ⊆ A ∩ B לבין X ⊆ A ∧ X ⊆ B הוא טענה (ג) (יחידה 9, שלב 3). כאן מוכיחים אותו במקום: יהי x ∈ X.`,
        newDefinitions: [inter],
        hints: [
            `גררו את הבלוק ${SET_EQ_BLOCK} אל תוך בלוק המטרה. בכל חלק: ${SUBSET_INTRO_BLOCK}, תהי X באגף שמאל, ופתחו את ההגדרות בהנחה ובמטרה.`,
            `בחלק הראשון, X ⊆ A ∩ B בידינו, והמטרה "וגם": ${AND_INTRO_BLOCK}. בכל חלק פתחו את הגדרת קבוצת החזקה, יהי x ∈ X, ${SUBSET_ELIM_BLOCK} עם X ⊆ A ∩ B, פתחו את הגדרת החיתוך, ו־${AND_ELIM_BLOCK}.`,
            `בחלק השני: ${AND_ELIM_BLOCK}, ופתחו את הגדרת קבוצת החזקה בשני החלקים: X ⊆ A ו־X ⊆ B. במטרה X ⊆ A ∩ B: יהי x ∈ X, פתחו את הגדרת החיתוך, ובכל חלק ${SUBSET_ELIM_BLOCK} עם ההכלה המתאימה.`,
        ],
        conclusion: 'הוכחתם הכלה בשני הכיוונים, ולכן 𝒫(A ∩ B) = 𝒫(A) ∩ 𝒫(B): תת־קבוצה של החיתוך היא תת־קבוצה של כל אחת מהשתיים, ולהפך.',
        startXml: goalXml('𝒫(A ∩ B) = 𝒫(A) ∩ 𝒫(B)'),
    }),
    level(6, {
        title: 'ומה עם האיחוד?',
        name: 'unit10_l6_powerset_union',
        proposition: '𝒫 A ∪ 𝒫 B ⊆ 𝒫 (A ∪ B)',
        goalLabel: '𝒫(A) ∪ 𝒫(B) ⊆ 𝒫(A ∪ B)',
        toolboxBlocks: ['subset_intro', 'unfold', 'or_elim', 'subset_elim', 'or_by_negation', 'or_intro', 'exact'],
        introduction: `# ומה עם האיחוד?

בהרצאה ראינו ש־\`𝒫(A ∪ B) = 𝒫(A) ∪ 𝒫(B)\` *לא* נכון תמיד: עבור A = {1} ו־B = {2}, {1,2} ∈ 𝒫(A ∪ B) אבל {1,2} ∉ 𝒫(A) ∪ 𝒫(B). השוויון נכון אם ורק אם A ⊆ B או B ⊆ A.

אבל הכלה אחת נכונה תמיד: \`𝒫(A) ∪ 𝒫(B) ⊆ 𝒫(A ∪ B)\`. זה הכיוון ⊇ מהשקף: "יהי X ∈ 𝒫(A) ∪ 𝒫(B). נחלק לשני מקרים: אם X ∈ 𝒫(A), אז X ⊆ A ⊆ A ∪ B; אם X ∈ 𝒫(B), אז X ⊆ B ⊆ A ∪ B. בכל מקרה X ∈ 𝒫(A ∪ B)."`,
        newDefinitions: [union],
        hints: [
            `גררו את הבלוק ${SUBSET_INTRO_BLOCK}: יהי X ∈ (𝒫(A) ∪ 𝒫(B)). פתחו את הגדרת האיחוד בהנחה, ואת הגדרת קבוצת החזקה במטרה: די להוכיח X ⊆ A ∪ B.`,
            `${OR_ELIM_BLOCK} עם X ∈ 𝒫(A) ∨ X ∈ 𝒫(B). במקרה 1: פתחו את ההגדרה (X ⊆ A), ויהי x ∈ X.`,
            `${SUBSET_ELIM_BLOCK} עם X ⊆ A ועם x ∈ X. פתחו את הגדרת האיחוד במטרה x ∈ (A ∪ B), ו־${OR_INTRO_BLOCK} עם x ∈ A.`,
            'במקרה 2 אותו דבר, עם B.',
        ],
        conclusion: 'בכל מקרה X ∈ 𝒫(A ∪ B). ההכלה ההפוכה נכונה רק כש־A ⊆ B או B ⊆ A: בלי זה, קבוצה עם איבר מ־A ואיבר מ־B שייכת ל־𝒫(A ∪ B), אבל לא ל־𝒫(A) ולא ל־𝒫(B).',
        startXml: goalXml('𝒫(A) ∪ 𝒫(B) ⊆ 𝒫(A ∪ B)'),
    }),
    level(7, {
        title: 'חיתוך אונרי',
        name: 'unit10_l7_sinter',
        variableLine: SET_OF_SETS,
        params: '(hA : A ∈ X)',
        proposition: '⋂ X ⊆ A',
        goalLabel: '⋂X ⊆ A',
        assumptions: [{ name: 'hA', prop: 'A ∈ X' }],
        toolboxBlocks: ['subset_intro', 'unfold', 'forall_elim', 'forward', 'apply_rule', 'exact'],
        introduction: `# חיתוך אונרי

תהי X קבוצה שאבריה קבוצות. *החיתוך האונרי* של X: \`⋂X = {a | ∀A ∈ X (a ∈ A)}\`, האיברים המשותפים לכל הקבוצות של X. לכן \`x ∈ ⋂X\` פירושו \`∀S (S ∈ X → x ∈ S)\`.

הדוגמה מההרצאה: תהי A ∈ X. אז \`⋂X ⊆ A ⊆ ⋃X\`. כאן החלק הראשון: "יהי a ∈ ⋂X. מההנחה a ∈ ⋂X מותר להציב *כל* קבוצה ב־X שנבחר. נבחר את A ∈ X, ונקבל a ∈ A."
מההנחה "∀" מציבים, כמו ביחידה 5: כאן מציבים קבוצה.`,
        newDefinitions: [sInter],
        hints: [
            `גררו את הבלוק ${SUBSET_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: כדי להוכיח ⋂X ⊆ A יהי x ∈ ⋂X ונוכיח x ∈ A.`,
            `הוסיפו את הבלוק ${UNFOLD_BLOCK}, ובחרו בו x ∈ ⋂X: פירושו ∀S (S ∈ X → x ∈ S).`,
            `הוסיפו את הבלוק ${FORALL_ELIM_BLOCK}, ובחרו בו את ה"לכל" ואת A: נקבל (A ∈ X → x ∈ A).`,
            `${FORWARD_BLOCK} עם A ∈ X → x ∈ A ועם A ∈ X. x ∈ A בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
            'או אחורה: לפי הגרירה A ∈ X → x ∈ A, כדי להוכיח x ∈ A די להוכיח A ∈ X, וזה בידינו.',
        ],
        conclusion: 'חיתוך אונרי הוא טענת "לכל", ולכן משתמשים בו בהצבה: את הקבוצה *אנחנו בוחרים*, כאן A. זכרו מההרצאה: ⋂ הולך עם "לכל".',
        startXml: goalXml('⋂X ⊆ A', 'A ∈ X'),
    }),
    level(8, {
        title: 'איחוד אונרי',
        name: 'unit10_l8_sunion',
        variableLine: SET_OF_SETS,
        params: '(hA : A ∈ X)',
        proposition: 'A ⊆ ⋃ X',
        goalLabel: 'A ⊆ ⋃X',
        assumptions: [{ name: 'hA', prop: 'A ∈ X' }],
        toolboxBlocks: ['subset_intro', 'unfold', 'exists_intro', 'and_intro', 'exact'],
        introduction: `# איחוד אונרי

*האיחוד האונרי* של X: \`⋃X = {a | ∃A ∈ X (a ∈ A)}\`, האיברים הנמצאים באיזושהי קבוצה של X. לכן \`x ∈ ⋃X\` פירושו \`∃S (S ∈ X ∧ x ∈ S)\`.

החלק השני של הדוגמה מההרצאה, \`A ⊆ ⋃X\`: "יהי a ∈ A. כדי להוכיח a ∈ ⋃X צריך *עד*. A עצמה היא העד: A ∈ X ו־a ∈ A, ולכן a ∈ ⋃X."
להוכיח "קיים" בוחרים עד, כמו ביחידה 5.`,
        newDefinitions: [sUnion],
        hints: [
            `גררו את הבלוק ${SUBSET_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: כדי להוכיח A ⊆ ⋃X יהי x ∈ A ונוכיח x ∈ ⋃X.`,
            `הוסיפו את הבלוק ${UNFOLD_BLOCK}, ובחרו בו את המטרה x ∈ ⋃X. נשאר להוכיח ∃S (S ∈ X ∧ x ∈ S).`,
            `הוסיפו את הבלוק ${EXISTS_INTRO_BLOCK}, ובחרו בו את A.`,
            `${AND_INTRO_BLOCK}: בכל חלק, מה שמוכיחים כבר בידינו.`,
        ],
        conclusion: 'איחוד אונרי הוא טענת "קיים", ולכן מוכיחים שייכות אליו בבחירת עד: קבוצה מ־X שהאיבר שייך אליה. ⋃ הולך עם "קיים". יחד עם השלב הקודם: ⋂X ⊆ A ⊆ ⋃X.',
        startXml: goalXml('A ⊆ ⋃X', 'A ∈ X'),
    }),
    level(9, {
        title: 'שלב בונוס: איחוד אונרי של קבוצת החזקה',
        name: 'unit10_l9_sunion_powerset',
        proposition: '⋃ (𝒫 A) = A',
        goalLabel: '⋃𝒫(A) = A',
        toolboxBlocks: ['set_eq', 'subset_intro', 'unfold', 'exists_elim', 'and_elim', 'subset_elim', 'exists_intro', 'and_intro', 'exact'],
        introduction: `# בונוס: איחוד אונרי של קבוצת החזקה

הטענה מההרצאה: \`⋃𝒫(A) = A\`. האיחוד של כל תת־הקבוצות של A הוא A עצמה.

- **(⊆)** יהי x ∈ ⋃𝒫(A). לפי ההגדרה, קיימת S ∈ 𝒫(A) כך ש־x ∈ S. *נותנים לה שם*, S₀, אבל לא בוחרים אותה, כמו ב"נסמן ב־x₀ עצם כזה" של יחידה 5. S₀ ⊆ A, ולכן x ∈ A.
- **(⊇)** יהי x ∈ A. העד: A עצמה, כי A ∈ 𝒫(A) (שלב 1) ו־x ∈ A.`,
        hints: [
            `גררו את הבלוק ${SET_EQ_BLOCK} אל תוך בלוק המטרה. בחלק הראשון: יהי x ∈ ⋃𝒫(A), ופתחו את ההגדרה: ∃S (S ∈ 𝒫(A) ∧ x ∈ S).`,
            `${EXISTS_ELIM_BLOCK} עם ה"קיים": נסמן ב־S₀ עצם כזה. אחר כך ${AND_ELIM_BLOCK}, פתחו את ההגדרה ב־S₀ ∈ 𝒫(A) (פירושו S₀ ⊆ A), ו־${SUBSET_ELIM_BLOCK} עם S₀ ⊆ A ועם x ∈ S₀.`,
            `בחלק השני: יהי x ∈ A. פתחו את ההגדרה במטרה x ∈ ⋃𝒫(A), ו־${EXISTS_INTRO_BLOCK} עם A.`,
            `${AND_INTRO_BLOCK}: בחלק A ∈ 𝒫(A), פתחו את ההגדרה ויהי x₀ ∈ A, והוא בידינו (השם x כבר תפוס). בחלק השני x ∈ A בידינו.`,
        ],
        conclusion: `סיימתם את יחידה 10, כולל שלב הבונוס, ואת כל השיעור השני! בחלק הראשון השתמשתם ב"קיים" (נתתם שם לקבוצה), ובחלק השני הוכחתם "קיים" (בחרתם עד).
בהרצאה: "שתי הנחות שייכות לאיחוד נותנות שני עדים, ונותנים להם שמות שונים". לכן שמות כמו S₀ ו־S₁.`,
        startXml: goalXml('⋃𝒫(A) = A'),
    }),
];
