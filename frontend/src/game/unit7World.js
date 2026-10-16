import { goalXml } from './levelXml';

// Unit 7 (see blocks/moves.js): sets of sets, the power
// set and families of sets, as in Logic and Proof (chapter 12). Their
// definitions are read with the same move as in unit 6 ("לפי ההגדרה"), and
// what they say is a "for all" or a "there exists" over sets, used with the
// moves of unit 4. Each level offers only the moves of its solutions.

export const unit7WorldName = 'יחידה 7 - קבוצות של קבוצות';

const SETS = 'variable {obj : Type} {A B : Set obj}';
const FAMILY = 'variable {obj : Type} {A : Set obj} {F : Set (Set obj)}';

// The moves as the toolbox shows them, before they are placed.
const SUBSET_INTRO_BLOCK = '"כדי להוכיח הכלה: יהי איבר של הקבוצה המוכלת, ונוכיח שהוא שייך לקבוצה המכילה"';
const SUBSET_ELIM_BLOCK = '"לפי ההכלה ? ומ־?"';
const UNFOLD_BLOCK = '"לפי ההגדרה, ?"';
const OR_INTRO_BLOCK = '"כדי להוכיח את ה"או" די להוכיח את ?"';
const EXISTS_INTRO_BLOCK = '"כדי להוכיח "קיים" נבחר את העצם ?"';
const EXISTS_ELIM_BLOCK = '"לפי ה"קיים" ? יהי עצם חדש שמקיים אותו"';
const FORALL_ELIM_BLOCK = '"לפי ה"לכל" ? עבור העצם ?"';
const AND_ELIM_BLOCK = '"מה"וגם" ?"';
const CLOSE_BLOCK = '"יש לנו ביד בדיוק את מה שאנחנו רוצים להוכיח."';

const powerset = { symbol: 'קבוצת החזקה', doc: 'X ∈ 𝒫(A) פירושו X ⊆ A: האיברים של קבוצת החזקה הם תתי־הקבוצות של A.' };
const sUnion = { symbol: 'איחוד של משפחה', doc: 'x₀ ∈ ⋃₀ F פירושו ∃S (S ∈ F ∧ x₀ ∈ S): x₀ שייך לאחת הקבוצות במשפחה.' };
const sInter = { symbol: 'חיתוך של משפחה', doc: 'x₀ ∈ ⋂₀ F פירושו ∀S (S ∈ F → x₀ ∈ S): x₀ שייך לכל הקבוצות במשפחה.' };

const level = (number, fields) => ({
    id: `unit7-${number}`,
    levelNumber: number,
    totalLevels: 6,
    usesSets: true,
    objects: [],
    assumptions: [],
    newTacticsBlocks: [],
    newTacticsInfo: [],
    newDefinitions: [],
    ...fields,
});

