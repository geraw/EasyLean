import { goalXml } from './levelXml';

// Unit 6 (see blocks/moves.js): sets of objects, as in
// Logic and Proof (chapters 11 and 12) and Mathematics in Lean (4.1); sets
// of sets (power sets, families) are unit 7. An inclusion is
// proved by taking an arbitrary element ("יהי x₀ ∈ A") and used by its
// element; an equality is two inclusions; and membership in a set built by an
// operation is read by its definition ("לפי הגדרת החיתוך, x₀ ∈ (A ∩ B) פירושו
// x₀ ∈ A ∧ x₀ ∈ B"), one move for all the operations, which names the
// definition it used. After that the moves of units 1-4 do the rest. Each
// level offers only the moves of its solution.

export const unit6WorldName = 'יחידה 6 - קבוצות';

const SETS = 'variable {obj : Type} {A B C : Set obj}';

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
    doc: 'A ⊆ B אומרת שכל איבר של A הוא גם איבר של B. לכן מ־A ⊆ B ומ־x₀ ∈ A נובע x₀ ∈ B. בהוכחה כתובה: "לפי ההכלה A ⊆ B, מ־x₀ ∈ A נובע x₀ ∈ B".',
};
const subsetIntroInfo = {
    name: 'הוכחת הכלה',
    doc: 'כדי להוכיח A ⊆ B לוקחים איבר שרירותי x₀ של A, ומוכיחים ש־x₀ ∈ B. בהוכחה כתובה: "יהי x₀ ∈ A; נוכיח x₀ ∈ B".',
};
const unfoldInfo = {
    name: 'לפי ההגדרה',
    doc: 'שייכות לקבוצה שנבנתה בפעולה פירושה טענה לוגית, לפי הגדרת הפעולה. בוחרים בבלוק את טענת השייכות, מהמטרה או ממה שבידינו, והבלוק כותב לפי איזו הגדרה ומה היא אומרת.',
};
const setEqInfo = {
    name: 'שוויון קבוצות',
    doc: 'שתי קבוצות שוות אם כל אחת מוכלת בשנייה: מוכיחים A ⊆ B וגם B ⊆ A, כל הכלה בחלק משלה.',
};

const inter = { symbol: 'חיתוך', doc: 'x₀ ∈ (A ∩ B) פירושו x₀ ∈ A ∧ x₀ ∈ B.' };
const union = { symbol: 'איחוד', doc: 'x₀ ∈ (A ∪ B) פירושו x₀ ∈ A ∨ x₀ ∈ B.' };
const diff = { symbol: 'הפרש', doc: 'x₀ ∈ (A \\ B) פירושו x₀ ∈ A ∧ ¬x₀ ∈ B.' };
const empty = { symbol: 'הקבוצה הריקה', doc: 'x₀ ∈ ∅ פירושו סתירה (⊥): אין אף איבר בקבוצה הריקה.' };

const level = (number, fields) => ({
    id: `unit6-${number}`,
    levelNumber: number,
    totalLevels: 11,
    usesSets: true,
    objects: [],
    assumptions: [],
    newTacticsBlocks: [],
    newTacticsInfo: [],
    newDefinitions: [],
    ...fields,
});

