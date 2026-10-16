import { goalXml } from '../game/levelXml';

// Unit 5 of the handwritten version (see blocks.js): sets, as in Logic and
// Proof (chapters 11 and 12) and Mathematics in Lean (4.1). An inclusion is
// proved by taking an arbitrary element ("יהי x₀ ∈ A") and used by its
// element; an equality is two inclusions; and membership in a set built by an
// operation is read by its definition ("לפי הגדרת החיתוך, x₀ ∈ A ∩ B פירושו
// x₀ ∈ A ∧ x₀ ∈ B"), one move for all the operations, which names the
// definition it used. After that the moves of units 1-4 do the rest. Each
// level offers only the moves of its solution.

export const unit5WorldName = 'יחידה 5 - קבוצות';

const SETS = 'variable {obj : Type} {A B C : Set obj}';
const FAMILY = 'variable {obj : Type} {A : Set obj} {F : Set (Set obj)}';

// The moves as the toolbox shows them, before they are placed.
const SUBSET_INTRO_BLOCK = '"כדי להוכיח הכלה: יהי איבר של הקבוצה המוכלת, ונוכיח שהוא שייך לקבוצה המכילה"';
const SUBSET_ELIM_BLOCK = '"לפי ההכלה ? ומ־?"';
const SET_EQ_BLOCK = '"כדי להוכיח שוויון קבוצות, נוכיח שתי הכלות"';
const UNFOLD_BLOCK = '"לפי ההגדרה, ?"';
const ASSUME_BLOCK = '"כדי להוכיח את הגרירה, נניח..."';
const AND_ELIM_BLOCK = '"מה"וגם" ?"';
const AND_INTRO_BLOCK = '"כדי להוכיח את ה"וגם", נוכיח כל צד לחוד"';
const OR_INTRO_BLOCK = '"כדי להוכיח את ה"או" די להוכיח את ?"';
const OR_ELIM_BLOCK = '"נחלק למקרים לפי ה"או" ?"';
const CLOSE_BLOCK = '"יש לנו ביד בדיוק את מה שאנחנו רוצים להוכיח."';

const subsetElimInfo = {
    name: 'שימוש בהכלה',
    doc: 'A ⊆ B אומרת שכל איבר של A הוא גם איבר של B. לכן מ־A ⊆ B ומ־x₀ ∈ A נובע x₀ ∈ B. בכתב יד: "לפי ההכלה A ⊆ B, מ־x₀ ∈ A נובע x₀ ∈ B".',
};
const subsetIntroInfo = {
    name: 'הוכחת הכלה',
    doc: 'כדי להוכיח A ⊆ B לוקחים איבר שרירותי x₀ של A, ומוכיחים ש־x₀ ∈ B. בכתב יד: "יהי x₀ ∈ A; נוכיח x₀ ∈ B".',
};
const unfoldInfo = {
    name: 'לפי ההגדרה',
    doc: 'שייכות לקבוצה שנבנתה בפעולה פירושה טענה לוגית, לפי הגדרת הפעולה. בוחרים בבלוק את טענת השייכות, מהמטרה או ממה שבידינו, והבלוק כותב לפי איזו הגדרה ומה היא אומרת.',
};
const setEqInfo = {
    name: 'שוויון קבוצות',
    doc: 'שתי קבוצות שוות אם כל אחת מוכלת בשנייה: מוכיחים A ⊆ B וגם B ⊆ A, כל הכלה בחלק משלה.',
};

const inter = { symbol: 'חיתוך', doc: 'x₀ ∈ A ∩ B פירושו x₀ ∈ A ∧ x₀ ∈ B.' };
const union = { symbol: 'איחוד', doc: 'x₀ ∈ A ∪ B פירושו x₀ ∈ A ∨ x₀ ∈ B.' };
const compl = { symbol: 'משלים', doc: 'x₀ ∈ Aᶜ פירושו ¬x₀ ∈ A: האיבר לא שייך ל־A.' };
const diff = { symbol: 'הפרש', doc: 'x₀ ∈ A \\ B פירושו x₀ ∈ A ∧ ¬x₀ ∈ B.' };
const empty = { symbol: 'הקבוצה הריקה', doc: 'x₀ ∈ ∅ פירושו סתירה (⊥): אין אף איבר בקבוצה הריקה.' };
const powerset = { symbol: 'קבוצת החזקה', doc: 'X₀ ∈ 𝒫 A פירושו X₀ ⊆ A: האיברים של קבוצת החזקה הם תתי־הקבוצות של A.' };
const sUnion = { symbol: 'איחוד של משפחה', doc: 'x₀ ∈ ⋃₀ F פירושו ∃S (S ∈ F ∧ x₀ ∈ S): x₀ שייך לאחת הקבוצות במשפחה.' };
const sInter = { symbol: 'חיתוך של משפחה', doc: 'x₀ ∈ ⋂₀ F פירושו ∀S (S ∈ F → x₀ ∈ S): x₀ שייך לכל הקבוצות במשפחה.' };