export const unit7Levels = [
    level(1, {
        title: 'קבוצת החזקה',
        name: 'unit7_l1_powerset_mem',
        variableLine: SETS,
        params: '',
        proposition: 'A ∈ 𝒫 (A ∪ B)',
        goalLabel: 'A ∈ 𝒫(A ∪ B)',
        toolboxBlocks: ['unfold', 'subset_intro', 'or_intro', 'exact'],
        introduction: `# קבוצות של קבוצות

ביחידה 6 האיברים של הקבוצות היו עצמים. ביחידה הזאת יש גם קבוצות שהאיברים שלהן הם *קבוצות*.

\`𝒫(A)\` היא *קבוצת החזקה* של A: הקבוצה שהאיברים שלה הם כל תתי־הקבוצות של A. לפי ההגדרה, \`X ∈ 𝒫(A)\` פירושו \`X ⊆ A\`.

כאן המטרה היא \`A ∈ 𝒫(A ∪ B)\`: A היא תת־קבוצה של A ∪ B. פותחים את ההגדרה במטרה, כמו ביחידה 6, ומקבלים הכלה רגילה.`,
        newDefinitions: [powerset],
        hints: [
            `גררו את הבלוק ${UNFOLD_BLOCK} אל תוך בלוק המטרה, ובחרו בו את המטרה A ∈ 𝒫(A ∪ B). עכשיו כתוב בו: לפי הגדרת קבוצת החזקה, כדי להוכיח A ∈ 𝒫(A ∪ B) די להוכיח A ⊆ (A ∪ B).`,
            `הוסיפו את הבלוק ${SUBSET_INTRO_BLOCK}: יהי x₀ ∈ A ונוכיח x₀ ∈ A ∪ B.`,
            `פתחו את ההגדרה במטרה x₀ ∈ A ∪ B. אחר כך הוסיפו את הבלוק ${OR_INTRO_BLOCK}, ובחרו בו x₀ ∈ A: היא בידינו.`,
        ],
        conclusion: `קבוצה היא איבר של קבוצת החזקה בדיוק כשהיא תת־קבוצה. אחרי פתיחת ההגדרה נשארה הכלה מוכרת.`,
        startXml: goalXml('A ∈ 𝒫(A ∪ B)'),
    }),
    level(2, {
        title: 'הכלה של קבוצות חזקה',
        name: 'unit7_l2_powerset_mono',
        variableLine: SETS,
        params: '',
        proposition: '(A ⊆ B) → (𝒫 A ⊆ 𝒫 B)',
        goalLabel: '((A ⊆ B) → (𝒫(A) ⊆ 𝒫(B)))',
        toolboxBlocks: ['assume', 'subset_intro', 'unfold', 'subset_elim', 'exact'],
        introduction: `# הכלה של קבוצות חזקה

אם A ⊆ B, כל תת־קבוצה של A היא גם תת־קבוצה של B.

הפעם מוכיחים הכלה בין שתי קבוצות של קבוצות. לוקחים איבר של 𝒫(A), והוא קבוצה, ולכן קוראים לו X₀, באות גדולה. מלבד זה ההוכחה כמו כל הכלה: לוקחים איבר, פותחים הגדרות, ומשתמשים בהכלות.`,
        hints: [
            `נניח A ⊆ B, ואחר כך ${SUBSET_INTRO_BLOCK}: יהי X₀ ∈ 𝒫(A) ונוכיח X₀ ∈ 𝒫(B).`,
            'פתחו את ההגדרה בהנחה X₀ ∈ 𝒫(A) (פירושו X₀ ⊆ A), ואחר כך במטרה X₀ ∈ 𝒫(B) (נשאר להוכיח X₀ ⊆ B).',
            `כדי להוכיח X₀ ⊆ B, הוסיפו שוב את הבלוק ${SUBSET_INTRO_BLOCK}: יהי x₀ ∈ X₀.`,
            `השתמשו בשתי ההכלות: לפי X₀ ⊆ A נובע x₀ ∈ A, ולפי A ⊆ B נובע x₀ ∈ B.`,
        ],
        conclusion: `האיברים של קבוצת החזקה הם קבוצות, אבל ההוכחה זהה: לוקחים איבר, פותחים הגדרה, ומשתמשים בהכלות.`,
        startXml: goalXml('((A ⊆ B) → (𝒫(A) ⊆ 𝒫(B)))'),
    }),
    level(3, {
        title: 'הקבוצה הריקה בקבוצת החזקה',
        name: 'unit7_l3_empty_mem_powerset',
        variableLine: SETS,
        params: '',
        proposition: '∅ ∈ 𝒫 A',
        goalLabel: '∅ ∈ 𝒫(A)',
        toolboxBlocks: ['unfold', 'subset_intro', 'exfalso', 'exact'],
        introduction: `# הקבוצה הריקה בקבוצת החזקה

הקבוצה הריקה היא תת־קבוצה של כל קבוצה (יחידה 6, שלב 10), ולכן היא איבר של כל קבוצת חזקה.

פותחים את הגדרת קבוצת החזקה במטרה, ונשארים עם ההכלה ∅ ⊆ A, שכבר הוכחתם פעם.`,
        hints: [
            `גררו את הבלוק ${UNFOLD_BLOCK}, ובחרו בו את המטרה ∅ ∈ 𝒫(A). נשאר להוכיח ∅ ⊆ A.`,
            `יהי x₀ ∈ ∅. פתחו את ההגדרה בהנחה x₀ ∈ ∅: פירושו ⊥.`,
            `הוסיפו את הבלוק "מסתירה נובע הכול, ולכן די להגיע לסתירה". הסתירה כבר בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `∅ ∈ 𝒫(A) לכל קבוצה A: קבוצת החזקה אף פעם לא ריקה.`,
        startXml: goalXml('∅ ∈ 𝒫(A)'),
    }),
    level(4, {
        title: 'איחוד של משפחה',
        name: 'unit7_l4_sunion',
        variableLine: FAMILY,
        params: '(hA : A ∈ F)',
        proposition: 'A ⊆ ⋃₀ F',
        goalLabel: 'A ⊆ ⋃₀ F',
        assumptions: [{ name: 'hA', prop: 'A ∈ F' }],
        toolboxBlocks: ['subset_intro', 'unfold', 'exists_intro', 'and_intro', 'exact'],
        introduction: `# איחוד של משפחה

F היא *משפחה* של קבוצות: קבוצה שהאיברים שלה הם קבוצות. \`⋃₀ F\` הוא האיחוד של כל הקבוצות במשפחה: לפי ההגדרה, \`x₀ ∈ ⋃₀ F\` פירושו שקיימת קבוצה S ב־F כך ש־x₀ ∈ S.

אם A היא אחת הקבוצות במשפחה, היא מוכלת באיחוד. אחרי פתיחת ההגדרה המטרה היא טענת "קיים", כמו ביחידה 4, והעד הוא A עצמה.`,
        newDefinitions: [sUnion],
        hints: [
            `גררו את הבלוק ${SUBSET_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: יהי x₀ ∈ A ונוכיח x₀ ∈ ⋃₀ F.`,
            `הוסיפו את הבלוק ${UNFOLD_BLOCK}, ובחרו בו את המטרה x₀ ∈ ⋃₀ F. נשאר להוכיח ∃S (S ∈ F ∧ x₀ ∈ S).`,
            `הוסיפו את הבלוק ${EXISTS_INTRO_BLOCK}, ובחרו בו את A.`,
            `הוכיחו את ה"וגם" בשני חלקים: בכל חלק, מה שמוכיחים כבר בידינו.`,
        ],
        conclusion: `איחוד של משפחה הוא טענת "קיים", ולכן מוכיחים שייכות אליו בבחירת עד: הקבוצה מהמשפחה שהאיבר שייך אליה.`,
        startXml: goalXml('A ⊆ ⋃₀ F', 'A ∈ F'),
    }),
    level(5, {
        title: 'חיתוך של משפחה',
        name: 'unit7_l5_sinter',
        variableLine: FAMILY,
        params: '(hA : A ∈ F)',
        proposition: '⋂₀ F ⊆ A',
        goalLabel: '⋂₀ F ⊆ A',
        assumptions: [{ name: 'hA', prop: 'A ∈ F' }],
        toolboxBlocks: ['subset_intro', 'unfold', 'forall_elim', 'forward', 'apply_rule', 'exact'],
        introduction: `# חיתוך של משפחה

\`⋂₀ F\` הוא החיתוך של כל הקבוצות במשפחה: לפי ההגדרה, \`x₀ ∈ ⋂₀ F\` פירושו שלכל קבוצה S ב־F מתקיים x₀ ∈ S.

אם A היא אחת הקבוצות במשפחה, החיתוך מוכל בה. אחרי פתיחת ההגדרה יש בידינו טענת "לכל", ומציבים בה את A, כמו ביחידה 4.`,
        newDefinitions: [sInter],
        hints: [
            `גררו את הבלוק ${SUBSET_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: יהי x₀ ∈ ⋂₀ F ונוכיח x₀ ∈ A.`,
            `הוסיפו את הבלוק ${UNFOLD_BLOCK}, ובחרו בו x₀ ∈ ⋂₀ F. עכשיו כתוב בו: פירושו ∀S (S ∈ F → x₀ ∈ S).`,
            `הוסיפו את הבלוק ${FORALL_ELIM_BLOCK}, ובחרו בו את ה"לכל" ואת A. עכשיו כתוב בו: נובע (A ∈ F → x₀ ∈ A).`,
            `הוסיפו את הבלוק "מהגרירה ? ומ־?" עם A ∈ F → x₀ ∈ A ועם A ∈ F. x₀ ∈ A בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
            'או אחורה: לפי הגרירה A ∈ F → x₀ ∈ A, כדי להוכיח x₀ ∈ A די להוכיח A ∈ F, וזה בידינו.',
        ],
        conclusion: `חיתוך של משפחה הוא טענת "לכל", ולכן משתמשים בו בהצבה: כאן הצבתם קבוצה, A.`,
        startXml: goalXml('⋂₀ F ⊆ A', 'A ∈ F'),
    }),
    level(6, {
        title: 'תרגיל מסכם: איחוד מוכל',
        name: 'unit7_l6_sunion_subset',
        variableLine: FAMILY,
        params: '',
        proposition: '(∀ S, S ∈ F → S ⊆ A) → ⋃₀ F ⊆ A',
        goalLabel: '((∀S (S ∈ F → S ⊆ A)) → (⋃₀ F ⊆ A))',
        toolboxBlocks: ['assume', 'subset_intro', 'unfold', 'exists_elim', 'and_elim', 'forall_elim', 'forward', 'subset_elim', 'exact'],
        introduction: `# תרגיל מסכם: איחוד מוכל

אם כל הקבוצות במשפחה מוכלות ב־A, גם האיחוד שלהן מוכל ב־A.

ניקח איבר x₀ של ⋃₀ F. לפי ההגדרה, x₀ שייך לאחת הקבוצות במשפחה, אבל לא ידוע לאיזו: זו טענת "קיים", ולכן נקבל ממנה קבוצה S₀ כזאת, כמו ביחידה 4.
אחר כך מציבים את S₀ בהנחה על כל הקבוצות במשפחה, ומשתמשים בהכלה שמתקבלת.`,
        hints: [
            `נניח את התנאי, ואחר כך ${SUBSET_INTRO_BLOCK}: יהי x₀ ∈ ⋃₀ F ונוכיח x₀ ∈ A.`,
            `פתחו את ההגדרה בהנחה x₀ ∈ ⋃₀ F, ואחר כך ${EXISTS_ELIM_BLOCK} עם ∃S (S ∈ F ∧ x₀ ∈ S): יהי S₀ כך ש־(S₀ ∈ F ∧ x₀ ∈ S₀).`,
            `${AND_ELIM_BLOCK} עם S₀ ∈ F ∧ x₀ ∈ S₀. אחר כך ${FORALL_ELIM_BLOCK} עם ההנחה ועם S₀: נובע (S₀ ∈ F → S₀ ⊆ A).`,
            `מהגרירה S₀ ∈ F → S₀ ⊆ A ומ־S₀ ∈ F נובע S₀ ⊆ A. לבסוף ${SUBSET_ELIM_BLOCK} עם S₀ ⊆ A ועם x₀ ∈ S₀.`,
        ],
        conclusion: `סיימתם את יחידה 7! בהוכחה השתמשתם בכל הכלים: הכלה, הגדרות, "קיים", "לכל" וגרירה, והפעם העצמים היו קבוצות.`,
        startXml: goalXml('((∀S (S ∈ F → S ⊆ A)) → (⋃₀ F ⊆ A))'),
    }),
];