export const unit6Levels = [
    level(1, {
        title: 'משתמשים בהכלה',
        name: 'unit6_l1_subset_elim',
        variableLine: SETS,
        params: '(x₀ : obj) (h : A ⊆ B) (hx : x₀ ∈ A)',
        proposition: 'x₀ ∈ B',
        goalLabel: 'x₀ ∈ B',
        objects: [{ name: 'x₀', type: 'obj' }],
        assumptions: [{ name: 'h', prop: 'A ⊆ B' }, { name: 'hx', prop: 'x₀ ∈ A' }],
        toolboxBlocks: ['subset_elim', 'exact'],
        introduction: `# קבוצות והכלה

*קבוצה* היא אוסף של עצמים מהתחום, ו־\`x₀ ∈ A\` אומרת ש־x₀ *שייך* ל־A. למשל: A היא קבוצת הסטודנטים שעברו את הבוחן, ו־B קבוצת הסטודנטים שרשאים לגשת למבחן.

\`A ⊆ B\` נקראת "A מוכלת ב־B": כל איבר של A הוא גם איבר של B.

כאן נתון ש־A ⊆ B וש־x₀ ∈ A, והמטרה היא x₀ ∈ B. בהוכחה כתובה: "לפי ההכלה A ⊆ B, מ־x₀ ∈ A נובע x₀ ∈ B".
הבלוק ${SUBSET_ELIM_BLOCK} עושה זאת: בוחרים בו את ההכלה ואת השייכות.`,
        newTacticsBlocks: ['subset_elim'],
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
        name: 'unit6_l2_subset_trans',
        variableLine: SETS,
        params: '',
        proposition: '(A ⊆ B) → ((B ⊆ C) → (A ⊆ C))',
        goalLabel: '((A ⊆ B) → ((B ⊆ C) → (A ⊆ C)))',
        toolboxBlocks: ['assume', 'subset_intro', 'subset_elim', 'exact'],
        introduction: `# מוכיחים הכלה

אם A מוכלת ב־B ו־B מוכלת ב־C, אז A מוכלת ב־C.

כדי להוכיח \`A ⊆ C\` לוקחים איבר *שרירותי* x₀ של A, ומוכיחים שהוא שייך ל־C. כמו ביחידה 4, מה שהוכח לאיבר שרירותי נכון לכל איבר.
בהוכחה כתובה: "יהי x₀ ∈ A; נוכיח x₀ ∈ C". הבלוק ${SUBSET_INTRO_BLOCK} עושה זאת: העצם x₀ וההנחה x₀ ∈ A מצטרפים למה שבידינו.

אחרי זה משתמשים בשתי ההכלות, אחת אחרי השנייה, כמו בשלב 1.`,
        newTacticsBlocks: ['subset_intro'],
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
        name: 'unit6_l3_inter_subset',
        variableLine: SETS,
        params: '',
        proposition: 'A ∩ B ⊆ A',
        goalLabel: 'A ∩ B ⊆ A',
        toolboxBlocks: ['subset_intro', 'unfold', 'and_elim', 'exact'],
        introduction: `# חיתוך

\`A ∩ B\` הוא *החיתוך* של A ו־B: האיברים ששייכים לשתיהן. לפי ההגדרה, \`x₀ ∈ (A ∩ B)\` פירושו \`x₀ ∈ A ∧ x₀ ∈ B\`.

הבלוק ${UNFOLD_BLOCK} משתמש בהגדרה: בוחרים בו טענת שייכות, והוא כותב לפי איזו הגדרה ומה היא אומרת. מה שהיא אומרת מצטרף למה שבידינו.
אחרי פתיחת ההגדרה נשארת טענת "וגם", ומשתמשים בה כמו ביחידה 2.`,
        newTacticsBlocks: ['unfold'],
        newTacticsInfo: [unfoldInfo],
        newDefinitions: [inter],
        hints: [
            `גררו את הבלוק ${SUBSET_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: יהי x₀ ∈ (A ∩ B) ונוכיח x₀ ∈ A.`,
            `הוסיפו את הבלוק ${UNFOLD_BLOCK}, ובחרו בו x₀ ∈ (A ∩ B). עכשיו כתוב בו: לפי הגדרת החיתוך, פירושו (x₀ ∈ A ∧ x₀ ∈ B).`,
            `הוסיפו את הבלוק ${AND_ELIM_BLOCK}, ובחרו בו x₀ ∈ A ∧ x₀ ∈ B. עכשיו x₀ ∈ A בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "יהי x₀ ∈ (A ∩ B). לפי הגדרת החיתוך, x₀ ∈ A ∧ x₀ ∈ B, ולכן x₀ ∈ A."`,
        startXml: goalXml('A ∩ B ⊆ A'),
    }),
    level(4, {
        title: 'איחוד',
        name: 'unit6_l4_subset_union',
        variableLine: SETS,
        params: '',
        proposition: 'A ⊆ A ∪ B',
        goalLabel: 'A ⊆ A ∪ B',
        toolboxBlocks: ['subset_intro', 'unfold', 'or_intro', 'exact'],
        introduction: `# איחוד

\`A ∪ B\` הוא *האיחוד* של A ו־B: האיברים ששייכים לפחות לאחת מהן. לפי ההגדרה, \`x₀ ∈ (A ∪ B)\` פירושו \`x₀ ∈ A ∨ x₀ ∈ B\`.

הפעם משתמשים בהגדרה על *המטרה*: בוחרים בבלוק ${UNFOLD_BLOCK} את המטרה, x₀ ∈ (A ∪ B), ומה שהיא אומרת הופך למה שנשאר להוכיח.`,
        newDefinitions: [union],
        hints: [
            `גררו את הבלוק ${SUBSET_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: יהי x₀ ∈ A ונוכיח x₀ ∈ (A ∪ B).`,
            `הוסיפו את הבלוק ${UNFOLD_BLOCK}, ובחרו בו את המטרה x₀ ∈ (A ∪ B). עכשיו כתוב בו: לפי הגדרת האיחוד, כדי להוכיח x₀ ∈ (A ∪ B) די להוכיח (x₀ ∈ A ∨ x₀ ∈ B).`,
            `הוסיפו את הבלוק ${OR_INTRO_BLOCK}, ובחרו בו x₀ ∈ A. היא בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "יהי x₀ ∈ A. לפי הגדרת האיחוד, די להוכיח x₀ ∈ A ∨ x₀ ∈ B, ודי להוכיח x₀ ∈ A."`,
        startXml: goalXml('A ⊆ A ∪ B'),
    }),
    level(5, {
        title: 'הכלה של איחוד',
        name: 'unit6_l5_union_subset',
        variableLine: SETS,
        params: '(h1 : A ⊆ C) (h2 : B ⊆ C)',
        proposition: 'A ∪ B ⊆ C',
        goalLabel: 'A ∪ B ⊆ C',
        assumptions: [{ name: 'h1', prop: 'A ⊆ C' }, { name: 'h2', prop: 'B ⊆ C' }],
        toolboxBlocks: ['subset_intro', 'unfold', 'or_elim', 'subset_elim', 'exact'],
        introduction: `# הכלה של איחוד

אם A ו־B מוכלות שתיהן ב־C, גם האיחוד שלהן מוכל ב־C.

ניקח איבר x₀ של A ∪ B. לפי הגדרת האיחוד, x₀ ∈ A או x₀ ∈ B, ולכן נחלק למקרים, כמו ביחידה 2. בכל מקרה משתמשים בהכלה המתאימה.`,
        hints: [
            `גררו את הבלוק ${SUBSET_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: יהי x₀ ∈ (A ∪ B) ונוכיח x₀ ∈ C.`,
            `הוסיפו את הבלוק ${UNFOLD_BLOCK}, ובחרו בו x₀ ∈ (A ∪ B). עכשיו כתוב בו: פירושו (x₀ ∈ A ∨ x₀ ∈ B).`,
            `הוסיפו את הבלוק ${OR_ELIM_BLOCK}, ובחרו בו x₀ ∈ A ∨ x₀ ∈ B.`,
            `במקרה הראשון: ${SUBSET_ELIM_BLOCK} עם A ⊆ C ועם x₀ ∈ A, ואחריו ${CLOSE_BLOCK}. במקרה השני: אותו דבר עם B ⊆ C ועם x₀ ∈ B.`,
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "יהי x₀ ∈ (A ∪ B), כלומר x₀ ∈ A או x₀ ∈ B. במקרה הראשון, לפי A ⊆ C, x₀ ∈ C. במקרה השני, לפי B ⊆ C, x₀ ∈ C."`,
        startXml: goalXml('A ∪ B ⊆ C', 'A ⊆ C,  B ⊆ C'),
    }),
    level(6, {
        title: 'שוויון קבוצות',
        name: 'unit6_l6_inter_comm',
        variableLine: SETS,
        params: '',
        proposition: 'A ∩ B = B ∩ A',
        goalLabel: 'A ∩ B = B ∩ A',
        toolboxBlocks: ['set_eq', 'subset_intro', 'unfold', 'and_elim', 'and_intro', 'and_combine', 'exact'],
        introduction: `# שוויון קבוצות

שתי קבוצות *שוות* אם יש להן אותם איברים, כלומר אם כל אחת מוכלת בשנייה.
לכן כדי להוכיח \`A ∩ B = B ∩ A\` מוכיחים שתי הכלות, כל אחת בחלק משלה. הבלוק ${SET_EQ_BLOCK} עושה זאת.

בכל הכלה לוקחים איבר, פותחים את הגדרת החיתוך בהנחה ובמטרה, ומשתמשים ב"וגם" כמו ביחידה 2.`,
        newTacticsBlocks: ['set_eq'],
        newTacticsInfo: [setEqInfo],
        hints: [
            `גררו את הבלוק ${SET_EQ_BLOCK} אל תוך בלוק המטרה. בראש החלקים כתוב: נוכיח A ∩ B ⊆ B ∩ A, ונוכיח B ∩ A ⊆ A ∩ B.`,
            `בחלק הראשון: יהי x₀ ∈ (A ∩ B). פתחו את ההגדרה בהנחה x₀ ∈ (A ∩ B), ובחרו ב${AND_ELIM_BLOCK} את מה שהיא אומרת.`,
            `עכשיו פתחו את ההגדרה במטרה x₀ ∈ (B ∩ A), והוכיחו את ה"וגם" ב${AND_INTRO_BLOCK}: בכל צד, מה שמוכיחים כבר בידינו.`,
            'החלק השני זהה, עם A ו־B בתפקידים הפוכים.',
            'או קדימה, במקום להוכיח את ה"וגם" בשני חלקים: מ־x₀ ∈ B ומ־x₀ ∈ A נובע (x₀ ∈ B ∧ x₀ ∈ A), וזו המטרה.',
        ],
        conclusion: `שתי ההכלות הוכחו, ולכן A ∩ B = B ∩ A: לחיתוך לא משנה הסדר.`,
        startXml: goalXml('A ∩ B = B ∩ A'),
    }),
    level(7, {
        title: 'פילוג',
        name: 'unit6_l7_distrib',
        variableLine: SETS,
        params: '',
        proposition: 'A ∩ (B ∪ C) ⊆ (A ∩ B) ∪ (A ∩ C)',
        goalLabel: 'A ∩ (B ∪ C) ⊆ (A ∩ B) ∪ (A ∩ C)',
        toolboxBlocks: ['subset_intro', 'unfold', 'and_elim', 'or_elim', 'or_intro', 'and_intro', 'exact'],
        introduction: `# פילוג

החיתוך מתפלג על האיחוד: איבר של A ∩ (B ∪ C) שייך ל־A ∩ B או ל־A ∩ C.

פותחים את ההגדרות שבהנחה עד שמגיעים ל"וגם" ול"או", ואת ההגדרה של המטרה. אחר כך מחלקים למקרים לפי "x₀ ∈ B או x₀ ∈ C", ובכל מקרה בוחרים את הצד המתאים של המטרה.`,
        hints: [
            `יהי x₀ ∈ (A ∩ (B ∪ C)). פתחו את הגדרת החיתוך בהנחה, ומה"וגם" נובע x₀ ∈ A ונובע x₀ ∈ (B ∪ C). פתחו גם את הגדרת האיחוד ב־x₀ ∈ (B ∪ C).`,
            `פתחו את ההגדרה במטרה, x₀ ∈ ((A ∩ B) ∪ (A ∩ C)): נשאר להוכיח (x₀ ∈ (A ∩ B) ∨ x₀ ∈ (A ∩ C)).`,
            `חלקו למקרים לפי x₀ ∈ B ∨ x₀ ∈ C. במקרה הראשון בחרו להוכיח x₀ ∈ (A ∩ B), פתחו את ההגדרה, והוכיחו את ה"וגם" בשני חלקים.`,
            'המקרה השני דומה, עם x₀ ∈ (A ∩ C).',
        ],
        conclusion: `ההוכחה, כמו שכותבים אותה ביד: "יהי x₀ ∈ (A ∩ (B ∪ C)), כלומר x₀ ∈ A, ו־x₀ ∈ B או x₀ ∈ C. במקרה ש־x₀ ∈ B, x₀ ∈ (A ∩ B); במקרה ש־x₀ ∈ C, x₀ ∈ (A ∩ C)."`,
        startXml: goalXml('A ∩ (B ∪ C) ⊆ (A ∩ B) ∪ (A ∩ C)'),
    }),
    level(8, {
        title: 'הפרש',
        name: 'unit6_l8_diff',
        variableLine: SETS,
        params: '',
        proposition: '(A ⊆ B) → (C \\ B ⊆ C \\ A)',
        goalLabel: '((A ⊆ B) → (C \\ B ⊆ C \\ A))',
        toolboxBlocks: ['assume', 'subset_intro', 'unfold', 'and_elim', 'and_intro', 'not_intro', 'subset_elim', 'contradiction', 'exact'],
        introduction: `# הפרש

\`C \\ B\` הוא *ההפרש* של C ו־B: האיברים של C שלא שייכים ל־B. לפי ההגדרה, \`x₀ ∈ (C \\ B)\` פירושו \`x₀ ∈ C ∧ ¬x₀ ∈ B\`.

אם A ⊆ B, אז מי שנשאר ב־C אחרי שמוציאים את B נשאר גם אחרי שמוציאים את A: מוציאים פחות, ונשאר יותר.
אחרי פתיחת ההגדרות, החלק השני של המטרה הוא שלילה, ולכן מניחים ומגיעים לסתירה, כמו ביחידה 3.`,
        newDefinitions: [diff],
        hints: [
            `נניח A ⊆ B, ואחר כך ${SUBSET_INTRO_BLOCK}: יהי x₀ ∈ (C \\ B) ונוכיח x₀ ∈ (C \\ A).`,
            `פתחו את ההגדרה בהנחה x₀ ∈ (C \\ B), ומה"וגם" נובע x₀ ∈ C ונובע ¬x₀ ∈ B.`,
            `פתחו את ההגדרה במטרה x₀ ∈ (C \\ A), והוכיחו את ה"וגם" בשני חלקים. בחלק הראשון x₀ ∈ C בידינו.`,
            'בחלק השני, כדי להוכיח ¬x₀ ∈ A נניח x₀ ∈ A ונגיע לסתירה: לפי ההכלה A ⊆ B, מ־x₀ ∈ A נובע x₀ ∈ B, ויש לנו ביד את x₀ ∈ B ואת השלילה שלה.',
        ],
        conclusion: `מ־A ⊆ B נובע C \\ B ⊆ C \\ A: ההפרש הופך את כיוון ההכלה של מה שמוציאים.`,
        startXml: goalXml('((A ⊆ B) → (C \\ B ⊆ C \\ A))'),
    }),
    level(9, {
        title: 'הפרש של הפרש',
        name: 'unit6_l9_diff_diff',
        variableLine: SETS,
        params: '',
        proposition: 'A \\ (A \\ B) ⊆ A ∩ B',
        goalLabel: 'A \\ (A \\ B) ⊆ A ∩ B',
        toolboxBlocks: ['subset_intro', 'unfold', 'and_elim', 'and_intro', 'by_contradiction', 'not_elim', 'exact'],
        introduction: `# הפרש של הפרש

אם מוציאים מ־A את כל מה שב־A ולא ב־B, נשאר מה שב־A וגם ב־B: \`A \\ (A \\ B) ⊆ A ∩ B\`.
אחרי פתיחת ההגדרות בידינו ¬x₀ ∈ (A \\ B), וצריך להוכיח x₀ ∈ B. אין דרך ישירה, ולכן מוכיחים בשלילה, כמו ביחידה 3: אם x₀ לא ב־B, אז x₀ ∈ (A \\ B), וזו סתירה.`,
        hints: [
            `יהי x₀ ∈ (A \\ (A \\ B)). פתחו את ההגדרה בהנחה, ומה"וגם" נובע x₀ ∈ A ונובע ¬x₀ ∈ (A \\ B).`,
            'פתחו את ההגדרה במטרה x₀ ∈ (A ∩ B), והוכיחו את ה"וגם" בשני חלקים. בחלק הראשון x₀ ∈ A בידינו.',
            'בחלק השני: נוכיח בשלילה, נניח ¬x₀ ∈ B. לפי השלילה ¬x₀ ∈ (A \\ B), די להוכיח x₀ ∈ (A \\ B): פתחו בה את ההגדרה, והוכיחו את ה"וגם" בשני חלקים, משני הדברים שבידינו.',
        ],
        conclusion: `A \\ (A \\ B) ⊆ A ∩ B. גם ההכלה ההפוכה נכונה, ולכן אלה קבוצות שוות: הפרש כפול "מחזיר" את החיתוך.`,
        startXml: goalXml('A \\ (A \\ B) ⊆ A ∩ B'),
    }),
    level(10, {
        title: 'הקבוצה הריקה',
        name: 'unit6_l10_empty',
        variableLine: SETS,
        params: '',
        proposition: '∅ ⊆ A',
        goalLabel: '∅ ⊆ A',
        toolboxBlocks: ['subset_intro', 'unfold', 'exfalso', 'exact'],
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
        title: 'שלב בונוס: חוק דה מורגן לקבוצות',
        name: 'unit6_l11_de_morgan',
        variableLine: SETS,
        params: '',
        proposition: 'A \\ (B ∪ C) = (A \\ B) ∩ (A \\ C)',
        goalLabel: 'A \\ (B ∪ C) = (A \\ B) ∩ (A \\ C)',
        toolboxBlocks: ['set_eq', 'subset_intro', 'unfold', 'and_intro', 'and_elim', 'not_intro', 'not_elim', 'or_intro', 'or_elim', 'contradiction', 'exact'],
        introduction: `# בונוס: חוק דה מורגן לקבוצות

מה שב־A ולא באיחוד של B ו־C הוא מה שב־A ולא ב־B, וגם ב־A ולא ב־C: \`A \\ (B ∪ C) = (A \\ B) ∩ (A \\ C)\`.

זה חוק דה מורגן של יחידה 3, בשפת הקבוצות: אחרי פתיחת ההגדרות נשארת ההוכחה של ¬(P ∨ Q) ↔ ¬P ∧ ¬Q, בתוך "x₀ ∈ A וגם". מוכיחים שתי הכלות.`,
        hints: [
            `גררו את הבלוק ${SET_EQ_BLOCK} אל תוך בלוק המטרה, ובכל חלק קחו איבר x₀ ופתחו את ההגדרות.`,
            'בהכלה הראשונה: מ־x₀ ∈ (A \\ (B ∪ C)) נובעים x₀ ∈ A ו־¬x₀ ∈ (B ∪ C). המטרה היא "וגם" של שני הפרשים: בכל אחד x₀ ∈ A בידינו, ואת השלילה (¬x₀ ∈ B, או ¬x₀ ∈ C) מוכיחים בהנחה ובסתירה עם ¬x₀ ∈ (B ∪ C).',
            'בהכלה השנייה: מ־x₀ ∈ ((A \\ B) ∩ (A \\ C)) נובעים x₀ ∈ A, ¬x₀ ∈ B ו־¬x₀ ∈ C. במטרה x₀ ∈ (A \\ (B ∪ C)), כדי להוכיח ¬x₀ ∈ (B ∪ C) נניח x₀ ∈ (B ∪ C), נפתח את ההגדרה, ונחלק למקרים.',
        ],
        conclusion: `סיימתם את יחידה 6, כולל שלב הבונוס! אחרי פתיחת ההגדרות, כל הוכחה על קבוצות היא הוכחה לוגית מוכרת.
אם U היא קבוצה שמכילה את כל העצמים שמדברים עליהם, ו־Bᶜ, *המשלים* של B, הוא U \\ B, החוק שהוכחתם (עם A = U) אומר ש־(B ∪ C)ᶜ = Bᶜ ∩ Cᶜ. זה חוק דה מורגן לקבוצות, בהקבלה מלאה לחוק דה מורגן בלוגיקה: ∪ במקום ∨, ∩ במקום ∧, ומשלים במקום שלילה.`,
        startXml: goalXml('A \\ (B ∪ C) = (A \\ B) ∩ (A \\ C)'),
    }),
];
