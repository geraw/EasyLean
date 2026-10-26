import { prepareLevels } from './levelXml';

// Unit 9 (see blocks/moves.js): the operations on sets, after the lecture
// (01-sets.md, "פעולות על קבוצות" and "הפרש סימטרי"), in its order but for two
// changes: the basic claims come first (the slide of the properties before
// them lists laws that are proved later, and they are the easier), and De
// Morgan's law, proved in the lecture before the symmetric difference, is the
// bonus at the end. Its basic claims
// (א) A ⊆ A ∪ B, (ב) A ∩ B ⊆ A and (ג) X ⊆ A ∩ B ⟺ X ⊆ A ∧ X ⊆ B, the laws
// of commutativity and distributivity, how to prove a set is empty
// (A ⊆ B → A ∖ B = ∅), the table of all cases (A ∖ C ⊆ (A ∖ B) ∪ (B ∖ C), by
// cases on x ∈ B, as the rows of the table), the symmetric difference with
// the lecture's definition, and De Morgan's first law. Membership in a set
// built by an operation is read by its definition, with the move of unit 8
// that names it ("לפי הגדרת החיתוך"). Each level offers only the moves of its
// solution.

export const unit9WorldName = 'יחידה 9 - פעולות על קבוצות';

const SETS = 'variable {obj : Type} {A B C : Set obj}';

// The moves as the toolbox shows them, before they are placed.
const SUBSET_INTRO_BLOCK = '"כדי להוכיח הכלה: יהי איבר של הקבוצה המוכלת, ונוכיח שהוא שייך לקבוצה המכילה"';
const SUBSET_ELIM_BLOCK = '"לפי ההכלה ? ומ־ ? נובע שהאיבר שייך לקבוצה המכילה"';
const SET_EQ_BLOCK = '"כדי להוכיח שוויון קבוצות, נוכיח שתי הכלות"';
const UNFOLD_BLOCK = '"לפי ההגדרה, ? פירושו מה שההגדרה אומרת"';
const ASSUME_BLOCK = '"נניח את התנאי של הגרירה..."';
const AND_ELIM_BLOCK = '"מ־ ? נקבל את שני החלקים של ה"וגם"."';
const AND_INTRO_BLOCK = '"נוכיח את שני החלקים של ה"וגם"."';
const OR_INTRO_BLOCK = '"כדי להוכיח את ה"או" נוכיח את ?"';
const OR_ELIM_BLOCK = '"נחלק למקרים לפי ?"';
const CASES_BLOCK = '"נחלק למקרים: ? או השלילה שלה"';
const NOT_INTRO_BLOCK = '"נניח בשלילה את הטענה שהמטרה שוללת..."';
const NOT_ELIM_BLOCK = '"לפי ? כדי להגיע לסתירה די להוכיח את הטענה שהיא שוללת."';
const CONTRADICTION_BLOCK = '"קיבלנו ? וגם את השלילה שלה, בסתירה."';
const EXFALSO_BLOCK = '"מסתירה נובע הכול: די להגיע לסתירה."';
const IFF_INTRO_BLOCK = '"נוכיח את שני הכיוונים של ה"אם ורק אם"."';
const BY_CONTRADICTION_BLOCK = '"נניח בשלילה שהמטרה לא נכונה..."';
const CLAIM_BLOCK = '"נוכיח קודם את טענת העזר ?..."';
const REWRITE_BLOCK = '"לפי השוויון ? נחליף ... בתוך ?"';
const CLOSE_BLOCK = '"המטרה בידינו, וזה מה שעלינו להראות."';

const claimInfo = {
    name: 'טענת עזר',
    doc: 'בהוכחה כתובה מוכיחים לפעמים קודם טענה שתעזור בהמשך: "נוכיח קודם ש...". בוחרים את הטענה בבלוק, מוכיחים אותה בחלק שבתוכו, ומעכשיו היא בידינו.',
};
const rewriteInfo = {
    name: 'החלפה לפי שוויון',
    doc: 'אם a = b, אפשר להחליף את a ב־b, או את b ב־a, במטרה או בטענה שבידינו. בטענה שבידינו, התוצאה מצטרפת למה שבידינו.',
};

