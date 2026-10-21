import { goalXml } from './levelXml';

// Unit 7 (see blocks/moves.js): the structures of proof, as the part of the
// first lecture on proofs teaches them, with its examples, in its order: proof
// against persuasive talk, the three ways to prove an implication, the barber,
// and the proofs of "and", "or", "for all", "there exists", of using
// quantified assumptions, of scope and of cases. The lecture's strategies that
// had no move of their own get one here: modus tollens, proof by
// contraposition, proving "or" by assuming the negation of one side, and cases
// by a statement and its negation. Each level offers only the moves of its
// solutions.

export const unit7WorldName = 'יחידה 7 - מבני הוכחה';

// The moves as the toolbox shows them, before they are placed.
const ASSUME_BLOCK = '"נניח את התנאי של הגרירה..."';
const FORALL_INTRO_BLOCK = '"יהי עצם שרירותי..."';
const FORALL_ELIM_BLOCK = '"ב־ ? נציב ? ונקבל מה שהוא אומר על העצם."';
const EXISTS_INTRO_BLOCK = '"נבחר את העצם ?..."';
const EXISTS_ELIM_BLOCK = '"לפי ? יהי עצם כזה."';
const AND_INTRO_BLOCK = '"נוכיח את שני החלקים של ה"וגם"."';
const AND_ELIM_BLOCK = '"מ־ ? נקבל את שני החלקים של ה"וגם"."';
const FORWARD_BLOCK = '"מ־ ? ומ־ ? נקבל את המסקנה של הגרירה."';
const MT_BLOCK = '"מ־ ? ומ־ ? נקבל את השלילה של התנאי של הגרירה."';
const CONTRAPOSITIVE_BLOCK = '"נוכיח את הקונטרפוזיציה..."';
const OR_BY_NEGATION_BLOCK = '"נניח את השלילה של הצד הראשון של ה"או"..."';
const CASES_BLOCK = '"נחלק למקרים: ? או השלילה שלה"';
const CLOSE_BLOCK = '"המטרה בידינו, וזה מה שעלינו להראות."';

const mtInfo = {
    name: 'גרירה ושלילת המסקנה',
    doc: 'מגרירה α → β ומ־¬β נקבל ¬α: אם המסקנה לא נכונה, גם התנאי לא נכון (modus tollens). בהוכחה כתובה: "מ־P → Q ומ־¬Q נקבל ¬P."',
};
const contrapositiveInfo = {
    name: 'הוכחה בקונטרפוזיציה',
    doc: 'כדי להוכיח α → β מוכיחים את הקונטרפוזיציה ¬β → ¬α: מניחים ¬β ומוכיחים ¬α. בהוכחה כתובה: "נוכיח את הקונטרפוזיציה: נניח ¬Q. עלינו להראות ¬P. … הוכחנו ¬Q → ¬P, ולכן P → Q."',
};
const orByNegationInfo = {
    name: 'הוכחת "או"',
    doc: 'כדי להוכיח α ∨ β מניחים ¬α ומוכיחים β, לפי השקילות ¬α → β ≡ α ∨ β (יחידה 1, שלב 3). בהוכחה כתובה: "נניח ¬P. עלינו להראות Q. … הוכחנו ¬P → Q, ולכן P ∨ Q."',
};
const casesInfo = {
    name: 'חלוקה למקרים: טענה ושלילתה',
    doc: 'כל טענה נכונה או לא נכונה (α ∨ ¬α, טאוטולוגיה), ולכן אפשר תמיד לחלק למקרים: מקרה 1, α; מקרה 2, ¬α. בהוכחה כתובה: "נחלק למקרים: P או ¬P. מקרה 1: P. … מקרה 2: ¬P. … המקרים מכסים את כל האפשרויות, ובשניהם R."',
};

const PROPOSITIONS = 'variable {P Q R : Prop}';

const level = (number, fields) => ({
    id: `unit7-${number}`,
    levelNumber: number,
    totalLevels: 12,
    variableLine: PROPOSITIONS,
    params: '',
    objects: [],
    assumptions: [],
    newTacticsBlocks: [],
    newTacticsInfo: [],
    newDefinitions: [],
    ...fields,
});

