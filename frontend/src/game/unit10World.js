import { goalXml } from './levelXml';

// Unit 10: summary exercises, at the level of the course's quizzes and exams
// (the BGU course "מבוא ללוגיקה ותורת הקבוצות", recent years). Every level
// offers all the moves of the course, in drawers by kind, all the laws, and
// a few intermediate claims, some of them not needed; there is one hint,
// which points the way without solving.

export const unit10WorldName = 'יחידה 10 - תרגילים מסכמים';

// All the moves, in drawers by kind.
const DRAWERS = [
    { name: 'כללי', blocks: ['exact', 'assume', 'apply_rule', 'forward', 'claim'] },
    { name: '"וגם", "או", "אם ורק אם"', blocks: ['and_elim', 'and_intro', 'and_combine', 'or_intro', 'or_elim', 'iff_intro', 'iff_elim'] },
    { name: 'שלילה וסתירה', blocks: ['not_intro', 'not_elim', 'contradiction', 'exfalso', 'by_contradiction'] },
    { name: 'כמתים', blocks: ['forall_intro', 'forall_elim', 'exists_intro', 'exists_elim'] },
    { name: 'שקילויות', blocks: ['replace'] },
    { name: 'קבוצות', blocks: ['subset_intro', 'subset_elim', 'set_eq', 'unfold'] },
    { name: 'שוויון ואינדוקציה', blocks: ['rfl', 'rewrite', 'induction', 'unfold_function', 'calc', 'calc_hyps', 'algebra', 'algebra_hyps'] },
];
const LAWS = ['easylean_not_not', 'easylean_not_or', 'easylean_not_and', 'easylean_imp_or', 'easylean_contrapositive', 'easylean_not_imp', 'easylean_not_exists', 'easylean_not_forall'];

const PROPOSITIONS = 'variable {P Q R : Prop}';
const RELATIONS = 'variable {obj : Type} {R S : obj → obj → Prop}';
const SETS = 'variable {obj : Type} {A B C E : Set obj}';
const FAMILIES = 'variable {obj : Type} {A B : Set obj} {F G H : Set (Set obj)}';

const drawersInfo = {
    name: 'ארגז מלא, במגירות',
    doc: 'ביחידה הזאת יש בארגז את כל המהלכים שלמדתם, מחולקים למגירות לפי סוג: לחצו על שם של מגירה כדי לפתוח אותה. גם כל השקילויות של יחידה 5 זמינות, ובבלוק של טענת עזר יש כמה טענות לבחירה, ולא כולן נחוצות.',
};

const level = (number, fields) => ({
    id: `unit10-${number}`,
    levelNumber: number,
    totalLevels: 17,
    variableLine: PROPOSITIONS,
    params: '',
    objects: [],
    assumptions: [],
    toolboxDrawers: DRAWERS,
    toolboxBlocks: DRAWERS.flatMap((drawer) => drawer.blocks),
    laws: LAWS,
    claims: [],
    newTacticsBlocks: [],
    newTacticsInfo: [],
    newDefinitions: [],
    ...fields,
});