const union = { symbol: 'האיחוד', doc: 'A ∪ B = {x | x ∈ A ∨ x ∈ B}: האיברים השייכים לפחות לאחת מהקבוצות. לכן x ∈ (A ∪ B) פירושו x ∈ A ∨ x ∈ B.' };
const inter = { symbol: 'החיתוך', doc: 'A ∩ B = {x | x ∈ A ∧ x ∈ B}: האיברים השייכים לשתי הקבוצות. לכן x ∈ (A ∩ B) פירושו x ∈ A ∧ x ∈ B.' };
const diff = { symbol: 'ההפרש', doc: 'A ∖ B = {x | x ∈ A ∧ x ∉ B}: האיברים השייכים לקבוצה הראשונה אך לא לשנייה. לכן x ∈ (A ∖ B) פירושו x ∈ A ∧ x ∉ B.' };
const symmDiff = { symbol: 'ההפרש הסימטרי', doc: 'A ∆ B = {x | (x ∈ A ∧ x ∉ B) ∨ (x ∉ A ∧ x ∈ B)}: האיברים השייכים בדיוק לאחת מהקבוצות.' };

const level = (number, fields) => ({
    id: `unit9-${number}`,
    levelNumber: number,
    totalLevels: 10,
    usesSets: true,
    variableLine: SETS,
    params: '',
    objects: [],
    newTacticsBlocks: [],
    newTacticsInfo: [],
    newDefinitions: [],
    ...fields,
});