const level = (number, fields) => ({
    id: `hw-unit5-${number}`,
    levelNumber: number,
    totalLevels: 14,
    usesSets: true,
    objects: [],
    assumptions: [],
    newTacticsBlocks: [],
    newTacticsInfo: [],
    newDefinitions: [],
    ...fields,
});

export const unit5Levels = [
    level(1, {
        title: 'משתמשים בהכלה',
        name: 'hw_unit5_l1_subset_elim',
        variableLine: SETS,
        params: '(x₀ : obj) (h : A ⊆ B) (hx : x₀ ∈ A)',
        proposition: 'x₀ ∈ B',
        goalLabel: 'x₀ ∈ B',
        objects: [{ name: 'x₀', type: 'obj' }],
        assumptions: [{ name: 'h', prop: 'A ⊆ B' }, { name: 'hx', prop: 'x₀ ∈ A' }],
        toolboxBlocks: ['hw_subset_elim', 'hw_exact'],
        introduction: `# קבוצות והכלה

*קבוצה* היא אוסף של עצמים מהתחום, ו־\`x₀ ∈ A\` אומרת ש־x₀ *שייך* ל־A. למשל: A היא קבוצת הסטודנטים שעברו את הבוחן, ו־B קבוצת הסטודנטים שרשאים לגשת למבחן.

\`A ⊆ B\` נקראת "A מוכלת ב־B": כל איבר של A הוא גם איבר של B.

כאן נתון ש־A ⊆ B וש־x₀ ∈ A, והמטרה היא x₀ ∈ B. בכתב יד: "לפי ההכלה A ⊆ B, מ־x₀ ∈ A נובע x₀ ∈ B".
הבלוק ${SUBSET_ELIM_BLOCK} עושה זאת: בוחרים בו את ההכלה ואת השייכות.`,
        newTacticsBlocks: ['hw_subset_elim'],
        newTacticsInfo: [subsetElimInfo],
        hints: [
            `גררו את הבלוק ${SUBSET_ELIM_BLOCK} אל תוך בלוק המטרה, ובחרו בו A ⊆ B ואת x₀ ∈ A. עכשיו כתוב בו: נובע x₀ ∈ B.`,
            `x₀ ∈ B בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `מההכלה ומהשייכות ל־A הסקתם את השייכות ל־B: מה שנכון לכל איבר של A נכון גם ל־x₀.`,
        startXml: goalXml('x₀ ∈ B', 'A ⊆ B,  x₀ ∈ A'),
    }),
    level(2, {
        title: 'מוכיחים הכלה',
        name: 'hw_unit5_l2_subset_trans',
        variableLine: SETS,
        params: '',
        proposition: '(A ⊆ B) → ((B ⊆ C) → (A ⊆ C))',
        goalLabel: '((A ⊆ B) → ((B ⊆ C) → (A ⊆ C)))',
        toolboxBlocks: ['hw_assume', 'hw_subset_intro', 'hw_subset_elim', 'hw_exact'],
        introduction: `# מוכיחים הכלה

אם A מוכלת ב־B ו־B מוכלת ב־C, אז A מוכלת ב־C.

כדי להוכיח \`A ⊆ C\` לוקחים איבר *שרירותי* x₀ של A, ומוכיחים שהוא שייך ל־C. כמו ביחידה 4, מה שהוכח לאיבר שרירותי נכון לכל איבר.
בכתב יד: "יהי x₀ ∈ A; נוכיח x₀ ∈ C". הבלוק ${SUBSET_INTRO_BLOCK} עושה זאת: העצם x₀ וההנחה x₀ ∈ A מצטרפים למה שבידינו.

אחרי זה משתמשים בשתי ההכלות, אחת אחרי השנייה, כמו בשלב 1.`,
        newTacticsBlocks: ['hw_subset_intro'],
        newTacticsInfo: [subsetIntroInfo],
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה, והוסיפו אחריו עוד אחד כזה. עכשיו המטרה היא A ⊆ C.`,
            `הוסיפו את הבלוק ${SUBSET_INTRO_BLOCK}. עכשיו כתוב בו: יהי x₀ ∈ A ונוכיח x₀ ∈ C.`,
            `הוסיפו את הבלוק ${SUBSET_ELIM_BLOCK} עם A ⊆ B ועם x₀ ∈ A, ואחריו עוד אחד כזה עם B ⊆ C ועם x₀ ∈ B.`,
            `x₀ ∈ C בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "נניח A ⊆ B ונניח B ⊆ C. יהי x₀ ∈ A. לפי A ⊆ B נובע x₀ ∈ B, ולפי B ⊆ C נובע x₀ ∈ C."`,
        startXml: goalXml('((A ⊆ B) → ((B ⊆ C) → (A ⊆ C)))'),
    }),
    level(3, {
        title: 'חיתוך',
        name: 'hw_unit5_l3_inter_subset',
        variableLine: SETS,
        params: '',
        proposition: 'A ∩ B ⊆ A',
        goalLabel: 'A ∩ B ⊆ A',
        toolboxBlocks: ['hw_subset_intro', 'hw_unfold', 'hw_and_elim', 'hw_exact'],
        introduction: `# חיתוך

\`A ∩ B\` הוא *החיתוך* של A ו־B: האיברים ששייכים לשתיהן. לפי ההגדרה, \`x₀ ∈ A ∩ B\` פירושו \`x₀ ∈ A ∧ x₀ ∈ B\`.

הבלוק ${UNFOLD_BLOCK} משתמש בהגדרה: בוחרים בו טענת שייכות, והוא כותב לפי איזו הגדרה ומה היא אומרת. מה שהיא אומרת מצטרף למה שבידינו.
אחרי פתיחת ההגדרה נשארת טענת "וגם", ומשתמשים בה כמו ביחידה 2.`,
        newTacticsBlocks: ['hw_unfold'],
        newTacticsInfo: [unfoldInfo],
        newDefinitions: [inter],
        hints: [
            `גררו את הבלוק ${SUBSET_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: יהי x₀ ∈ A ∩ B ונוכיח x₀ ∈ A.`,
            `הוסיפו את הבלוק ${UNFOLD_BLOCK}, ובחרו בו x₀ ∈ A ∩ B. עכשיו כתוב בו: לפי הגדרת החיתוך, פירושו (x₀ ∈ A ∧ x₀ ∈ B).`,
            `הוסיפו את הבלוק ${AND_ELIM_BLOCK}, ובחרו בו x₀ ∈ A ∧ x₀ ∈ B. עכשיו x₀ ∈ A בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "יהי x₀ ∈ A ∩ B. לפי הגדרת החיתוך, x₀ ∈ A ∧ x₀ ∈ B, ולכן x₀ ∈ A."`,
        startXml: goalXml('A ∩ B ⊆ A'),
    }),
    level(4, {
        title: 'איחוד',
        name: 'hw_unit5_l4_subset_union',
        variableLine: SETS,
        params: '',
        proposition: 'A ⊆ A ∪ B',
        goalLabel: 'A ⊆ A ∪ B',
        toolboxBlocks: ['hw_subset_intro', 'hw_unfold', 'hw_or_intro', 'hw_exact'],
        introduction: `# איחוד

\`A ∪ B\` הוא *האיחוד* של A ו־B: האיברים ששייכים לפחות לאחת מהן. לפי ההגדרה, \`x₀ ∈ A ∪ B\` פירושו \`x₀ ∈ A ∨ x₀ ∈ B\`.

הפעם משתמשים בהגדרה על *המטרה*: בוחרים בבלוק ${UNFOLD_BLOCK} את המטרה, x₀ ∈ A ∪ B, ומה שהיא אומרת הופך למה שנשאר להוכיח.`,
        newDefinitions: [union],
        hints: [
            `גררו את הבלוק ${SUBSET_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: יהי x₀ ∈ A ונוכיח x₀ ∈ A ∪ B.`,
            `הוסיפו את הבלוק ${UNFOLD_BLOCK}, ובחרו בו את המטרה x₀ ∈ A ∪ B. עכשיו כתוב בו: לפי הגדרת האיחוד, כלומר, נוכיח (x₀ ∈ A ∨ x₀ ∈ B).`,
            `הוסיפו את הבלוק ${OR_INTRO_BLOCK}, ובחרו בו x₀ ∈ A. היא בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "יהי x₀ ∈ A. לפי הגדרת האיחוד, די להוכיח x₀ ∈ A ∨ x₀ ∈ B, ודי להוכיח x₀ ∈ A."`,
        startXml: goalXml('A ⊆ A ∪ B'),
    }),
    level(5, {
        title: 'הכלה של איחוד',
        name: 'hw_unit5_l5_union_subset',
        variableLine: SETS,
        params: '(h1 : A ⊆ C) (h2 : B ⊆ C)',
        proposition: 'A ∪ B ⊆ C',
        goalLabel: 'A ∪ B ⊆ C',
        assumptions: [{ name: 'h1', prop: 'A ⊆ C' }, { name: 'h2', prop: 'B ⊆ C' }],
        toolboxBlocks: ['hw_subset_intro', 'hw_unfold', 'hw_or_elim', 'hw_subset_elim', 'hw_exact'],
        introduction: `# הכלה של איחוד

אם A ו־B מוכלות שתיהן ב־C, גם האיחוד שלהן מוכל ב־C.

ניקח איבר x₀ של A ∪ B. לפי הגדרת האיחוד, x₀ ∈ A או x₀ ∈ B, ולכן נחלק למקרים, כמו ביחידה 2. בכל מקרה משתמשים בהכלה המתאימה.`,
        hints: [
            `גררו את הבלוק ${SUBSET_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: יהי x₀ ∈ A ∪ B ונוכיח x₀ ∈ C.`,
            `הוסיפו את הבלוק ${UNFOLD_BLOCK}, ובחרו בו x₀ ∈ A ∪ B. עכשיו כתוב בו: פירושו (x₀ ∈ A ∨ x₀ ∈ B).`,
            `הוסיפו את הבלוק ${OR_ELIM_BLOCK}, ובחרו בו x₀ ∈ A ∨ x₀ ∈ B.`,
            `במקרה הראשון: ${SUBSET_ELIM_BLOCK} עם A ⊆ C ועם x₀ ∈ A, ואחריו ${CLOSE_BLOCK}. במקרה השני: אותו דבר עם B ⊆ C ועם x₀ ∈ B.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "יהי x₀ ∈ A ∪ B, כלומר x₀ ∈ A או x₀ ∈ B. במקרה הראשון, לפי A ⊆ C, x₀ ∈ C. במקרה השני, לפי B ⊆ C, x₀ ∈ C."`,
        startXml: goalXml('A ∪ B ⊆ C', 'A ⊆ C,  B ⊆ C'),
    }),
    level(6, {
        title: 'שוויון קבוצות',
        name: 'hw_unit5_l6_inter_comm',
        variableLine: SETS,
        params: '',
        proposition: 'A ∩ B = B ∩ A',
        goalLabel: 'A ∩ B = B ∩ A',
        toolboxBlocks: ['hw_set_eq', 'hw_subset_intro', 'hw_unfold', 'hw_and_elim', 'hw_and_intro', 'hw_and_combine', 'hw_exact'],
        introduction: `# שוויון קבוצות

שתי קבוצות *שוות* אם יש להן אותם איברים, כלומר אם כל אחת מוכלת בשנייה.
לכן כדי להוכיח \`A ∩ B = B ∩ A\` מוכיחים שתי הכלות, כל אחת בחלק משלה. הבלוק ${SET_EQ_BLOCK} עושה זאת.

בכל הכלה לוקחים איבר, פותחים את הגדרת החיתוך בהנחה ובמטרה, ומשתמשים ב"וגם" כמו ביחידה 2.`,
        newTacticsBlocks: ['hw_set_eq'],
        newTacticsInfo: [setEqInfo],
        hints: [
            `גררו את הבלוק ${SET_EQ_BLOCK} אל תוך בלוק המטרה. בראש החלקים כתוב: נוכיח A ∩ B ⊆ B ∩ A, ונוכיח B ∩ A ⊆ A ∩ B.`,
            `בחלק הראשון: יהי x₀ ∈ A ∩ B. פתחו את ההגדרה בהנחה x₀ ∈ A ∩ B, ובחרו ב${AND_ELIM_BLOCK} את מה שהיא אומרת.`,
            `עכשיו פתחו את ההגדרה במטרה x₀ ∈ B ∩ A, והוכיחו את ה"וגם" ב${AND_INTRO_BLOCK}: בכל צד, מה שמוכיחים כבר בידינו.`,
            'החלק השני זהה, עם A ו־B בתפקידים הפוכים.',
            'או קדימה, במקום להוכיח את ה"וגם" בשני חלקים: מ־x₀ ∈ B ומ־x₀ ∈ A נובע (x₀ ∈ B ∧ x₀ ∈ A), וזו המטרה.',
        ],
        conclusion: `שתי ההכלות הוכחו, ולכן A ∩ B = B ∩ A: לחיתוך לא משנה הסדר.`,
        startXml: goalXml('A ∩ B = B ∩ A'),
    }),
    level(7, {
        title: 'פילוג',
        name: 'hw_unit5_l7_distrib',
        variableLine: SETS,
        params: '',
        proposition: 'A ∩ (B ∪ C) ⊆ (A ∩ B) ∪ (A ∩ C)',
        goalLabel: 'A ∩ (B ∪ C) ⊆ (A ∩ B) ∪ (A ∩ C)',
        toolboxBlocks: ['hw_subset_intro', 'hw_unfold', 'hw_and_elim', 'hw_or_elim', 'hw_or_intro', 'hw_and_intro', 'hw_exact'],
        introduction: `# פילוג

החיתוך מתפלג על האיחוד: איבר של A ∩ (B ∪ C) שייך ל־A ∩ B או ל־A ∩ C.

פותחים את ההגדרות שבהנחה עד שמגיעים ל"וגם" ול"או", ואת ההגדרה של המטרה. אחר כך מחלקים למקרים לפי "x₀ ∈ B או x₀ ∈ C", ובכל מקרה בוחרים את הצד המתאים של המטרה.`,
        hints: [
            `יהי x₀ ∈ A ∩ (B ∪ C). פתחו את הגדרת החיתוך בהנחה, ומה"וגם" נובע x₀ ∈ A ונובע x₀ ∈ B ∪ C. פתחו גם את הגדרת האיחוד ב־x₀ ∈ B ∪ C.`,
            `פתחו את ההגדרה במטרה, x₀ ∈ (A ∩ B) ∪ (A ∩ C): נשאר להוכיח (x₀ ∈ A ∩ B ∨ x₀ ∈ A ∩ C).`,
            `חלקו למקרים לפי x₀ ∈ B ∨ x₀ ∈ C. במקרה הראשון בחרו להוכיח x₀ ∈ A ∩ B, פתחו את ההגדרה, והוכיחו את ה"וגם" בשני חלקים.`,
            'המקרה השני דומה, עם x₀ ∈ A ∩ C.',
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "יהי x₀ ∈ A ∩ (B ∪ C), כלומר x₀ ∈ A, ו־x₀ ∈ B או x₀ ∈ C. במקרה ש־x₀ ∈ B, x₀ ∈ A ∩ B; במקרה ש־x₀ ∈ C, x₀ ∈ A ∩ C."`,
        startXml: goalXml('A ∩ (B ∪ C) ⊆ (A ∩ B) ∪ (A ∩ C)'),
    }),
    level(8, {
        title: 'משלים',
        name: 'hw_unit5_l8_compl',
        variableLine: SETS,
        params: '',
        proposition: '(A ⊆ B) → (Bᶜ ⊆ Aᶜ)',
        goalLabel: '((A ⊆ B) → (Bᶜ ⊆ Aᶜ))',
        toolboxBlocks: ['hw_assume', 'hw_subset_intro', 'hw_unfold', 'hw_not_intro', 'hw_subset_elim', 'hw_contradiction'],
        introduction: `# משלים

\`Aᶜ\` הוא *המשלים* של A: האיברים בתחום שלא שייכים ל־A. לפי ההגדרה, \`x₀ ∈ Aᶜ\` פירושו \`¬x₀ ∈ A\`.

אם A ⊆ B, אז מי שלא שייך ל־B גם לא שייך ל־A. אחרי פתיחת ההגדרות המטרה היא שלילה, ולכן מניחים ומגיעים לסתירה, כמו ביחידה 3.`,
        newDefinitions: [compl],
        hints: [
            `נניח A ⊆ B, ואחר כך ${SUBSET_INTRO_BLOCK}: יהי x₀ ∈ Bᶜ ונוכיח x₀ ∈ Aᶜ.`,
            `פתחו את ההגדרה בהנחה x₀ ∈ Bᶜ (פירושו ¬x₀ ∈ B), ואחר כך במטרה x₀ ∈ Aᶜ (נשאר להוכיח ¬x₀ ∈ A).`,
            'כדי להוכיח ¬x₀ ∈ A, נניח x₀ ∈ A ונגיע לסתירה.',
            `לפי ההכלה A ⊆ B, מ־x₀ ∈ A נובע x₀ ∈ B. יש לנו ביד את x₀ ∈ B ואת השלילה שלה.`,
        ],
        conclusion: `מ־A ⊆ B נובע Bᶜ ⊆ Aᶜ: המשלים הופך את כיוון ההכלה.`,
        startXml: goalXml('((A ⊆ B) → (Bᶜ ⊆ Aᶜ))'),
    }),
    level(9, {
        title: 'הפרש',
        name: 'hw_unit5_l9_diff',
        variableLine: SETS,
        params: '',
        proposition: 'A \\ B ⊆ A ∩ Bᶜ',
        goalLabel: 'A \\ B ⊆ A ∩ Bᶜ',
        toolboxBlocks: ['hw_subset_intro', 'hw_unfold', 'hw_and_elim', 'hw_and_intro', 'hw_exact'],
        introduction: `# הפרש

\`A \\ B\` הוא *ההפרש* של A ו־B: האיברים של A שלא שייכים ל־B. לפי ההגדרה, \`x₀ ∈ A \\ B\` פירושו \`x₀ ∈ A ∧ ¬x₀ ∈ B\`.

נראה שההפרש מוכל בחיתוך של A עם המשלים של B. בהוכחה פותחים שלוש הגדרות: הפרש, חיתוך ומשלים.`,
        newDefinitions: [diff],
        hints: [
            `יהי x₀ ∈ A \\ B. פתחו את ההגדרה בהנחה, ומה"וגם" נובע x₀ ∈ A ונובע ¬x₀ ∈ B.`,
            `פתחו את ההגדרה במטרה, x₀ ∈ A ∩ Bᶜ, והוכיחו את ה"וגם" בשני חלקים.`,
            'בחלק השני המטרה היא x₀ ∈ Bᶜ: פתחו את ההגדרה גם בה. נשאר להוכיח ¬x₀ ∈ B, וזה בידינו.',
        ],
        conclusion: `"באחת ולא בשנייה" אפשר לכתוב כהפרש, או כחיתוך עם המשלים.`,
        startXml: goalXml('A \\ B ⊆ A ∩ Bᶜ'),
    }),
    level(10, {
        title: 'הקבוצה הריקה',
        name: 'hw_unit5_l10_empty',
        variableLine: SETS,
        params: '',
        proposition: '∅ ⊆ A',
        goalLabel: '∅ ⊆ A',
        toolboxBlocks: ['hw_subset_intro', 'hw_unfold', 'hw_exfalso', 'hw_exact'],
        introduction: `# הקבוצה הריקה

\`∅\` היא *הקבוצה הריקה*: אין בה אף איבר. לפי ההגדרה, \`x₀ ∈ ∅\` פירושו סתירה (⊥).

הקבוצה הריקה מוכלת בכל קבוצה. ניקח איבר שלה, אבל אין כזה: ההנחה עליו היא סתירה, ומסתירה נובע הכול (יחידה 3).`,
        newDefinitions: [empty],
        hints: [
            `גררו את הבלוק ${SUBSET_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: יהי x₀ ∈ ∅ ונוכיח x₀ ∈ A.`,
            `הוסיפו את הבלוק ${UNFOLD_BLOCK}, ובחרו בו x₀ ∈ ∅. עכשיו כתוב בו: לפי הגדרת הקבוצה הריקה, פירושו ⊥.`,
            `הוסיפו את הבלוק "מסתירה נובע הכול, ולכן די להגיע לסתירה". הסתירה כבר בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `∅ מוכלת בכל קבוצה, כי אין בה איבר שיכול להפריך את ההכלה. זה נובע מ"מסתירה נובע הכול".`,
        startXml: goalXml('∅ ⊆ A'),
    }),
    level(11, {
        title: 'קבוצת החזקה',
        name: 'hw_unit5_l11_powerset',
        variableLine: SETS,
        params: '',
        proposition: '(A ⊆ B) → (𝒫 A ⊆ 𝒫 B)',
        goalLabel: '((A ⊆ B) → (𝒫(A) ⊆ 𝒫(B)))',
        toolboxBlocks: ['hw_assume', 'hw_subset_intro', 'hw_unfold', 'hw_subset_elim', 'hw_exact'],
        introduction: `# קבוצת החזקה

\`𝒫 A\` היא *קבוצת החזקה* של A: הקבוצה שהאיברים שלה הם כל תתי־הקבוצות של A. לפי ההגדרה, \`X₀ ∈ 𝒫 A\` פירושו \`X₀ ⊆ A\`.

אם A ⊆ B, כל תת־קבוצה של A היא גם תת־קבוצה של B. האיברים כאן הם קבוצות, ולכן לאיבר קוראים X₀, באות גדולה, אבל ההוכחה כמו כל הכלה: לוקחים איבר, פותחים הגדרות, ומשתמשים בהכלות.`,
        newDefinitions: [powerset],
        hints: [
            `נניח A ⊆ B, ואחר כך ${SUBSET_INTRO_BLOCK}: יהי X₀ ∈ 𝒫 A ונוכיח X₀ ∈ 𝒫 B.`,
            'פתחו את ההגדרה בהנחה X₀ ∈ 𝒫 A (פירושו X₀ ⊆ A), ואחר כך במטרה X₀ ∈ 𝒫 B (נשאר להוכיח X₀ ⊆ B).',
            `כדי להוכיח X₀ ⊆ B, הוסיפו שוב את הבלוק ${SUBSET_INTRO_BLOCK}: יהי x₀ ∈ X₀.`,
            `השתמשו בשתי ההכלות: לפי X₀ ⊆ A נובע x₀ ∈ A, ולפי A ⊆ B נובע x₀ ∈ B.`,
        ],
        conclusion: `האיברים של קבוצת החזקה הם קבוצות, אבל ההוכחה זהה: לוקחים איבר, פותחים הגדרה, ומשתמשים בהכלות.`,
        startXml: goalXml('((A ⊆ B) → (𝒫(A) ⊆ 𝒫(B)))'),
    }),
    level(12, {
        title: 'איחוד של משפחה',
        name: 'hw_unit5_l12_sunion',
        variableLine: FAMILY,
        params: '(hA : A ∈ F)',
        proposition: 'A ⊆ ⋃₀ F',
        goalLabel: 'A ⊆ ⋃₀ F',
        assumptions: [{ name: 'hA', prop: 'A ∈ F' }],
        toolboxBlocks: ['hw_subset_intro', 'hw_unfold', 'hw_exists_intro', 'hw_and_intro', 'hw_exact'],
        introduction: `# איחוד של משפחה

F היא *משפחה* של קבוצות: קבוצה שהאיברים שלה הם קבוצות. \`⋃₀ F\` הוא האיחוד של כל הקבוצות במשפחה: לפי ההגדרה, \`x₀ ∈ ⋃₀ F\` פירושו שקיימת קבוצה S ב־F כך ש־x₀ ∈ S.

אם A היא אחת הקבוצות במשפחה, היא מוכלת באיחוד. אחרי פתיחת ההגדרה המטרה היא טענת "קיים", כמו ביחידה 4, והעד הוא A עצמה.`,
        newDefinitions: [sUnion],
        hints: [
            `גררו את הבלוק ${SUBSET_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: יהי x₀ ∈ A ונוכיח x₀ ∈ ⋃₀ F.`,
            `הוסיפו את הבלוק ${UNFOLD_BLOCK}, ובחרו בו את המטרה x₀ ∈ ⋃₀ F. נשאר להוכיח ∃S (S ∈ F ∧ x₀ ∈ S).`,
            'הוסיפו את הבלוק "כדי להוכיח "קיים" נבחר את העצם ?", ובחרו בו את A.',
            `הוכיחו את ה"וגם" בשני חלקים: בכל חלק, מה שמוכיחים כבר בידינו.`,
        ],
        conclusion: `איחוד של משפחה הוא טענת "קיים", ולכן מוכיחים שייכות אליו בבחירת עד: הקבוצה מהמשפחה שהאיבר שייך אליה.`,
        startXml: goalXml('A ⊆ ⋃₀ F', 'A ∈ F'),
    }),
    level(13, {
        title: 'חיתוך של משפחה',
        name: 'hw_unit5_l13_sinter',
        variableLine: FAMILY,
        params: '(hA : A ∈ F)',
        proposition: '⋂₀ F ⊆ A',
        goalLabel: '⋂₀ F ⊆ A',
        assumptions: [{ name: 'hA', prop: 'A ∈ F' }],
        toolboxBlocks: ['hw_subset_intro', 'hw_unfold', 'hw_forall_elim', 'hw_forward', 'hw_apply_rule', 'hw_exact'],
        introduction: `# חיתוך של משפחה

\`⋂₀ F\` הוא החיתוך של כל הקבוצות במשפחה: לפי ההגדרה, \`x₀ ∈ ⋂₀ F\` פירושו שלכל קבוצה S ב־F מתקיים x₀ ∈ S.

אם A היא אחת הקבוצות במשפחה, החיתוך מוכל בה. אחרי פתיחת ההגדרה יש בידינו טענת "לכל", ומציבים בה את A, כמו ביחידה 4.`,
        newDefinitions: [sInter],
        hints: [
            `גררו את הבלוק ${SUBSET_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: יהי x₀ ∈ ⋂₀ F ונוכיח x₀ ∈ A.`,
            `הוסיפו את הבלוק ${UNFOLD_BLOCK}, ובחרו בו x₀ ∈ ⋂₀ F. עכשיו כתוב בו: פירושו ∀S (S ∈ F → x₀ ∈ S).`,
            'הוסיפו את הבלוק "לפי ה"לכל" ? עבור העצם ?", ובחרו בו את ה"לכל" ואת A. עכשיו כתוב בו: נובע (A ∈ F → x₀ ∈ A).',
            `הוסיפו את הבלוק "מהגרירה ? ומ־?" עם A ∈ F → x₀ ∈ A ועם A ∈ F. x₀ ∈ A בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
            'או אחורה: לפי הגרירה A ∈ F → x₀ ∈ A, כדי להוכיח x₀ ∈ A די להוכיח A ∈ F, וזה בידינו.',
        ],
        conclusion: `חיתוך של משפחה הוא טענת "לכל", ולכן משתמשים בו בהצבה: כאן הצבתם קבוצה, A.`,
        startXml: goalXml('⋂₀ F ⊆ A', 'A ∈ F'),
    }),
    level(14, {
        title: 'שלב בונוס: חוק דה מורגן לקבוצות',
        name: 'hw_unit5_l14_de_morgan',
        variableLine: SETS,
        params: '',
        proposition: '(A ∪ B)ᶜ = Aᶜ ∩ Bᶜ',
        goalLabel: '(A ∪ B)ᶜ = Aᶜ ∩ Bᶜ',
        toolboxBlocks: ['hw_set_eq', 'hw_subset_intro', 'hw_unfold', 'hw_and_intro', 'hw_and_elim', 'hw_not_intro', 'hw_not_elim', 'hw_or_intro', 'hw_or_elim', 'hw_contradiction', 'hw_exact'],
        introduction: `# בונוס: חוק דה מורגן לקבוצות

המשלים של איחוד הוא החיתוך של המשלימים: מי שלא שייך ל־A ∪ B לא שייך ל־A וגם לא ל־B, ולהפך.

זה חוק דה מורגן של יחידה 3, בשפת הקבוצות: אחרי פתיחת ההגדרות נשארת ההוכחה של ¬(P ∨ Q) ↔ ¬P ∧ ¬Q. מוכיחים שתי הכלות.`,
        hints: [
            `גררו את הבלוק ${SET_EQ_BLOCK} אל תוך בלוק המטרה, ובכל חלק קחו איבר x₀ ופתחו את ההגדרות.`,
            'בהכלה הראשונה: מ־x₀ ∈ (A ∪ B)ᶜ נובע ¬x₀ ∈ A ∪ B. המטרה x₀ ∈ Aᶜ ∩ Bᶜ היא "וגם" של שתי שלילות: בכל אחת נניח ונגיע לסתירה בעזרת ¬x₀ ∈ A ∪ B.',
            'בהכלה השנייה: מ־x₀ ∈ Aᶜ ∩ Bᶜ נובעים ¬x₀ ∈ A ו־¬x₀ ∈ B. המטרה x₀ ∈ (A ∪ B)ᶜ היא שלילה: נניח x₀ ∈ A ∪ B, פתחו את ההגדרה, וחלקו למקרים.',
        ],
        conclusion: `סיימתם את יחידה 5, כולל שלב הבונוס! אחרי פתיחת ההגדרות, כל הוכחה על קבוצות היא הוכחה לוגית מוכרת.`,
        startXml: goalXml('(A ∪ B)ᶜ = Aᶜ ∩ Bᶜ'),
    }),
];
