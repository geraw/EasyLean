import { goalXml } from './levelXml';

// Unit 6 (see blocks/moves.js): logical equivalences, as the replacement
// rules of Copi and Hurley. The laws of the connectives were proved in the
// truth tables of unit 1; the laws of the quantifiers, which no table can
// check, were proved in unit 5 in one direction, and the first two levels
// complete them. Then the move "לפי השקילות" replaces a statement by an
// equivalent one, also inside a larger statement, by a law already proved
// (LAWS in blocks/moves.js). Each level offers only the moves and the laws of
// its solutions.

export const unit6WorldName = 'יחידה 6 - שקילויות לוגיות';

const PROPOSITIONS = 'variable {P Q : Prop}';
const DOMAIN = 'variable {obj : Type} {P : obj → Prop}';
const RELATION = 'variable {obj : Type} {R : obj → obj → Prop}';
const TWO_PROPERTIES = 'variable {obj : Type} {P Q : obj → Prop}';

// The moves as the toolbox shows them, before they are placed.
const ASSUME_BLOCK = '"נניח את התנאי של הגרירה..."';
const REPLACE_BLOCK = '"לפי השקילות ? נחליף ..."';
const CLOSE_BLOCK = '"המטרה בידינו, וזה מה שעלינו להראות."';
const NOT_INTRO_BLOCK = '"נניח בשלילה את הטענה שהמטרה שוללת..."';
const CONTRADICTION_BLOCK = '"קיבלנו ? וגם את השלילה שלה, בסתירה."';

const replaceInfo = {
    name: 'החלפה לפי שקילות',
    doc: 'אם A ↔ B, מותר להחליף את A ב־B, או את B ב־A, גם בתוך טענה גדולה יותר: במטרה, או בטענה שבידינו, ואז התוצאה מצטרפת להנחות. משתמשים רק בשקילויות שכבר הוכחו: בטבלת אמת (יחידה 1), או בשני הכיוונים במהלכים. בהוכחה כתובה: "לפי השקילות ¬(A ∨ B) ↔ (¬A ∧ ¬B), נחליף את ¬(P ∨ Q) ב־(¬P ∧ ¬Q)".',
};

// The laws, as cards in the levels that offer them.
const law = (symbol, doc) => ({ label: 'שקילות', symbol, doc });
const deMorganOr = law('דה מורגן ל"או"', '¬(A ∨ B) ↔ (¬A ∧ ¬B). בדקתם אותה בטבלת אמת ביחידה 1, שלב 6.');
const implicationAsOr = law('גרירה כ"או"', '(A → B) ↔ (¬A ∨ B). בדקתם אותה בטבלת אמת ביחידה 1, שלב 4.');
const contrapositive = law('קונטרה־פוזיציה', '(A → B) ↔ (¬B → ¬A). בדקתם אותה בטבלת אמת ביחידה 1, שלב 4.');
const doubleNegation = law('שלילה כפולה', '¬¬A ↔ A. בדקתם אותה בטבלת אמת ביחידה 1, שלב 5. מחליפים רק את ¬¬A ב־A: בכיוון ההפוך, כל טענה היא מהצורה A.');
const notForall = law('שלילה של "לכל"', '¬∀x (P(x)) ↔ ∃x (¬P(x)). הכיוון → הוא יחידה 5, שלב 10, והכיוון ← הוא שלב 2 ביחידה הזאת. אותה אי אפשר לבדוק בטבלת אמת.');
const notImplies = law('שלילה של גרירה', '¬(A → B) ↔ (A ∧ ¬B). בדקתם אותה בטבלת אמת ביחידה 1, שלב 5.');
const orAsImplication = law('"או" כגרירה', '(¬A → B) ↔ (A ∨ B). בדקתם אותה בטבלת אמת ביחידה 1, שלב 3 (המטריה).');
const deMorganAnd = law('דה מורגן ל"וגם"', '¬(A ∧ B) ↔ (¬A ∨ ¬B). בדקתם אותה בטבלת אמת ביחידה 1, שלב 5.');
const notExists = law('שלילה של "קיים"', '¬∃x (P(x)) ↔ ∀x (¬P(x)). הכיוון → הוא יחידה 5, שלב 8, והכיוון ← הוא שלב 1 ביחידה הזאת. אותה אי אפשר לבדוק בטבלת אמת.');