export const unit7Levels = [
    level(1, {
        title: 'הוכחה מול מלל משכנע',
        name: 'unit7_l1_proof_not_persuasion',
        variableLine: 'variable {obj : Type} {P Q : obj → Prop}',
        proposition: '(∀ x, P x ∧ Q x) → ((∀ x, P x) ∧ (∀ x, Q x))',
        goalLabel: '((∀x (P(x) ∧ Q(x))) → ((∀x (P(x))) ∧ (∀x (Q(x)))))',
        toolboxBlocks: ['assume', 'and_intro', 'forall_intro', 'forall_elim', 'and_elim', 'exact'],
        introduction: `# הוכחה מול מלל משכנע

היחידה הזאת היא החלק של ההרצאה על הוכחות, עם הדוגמאות של השקפים. להוכחה יש מבנה קבוע: *שורת פתיחה* שקובעת מה מניחים ומה צריך להראות, *גוף* שבו כל שורה נובעת מקודמותיה, ו*שורת סיום* שאומרת מה הוכחנו. המבנה נקבע לפי המילה הראשית.

"אם כל אחד מקיים את שתי התכונות, ברור שכל אחד מקיים כל אחת מהן" הוא מלל משכנע, ולא הוכחה. ההוכחה מההרצאה: נניח ∀x (P(x) ∧ Q(x)), ונוכיח בנפרד את שני חלקי ה־∧. בכל חלק: יהי x שרירותי, נציב אותו בהנחה ונקבל P(x) ∧ Q(x), ובפרט את החלק שצריך.`,
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה. המילה הראשית של המטרה היא →.`,
            `בתוך "נניח" המטרה היא "וגם": גררו לתוכו את הבלוק ${AND_INTRO_BLOCK}.`,
            `בכל חלק: ${FORALL_INTRO_BLOCK}, ובתוכו ${FORALL_ELIM_BLOCK} עם ההנחה ועם x. אחר כך ${AND_ELIM_BLOCK} עם P(x) ∧ Q(x), ו־${CLOSE_BLOCK}.`,
        ],
        conclusion: `זו ההוכחה מהשקף: "נניח ∀x (P(x) ∧ Q(x)). נוכיח את שני החלקים. החלק הראשון: יהי x שרירותי. נציב אותו בהנחה ונקבל P(x) ∧ Q(x), ובפרט P(x). מאחר ש־x שרירותי, ∀x (P(x)). החלק השני: באותו אופן, ∀x (Q(x)). לכן ∀x (P(x)) ∧ ∀x (Q(x))."
כל שורה נובעת מההנחה, מהגדרת הקשר או מהשורות שלפניה. בהנחת ה־∀ *אנחנו בחרנו* להציב את אותו x.`,
        startXml: goalXml('((∀x (P(x) ∧ Q(x))) → ((∀x (P(x))) ∧ (∀x (Q(x)))))'),
    }),
    level(2, {
        title: 'כשיש ¬β, מקבלים ¬α',
        name: 'unit7_l2_modus_tollens',
        params: '(h1 : P → Q) (h2 : ¬Q)',
        proposition: '¬P',
        goalLabel: '¬P',
        toolboxBlocks: ['modus_tollens', 'exact'],
        newTacticsBlocks: ['modus_tollens'],
        newTacticsInfo: [mtInfo],
        introduction: `# כשיש ¬β, מקבלים ¬α

בטבלה של ההרצאה "כשצריך להוכיח וכשזה נתון", גרירה α → β שנתונה משמשת בשתי דרכים: כשיש לנו α, מקבלים β; וכשיש ¬β, מקבלים ¬α.
את הדרך השנייה הוכחתם ביחידה 4, שלב 3, בכללי השלילה. מעכשיו יש לה מהלך משלה: ${MT_BLOCK}`,
        hints: [
            `גררו את הבלוק ${MT_BLOCK} אל תוך בלוק המטרה, ובחרו בו את P → Q ואת ¬Q.`,
            `¬P בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `"מ־P → Q ומ־¬Q נקבל ¬P": אם המסקנה לא נכונה, גם התנאי לא נכון.`,
        startXml: goalXml('¬P', '(P → Q),  ¬Q'),
    }),
    level(3, {
        title: 'הוכחה בקונטרפוזיציה',
        name: 'unit7_l3_contrapositive',
        params: '(h1 : ¬R → ¬Q) (h2 : ¬Q → ¬P)',
        proposition: 'P → R',
        goalLabel: '(P → R)',
        toolboxBlocks: ['contrapositive', 'forward', 'exact'],
        newTacticsBlocks: ['contrapositive'],
        newTacticsInfo: [contrapositiveInfo],
        introduction: `# הוכחה בקונטרפוזיציה

ביחידה 1, שלב 4, ראיתם בטבלת אמת ש־α → β ≡ ¬β → ¬α. מכאן טכניקת הוכחה מההרצאה: כדי להוכיח α → β, נוכיח את הקונטרפוזיציה. שורת הפתיחה: "נניח ¬β", ונשאר להראות ¬α. שורת הסיום: "הוכחנו ¬β → ¬α, ולכן α → β."

הבלוק ${CONTRAPOSITIVE_BLOCK} עושה זאת. כמו "נניח", הוא מחזיק את ההוכחה בתוכו.`,
        hints: [
            `גררו את הבלוק ${CONTRAPOSITIVE_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: נוכיח את הקונטרפוזיציה: נניח ¬R. עלינו להראות ¬P.`,
            `בתוכו: ${FORWARD_BLOCK} עם ¬R → ¬Q ועם ¬R, ואחריו שוב, עם ¬Q → ¬P ועם ¬Q.`,
            `¬P בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `"נוכיח את הקונטרפוזיציה: נניח ¬R. עלינו להראות ¬P. מ־¬R → ¬Q ומ־¬R נקבל ¬Q, ומ־¬Q → ¬P ומ־¬Q נקבל ¬P. הוכחנו ¬R → ¬P, ולכן P → R."`,
        startXml: goalXml('(P → R)', '(¬R → ¬Q),  (¬Q → ¬P)'),
    }),
    level(4, {
        title: 'שלוש דרכים להוכחת גרירה',
        name: 'unit7_l4_three_ways',
        variableLine: 'variable {obj : Type} {P Q R : obj → Prop}',
        params: '(h : ∀ x, (P x → R x) ∧ (R x → Q x))',
        proposition: '∀ x, P x → Q x',
        goalLabel: '∀x (P(x) → Q(x))',
        toolboxBlocks: ['forall_intro', 'forall_elim', 'and_elim', 'assume', 'forward', 'contrapositive', 'modus_tollens', 'by_contradiction', 'contradiction', 'exact'],
        introduction: `# שלוש דרכים להוכחת גרירה

הדוגמה מההרצאה. נתון: לכל x, מתקיימות P(x) → R(x) וגם R(x) → Q(x). נוכיח: לכל x, אם P(x) אז Q(x).

בכל שלוש הדרכים מתחילים ב"יהי x שרירותי", ומציבים את x בנתון. אחר כך:

- **ישירה:** נניח P(x), ומשתי הגרירות נקבל R(x) ואז Q(x).

- **קונטרפוזיציה:** נניח ¬Q(x), ונקבל ¬R(x) ואז ¬P(x).

- **בשלילה:** נניח P(x), ונניח בשלילה ¬Q(x). נקבל R(x) ואז Q(x), בסתירה. (בהרצאה מניחים את שתיהן בבת אחת: "נניח בשלילה P(x) וגם ¬Q(x)".)

נסו את שלוש הדרכים: בארגז יש את כל המהלכים שהן צריכות.`,
        hints: [
            `גררו את הבלוק ${FORALL_INTRO_BLOCK} אל תוך בלוק המטרה, ובתוכו ${FORALL_ELIM_BLOCK} עם הנתון ועם x, ואחריו ${AND_ELIM_BLOCK}. עכשיו בידינו P(x) → R(x) ו־R(x) → Q(x).`,
            `ישירה: ${ASSUME_BLOCK}, ובתוכו פעמיים ${FORWARD_BLOCK}: מ־P(x) → R(x) ומ־P(x), ואחר כך מ־R(x) → Q(x) ומ־R(x). ואז ${CLOSE_BLOCK}.`,
            `קונטרפוזיציה: ${CONTRAPOSITIVE_BLOCK}, ובתוכו פעמיים ${MT_BLOCK}: מ־R(x) → Q(x) ומ־¬Q(x), ואחר כך מ־P(x) → R(x) ומ־¬R(x).`,
            'בשלילה: "נניח" P(x), ובתוכו "נניח בשלילה" ¬Q(x). בתוכו נקבל R(x) ואז Q(x), ואז "קיבלנו Q(x) וגם ¬Q(x), בסתירה."',
        ],
        conclusion: `שלוש ההוכחות מהשקף, ובכל אחת שורת הסיום של המבנה שלה: "לכן P(x) → Q(x)", "הוכחנו ¬Q(x) → ¬P(x), ולכן P(x) → Q(x)", "קיבלנו סתירה, ולכן Q(x)". ובסוף כולן: "מאחר ש־x שרירותי, ∀x (P(x) → Q(x))."`,
        startXml: goalXml('∀x (P(x) → Q(x))', '∀x ((P(x) → R(x)) ∧ (R(x) → Q(x)))'),
    }),
    level(5, {
        title: 'פרדוקס הספר',
        name: 'unit7_l5_barber',
        variableLine: 'variable {obj : Type} {Shaves : obj → obj → Prop}',
        proposition: '¬∃ b, ∀ y, Shaves b y ↔ ¬Shaves y y',
        goalLabel: '¬∃b (∀y (Shaves(b,y) ↔ ¬Shaves(y,y)))',
        claims: ['Shaves b b'],
        toolboxBlocks: ['not_intro', 'exists_elim', 'forall_elim', 'iff_elim', 'em_cases', 'forward', 'contradiction'],
        newTacticsBlocks: ['em_cases'],
        newTacticsInfo: [casesInfo],
        introduction: `# פרדוקס הספר

**משפט:** אין אדם b שמספר בדיוק את כל מי שאינו מספר את עצמו. המילה הראשית היא ¬∃, ולכן נוכיח בשלילה.

ההוכחה מההרצאה: נניח בשלילה שקיים b כזה. את b קיבלנו מההנחה: נותנים לו שם, אבל לא בוחרים אותו. ההנחה עליו היא הנחת "לכל", ולכן מותר להציב בה כל y ש*אנחנו בוחרים*: נבחר y = b, ונקבל Shaves(b,b) ↔ ¬Shaves(b,b).

אחר כך נחלק למקרים: Shaves(b,b), או ¬Shaves(b,b). לזה יש מהלך חדש, ${CASES_BLOCK}: כל טענה נכונה או לא נכונה. בשני המקרים נקבל טענה ואת שלילתה, בסתירה.`,
        hints: [
            'גררו את הבלוק "נניח בשלילה את הטענה שהמטרה שוללת..." אל תוך בלוק המטרה. בתוכו: לפי ה"קיים" שהנחנו, יהי b כזה.',
            `${FORALL_ELIM_BLOCK}: בהנחה על b נציב y = b. אחר כך "מ־ ? נקבל את שני הכיוונים שלו" עם Shaves(b,b) ↔ ¬Shaves(b,b).`,
            `${CASES_BLOCK} עם Shaves(b,b). במקרה 1, מהגרירה Shaves(b,b) → ¬Shaves(b,b) נקבל ¬Shaves(b,b); במקרה 2, מהגרירה השנייה נקבל Shaves(b,b).`,
            'בכל מקרה: "קיבלנו ? וגם את השלילה שלה, בסתירה." עם Shaves(b,b).',
        ],
        conclusion: `"נניח בשלילה שקיים b כזה. נציב y = b ונקבל Shaves(b,b) ↔ ¬Shaves(b,b). נחלק למקרים. בשני המקרים קיבלנו טענה ואת שלילתה, בסתירה. לכן הנחת השלילה שגויה, ואין b כזה."
באותו מבנה בדיוק נוכיח בהרצאה הבאה את פרדוקס ראסל.`,
        startXml: goalXml('¬∃b (∀y (Shaves(b,y) ↔ ¬Shaves(y,y)))'),
    }),
    level(6, {
        title: 'הוכחת "וגם": פינגווינים',
        name: 'unit7_l6_penguins',
        variableLine: 'variable {obj : Type} {Penguin Bird Swims : obj → Prop}',
        params: '(h1 : ∀ x, Penguin x → Bird x) (h2 : ∀ x, Penguin x → Swims x)',
        proposition: '∀ x, Penguin x → Bird x ∧ Swims x',
        goalLabel: '∀x (Penguin(x) → (Bird(x) ∧ Swims(x)))',
        toolboxBlocks: ['forall_intro', 'assume', 'and_intro', 'forall_elim', 'forward', 'exact'],
        introduction: `# הוכחת "וגם"

נתון: כל פינגווין הוא ציפור, וכל פינגווין שוחה. נוכיח: כל פינגווין הוא ציפור ושוחה.

המילים הראשיות, מבחוץ פנימה: ∀, אחר כך →, ובמסקנה ∧. לכן: יהי x שרירותי, ונניח Penguin(x). אחר כך נוכיח את שני החלקים: בכל חלק נציב את x בנתון המתאים, ונשתמש בכך ש־Penguin(x).`,
        hints: [
            `${FORALL_INTRO_BLOCK}, ובתוכו ${ASSUME_BLOCK}.`,
            `בתוך "נניח": ${AND_INTRO_BLOCK}`,
            `בחלק הראשון: ${FORALL_ELIM_BLOCK} בנתון הראשון עם x, ואחר כך ${FORWARD_BLOCK} עם Penguin(x) → Bird(x) ועם Penguin(x). בחלק השני אותו דבר, בנתון השני.`,
        ],
        conclusion: `"יהי x שרירותי, ונניח Penguin(x). החלק הראשון: נציב את x בנתון הראשון ונקבל Penguin(x) → Bird(x), ולכן Bird(x). החלק השני: באותו אופן, Swims(x). הוכחנו את שני החלקים, ולכן Bird(x) ∧ Swims(x). מאחר ש־x כללי, הטענה נכונה לכל x."`,
        startXml: goalXml('∀x (Penguin(x) → (Bird(x) ∧ Swims(x)))', '∀x (Penguin(x) → Bird(x)),  ∀x (Penguin(x) → Swims(x))'),
    }),
    level(7, {
        title: 'הוכחת "או": בוחן או עבודה',
        name: 'unit7_l7_quiz_or_project',
        variableLine: 'variable {obj : Type} {Quiz Project : obj → Prop}',
        proposition: '(∀ x, Quiz x ∨ Project x) → ((∀ x, Quiz x) ∨ (∃ x, Project x))',
        goalLabel: '((∀x (Quiz(x) ∨ Project(x))) → ((∀x (Quiz(x))) ∨ (∃x (Project(x)))))',
        laws: ['easylean_not_forall'],
        toolboxBlocks: ['assume', 'or_by_negation', 'replace', 'exists_elim', 'forall_elim', 'or_elim', 'exfalso', 'contradiction', 'exists_intro', 'exact'],
        newTacticsBlocks: ['or_by_negation'],
        newTacticsInfo: [orByNegationInfo],
        introduction: `# הוכחת "או"

**טענה:** אם כל סטודנט עבר את הבוחן או הגיש עבודה, אז כולם עברו את הבוחן, *או* שמישהו הגיש עבודה.

המילה הראשית היא →, ובמסקנה ∨. כמו בהרצאה, להוכחת α ∨ β נוכיח את הגרירה השקולה ¬α → β: נניח ¬∀x (Quiz(x)), ונוכיח ∃x (Project(x)). לזה יש מהלך חדש, ${OR_BY_NEGATION_BLOCK}

אחר כך, כמו בהרצאה: ¬∀x (Quiz(x)) פירושו (שלילת כמת) ∃x (¬Quiz(x)). יהי x כזה. נציב אותו בהנחה הראשונה ונקבל Quiz(x) ∨ Project(x). מאחר ש־¬Quiz(x), מתקיים Project(x), ו־x הוא עד ל־∃x (Project(x)).`,
        hints: [
            `${ASSUME_BLOCK}, ובתוכו ${OR_BY_NEGATION_BLOCK} עכשיו כתוב בו: נניח ¬∀x (Quiz(x)). עלינו להראות ∃x (Project(x)).`,
            'לפי השקילות של שלילת "לכל", החליפו בהנחה ¬∀x (Quiz(x)): עכשיו בידינו ∃x (¬Quiz(x)).',
            `${EXISTS_ELIM_BLOCK} עם ∃x (¬Quiz(x)), ואחריו ${FORALL_ELIM_BLOCK} בהנחה הראשונה עם x.`,
            `"נחלק למקרים לפי ?" עם Quiz(x) ∨ Project(x). במקרה 1 יש סתירה עם ¬Quiz(x): "מסתירה נובע הכול", ובתוכו "קיבלנו ...". במקרה 2: ${EXISTS_INTRO_BLOCK} עם x, ובתוכו ${CLOSE_BLOCK}`,
        ],
        conclusion: `"נניח ¬∀x (Quiz(x)), כלומר ∃x (¬Quiz(x)). יהי x כזה. נציב את x בהנחה הראשונה: Quiz(x) ∨ Project(x). מאחר ש־¬Quiz(x), מתקיים Project(x), ולכן x הוא עד ל־∃x (Project(x)). הוכחנו ¬α → β, ולכן α ∨ β."
שימו לב: אי אפשר להחליף כאן את ∃x (Project(x)) ב־∀x (Project(x)). זו בדיוק הטעות "פילוג לכל על או".`,
        startXml: goalXml('((∀x (Quiz(x) ∨ Project(x))) → ((∀x (Quiz(x))) ∨ (∃x (Project(x)))))'),
    }),
    level(8, {
        title: 'הוכחת "לכל": הדלתות',
        name: 'unit7_l8_doors',
        variableLine: 'variable {obj : Type} {Locked Floor2 : obj → Prop}',
        proposition: '(∀ x, Locked x) → ∀ x, Floor2 x → Locked x',
        goalLabel: '((∀x (Locked(x))) → (∀x (Floor2(x) → Locked(x))))',
        toolboxBlocks: ['assume', 'forall_intro', 'forall_elim', 'exact'],
        introduction: `# הוכחת "לכל"

אם כל הדלתות נעולות, אז כל דלת בקומה 2 נעולה.

כדי להוכיח ∀x (α(x)) פותחים ב"יהי x ...": בוחרים x *כללי*, שעליו לא מניחים דבר מלבד מה שנתון. מרגע זה x הוא משתנה חופשי בהוכחה: הוא מייצג ערך מסוים אבל שרירותי. ובסוף: "מאחר ש־x כללי, הטענה נכונה לכל x."`,
        hints: [
            `${ASSUME_BLOCK}, ובתוכו ${FORALL_INTRO_BLOCK}, ובתוכו שוב ${ASSUME_BLOCK} (המילה הראשית בפנים היא →).`,
            `${FORALL_ELIM_BLOCK}: בהנחה ∀x (Locked(x)) נציב את x. ואז ${CLOSE_BLOCK}.`,
        ],
        conclusion: `"נניח ∀x (Locked(x)). יהי x כלשהו. נניח Floor2(x). נציב את x בהנחה ונקבל Locked(x). לכן Floor2(x) → Locked(x). מאחר ש־x היה כללי, הטענה נכונה לכל x."`,
        startXml: goalXml('((∀x (Locked(x))) → (∀x (Floor2(x) → Locked(x))))'),
    }),
    level(9, {
        title: 'הוכחת "קיים": לכל אחד יש חבר',
        name: 'unit7_l9_friends',
        variableLine: 'variable {obj : Type} {Friend : obj → obj → Prop}',
        proposition: '(∀ x, Friend x x) → ∀ x, ∃ y, Friend x y',
        goalLabel: '((∀x (Friend(x,x))) → (∀x (∃y (Friend(x,y)))))',
        toolboxBlocks: ['assume', 'forall_intro', 'exists_intro', 'forall_elim', 'exact'],
        introduction: `# הוכחת "קיים"

אם כל אחד הוא חבר של עצמו, אז לכל אחד יש חבר.

כדי להוכיח ∃y (α(y)) מספיק להציג דוגמה: לבחור ערך מסוים של y ולבדוק שהוא מקיים את α. כשיש ∀ ואחריו ∃, הבחירה יכולה להיות תלויה במשתנה שכבר קבענו: כאן נבחר y = x.`,
        hints: [
            `${ASSUME_BLOCK}, ובתוכו ${FORALL_INTRO_BLOCK}.`,
            `בתוכו: ${EXISTS_INTRO_BLOCK} עם x. עכשיו כתוב בו: נבחר y = x. עלינו להראות Friend(x,x).`,
            `${FORALL_ELIM_BLOCK}: בהנחה נציב את x, ואז ${CLOSE_BLOCK}.`,
        ],
        conclusion: `"נניח ∀x (Friend(x,x)). יהי x. נבחר y = x, שתלוי ב־x החופשי. מההנחה Friend(x,x). לכן קיים y כזה. מאחר ש־x כללי, הטענה נכונה לכל x."`,
        startXml: goalXml('((∀x (Friend(x,x))) → (∀x (∃y (Friend(x,y)))))'),
    }),
    level(10, {
        title: 'שני כמתים: מי שמכיר את כולם',
        name: 'unit7_l10_knows',
        variableLine: 'variable {obj : Type} {Knows : obj → obj → Prop}',
        proposition: '(∃ x, ∀ y, Knows x y) → ∀ y, ∃ x, Knows x y',
        goalLabel: '((∃x (∀y (Knows(x,y)))) → (∀y (∃x (Knows(x,y)))))',
        toolboxBlocks: ['assume', 'exists_elim', 'forall_intro', 'exists_intro', 'forall_elim', 'exact'],
        introduction: `# שני כמתים

אם יש מישהו שמכיר את כולם, אז כל אחד מוכר על ידי מישהו.

- הנחת "קיים": יהי x כך ש־∀y (Knows(x,y)). את x *קיבלנו*: נותנים לו שם, אבל לא בוחרים אותו.

- המסקנה היא "לכל": יהי y כלשהו. נבחר עד: את x שקיבלנו. נציב את y בהנחה על x.

סדר הכמתים חשוב: ההפך אינו נכון. אם כל אחד מוכר על ידי מישהו, לא בהכרח יש מישהו שמכיר את כולם.`,
        hints: [
            `${ASSUME_BLOCK}, ובתוכו ${EXISTS_ELIM_BLOCK} עם ההנחה.`,
            `${FORALL_INTRO_BLOCK}, ובתוכו ${EXISTS_INTRO_BLOCK} עם x.`,
            `${FORALL_ELIM_BLOCK}: ב־∀y (Knows(x,y)) נציב את y. ואז ${CLOSE_BLOCK}.`,
        ],
        conclusion: `"יהי x כך ש־∀y (Knows(x,y)). יהי y כלשהו. נבחר את x כעד. נציב את y בהנחה על x ונקבל Knows(x,y). לכן קיים x כזה. מאחר ש־y שרירותי, ∀y (∃x (Knows(x,y)))."`,
        startXml: goalXml('((∃x (∀y (Knows(x,y)))) → (∀y (∃x (Knows(x,y)))))'),
    }),
    level(11, {
        title: 'טווח: על מה חלה כל מילה?',
        name: 'unit7_l11_scope',
        variableLine: 'variable {obj : Type} {Trusts : obj → obj → Prop}',
        proposition: '∀ x, (∀ y, Trusts x y) → Trusts x x',
        goalLabel: '∀x ((∀y (Trusts(x,y))) → Trusts(x,x))',
        toolboxBlocks: ['forall_intro', 'assume', 'forall_elim', 'exact'],
        introduction: `# טווח

מיקום הכמת קובע על מה הוא חל. השוו, כש־Trusts(x,y) פירושו "x סומך על y":

- **טענה 1:** לכל x: אם x סומך על *כולם*, אז x סומך על עצמו. ∀x ((∀y (Trusts(x,y))) → Trusts(x,x)). אמיתית: אותה תוכיחו כאן.

- **טענה 2:** לכל x: אם x סומך על *מישהו*, אז x סומך על עצמו. ∀x ((∃y (Trusts(x,y))) → Trusts(x,x)). שקרית: שני אנשים, a ו־b, ו־a סומך רק על b.

ההבדל הוא במילה הראשית של ההנחה: הנחת "לכל y" מאפשרת לנו *לבחור* איזה y להציב.`,
        hints: [
            `${FORALL_INTRO_BLOCK}, ובתוכו ${ASSUME_BLOCK}.`,
            `${FORALL_ELIM_BLOCK}: ב־∀y (Trusts(x,y)) נציב y = x. ואז ${CLOSE_BLOCK}.`,
        ],
        conclusion: `"יהי x. נניח ∀y (Trusts(x,y)). בפרט, נציב y = x ונקבל Trusts(x,x)."
בטענה 2 ההנחה היא "קיים y": היא נותנת y אחד שאיננו בוחרים, ואולי זה דווקא מישהו אחר, שלא אומר כלום על x עצמו.`,
        startXml: goalXml('∀x ((∀y (Trusts(x,y))) → Trusts(x,x))'),
    }),
    level(12, {
        title: 'חלוקה למקרים: גשם',
        name: 'unit7_l12_rain',
        variableLine: 'variable {obj : Type} {Rain Bus Bike : obj → Prop}',
        params: '(h1 : ∀ d, Rain d → Bus d) (h2 : ∀ d, ¬Rain d → Bike d)',
        proposition: '∀ d, Bus d ∨ Bike d',
        goalLabel: '∀d (Bus(d) ∨ Bike(d))',
        claims: ['Rain d'],
        toolboxBlocks: ['forall_intro', 'em_cases', 'forall_elim', 'forward', 'or_intro', 'exact'],
        introduction: `# חלוקה למקרים

נתון: בימים גשומים נוסעים באוטובוס, ובימים לא גשומים רוכבים על אופניים. נוכיח: בכל יום נוסעים באוטובוס או רוכבים.

כשקל יותר לטפל בכמה מצבים בנפרד, מחלקים למקרים שמכסים את *כל* האפשרויות. כאן: Rain(d) או ¬Rain(d), כמו בשלב 5.`,
        hints: [
            `${FORALL_INTRO_BLOCK}, ובתוכו ${CASES_BLOCK} עם Rain(d).`,
            `במקרה 1: ${FORALL_ELIM_BLOCK} בנתון הראשון עם d, ואחר כך ${FORWARD_BLOCK} עם Rain(d) → Bus(d) ועם Rain(d).`,
            'עכשיו Bus(d) בידינו: "כדי להוכיח את ה"או" נוכיח את ?" עם Bus(d), ובתוכו "המטרה בידינו...".',
            'במקרה 2 אותו דבר, בנתון השני, ובצד Bike(d).',
        ],
        conclusion: `"יהי d שרירותי. נחלק למקרים: Rain(d) או ¬Rain(d). מקרה 1: מהנתון הראשון Bus(d), ולכן Bus(d) ∨ Bike(d). מקרה 2: מהנתון השני Bike(d), ולכן Bus(d) ∨ Bike(d). המקרים מכסים את כל האפשרויות, ובשניהם מתקיימת המסקנה. מאחר ש־d כללי, הטענה נכונה לכל d."
סיימתם את היחידה ואת כל מבני ההוכחה של ההרצאה.`,
        startXml: goalXml('∀d (Bus(d) ∨ Bike(d))', '∀d (Rain(d) → Bus(d)),  ∀d (¬Rain(d) → Bike(d))'),
    }),
];