export const unit10Levels = [
    level(1, {
        title: 'גרירה של "או"',
        name: 'unit10_l1_implies_or',
        proposition: '(P → Q ∨ R) ↔ (P → Q) ∨ (P → R)',
        goalLabel: '((P → (Q ∨ R)) ↔ ((P → Q) ∨ (P → R)))',
        newTacticsInfo: [drawersInfo],
        introduction: `# תרגילים מסכמים

ביחידה הזאת התרגילים לקוחים מהבחנים, מהמבחנים ומהתרגולים של הקורס בשנים האחרונות. בארגז יש את כל המהלכים, במגירות, ורמז אחד בלבד בכל שלב.

**תרגיל 1** (תרגיל בית 1, שאלה 6): הוכיחו ש־P → (Q ∨ R) שקולה ל־(P → Q) ∨ (P → R).
כיוון אחד קל. בכיוון השני לא ידוע איזה צד של ה"או" נכון.`,
        hints: ['בכיוון הקשה, הוכיחו בשלילה: את השלילה של ה"או" אפשר להחליף לפי דה מורגן, ואת השלילה של כל גרירה לפי השקילות של שלב 5.11.'],
        conclusion: 'הוכחתם את השקילות. אגב, ∀ לא מתחלק על "או" באותה דרך: ∀x (P(x) ∨ Q(x)) לא שקולה ל־∀x (P(x)) ∨ ∀x (Q(x)).',
        startXml: goalXml('((P → (Q ∨ R)) ↔ ((P → Q) ∨ (P → R)))'),
    }),
    level(2, {
        title: 'אחת משתי הגרירות',
        name: 'unit10_l2_one_of_two',
        variableLine: 'variable {P Q : Prop}',
        proposition: '(P → Q) ∨ (Q → P)',
        goalLabel: '((P → Q) ∨ (Q → P))',
        introduction: `# אחת משתי הגרירות

**תרגיל 2** (תרגול 2): הוכיחו, בלי טבלת אמת, ש־(P → Q) ∨ (Q → P).
טענה מפתיעה: לכל שתי טענות, אחת מהן גוררת את השנייה.`,
        hints: ['הוכיחו בשלילה, והחליפו את השלילה לפי השקילויות עד שיש בידכם P, ¬Q, Q ו־¬P.'],
        conclusion: '(P → Q) ∨ (Q → P) נכונה תמיד: אם Q נכונה, הגרירה הראשונה נכונה; ואם לא, השנייה.',
        startXml: goalXml('((P → Q) ∨ (Q → P))'),
    }),
    level(3, {
        title: 'יחס שאינו אנטי־סימטרי',
        name: 'unit10_l3_not_antisymmetric',
        variableLine: RELATIONS,
        proposition: '(¬∀ x, ∀ y, R x y ∧ R y x → x = y) → ∃ x, ∃ y, (R x y ∧ R y x) ∧ ¬x = y',
        goalLabel: '((¬∀x (∀y ((R(x,y) ∧ R(y,x)) → x = y))) → (∃x (∃y ((R(x,y) ∧ R(y,x)) ∧ ¬x = y))))',
        introduction: `# יחס שאינו אנטי־סימטרי

**תרגיל 3** (לפי שאלה ממבחן 2025א, מועד ב): יחס R הוא *אנטי־סימטרי* אם ∀x (∀y ((R(x,y) ∧ R(y,x)) → x = y)).
הוכיחו שאם R אינו אנטי־סימטרי, יש x ו־y שונים כך ש־R(x,y) וגם R(y,x).`,
        hints: ['העבירו את השלילה פנימה בשקילויות: דרך שני הכמתים, ואחר כך דרך הגרירה.'],
        conclusion: 'השלילה של "אנטי־סימטרי" היא "יש שני איברים שונים שכל אחד מהם ביחס לשני". כך מוצאים את השלילה של כל הגדרה.',
        startXml: goalXml('((¬∀x (∀y ((R(x,y) ∧ R(y,x)) → x = y))) → (∃x (∃y ((R(x,y) ∧ R(y,x)) ∧ ¬x = y))))'),
    }),
    level(4, {
        title: 'חיתוך של יחסים טרנזיטיביים',
        name: 'unit10_l4_transitive_inter',
        variableLine: RELATIONS,
        params: '(hR : ∀ x y z, R x y ∧ R y z → R x z) (hS : ∀ x y z, S x y ∧ S y z → S x z)',
        proposition: '∀ x y z, (R x y ∧ S x y) ∧ (R y z ∧ S y z) → R x z ∧ S x z',
        goalLabel: '∀x (∀y (∀z (((R(x,y) ∧ S(x,y)) ∧ (R(y,z) ∧ S(y,z))) → (R(x,z) ∧ S(x,z)))))',
        introduction: `# חיתוך של יחסים טרנזיטיביים

**תרגיל 4** (לפי שאלה ממבחן 2026א, מועד ב): אם R ו־S טרנזיטיביים, גם R ∩ S טרנזיטיבי.
כאן היחסים כתובים כטענות: R טרנזיטיבי פירושו ∀x (∀y (∀z ((R(x,y) ∧ R(y,z)) → R(x,z)))), ו־(x,y) ∈ R ∩ S פירושו R(x,y) ∧ S(x,y).`,
        hints: ['יהיו x₀, y₀, z₀ ונניח את התנאי. כל צד של המטרה נובע מהטרנזיטיביות של יחס אחד, אחרי הצבה של x₀, y₀ ו־z₀ בה.'],
        conclusion: 'R ∩ S טרנזיטיבי. לעומת זאת, R ∪ S לא חייב להיות טרנזיטיבי: נסו למצוא דוגמה.',
        startXml: goalXml('∀x (∀y (∀z (((R(x,y) ∧ S(x,y)) ∧ (R(y,z) ∧ S(y,z))) → (R(x,z) ∧ S(x,z)))))',
            '∀x (∀y (∀z ((R(x,y) ∧ R(y,z)) → R(x,z)))),  ∀x (∀y (∀z ((S(x,y) ∧ S(y,z)) → S(x,z))))'),
    }),
    level(5, {
        title: 'חיתוך והפרש',
        name: 'unit10_l5_inter_diff',
        variableLine: SETS,
        usesSets: true,
        proposition: '(A \\ C) ∩ B ⊆ B \\ C',
        goalLabel: '(A \\ C) ∩ B ⊆ B \\ C',
        introduction: `# חיתוך והפרש

**תרגיל 5** (תרגול 3, ותכנון הסמסטר): הוכיחו ש־(A \\ C) ∩ B ⊆ B \\ C.`,
        hints: ['קחו איבר, ופתחו את כל ההגדרות: בהנחה, ואחר כך במטרה.'],
        conclusion: 'בתרגול גם שואלים מתי יש כאן שוויון. התשובה: בדיוק כש־B \\ A ⊆ C.',
        startXml: goalXml('(A \\ C) ∩ B ⊆ B \\ C'),
    }),
    level(6, {
        title: 'הפרש של הפרש',
        name: 'unit10_l6_diff_of_diff',
        variableLine: SETS,
        usesSets: true,
        proposition: 'A \\ (B \\ C) = (A \\ B) ∪ (A ∩ C)',
        goalLabel: 'A \\ (B \\ C) = (A \\ B) ∪ (A ∩ C)',
        claims: ['x₀ ∈ C ∨ ¬x₀ ∈ C', 'x₀ ∈ B ∨ ¬x₀ ∈ B', 'x₀ ∈ A ∩ C'],
        introduction: `# הפרש של הפרש

**תרגיל 6** (תרגול 3, ותכנון הסמסטר): הוכיחו ש־A \\ (B \\ C) = (A \\ B) ∪ (A ∩ C).
בהכלה הראשונה צריך להוכיח "או", ולא ידוע איזה צד נכון: זה תלוי בשאלה אם x₀ ∈ C.`,
        hints: ['בהכלה הראשונה, הוכיחו קודם את טענת העזר x₀ ∈ C ∨ ¬x₀ ∈ C (כמו P ∨ ¬P ביחידה 3), ואחר כך חלקו למקרים לפיה.'],
        conclusion: 'בהכלה הראשונה חילקתם למקרים לפי x₀ ∈ C ∨ ¬x₀ ∈ C, שאינה נובעת מההנחות אלא מהלוגיקה עצמה. זה שימוש נפוץ בטענת עזר.',
        startXml: goalXml('A \\ (B \\ C) = (A \\ B) ∪ (A ∩ C)'),
    }),
    level(7, {
        title: 'קבוצות זרות',
        name: 'unit10_l7_disjoint',
        variableLine: SETS,
        usesSets: true,
        proposition: 'A ∩ B = ∅ ↔ (A ∪ B) \\ B = A',
        goalLabel: '(A ∩ B = ∅ ↔ (A ∪ B) \\ B = A)',
        claims: ['x₀ ∈ A ∩ B', 'x₀ ∈ A ∪ B', 'x₀ ∈ ∅'],
        introduction: `# קבוצות זרות

**תרגיל 7** (תרגול 3, ותכנון הסמסטר): הוכיחו ש־A ∩ B = ∅ אם ורק אם (A ∪ B) \\ B = A.
כאן משתמשים בשוויון של קבוצות שבידינו: לפיו מחליפים, כמו ביחידה 8.`,
        hints: ['כדי להשתמש ב־A ∩ B = ∅, צריך טענה שמופיעה בה A ∩ B, למשל x₀ ∈ A ∩ B: החליפו בה לפי השוויון. בכיוון השני, החליפו את A ב־x₀ ∈ A לפי השוויון שבידינו.'],
        conclusion: 'A ו־B זרות בדיוק כשהוצאת B מהאיחוד מחזירה את A.',
        startXml: goalXml('(A ∩ B = ∅ ↔ (A ∪ B) \\ B = A)'),
    }),
    level(8, {
        title: 'חיתוך עם כל קבוצה',
        name: 'unit10_l8_inter_every_set',
        variableLine: SETS,
        usesSets: true,
        proposition: '(∀ (X : Set obj), A ∩ X = A) → A = ∅',
        goalLabel: '((∀X (A ∩ X = A)) → A = ∅)',
        introduction: `# חיתוך עם כל קבוצה

**תרגיל 8** (בוחן תש"פ, ובעוד שלושה מקורות): אם A ∩ X = A לכל קבוצה X, אז A = ∅.
ההנחה היא "לכל", ולכן משתמשים בה בהצבה. השאלה היא איזו קבוצה כדאי להציב.`,
        hints: ['הציבו בהנחה את הקבוצה הריקה.'],
        conclusion: 'הצבה של קבוצה מתאימה בהנחה של "לכל קבוצה" היא הרעיון של התרגיל, ושל הרבה תרגילים כמוהו.',
        startXml: goalXml('((∀X (A ∩ X = A)) → A = ∅)'),
    }),
    level(9, {
        title: 'קבוצות נחמדות',
        name: 'unit10_l9_nice_sets',
        variableLine: SETS,
        usesSets: true,
        params: '(hE : ¬E ⊆ A)',
        proposition: '∃ X, (∃ x, x ∈ X ∩ E) ∧ A ∩ X = ∅',
        goalLabel: '∃X ((∃x (x ∈ (X ∩ E))) ∧ A ∩ X = ∅)',
        claims: ['∃ x, x ∈ E ∧ ¬x ∈ A', '∃ x, x ∈ A ∩ E', 'A ∩ E = ∅'],
        introduction: `# קבוצות נחמדות

**תרגיל 9** (לפי בוחן תש"פ): קבוצה *נחמדה* אם יש לה איבר משותף עם E.
הוכיחו שאם E ⊄ A, יש קבוצה נחמדה X שזרה ל־A.
צריך לבחור את X, ולהוכיח שהיא נחמדה ושהיא זרה ל־A.`,
        hints: ['בחרו X = E \\ A. כדי להראות שהיא נחמדה, הוכיחו קודם את טענת העזר ∃x (x ∈ E ∧ ¬x ∈ A), בשלילה, בעזרת ¬E ⊆ A.'],
        conclusion: 'העד היה קבוצה שבניתם, E \\ A. ואת האיבר שלה קיבלתם מ־¬E ⊆ A, בהוכחה בשלילה.',
        startXml: goalXml('∃X ((∃x (x ∈ (X ∩ E))) ∧ A ∩ X = ∅)', '¬E ⊆ A'),
    }),
    level(10, {
        title: 'הפרש סימטרי',
        name: 'unit10_l10_symmetric_difference',
        variableLine: SETS,
        usesSets: true,
        proposition: '(A ∪ B) \\ (A ∩ B) ⊆ A ∆ B',
        goalLabel: '(A ∪ B) \\ (A ∩ B) ⊆ A ∆ B',
        claims: ['x₀ ∈ B ∨ ¬x₀ ∈ B', 'x₀ ∈ A ∨ ¬x₀ ∈ A', 'x₀ ∈ A ∩ B'],
        introduction: `# הפרש סימטרי

**תרגיל 10** (תכנון הסמסטר): בשלב 6.10 הוכחתם ש־A ∆ B ⊆ (A ∪ B) \\ (A ∩ B). הוכיחו את ההכלה ההפוכה, וכך ששתי ההגדרות של ההפרש הסימטרי שוות.`,
        hints: ['אחרי פתיחת ההגדרות, חלקו למקרים לפי x₀ ∈ A ∨ x₀ ∈ B. במקרה x₀ ∈ A, הוכיחו ש־¬x₀ ∈ B: אחרת x₀ ∈ A ∩ B.'],
        conclusion: 'יחד עם שלב 6.10: A ∆ B = (A ∪ B) \\ (A ∩ B). שתי ההגדרות של ההפרש הסימטרי שוות.',
        startXml: goalXml('(A ∪ B) \\ (A ∩ B) ⊆ A ∆ B'),
    }),
    level(11, {
        title: 'קבוצת החזקה של חיתוך',
        name: 'unit10_l11_powerset_inter',
        variableLine: FAMILIES,
        usesSets: true,
        proposition: '𝒫 (A ∩ B) = 𝒫 A ∩ 𝒫 B',
        goalLabel: '𝒫(A ∩ B) = 𝒫(A) ∩ 𝒫(B)',
        introduction: `# קבוצת החזקה של חיתוך

**תרגיל 11** (תרגיל בית 2, ותכנון הסמסטר): הוכיחו ש־𝒫(A ∩ B) = 𝒫(A) ∩ 𝒫(B).`,
        hints: ['שתי הכלות. בכל אחת, קחו קבוצה X₀, פתחו את ההגדרות עד שמגיעים להכלות, ואז קחו איבר x₀ של X₀.'],
        conclusion: 'קבוצת החזקה מתחלפת עם חיתוך. עם איחוד זה לא כך: 𝒫(A ∪ B) יכולה להיות גדולה מ־𝒫(A) ∪ 𝒫(B).',
        startXml: goalXml('𝒫(A ∩ B) = 𝒫(A) ∩ 𝒫(B)'),
    }),
    level(12, {
        title: 'משפחה של תתי־קבוצות',
        name: 'unit10_l12_family_of_subsets',
        variableLine: FAMILIES,
        usesSets: true,
        proposition: 'F ⊆ 𝒫 A ↔ ⋃₀ F ⊆ A',
        goalLabel: '(F ⊆ 𝒫(A) ↔ ⋃₀ F ⊆ A)',
        claims: ['x₀ ∈ ⋃₀ F', 'X₀ ∈ 𝒫 A', 'A ∈ F'],
        introduction: `# משפחה של תתי־קבוצות

**תרגיל 12** (תרגול 4, ותכנון הסמסטר, תרגול 3): הוכיחו ש־F ⊆ 𝒫(A) אם ורק אם ⋃₀ F ⊆ A.
ההוכחה עוברת בין שלוש רמות: איברים, קבוצות ומשפחות.`,
        hints: ['בכיוון ←, כדי להשתמש ב־⋃₀ F ⊆ A צריך איבר של ⋃₀ F: הוכיחו קודם את טענת העזר x₀ ∈ ⋃₀ F.'],
        conclusion: 'F ⊆ 𝒫(A) ו־⋃₀ F ⊆ A אומרות אותו דבר: כל קבוצה במשפחה מוכלת ב־A.',
        startXml: goalXml('(F ⊆ 𝒫(A) ↔ ⋃₀ F ⊆ A)'),
    }),
    level(13, {
        title: 'האיחוד של קבוצת החזקה',
        name: 'unit10_l13_union_of_powerset',
        variableLine: FAMILIES,
        usesSets: true,
        proposition: '⋃₀ (𝒫 A) = A',
        goalLabel: '⋃₀ 𝒫(A) = A',
        introduction: `# האיחוד של קבוצת החזקה

**תרגיל 13** (לפי שאלה ממבחן 2025ב, מועד ג): הוכיחו ש־⋃₀ 𝒫(A) = A.`,
        hints: ['בהכלה ⊇, צריך קבוצה ב־𝒫(A) שמכילה את x₀. נסו את A עצמה.'],
        conclusion: 'האיחוד של כל תתי־הקבוצות של A הוא A, כי A היא אחת מהן.',
        startXml: goalXml('⋃₀ 𝒫(A) = A'),
    }),
    level(14, {
        title: 'איחוד של משפחות',
        name: 'unit10_l14_union_of_families',
        variableLine: FAMILIES,
        usesSets: true,
        proposition: '(∀ (T : Set obj), T ∈ F → ∃ X, X ∈ G ∧ T ⊆ X) → ⋃₀ F ⊆ ⋃₀ G',
        goalLabel: '((∀T (T ∈ F → (∃X (X ∈ G ∧ T ⊆ X)))) → ⋃₀ F ⊆ ⋃₀ G)',
        introduction: `# איחוד של משפחות

**תרגיל 14** (בוחן 1, 2026א, שאלה 3): אם כל קבוצה ב־F מוכלת באחת הקבוצות של G, אז ⋃₀ F ⊆ ⋃₀ G.`,
        hints: ['יש כאן שתי טענות "קיים" שמשתמשים בהן: האחת מההגדרה של x₀ ∈ ⋃₀ F, והשנייה מההנחה, אחרי הצבה.'],
        conclusion: 'זו הייתה שאלה בבוחן של השנה. המבנה שלה, "קיים" שנותן עצם, ו"לכל" שמציבים בו את העצם, חוזר בהרבה הוכחות.',
        startXml: goalXml('((∀T (T ∈ F → (∃X (X ∈ G ∧ T ⊆ X)))) → ⋃₀ F ⊆ ⋃₀ G)'),
    }),
    level(15, {
        title: 'סכום החזקות השלישיות',
        name: 'unit10_l15_sum_of_cubes',
        variableLine: '',
        usesNat: true,
        params: '(n : Nat)',
        proposition: 'sumCubes n = sumTo n ^ 2',
        goalLabel: 'sumCubes(n) = sumTo(n) ^ 2',
        objects: [{ name: 'n', type: 'ℕ' }],
        claims: ['∀ k, 2 * sumTo k = k * (k + 1)', '∀ k, sumTo k ≤ sumCubes k', '2 * sumTo n = n * (n + 1)'],
        newDefinitions: [{ symbol: 'sumCubes', doc: 'sumCubes(0) = 0, ו־sumCubes(n + 1) = sumCubes(n) + (n + 1)³: הסכום 1³ + 2³ + ... + n³.' }],
        introduction: `# סכום החזקות השלישיות

**תרגיל 15** (תרגול 10–11): הוכיחו ש־1³ + 2³ + ... + n³ = (1 + 2 + ... + n)².
sumTo מיחידה 8 הוא הסכום 1 + 2 + ... + n, ו־sumCubes הוא סכום החזקות השלישיות.`,
        hints: ['בצעד צריך את הנוסחה של שלב 8.9, 2 · sumTo(k) = k · (k + 1), לכל k. הוכיחו אותה קודם כטענת עזר (באינדוקציה), והציבו בה n.'],
        conclusion: 'הנוסחה של שלב 8.9 שימשה כאן כטענת עזר. כך בונים הוכחות ארוכות: מוכיחים קודם את מה שצריך, ומשתמשים בו.',
        startXml: goalXml('sumCubes(n) = sumTo(n) ^ 2'),
    }),
    level(16, {
        title: 'פונקציה ששומרת על הסדר',
        name: 'unit10_l16_order_embedding',
        variableLine: 'variable {f : Nat → Nat}',
        usesNat: true,
        params: '(n : Nat) (hf : ∀ m k, m ≤ k ↔ f m ≤ f k)',
        proposition: 'n ≤ f n',
        goalLabel: 'n ≤ f(n)',
        objects: [{ name: 'n', type: 'ℕ' }],
        introduction: `# פונקציה ששומרת על הסדר

**תרגיל 16** (עבודה 4, 2026א, ומבחן 2024ב, מועד ב): f היא פונקציה מהטבעיים לטבעיים, כך ש־m ≤ k אם ורק אם f(m) ≤ f(k).
הוכיחו ש־n ≤ f(n) לכל n.`,
        hints: ['באינדוקציה על n. בצעד, הציבו בהנחה על f את n + 1 ואת n: מה שמתקבל, יחד עם הנחת האינדוקציה, נותן את הצעד בחשבון פשוט.'],
        conclusion: 'פונקציה ששומרת על הסדר לא יכולה "לרדת" מתחת ל־n. החשבון השתמש כאן בהנחה של התרגיל עצמו, שהיא "אם ורק אם".',
        startXml: goalXml('n ≤ f(n)', '∀m (∀k (m ≤ k ↔ f(m) ≤ f(k)))'),
    }),
    level(17, {
        title: 'שלב בונוס: חיתוך של משפחות',
        name: 'unit10_l17_inter_of_families',
        variableLine: FAMILIES,
        usesSets: true,
        params: '(hH : ∀ (X : Set obj), X ∈ F → ∀ (Y : Set obj), Y ∈ G → X ∪ Y ∈ H)',
        proposition: '⋂₀ H ⊆ ⋂₀ F ∪ ⋂₀ G',
        goalLabel: '⋂₀ H ⊆ (⋂₀ F) ∪ (⋂₀ G)',
        claims: ['∃ X, X ∈ F ∧ ¬x₀ ∈ X', '∃ Y, Y ∈ G ∧ ¬x₀ ∈ Y', 'x₀ ∈ ⋂₀ F'],
        introduction: `# בונוס: חיתוך של משפחות

**תרגיל 17** (עבודה 1, 2026א, שאלה 4): אם X ∪ Y ∈ H לכל X ∈ F ולכל Y ∈ G, אז ⋂₀ H ⊆ (⋂₀ F) ∪ (⋂₀ G).
זו ההוכחה הקשה ביותר ביחידה: היא דורשת הוכחה בשלילה, ושתי טענות עזר.`,
        hints: ['הוכיחו את ה"או" בשלילה. מ־¬x₀ ∈ ⋂₀ F הוכיחו את טענת העזר ∃X (X ∈ F ∧ ¬x₀ ∈ X), וכך גם ל־G. אחר כך הציבו את שתי הקבוצות בהנחה על H.'],
        conclusion: 'סיימתם את יחידה 10, ואת הקורס! בתרגיל האחרון השתמשתם כמעט בכל מה שלמדתם: הוכחה בשלילה, שקילויות, כמתים, קבוצות, משפחות של קבוצות וטענות עזר.',
        startXml: goalXml('⋂₀ H ⊆ (⋂₀ F) ∪ (⋂₀ G)', '∀X (X ∈ F → (∀Y (Y ∈ G → X ∪ Y ∈ H)))'),
    }),
];