const level = (number, fields) => ({
    id: `unit6-${number}`,
    levelNumber: number,
    totalLevels: 13,
    variableLine: PROPOSITIONS,
    params: '',
    objects: [],
    assumptions: [],
    newTacticsBlocks: [],
    newTacticsInfo: [],
    newDefinitions: [],
    ...fields,
});

export const unit6Levels = [
    level(1, {
        title: 'משלימים את השלילה של "קיים"',
        name: 'unit6_l1_not_exists_back',
        variableLine: DOMAIN,
        proposition: '(∀ x, ¬P x) → ¬∃ x, P x',
        goalLabel: '((∀x (¬P(x))) → ¬∃x (P(x)))',
        toolboxBlocks: ['assume', 'not_intro', 'exists_elim', 'forall_elim', 'contradiction'],
        introduction: `# שקילויות בהוכחות

ביחידה 1 בדקתם בטבלאות אמת שקילויות של הקשרים: גרירה כ"או", קונטרה־פוזיציה, דה מורגן, שלילה כפולה ושלילה של גרירה. ביחידה הזאת נשתמש בהן כמו בהוכחה כתובה: נחליף טענה בטענה ששקולה לה, גם בתוך טענה גדולה יותר. האותיות A ו־B בשקילויות הן כמו α ו־β בטבלאות: כל טענה.

את השקילויות של הכמתים אי אפשר לבדוק בטבלה. ביחידה 5 הוכחתם כל אחת מהן בכיוון אחד, ושני השלבים הראשונים משלימים את הכיוון השני.

ביחידה 5, שלב 8, הוכחתם ש־\`(¬∃x (P(x))) → (∀x (¬P(x)))\`. כאן מוכיחים את הכיוון ההפוך: אם אף עצם לא מקיים את P, אז לא קיים עצם שמקיים את P.`,
        hints: [
            `נניח ∀x (¬P(x)). עלינו להראות ¬∃x (P(x)). גררו לתוך הבלוק את הבלוק ${NOT_INTRO_BLOCK}. עכשיו כתוב בו: נניח בשלילה ∃x (P(x)). עלינו להגיע לסתירה.`,
            'בתוכו: לפי ∃x (P(x)) יהי x כזה, כלומר P(x).',
            `ב־∀x (¬P(x)) נציב את x, ונקבל ¬P(x). אחר כך ${CONTRADICTION_BLOCK}, עם P(x).`,
        ],
        conclusion: 'עכשיו ¬∃x (P(x)) ↔ ∀x (¬P(x)) היא שקילות: "לא קיים" פירושו "לכל ... לא".',
        startXml: goalXml('((∀x (¬P(x))) → ¬∃x (P(x)))'),
    }),
    level(2, {
        title: 'משלימים את השלילה של "לכל"',
        name: 'unit6_l2_not_forall_back',
        variableLine: DOMAIN,
        proposition: '(∃ x, ¬P x) → ¬∀ x, P x',
        goalLabel: '((∃x (¬P(x))) → ¬∀x (P(x)))',
        toolboxBlocks: ['assume', 'not_intro', 'exists_elim', 'forall_elim', 'contradiction'],
        introduction: `# משלימים את השלילה של "לכל"

ביחידה 5, שלב 10, הוכחתם ש־\`(¬∀x (P(x))) → (∃x (¬P(x)))\`. זה היה שלב הבונוס, כי צריך שם הוכחה בשלילה. הכיוון ההפוך קל: אם יש עצם שלא מקיים את P, אז לא כל העצמים מקיימים את P.`,
        hints: [
            `נניח ∃x (¬P(x)). עלינו להראות ¬∀x (P(x)). גררו לתוך הבלוק את הבלוק ${NOT_INTRO_BLOCK}. עכשיו כתוב בו: נניח בשלילה ∀x (P(x)). עלינו להגיע לסתירה.`,
            'בתוכו: לפי ∃x (¬P(x)) יהי x כזה, כלומר ¬P(x).',
            `ב־∀x (P(x)) נציב את x, ונקבל P(x). אחר כך ${CONTRADICTION_BLOCK}, עם P(x).`,
        ],
        conclusion: `עכשיו ¬∀x (P(x)) ↔ ∃x (¬P(x)) היא שקילות: "לא לכל" פירושו "קיים ... לא".
עכשיו גם השקילויות של הכמתים הוכחו בשני הכיוונים, ומהשלב הבא משתמשים בהן, יחד עם השקילויות מהטבלאות.`,
        startXml: goalXml('((∃x (¬P(x))) → ¬∀x (P(x)))'),
    }),
    level(3, {
        title: 'במקום גרירה, "או"',
        name: 'unit6_l3_replace_goal',
        params: '(h : ¬P)',
        proposition: 'P → Q',
        goalLabel: '(P → Q)',
        laws: ['easylean_imp_or'],
        toolboxBlocks: ['replace', 'or_intro', 'exact'],
        introduction: `# במקום גרירה, "או"

לפי השקילות \`(A → B) ↔ (¬A ∨ B)\`, שבדקתם בטבלת אמת ביחידה 1, שלב 4, להוכיח את P → Q זה כמו להוכיח את ¬P ∨ Q. מותר להחליף את המטרה בטענה ששקולה לה.

הבלוק ${REPLACE_BLOCK} עושה זאת: בוחרים בו את השקילות ואת המקום, המטרה או טענה שבידינו, ובשורה "נחליף" רואים מה יוחלף במה. אפשר לבחור שם גם את הכיוון ההפוך של השקילות, ואם יש כמה חלקים מאותה צורה, להחליף את כולם.
כאן נתונה ההנחה ¬P. אחרי ההחלפה, המטרה היא ¬P ∨ Q, ו־¬P בידינו.`,
        newTacticsBlocks: ['replace'],
        newTacticsInfo: [replaceInfo],
        newDefinitions: [implicationAsOr],
        hints: [
            `גררו את הבלוק ${REPLACE_BLOCK} אל תוך בלוק המטרה. בחרו בו את השקילות (A → B) ↔ (¬A ∨ B) ואת המטרה. עכשיו כתוב בו: נחליף את (P → Q) ב־(¬P ∨ Q).`,
            'עכשיו המטרה היא ¬P ∨ Q: הוסיפו אחריו את הבלוק "כדי להוכיח את ה"או" נוכיח את ?", ובחרו בו את ¬P. עכשיו כתוב בו: כדי להוכיח ¬P ∨ Q נוכיח את ¬P.',
            `¬P בידינו: גררו לתוך הבלוק את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `ההוכחה: "לפי השקילות (A → B) ↔ (¬A ∨ B), נחליף את P → Q ב־¬P ∨ Q. כדי להוכיח ¬P ∨ Q נוכיח את ¬P: ¬P בידינו, וזה מה שעלינו להראות. לכן ¬P ∨ Q."
גרירה שהתנאי שלה לא נכון היא נכונה, מה שלא תהיה המסקנה. זו *אמת ריקה*.`,
        startXml: goalXml('(P → Q)', '¬P'),
    }),
    level(4, {
        title: 'מחליפים בהנחה',
        name: 'unit6_l4_replace_assumption',
        params: '(h : ¬(P ∨ Q))',
        proposition: '¬Q',
        goalLabel: '¬Q',
        laws: ['easylean_not_or'],
        toolboxBlocks: ['replace', 'and_elim', 'exact'],
        introduction: `# מחליפים בהנחה

אפשר להחליף גם בטענה שבידינו. אז הטענה החדשה מצטרפת להנחות, והישנה נשארת.

ביחידה 4, שלב 4, הוכחתם את ¬P מתוך ¬(P ∨ Q) בכללי השלילה. כאן מוכיחים את ¬Q בדרך אחרת: לפי דה מורגן, ¬(P ∨ Q) שקולה ל־¬P ∧ ¬Q, ומה"וגם" נקבל את שני החלקים שלו.`,
        newDefinitions: [deMorganOr],
        hints: [
            `גררו את הבלוק ${REPLACE_BLOCK} אל תוך בלוק המטרה. בחרו בו את דה מורגן ואת ההנחה ¬(P ∨ Q). עכשיו כתוב בו: נחליף את ¬(P ∨ Q) ב־(¬P ∧ ¬Q).`,
            'עכשיו בידינו ¬P ∧ ¬Q: הוסיפו אחריו את הבלוק "מ־ ? נקבל את שני החלקים של ה"וגם"." עם ¬P ∧ ¬Q. עכשיו כתוב בו: מ־¬P ∧ ¬Q נקבל ¬P וגם ¬Q.',
            `¬Q בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `ההוכחה: "לפי דה מורגן, ¬(P ∨ Q) פירושו ¬P ∧ ¬Q. מ־¬P ∧ ¬Q נקבל ¬P וגם ¬Q, ו־¬Q הוא מה שעלינו להראות."
ביחידה 4 בניתם הוכחה כזאת מהכללים. שקילות שהוכחה פעם אחת חוסכת את העבודה בכל פעם שצריך אותה.`,
        startXml: goalXml('¬Q', '¬(P ∨ Q)'),
    }),
    level(5, {
        title: 'קונטרה־פוזיציה כשיטת הוכחה',
        name: 'unit6_l5_contrapositive',
        proposition: '(¬Q → ¬P) → (P → Q)',
        goalLabel: '((¬Q → ¬P) → (P → Q))',
        laws: ['easylean_contrapositive'],
        toolboxBlocks: ['assume', 'replace', 'exact'],
        introduction: `# קונטרה־פוזיציה כשיטת הוכחה

במתמטיקה מוכיחים הרבה פעמים גרירה דרך ה*קונטרה־פוזיציה* שלה: במקום "אם P אז Q" מוכיחים "אם לא Q אז לא P".
ביחידה 4, שלב 9, הוכחתם את הטענה הזאת בהוכחה בשלילה. עכשיו, כשהקונטרה־פוזיציה היא שקילות (יחידה 1, שלב 4), מספיקים מהלכים ספורים.`,
        newDefinitions: [contrapositive],
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה. עכשיו כתוב בו: נניח ¬Q → ¬P. עלינו להראות P → Q.`,
            `גררו לתוך הבלוק "נניח" את הבלוק ${REPLACE_BLOCK}, ובחרו בו את הקונטרה־פוזיציה ואת המטרה. עכשיו כתוב בו: נחליף את (P → Q) ב־(¬Q → ¬P).`,
            `¬Q → ¬P בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
            'או: במקום להחליף במטרה, החליפו בהנחה ¬Q → ¬P, ובחרו את הכיוון "את (¬Q → ¬P) ב־(P → Q)". עכשיו P → Q בידינו.',
        ],
        conclusion: `ביחידה 4 ההוכחה הזאת דרשה הוכחה בשלילה. כאן היא החלפה אחת: "נניח ¬Q → ¬P. עלינו להראות P → Q. לפי הקונטרה־פוזיציה, להוכיח P → Q זה כמו להוכיח ¬Q → ¬P, ו־¬Q → ¬P בידינו. לכן (¬Q → ¬P) → (P → Q)."`,
        startXml: goalXml('((¬Q → ¬P) → (P → Q))'),
    }),
    level(6, {
        title: 'שרשרת של החלפות',
        name: 'unit6_l6_chain',
        proposition: '¬(P ∨ ¬Q) → (¬P ∧ Q)',
        goalLabel: '(¬(P ∨ ¬Q) → (¬P ∧ Q))',
        laws: ['easylean_not_or', 'easylean_not_not'],
        toolboxBlocks: ['assume', 'replace', 'exact'],
        introduction: `# שרשרת של החלפות

אפשר להחליף גם *בתוך* טענה, ולהחליף כמה פעמים ברצף, כמו בחישוב: ¬(P ∨ ¬Q) ↔ (¬P ∧ ¬¬Q) ↔ (¬P ∧ Q).
בהחלפה השנייה מחליפים רק את הצד הימני של ה"וגם", ¬¬Q, ב־Q.`,
        newDefinitions: [doubleNegation],
        hints: [
            'נניח ¬(P ∨ ¬Q). עלינו להראות ¬P ∧ Q.',
            `בתוך הבלוק "נניח", לפי דה מורגן, החליפו בהנחה ¬(P ∨ ¬Q): "נחליף את ¬(P ∨ ¬Q) ב־(¬P ∧ ¬¬Q)".`,
            'לפי השלילה הכפולה, החליפו בהנחה ¬P ∧ ¬¬Q: "נחליף את ¬¬Q ב־Q". עכשיו בידינו ¬P ∧ Q.',
            `¬P ∧ Q בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `ההוכחה היא שרשרת של שקילויות: ¬(P ∨ ¬Q) שקולה ל־¬P ∧ ¬¬Q, וזו שקולה ל־¬P ∧ Q.
כך מוכיחים זהויות באלגברה, וכך מוכיחים גם שקילויות בלוגיקה.`,
        startXml: goalXml('(¬(P ∨ ¬Q) → (¬P ∧ Q))'),
    }),
    level(7, {
        title: 'דוחפים את השלילה פנימה',
        name: 'unit6_l7_push_negation',
        variableLine: RELATION,
        proposition: '(¬∀ x, ∃ y, R x y) → (∃ x, ∀ y, ¬R x y)',
        goalLabel: '((¬∀x (∃y (R(x,y)))) → (∃x (∀y (¬R(x,y)))))',
        laws: ['easylean_not_forall', 'easylean_not_exists'],
        toolboxBlocks: ['assume', 'replace', 'exact'],
        introduction: `# דוחפים את השלילה פנימה

R(x,y) היא *יחס* בין שני עצמים, למשל "x מכיר את y". הטענה ∀x (∃y (R(x,y))) אומרת: כל אחד מכיר מישהו.
מה פירוש השלילה שלה? מעבירים את השלילה פנימה, כמת אחר כמת, ובכל מעבר "לכל" הופך ל"קיים" ולהפך:
¬∀x (∃y (R(x,y))) ↔ ∃x (¬∃y (R(x,y))) ↔ ∃x (∀y (¬R(x,y))). כלומר: יש מישהו שלא מכיר אף אחד.
בהחלפה השנייה מחליפים בתוך ה"קיים", מתחת ל־∃x.`,
        newDefinitions: [notForall, notExists],
        hints: [
            'נניח ¬∀x (∃y (R(x,y))). עלינו להראות ∃x (∀y (¬R(x,y))).',
            'בתוך הבלוק "נניח", לפי השלילה של "לכל", החליפו בהנחה ¬∀x (∃y (R(x,y))): "נחליף את ¬∀x (∃y (R(x,y))) ב־∃x (¬∃y (R(x,y)))".',
            'לפי השלילה של "קיים", החליפו בהנחה ∃x (¬∃y (R(x,y))): "נחליף את ¬∃y (R(x,y)) ב־∀y (¬R(x,y))". עכשיו בידינו ∃x (∀y (¬R(x,y))).',
            `זו המטרה: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `"לא כל אחד מכיר מישהו" פירושו "יש מישהו שלא מכיר אף אחד". כך מוצאים את השלילה של כל טענה עם כמתים: מעבירים את השלילה פנימה, ומחליפים כל כמת שהיא עוברת.`,
        startXml: goalXml('((¬∀x (∃y (R(x,y)))) → (∃x (∀y (¬R(x,y)))))'),
    }),
    level(8, {
        title: 'דוגמה נגדית',
        name: 'unit6_l8_counterexample',
        variableLine: TWO_PROPERTIES,
        proposition: '(¬∀ x, P x → Q x) → (∃ x, P x ∧ ¬Q x)',
        goalLabel: '((¬∀x (P(x) → Q(x))) → (∃x (P(x) ∧ ¬Q(x))))',
        laws: ['easylean_not_forall', 'easylean_not_imp'],
        toolboxBlocks: ['assume', 'replace', 'exact'],
        introduction: `# דוגמה נגדית

"כל P הוא Q" היא ∀x (P(x) → Q(x)). מה פירוש השלילה שלה? מעבירים את השלילה פנימה: קודם דרך ה"לכל", ואחר כך דרך הגרירה, לפי השלילה של גרירה (יחידה 1, שלב 5).
מה שמתקבל, ∃x (P(x) ∧ ¬Q(x)), הוא *דוגמה נגדית*: עצם שהוא P ואינו Q.`,
        newDefinitions: [notForall, notImplies],
        hints: [
            'נניח ¬∀x (P(x) → Q(x)). עלינו להראות ∃x (P(x) ∧ ¬Q(x)).',
            'בתוך הבלוק "נניח", לפי השלילה של "לכל", החליפו בהנחה: עכשיו בידינו ∃x (¬(P(x) → Q(x))).',
            'לפי השלילה של גרירה, החליפו בהנחה החדשה את ¬(P(x) → Q(x)) ב־(P(x) ∧ ¬Q(x)).',
            `זו המטרה: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `"לא כל P הוא Q" פירושו "יש P שאינו Q". כך מפריכים טענה כללית: מראים דוגמה נגדית.`,
        startXml: goalXml('((¬∀x (P(x) → Q(x))) → (∃x (P(x) ∧ ¬Q(x))))'),
    }),
    level(9, {
        title: 'שלילת טענה מורכבת',
        name: 'unit6_l9_negate_compound',
        variableLine: 'variable {P Q R S : Prop}',
        proposition: '¬((P ∧ Q) → (R ∨ ¬S)) → ((P ∧ Q) ∧ (¬R ∧ S))',
        goalLabel: '(¬((P ∧ Q) → (R ∨ ¬S)) → ((P ∧ Q) ∧ (¬R ∧ S)))',
        laws: ['easylean_not_imp', 'easylean_not_or', 'easylean_not_not'],
        toolboxBlocks: ['assume', 'replace', 'exact'],
        introduction: `# שלילת טענה מורכבת

התרגיל מההרצאה: נשלול את הטענה (P ∧ Q) → (R ∨ ¬S), עד שסימני השלילה יופיעו רק ליד טענות היסוד.
בכל שלב שואלים: *מהי המילה הראשית?* היא קובעת איזה כלל שלילה מפעילים.

- המילה הראשית של (P ∧ Q) → (R ∨ ¬S) היא →: לפי שלילת גרירה, השלילה היא (P ∧ Q) ∧ ¬(R ∨ ¬S).

- בחלק השני המילה הראשית היא ∨: לפי דה מורגן, ¬(R ∨ ¬S) היא ¬R ∧ ¬¬S.

- ולבסוף שלילה כפולה: ¬¬S היא S.`,
        hints: [
            'נניח ¬((P ∧ Q) → (R ∨ ¬S)). עלינו להראות (P ∧ Q) ∧ (¬R ∧ S).',
            'המילה הראשית בתוך השלילה היא →: בתוך הבלוק "נניח", לפי השלילה של גרירה, החליפו בהנחה. עכשיו בידינו (P ∧ Q) ∧ ¬(R ∨ ¬S).',
            'בחלק הימני המילה הראשית בתוך השלילה היא ∨: לפי דה מורגן ל"או", החליפו בהנחה החדשה את ¬(R ∨ ¬S) ב־(¬R ∧ ¬¬S).',
            `לפי השלילה הכפולה, החליפו את ¬¬S ב־S, ואחר כך ${CLOSE_BLOCK}.`,
        ],
        conclusion: `השלילה של (P ∧ Q) → (R ∨ ¬S) היא (P ∧ Q) ∧ (¬R ∧ S): בדיוק כש־P, Q ו־S נכונות ו־R לא.
בדיקת שפיות, כמו בהרצאה: הגרירה המקורית שקרית רק כשהתנאי נכון והמסקנה לא, כלומר בדיוק כש־P, Q ו־S אמת ו־R שקר.`,
        startXml: goalXml('(¬((P ∧ Q) → (R ∨ ¬S)) → ((P ∧ Q) ∧ (¬R ∧ S)))'),
    }),
    level(10, {
        title: 'שלילת טענה עם כמתים',
        name: 'unit6_l10_negate_quantified',
        variableLine: 'variable {obj : Type} {R : obj → obj → Prop} {Q : obj → Prop}',
        proposition: '(¬∀ x, ∃ y, R x y ∧ Q y) → (∃ x, ∀ y, ¬R x y ∨ ¬Q y)',
        goalLabel: '((¬∀x (∃y (R(x,y) ∧ Q(y)))) → (∃x (∀y (¬R(x,y) ∨ ¬Q(y)))))',
        laws: ['easylean_not_forall', 'easylean_not_exists', 'easylean_not_and'],
        toolboxBlocks: ['assume', 'replace', 'exact'],
        introduction: `# שלילת טענה עם כמתים

התרגיל השני מההרצאה: "לכל n יש m כך ש־m > n ו־m ראשוני", בצורה כללית: ∀x (∃y (R(x,y) ∧ Q(y))).

- המילה הראשית היא ∀, ובתוכה ∃. השלילה הופכת את שניהם: ∃x (∀y (¬(R(x,y) ∧ Q(y)))).

- בפנים המילה הראשית היא ∧: לפי דה מורגן ל"וגם", ¬(R(x,y) ∧ Q(y)) היא ¬R(x,y) ∨ ¬Q(y).

בהרצאה זה יוצא "יש n כך שאף מספר גדול ממנו אינו ראשוני", כלומר יש רק מספר סופי של ראשוניים.`,
        newDefinitions: [deMorganAnd],
        hints: [
            'נניח ¬∀x (∃y (R(x,y) ∧ Q(y))). עלינו להראות ∃x (∀y (¬R(x,y) ∨ ¬Q(y))).',
            'בתוך הבלוק "נניח", לפי השלילה של "לכל", ואחר כך לפי השלילה של "קיים", החליפו בהנחה, כמו בשלב 7. עכשיו בידינו ∃x (∀y (¬(R(x,y) ∧ Q(y)))).',
            'לפי דה מורגן ל"וגם", החליפו בהנחה החדשה את ¬(R(x,y) ∧ Q(y)) ב־(¬R(x,y) ∨ ¬Q(y)).',
            `זו המטרה: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `השלילה של ∀x (∃y (R(x,y) ∧ Q(y))) היא ∃x (∀y (¬R(x,y) ∨ ¬Q(y))): השלילה עברה דרך שני הכמתים, הפכה כל אחד מהם, ובסוף עברה דרך ה"וגם".`,
        startXml: goalXml('((¬∀x (∃y (R(x,y) ∧ Q(y)))) → (∃x (∀y (¬R(x,y) ∨ ¬Q(y)))))'),
    }),
    level(11, {
        title: 'הוכחת "או": נניח את השלילה של צד אחד',
        name: 'unit6_l11_or_by_assuming',
        variableLine: 'variable {P Q R : Prop}',
        params: '(h1 : ¬P → R) (h2 : R → Q)',
        proposition: 'P ∨ Q',
        goalLabel: '(P ∨ Q)',
        laws: ['easylean_or_as_imp'],
        toolboxBlocks: ['replace', 'assume', 'forward', 'exact'],
        introduction: `# הוכחת "או"

להוכיח "או" כשלא ידוע איזה צד נכון זה קשה. בהרצאה ראיתם טכניקה: כדי להוכיח α ∨ β, *נניח ¬α ונוכיח β*. למשל, כדי להוכיח ש־a = 0 או b = 0, מניחים a ≠ 0 ומוכיחים b = 0.
הטכניקה נובעת מהשקילות ¬α → β ≡ α ∨ β, שבדקתם בטבלה ביחידה 1, שלב 3 (המטריה).

כאן צריך להוכיח P ∨ Q. לפי השקילות, זה כמו להוכיח ¬P → Q: נניח ¬P ונוכיח Q, בעזרת שתי הגרירות שבידינו.`,
        newDefinitions: [orAsImplication],
        hints: [
            `גררו את הבלוק ${REPLACE_BLOCK} אל תוך בלוק המטרה. בחרו בו את השקילות (¬A → B) ↔ (A ∨ B), את המטרה, ואת הכיוון "את (P ∨ Q) ב־(¬P → Q)". עכשיו המטרה היא ¬P → Q.`,
            'אחריו: נניח ¬P. עלינו להראות Q.',
            'בתוך הבלוק "נניח": מ־¬P → R ומ־¬P נקבל R, ומ־R → Q ומ־R נקבל Q.',
            `Q בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `ההוכחה, כמו בהרצאה: "נוכיח P ∨ Q. לפי השקילות, די להוכיח ¬P → Q. נניח ¬P. עלינו להראות Q. מ־¬P → R ומ־¬P נקבל R, ומ־R → Q ומ־R נקבל Q. לכן ¬P → Q."
כך מוכיחים "או": מניחים שצד אחד לא נכון, ומוכיחים את הצד השני.`,
        startXml: goalXml('(P ∨ Q)', '(¬P → R),  (R → Q)'),
    }),
    level(12, {
        title: 'הוכחת "או", כשהצד הוא שלילה',
        name: 'unit6_l12_or_by_double_negation',
        params: '(h : P → Q)',
        proposition: '¬P ∨ Q',
        goalLabel: '(¬P ∨ Q)',
        laws: ['easylean_or_as_imp', 'easylean_not_not'],
        toolboxBlocks: ['replace', 'assume', 'forward', 'exact'],
        introduction: `# הוכחת "או", כשהצד הוא שלילה

כמו בשלב הקודם, כדי להוכיח "או" נניח את השלילה של צד אחד ונוכיח את הצד השני.

כאן נתון P → Q, וצריך להוכיח ¬P ∨ Q. הצד השמאלי הוא שלילה, ¬P, ולכן מה שמניחים הוא השלילה שלו, ¬¬P: לפי השקילות, להוכיח ¬P ∨ Q זה כמו להוכיח ¬¬P → Q.
מ־¬¬P נקבל P לפי השלילה הכפולה, ומ־P → Q ומ־P נקבל Q.`,
        hints: [
            `גררו את הבלוק ${REPLACE_BLOCK} אל תוך בלוק המטרה. בחרו בו את השקילות (¬A → B) ↔ (A ∨ B), את המטרה, ואת הכיוון "את (¬P ∨ Q) ב־(¬¬P → Q)". עכשיו המטרה היא ¬¬P → Q.`,
            'אחריו: נניח ¬¬P. עלינו להראות Q.',
            'בתוך הבלוק "נניח", לפי השלילה הכפולה, החליפו בהנחה ¬¬P: "נחליף את ¬¬P ב־P". עכשיו P בידינו.',
            `מ־P → Q ומ־P נקבל Q, ואחר כך ${CLOSE_BLOCK}.`,
        ],
        conclusion: `ההוכחה, כמו בהרצאה: "נוכיח ¬P ∨ Q. לפי השקילות, די להוכיח ¬¬P → Q. נניח ¬¬P. עלינו להראות Q. לפי השלילה הכפולה, ¬¬P פירושו P, ומ־P → Q ומ־P נקבל Q. לכן ¬¬P → Q."
כך מוכיחים "או": מניחים שצד אחד לא נכון, ומוכיחים את הצד השני.`,
        startXml: goalXml('(¬P ∨ Q)', 'P → Q'),
    }),
    level(13, {
        title: 'שלב בונוס: דה מורגן ל"וגם"',
        name: 'unit6_l13_de_morgan_and',
        proposition: '¬(P ∧ Q) → (¬P ∨ ¬Q)',
        goalLabel: '(¬(P ∧ Q) → (¬P ∨ ¬Q))',
        laws: ['easylean_or_as_imp', 'easylean_not_not', 'easylean_imp_or'],
        toolboxBlocks: ['assume', 'replace', 'not_intro', 'not_elim', 'and_intro', 'exact'],
        introduction: `# בונוס: דה מורגן ל"וגם", בהוכחה

ביחידה 1, שלב 5, ראיתם בטבלת אמת ש־¬(α ∧ β) ≡ ¬α ∨ ¬β. טבלה היא רק אחת הדרכים להוכיח שקילות. כאן מוכיחים את הכיוון → בהוכחה: אם לא נכון ש"P וגם Q", אז P לא נכונה או Q לא נכונה.

המטרה, אחרי הנחת התנאי, היא "או": ¬P ∨ ¬Q. כמו בשלב הקודם, לפי השקילות (¬A → B) ↔ (A ∨ B), להוכיח אותה זה כמו להוכיח ¬¬P → ¬Q: נניח ¬¬P, כלומר P, ונוכיח ¬Q.

יש גם דרך קצרה יותר: לפי השקילות (A → B) ↔ (¬A ∨ B), להוכיח ¬P ∨ ¬Q זה כמו להוכיח P → ¬Q, בלי שלילה כפולה.`,
        newDefinitions: [implicationAsOr],
        hints: [
            'נניח ¬(P ∧ Q). עלינו להראות ¬P ∨ ¬Q.',
            `גררו לתוך הבלוק "נניח" את הבלוק ${REPLACE_BLOCK}: השקילות (¬A → B) ↔ (A ∨ B) והמטרה, בכיוון "את (¬P ∨ ¬Q) ב־(¬¬P → ¬Q)". אחריו: נניח ¬¬P. עלינו להראות ¬Q. בתוכו, לפי השלילה הכפולה, החליפו ב־¬¬P: עכשיו P בידינו.`,
            'או, בדרך הקצרה: השקילות (A → B) ↔ (¬A ∨ B), בכיוון "את (¬P ∨ ¬Q) ב־(P → ¬Q)", ואחריו: נניח P. עלינו להראות ¬Q.',
            `בשתי הדרכים המטרה היא עכשיו ¬Q: הוסיפו את הבלוק ${NOT_INTRO_BLOCK}. עכשיו כתוב בו: נניח בשלילה Q. עלינו להגיע לסתירה.`,
            'בתוכו: לפי ¬(P ∧ Q) כדי להגיע לסתירה די להוכיח P ∧ Q. הוכיחו אותה בשני חלקים: P ו־Q בידינו.',
        ],
        conclusion: `סיימתם את יחידה 6, כולל שלב הבונוס! את ¬(A ∧ B) → (¬A ∨ ¬B) בדקתם קודם בטבלה, ועכשיו הוכחתם אותה גם בהוכחה: כדי להוכיח "או", הנחתם שצד אחד לא נכון והוכחתם את הצד השני.`,
        startXml: goalXml('(¬(P ∧ Q) → (¬P ∨ ¬Q))'),
    }),
];