export const unit9Levels = prepareLevels([
    level(1, {
        title: 'איחוד: A ⊆ A ∪ B',
        name: 'unit9_l1_subset_union',
        proposition: 'A ⊆ A ∪ B',
        toolboxBlocks: ['subset_intro', 'unfold', 'or_by_negation', 'or_intro', 'exact'],
        introduction: `# פעולות על קבוצות: איחוד

\`A ∪ B\` הוא *האיחוד* של A ו־B: \`A ∪ B = {x | x ∈ A ∨ x ∈ B}\`, האיברים השייכים לפחות לאחת מהקבוצות. לכן \`x ∈ (A ∪ B)\` פירושו \`x ∈ A ∨ x ∈ B\`.

זו טענה (א) מ"טענות בסיסיות" בהרצאה: "יהי x ∈ A. אז x ∈ A ∨ x ∈ B, כלומר x ∈ A ∪ B."
הבלוק ${UNFOLD_BLOCK} עובד גם על *המטרה*: בוחרים בו את המטרה x ∈ (A ∪ B), ומה שהיא אומרת הופך למה שנשאר להוכיח.`,
        newDefinitions: [union],
        hints: [
            `גררו את הבלוק ${SUBSET_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: כדי להוכיח A ⊆ A ∪ B יהי x ∈ A ונוכיח x ∈ (A ∪ B).`,
            `הוסיפו את הבלוק ${UNFOLD_BLOCK}, ובחרו בו את המטרה x ∈ (A ∪ B). עכשיו כתוב בו: לפי הגדרת האיחוד, כדי להוכיח x ∈ (A ∪ B) די להוכיח (x ∈ A ∨ x ∈ B).`,
            `הוסיפו את הבלוק ${OR_INTRO_BLOCK}, ובחרו בו x ∈ A. היא בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: 'ההוכחה, כמו בהרצאה: "יהי x ∈ A. אז x ∈ A ∨ x ∈ B, כלומר x ∈ A ∪ B." כאן ידוע איזה צד של ה"או" נכון, ולכן מספיק לבחור אותו.',
    }),
    level(2, {
        title: 'חיתוך: A ∩ B ⊆ A',
        name: 'unit9_l2_inter_subset',
        proposition: 'A ∩ B ⊆ A',
        toolboxBlocks: ['subset_intro', 'unfold', 'and_elim', 'exact'],
        introduction: `# חיתוך

\`A ∩ B\` הוא *החיתוך* של A ו־B: \`A ∩ B = {x | x ∈ A ∧ x ∈ B}\`, האיברים השייכים לשתי הקבוצות. לכן \`x ∈ (A ∩ B)\` פירושו \`x ∈ A ∧ x ∈ B\`.

זו טענה (ב) מ"טענות בסיסיות": "יהי x ∈ A ∩ B. אז x ∈ A ∧ x ∈ B, ובפרט x ∈ A." הפעם משתמשים בהגדרה על הנחה, ומה שהיא אומרת מצטרף למה שבידינו.`,
        newDefinitions: [inter],
        hints: [
            `גררו את הבלוק ${SUBSET_INTRO_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: כדי להוכיח A ∩ B ⊆ A יהי x ∈ (A ∩ B) ונוכיח x ∈ A.`,
            `הוסיפו את הבלוק ${UNFOLD_BLOCK}, ובחרו בו x ∈ (A ∩ B). עכשיו כתוב בו: לפי הגדרת החיתוך, x ∈ (A ∩ B) פירושו (x ∈ A ∧ x ∈ B).`,
            `הוסיפו את הבלוק ${AND_ELIM_BLOCK}, ובחרו בו x ∈ A ∧ x ∈ B. עכשיו x ∈ A בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: 'ההוכחה, כמו בהרצאה: "יהי x ∈ A ∩ B. אז x ∈ A ∧ x ∈ B, ובפרט x ∈ A."',
    }),
    level(3, {
        title: 'הכלה בחיתוך',
        name: 'unit9_l3_subset_inter_iff',
        variableLine: 'variable {obj : Type} {A B X : Set obj}',
        proposition: 'X ⊆ A ∩ B ↔ X ⊆ A ∧ X ⊆ B',
        toolboxBlocks: ['iff_intro', 'assume', 'and_intro', 'and_elim', 'subset_intro', 'subset_elim', 'unfold', 'exact'],
        introduction: `# הכלה בחיתוך

טענה (ג) מ"טענות בסיסיות": \`X ⊆ A ∩ B ⟺ (X ⊆ A ∧ X ⊆ B)\`. במילים: A ∩ B היא הקבוצה *הגדולה ביותר* המוכלת גם ב־A וגם ב־B.

מוכיחים שני כיוונים, כמו ביחידה 3.
- **(⇒)** נניח X ⊆ A ∩ B. בכל חלק של ה"וגם": יהי x ∈ X. אז x ∈ A ∩ B, ובפרט x ∈ A (או x ∈ B). בהרצאה זה נעשה בעזרת (ב) וטרנזיטיביות ההכלה; כאן נעשה זאת ישירות.
- **(⇐)** נניח X ⊆ A וגם X ⊆ B. יהי x ∈ X. אז x ∈ A (כי X ⊆ A) וגם x ∈ B (כי X ⊆ B). לכן x ∈ A ∩ B.`,
        hints: [
            `גררו את הבלוק ${IFF_INTRO_BLOCK} אל תוך בלוק המטרה, ובכל כיוון את הבלוק ${ASSUME_BLOCK}.`,
            `בכיוון הראשון: ${AND_INTRO_BLOCK}, ובכל חלק ${SUBSET_INTRO_BLOCK}: יהי x ∈ X. אחר כך ${SUBSET_ELIM_BLOCK} עם X ⊆ A ∩ B ועם x ∈ X, פתחו את הגדרת החיתוך ב־x ∈ (A ∩ B), ו־${AND_ELIM_BLOCK}.`,
            `בכיוון השני: ${AND_ELIM_BLOCK} עם (X ⊆ A ∧ X ⊆ B), ו־${SUBSET_INTRO_BLOCK}: יהי x ∈ X ונוכיח x ∈ (A ∩ B).`,
            `פתחו את הגדרת החיתוך במטרה x ∈ (A ∩ B), ו־${AND_INTRO_BLOCK}: בכל חלק, ${SUBSET_ELIM_BLOCK} עם ההכלה המתאימה ועם x ∈ X.`,
        ],
        conclusion: 'הוכחתם את שני הכיוונים, כמו בהרצאה. בכיוון ⇐ זו ההוכחה מהשקף: "יהי x ∈ X. אז x ∈ A (כי X ⊆ A) וגם x ∈ B (כי X ⊆ B). לכן x ∈ A ∩ B, ומכאן X ⊆ A ∩ B."',
    }),
    level(4, {
        title: 'חוק החילוף',
        name: 'unit9_l4_inter_comm',
        proposition: 'A ∩ B = B ∩ A',
        toolboxBlocks: ['set_eq', 'subset_intro', 'unfold', 'and_elim', 'and_intro', 'and_combine', 'exact'],
        introduction: `# חוק החילוף

מ"תכונות של פעולות על קבוצות" בהרצאה: \`A ∩ B = B ∩ A\`.

כדי להוכיח שוויון קבוצות מוכיחים שתי הכלות (יחידה 8). בכל הכלה: יהי x באגף שמאל, פותחים את הגדרת החיתוך בהנחה ובמטרה, ומשתמשים ב"וגם" כמו ביחידה 3.`,
        hints: [
            `גררו את הבלוק ${SET_EQ_BLOCK} אל תוך בלוק המטרה. בראש החלקים כתוב: נוכיח A ∩ B ⊆ B ∩ A, ונוכיח B ∩ A ⊆ A ∩ B.`,
            `בחלק הראשון: ${SUBSET_INTRO_BLOCK}, יהי x ∈ (A ∩ B). פתחו את ההגדרה בהנחה x ∈ (A ∩ B), ובחרו ב־${AND_ELIM_BLOCK} את מה שהיא אומרת.`,
            `עכשיו פתחו את ההגדרה במטרה x ∈ (B ∩ A), והוכיחו את ה"וגם" ב־${AND_INTRO_BLOCK}: בכל צד, מה שמוכיחים כבר בידינו.`,
            'החלק השני זהה, עם A ו־B בתפקידים הפוכים.',
            'או קדימה, במקום להוכיח את ה"וגם" בשני חלקים: מ־x ∈ B ומ־x ∈ A נקבל (x ∈ B ∧ x ∈ A), וזו המטרה.',
        ],
        conclusion: 'שתי ההכלות הוכחו, ולכן A ∩ B = B ∩ A. אחרי פתיחת ההגדרות, זה חוק החילוף של "וגם".',
    }),
    level(5, {
        title: 'חוק הפילוג',
        name: 'unit9_l5_distrib',
        proposition: 'A ∩ (B ∪ C) ⊆ (A ∩ B) ∪ (A ∩ C)',
        toolboxBlocks: ['subset_intro', 'unfold', 'and_elim', 'or_elim', 'or_by_negation', 'or_intro', 'and_intro', 'exact'],
        introduction: `# חוק הפילוג

מ"תכונות של פעולות על קבוצות": \`A ∩ (B ∪ C) = (A ∩ B) ∪ (A ∩ C)\`. כאן נוכיח את ההכלה ⊆: איבר של A ∩ (B ∪ C) שייך ל־A ∩ B או ל־A ∩ C.

פותחים את ההגדרות שבהנחה עד שמגיעים ל"וגם" ול"או", ואת ההגדרה של המטרה. אחר כך מחלקים למקרים לפי "x ∈ B או x ∈ C", ובכל מקרה בוחרים את הצד המתאים של המטרה: כאן ידוע איזה צד נכון.`,
        hints: [
            `יהי x ∈ (A ∩ (B ∪ C)). פתחו את הגדרת החיתוך בהנחה, ומה"וגם" נקבל x ∈ A ו־x ∈ (B ∪ C). פתחו גם את הגדרת האיחוד ב־x ∈ (B ∪ C).`,
            'פתחו את ההגדרה במטרה, x ∈ ((A ∩ B) ∪ (A ∩ C)): נשאר להוכיח (x ∈ (A ∩ B) ∨ x ∈ (A ∩ C)).',
            `${OR_ELIM_BLOCK} עם x ∈ B ∨ x ∈ C. במקרה הראשון בחרו להוכיח x ∈ (A ∩ B), פתחו את ההגדרה, והוכיחו את ה"וגם" בשני חלקים.`,
            'המקרה השני דומה, עם x ∈ (A ∩ C).',
        ],
        conclusion: 'ההוכחה: "יהי x ∈ A ∩ (B ∪ C), כלומר x ∈ A, ו־x ∈ B או x ∈ C. במקרה ש־x ∈ B, x ∈ A ∩ B; במקרה ש־x ∈ C, x ∈ A ∩ C." אחרי פתיחת ההגדרות, זה חוק הפילוג של "וגם" על "או". גם ההכלה ההפוכה נכונה, ולכן הקבוצות שוות.',
    }),
    level(6, {
        title: 'איך מוכיחים שקבוצה ריקה',
        name: 'unit9_l6_diff_empty',
        proposition: '(A ⊆ B) → A \\ B = ∅',
        toolboxBlocks: ['assume', 'set_eq', 'subset_intro', 'unfold', 'and_elim', 'subset_elim', 'contradiction', 'exfalso', 'exact'],
        introduction: `# איך מוכיחים שקבוצה ריקה

\`A ∖ B\` הוא *ההפרש*: \`A ∖ B = {x | x ∈ A ∧ x ∉ B}\`, האיברים של A שאינם ב־B.

התבנית מההרצאה: כדי להוכיח \`S = ∅\`, מניחים x ∈ S ומגיעים לסתירה. כאן נכתוב אותה כשוויון קבוצות: בהכלה S ⊆ ∅, יהי x ∈ S, ומגיעים לסתירה, שממנה נובע הכול, גם x ∈ ∅; וההכלה ∅ ⊆ S נכונה תמיד (יחידה 8).

נוכיח את הכיוון ⇐ של הטענה מהשקף, \`A ∖ B = ∅ ⟺ A ⊆ B\`: אם A ⊆ B, אז A ∖ B = ∅. "נניח בשלילה שקיים x ∈ A ∖ B. אז x ∈ A, ומ־A ⊆ B נקבל x ∈ B. אבל גם x ∉ B: סתירה."`,
        newDefinitions: [diff],
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה, ולתוכו את הבלוק ${SET_EQ_BLOCK}.`,
            `בחלק הראשון: יהי x ∈ (A ∖ B). פתחו את ההגדרה בהנחה, ומה"וגם" נקבל x ∈ A ו־x ∉ B. כדי להוכיח x ∈ ∅ נגיע לסתירה: ${EXFALSO_BLOCK}.`,
            `${SUBSET_ELIM_BLOCK} עם A ⊆ B ועם x ∈ A, ואחריו ${CONTRADICTION_BLOCK} עם x ∈ B.`,
            `בחלק השני, כמו ביחידה 8: יהי x ∈ ∅, פתחו את ההגדרה, ${EXFALSO_BLOCK}, והסתירה בידינו.`,
        ],
        conclusion: 'הוכחתם שאין איבר ב־A ∖ B: כל איבר כזה מוביל לסתירה. גם הכיוון ⇒ נכון: אם A ∖ B = ∅, איבר של A שאינו ב־B היה איבר של A ∖ B, וזו סתירה.',
    }),
    level(7, {
        title: 'הפרש ריק נותן הכלה',
        name: 'unit9_l7_empty_diff_subset',
        proposition: '(A \\ B = ∅) → A ⊆ B',
        claims: ['x ∈ A \\ B'],
        toolboxBlocks: ['assume', 'subset_intro', 'by_contradiction', 'claim', 'unfold', 'and_intro', 'rewrite', 'exact'],
        newTacticsBlocks: ['claim', 'rewrite'],
        newTacticsInfo: [claimInfo, rewriteInfo],
        newDefinitions: [diff],
        introduction: `# הפרש ריק נותן הכלה

הכיוון השני של הטענה מהשקף, \`A ∖ B = ∅ ⟺ A ⊆ B\`: אם A ∖ B = ∅, אז A ⊆ B.

ההוכחה: יהי x ∈ A, ונוכיח x ∈ B. נניח בשלילה ש־x ∉ B. אז x שייך ל־A ∖ B, אבל A ∖ B = ∅, ולכן x ∈ ∅, וזו סתירה.

שני מהלכים חדשים: *טענת עזר*, כדי להוכיח קודם ש־x ∈ A ∖ B (בחלק שבתוך הבלוק, ומעכשיו היא בידינו); ו*החלפה לפי שוויון*, כדי להחליף את A ∖ B ב־∅ בתוך הטענה, לפי השוויון שבידינו.`,
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה, ואחריו את הבלוק ${SUBSET_INTRO_BLOCK}: יהי x ∈ A.`,
            `הוסיפו את הבלוק ${BY_CONTRADICTION_BLOCK}: עכשיו x ∉ B בידינו, והמטרה סתירה.`,
            `הוסיפו את הבלוק ${CLAIM_BLOCK}, ובחרו בו את x ∈ (A ∖ B). בתוכו: פתחו את ההגדרה במטרה, ואת שני חלקי ה"וגם" ${AND_INTRO_BLOCK}, וכל אחד מהם כבר בידינו.`,
            `אחרי טענת העזר, ${REWRITE_BLOCK}: בחרו בשוויון A ∖ B = ∅, והחליפו בתוך x ∈ (A ∖ B). עכשיו x ∈ ∅ בידינו.`,
            `פתחו את ההגדרה ב־x ∈ ∅: פירושו ⊥, וזו הסתירה שהמטרה דורשת.`,
        ],
        conclusion: `יחד עם השלב הקודם: A ∖ B = ∅ אם ורק אם A ⊆ B. המעבר "ההפרש ריק, ולכן x ∈ A ∖ B נותן סתירה" הוא התבנית של ההרצאה לקבוצה ריקה: איבר בקבוצה ריקה הוא תמיד סתירה.`,
    }),
    level(8, {
        title: 'טבלת המצבים',
        name: 'unit9_l7_cases_table',
        proposition: 'A \\ C ⊆ (A \\ B) ∪ (B \\ C)',
        claims: ['x ∈ B'],
        toolboxBlocks: ['subset_intro', 'unfold', 'and_elim', 'em_cases', 'or_by_negation', 'or_intro', 'and_intro', 'exact'],
        introduction: `# טבלת המצבים

בהרצאה בדקנו את הטענה \`A ∖ C ⊆ (A ∖ B) ∪ (B ∖ C)\` בטבלה של כל המצבים: לכל שילוב של x ∈ A, x ∈ B, x ∈ C, אין שורה שבה x שייך לאגף שמאל ולא לאגף ימין.

הוכחה בטבלה היא חלוקה למקרים. כאן יהי x ∈ A ∖ C, כלומר x ∈ A ו־x ∉ C. נשאר רק לבדוק את שתי האפשרויות של x ∈ B: נחלק למקרים לפי x ∈ B או השלילה שלה, כמו ביחידה 7.`,
        hints: [
            `יהי x ∈ (A ∖ C). פתחו את ההגדרה בהנחה, ומה"וגם" נקבל x ∈ A ו־x ∉ C. פתחו את ההגדרה גם במטרה: נשאר להוכיח (x ∈ (A ∖ B) ∨ x ∈ (B ∖ C)).`,
            `הוסיפו את הבלוק ${CASES_BLOCK}, ובחרו בו x ∈ B.`,
            `במקרה 1, x ∈ B: בחרו להוכיח x ∈ (B ∖ C), פתחו את ההגדרה, והוכיחו את ה"וגם" בשני חלקים.`,
            `במקרה 2, x ∉ B: בחרו להוכיח x ∈ (A ∖ B), פתחו את ההגדרה, והוכיחו את ה"וגם" בשני חלקים.`,
        ],
        conclusion: 'בכל אחד משני המקרים x שייך לאגף ימין. אלה שורות הטבלה שבהן x ∈ A ו־x ∉ C: שורה עם x ∈ B ושורה עם x ∉ B. בשאר השורות x לא שייך לאגף שמאל, ואין מה לבדוק.',
    }),
    level(9, {
        title: 'הפרש סימטרי',
        name: 'unit9_l8_symmetric_difference',
        proposition: 'A ∆ B = (A \\ B) ∪ (B \\ A)',
        toolboxBlocks: ['set_eq', 'subset_intro', 'unfold', 'or_elim', 'or_by_negation', 'or_intro', 'and_elim', 'and_combine', 'exact'],
        introduction: `# הפרש סימטרי

\`A ∆ B\` הוא *ההפרש הסימטרי*: \`A ∆ B = {x | (x ∈ A ∧ x ∉ B) ∨ (x ∉ A ∧ x ∈ B)}\`, האיברים השייכים בדיוק לאחת מהקבוצות.

הטענה מההרצאה: \`A ∆ B = (A ∖ B) ∪ (B ∖ A)\`. אחרי פתיחת ההגדרות, בשני האגפים יש "או" של שני מקרים, ולכן בכל הכלה מחלקים למקרים לפי ה"או" ובוחרים את הצד המתאים.
במקרה השני הסדר בתוך ה"וגם" הפוך (x ∉ A ∧ x ∈ B מול x ∈ B ∧ x ∉ A), ולכן מפרקים אותו ומרכיבים מחדש.`,
        newDefinitions: [symmDiff],
        hints: [
            `גררו את הבלוק ${SET_EQ_BLOCK} אל תוך בלוק המטרה. בכל חלק: יהי x באגף שמאל, ופתחו את ההגדרות בהנחה ובמטרה.`,
            `בחלק הראשון, ${OR_ELIM_BLOCK} עם ה"או" של הגדרת ההפרש הסימטרי. במקרה 1 בחרו להוכיח x ∈ (A ∖ B), פתחו את ההגדרה, ומה שנשאר להוכיח כבר בידינו.`,
            'במקרה 2: פרקו את ה"וגם" שבידינו, בחרו להוכיח x ∈ (B ∖ A), פתחו את ההגדרה, והרכיבו את ה"וגם" מ־x ∈ B ומ־x ∉ A.',
            'בחלק השני, חלקו למקרים לפי x ∈ (A ∖ B) ∨ x ∈ (B ∖ A), פתחו את ההגדרה של המקרה, ובחרו את הצד המתאים של ההפרש הסימטרי.',
        ],
        conclusion: `A ∆ B = (A ∖ B) ∪ (B ∖ A), כמו בהרצאה: "x ∈ A ∆ B ⟺ (x ∈ A ∧ x ∉ B) ∨ (x ∉ A ∧ x ∈ B) ⟺ x ∈ (A ∖ B) ∨ x ∈ (B ∖ A)".
בהרצאה הוכחנו גם ש־A ∆ B = (A ∪ B) ∖ (A ∩ B), ולכן לשלוש ההגדרות אותה משמעות, ואפשר להשתמש בכל אחת מהן לפי הנוחות.`,
    }),
    level(10, {
        title: 'שלב בונוס: כלל דה־מורגן',
        name: 'unit9_l9_de_morgan',
        proposition: 'A \\ (B ∩ C) = (A \\ B) ∪ (A \\ C)',
        claims: ['x ∈ B'],
        toolboxBlocks: ['set_eq', 'subset_intro', 'unfold', 'and_elim', 'and_intro', 'em_cases', 'or_by_negation', 'or_intro', 'or_elim', 'not_intro', 'not_elim', 'contradiction', 'exact'],
        introduction: `# בונוס: כלל דה־מורגן

כלל דה־מורגן הראשון מההרצאה: \`A ∖ (B ∩ C) = (A ∖ B) ∪ (A ∖ C)\`. מה שב־A ולא בשתיהן הוא מה שב־A ולא ב־B, או ב־A ולא ב־C.

בהרצאה הוכחנו אותו בטבלת המצבים ובשקילויות לוגיות (דה־מורגן ופילוג). כאן מוכיחים שתי הכלות:
- **(⊆)** יהי x ∈ A ∖ (B ∩ C): x ∈ A ו־x ∉ B ∩ C. נחלק למקרים לפי x ∈ B, כמו בשלב הקודם: אם x ∈ B, אז x ∉ C (אחרת x ∈ B ∩ C), ולכן x ∈ A ∖ C; ואם x ∉ B, אז x ∈ A ∖ B.
- **(⊇)** יהי x ∈ (A ∖ B) ∪ (A ∖ C). בכל אחד משני המקרים x ∈ A, ו־x ∉ B ∩ C: אם x ∈ B ∩ C, אז x ∈ B וגם x ∈ C, בסתירה.`,
        hints: [
            `גררו את הבלוק ${SET_EQ_BLOCK} אל תוך בלוק המטרה. בכל חלק: יהי x באגף שמאל, פתחו את ההגדרות בהנחה ובמטרה, ופרקו את ה"וגם".`,
            `בחלק הראשון: ${CASES_BLOCK} עם x ∈ B. במקרה 1 בחרו להוכיח x ∈ (A ∖ C). בחלק x ∉ C של ה"וגם": ${NOT_INTRO_BLOCK}, ואחריו ${NOT_ELIM_BLOCK} עם x ∉ (B ∩ C), פתחו את הגדרת החיתוך, והוכיחו את ה"וגם".`,
            'במקרה 2 בחרו להוכיח x ∈ (A ∖ B): פתחו את ההגדרה, ושני החלקים בידינו.',
            `בחלק השני: ${OR_ELIM_BLOCK} עם x ∈ (A ∖ B) ∨ x ∈ (A ∖ C). בכל מקרה פתחו את ההגדרה ופרקו את ה"וגם". בחלק x ∉ (B ∩ C) של המטרה: ${NOT_INTRO_BLOCK}, פתחו את הגדרת החיתוך, פרקו, ו־${CONTRADICTION_BLOCK}.`,
        ],
        conclusion: `סיימתם את יחידה 9, כולל שלב הבונוס! אחרי פתיחת ההגדרות, כל הוכחה על פעולות בקבוצות היא הוכחה לוגית מוכרת: ∪ הוא "או", ∩ הוא "וגם", ו־\\ הוא "וגם לא".
הכלל השני של דה־מורגן, A ∖ (B ∪ C) = (A ∖ B) ∩ (A ∖ C), מוכח באותה דרך.`,
    }),
]);
