import { goalXml } from './levelXml';

// Unit 5 (see blocks/moves.js): logical equivalences, as the replacement
// rules of Copi and Hurley and the derived rules of the natural-deduction
// courses. First the levels complete the laws of units 3 and 4, each proved
// there in one direction only; then the move "לפי השקילות" replaces a
// statement by an equivalent one, also inside a larger statement, by a law
// proved in both directions (LAWS in blocks/moves.js). Each level offers only
// the moves and the laws of its solutions.

export const unit5WorldName = 'יחידה 5 - שקילויות לוגיות';

const PROPOSITIONS = 'variable {P Q : Prop}';
const DOMAIN = 'variable {obj : Type} {P : obj → Prop}';
const RELATION = 'variable {obj : Type} {R : obj → obj → Prop}';

// The moves as the toolbox shows them, before they are placed.
const ASSUME_BLOCK = '"כדי להוכיח את הגרירה, נניח..."';
const REPLACE_BLOCK = '"לפי השקילות ? נחליף ..."';
const CLOSE_BLOCK = '"יש לנו ביד בדיוק את מה שאנחנו רוצים להוכיח."';
const NOT_INTRO_BLOCK = '"כדי להוכיח את השלילה, נניח את הטענה שהיא שוללת ונגיע לסתירה"';
const CONTRADICTION_BLOCK = '"יש לנו ביד את ? ואת השלילה שלה, וזו סתירה."';

const replaceInfo = {
    name: 'החלפה לפי שקילות',
    doc: 'אם A ↔ B, מותר להחליף את A ב־B, או את B ב־A, גם בתוך טענה גדולה יותר: במטרה, או בטענה שבידינו, ואז התוצאה מצטרפת להנחות. משתמשים רק בשקילויות שכבר הוכחו, בשני הכיוונים. בהוכחה כתובה: "לפי השקילות ¬(A ∨ B) ↔ (¬A ∧ ¬B), נחליף את ¬(P ∨ Q) ב־(¬P ∧ ¬Q)".',
};

// The laws, as cards in the levels that offer them.
const law = (symbol, doc) => ({ label: 'שקילות', symbol, doc });
const deMorganOr = law('דה מורגן ל"או"', '¬(A ∨ B) ↔ (¬A ∧ ¬B). הכיוון → הוא יחידה 3, שלב 5, והכיוון ← הוא שלב 1 ביחידה הזאת.');
const implicationAsOr = law('גרירה כ"או"', '(A → B) ↔ (¬A ∨ B). הוכחתם את שני הכיוונים בשלב 3.');
const contrapositive = law('קונטרה־פוזיציה', '(A → B) ↔ (¬B → ¬A). הכיוון ← הוא יחידה 3, שלב 9, והכיוון → הוא שלב 2 ביחידה הזאת.');
const doubleNegation = law('שלילה כפולה', '¬¬A ↔ A. הכיוון → הוא יחידה 3, שלב 8, והכיוון ← הוא יחידה 3, שלב 2. מחליפים רק את ¬¬A ב־A: בכיוון ההפוך, כל טענה היא מהצורה A.');
const notForall = law('שלילה של "לכל"', '¬∀x P(x) ↔ ∃x ¬P(x). הכיוון → הוא יחידה 4, שלב 10, והכיוון ← הוא שלב 5 ביחידה הזאת.');
const notExists = law('שלילה של "קיים"', '¬∃x P(x) ↔ ∀x ¬P(x). הכיוון → הוא יחידה 4, שלב 8, והכיוון ← הוא שלב 4 ביחידה הזאת.');

const level = (number, fields) => ({
    id: `unit5-${number}`,
    levelNumber: number,
    totalLevels: 11,
    variableLine: PROPOSITIONS,
    params: '',
    objects: [],
    assumptions: [],
    newTacticsBlocks: [],
    newTacticsInfo: [],
    newDefinitions: [],
    ...fields,
});

export const unit5Levels = [
    level(1, {
        title: 'משלימים את דה מורגן',
        name: 'unit5_l1_de_morgan_or_back',
        proposition: '(¬P ∧ ¬Q) → ¬(P ∨ Q)',
        goalLabel: '((¬P ∧ ¬Q) → ¬(P ∨ Q))',
        toolboxBlocks: ['assume', 'and_elim', 'not_intro', 'or_elim', 'contradiction'],
        introduction: `# שקילויות

שתי טענות *שקולות* אם כל אחת נובעת מהשנייה: A ↔ B. ביחידה הזאת נשתמש בשקילויות כדי להחליף טענה בטענה ששקולה לה, גם בתוך טענה גדולה יותר.
משתמשים רק בשקילות שהוכחתם, בשני הכיוונים. כמה מהן הוכחתם ביחידות 3 ו־4 בכיוון אחד בלבד, ולכן ארבעה מחמשת השלבים הראשונים משלימים את הכיוון השני, ובשלב 3 מוכיחים שקילות חדשה.

ביחידה 3, שלב 5, הוכחתם ש־\`¬(P ∨ Q) → (¬P ∧ ¬Q)\`. כאן מוכיחים את הכיוון ההפוך: אם P לא נכונה וגם Q לא נכונה, אז לא נכון ש"P או Q".
אחרי הנחת התנאי, המטרה היא שלילה: נניח P ∨ Q ונגיע לסתירה. בכל אחד מהמקרים של ה"או" יש סתירה.`,
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} אל תוך בלוק המטרה, ואחריו "מה"וגם" ?" עם ¬P ∧ ¬Q. עכשיו בידינו ¬P ו־¬Q.`,
            `הוסיפו את הבלוק ${NOT_INTRO_BLOCK}. עכשיו כתוב בו: נניח (P ∨ Q) ונגיע לסתירה.`,
            'הוסיפו את הבלוק "נחלק למקרים לפי ה"או" ?" עם P ∨ Q.',
            `בכל מקרה: ${CONTRADICTION_BLOCK} עם P (במקרה הראשון) או עם Q (במקרה השני).`,
        ],
        conclusion: `עכשיו הוכחתם את שני הכיוונים, ולכן ¬(A ∨ B) ↔ (¬A ∧ ¬B) היא שקילות: *חוק דה מורגן* ל"או".
אפשר להשתמש בה בלי להוכיח אותה שוב, לכל שתי טענות A ו־B.`,
        startXml: goalXml('((¬P ∧ ¬Q) → ¬(P ∨ Q))'),
    }),
    level(2, {
        title: 'משלימים את הקונטרה־פוזיציה',
        name: 'unit5_l2_contrapositive_back',
        proposition: '(P → Q) → (¬Q → ¬P)',
        goalLabel: '((P → Q) → (¬Q → ¬P))',
        toolboxBlocks: ['assume', 'not_intro', 'forward', 'contradiction'],
        introduction: `# משלימים את הקונטרה־פוזיציה

ביחידה 3, שלב 9, הוכחתם ש־\`(¬Q → ¬P) → (P → Q)\`. כאן מוכיחים את הכיוון ההפוך: אם P גוררת את Q, אז ¬Q גוררת את ¬P.
אחרי שתי הנחות התנאי, המטרה היא ¬P. ההוכחה דומה ליחידה 3, שלב 3.`,
        hints: [
            `גררו את הבלוק ${ASSUME_BLOCK} פעמיים: נניח P → Q, ואחר כך נניח ¬Q. המטרה עכשיו: ¬P.`,
            `הוסיפו את הבלוק ${NOT_INTRO_BLOCK}: נניח P ונגיע לסתירה.`,
            `מ־P → Q ומ־P נובע Q, ואחר כך ${CONTRADICTION_BLOCK} עם Q.`,
        ],
        conclusion: `עכשיו (A → B) ↔ (¬B → ¬A) היא שקילות: גרירה שקולה ל*קונטרה־פוזיציה* שלה.`,
        startXml: goalXml('((P → Q) → (¬Q → ¬P))'),
    }),
    level(3, {
        title: 'גרירה היא "או"',
        name: 'unit5_l3_implication_as_or',
        proposition: '(P → Q) ↔ (¬P ∨ Q)',
        goalLabel: '((P → Q) ↔ (¬P ∨ Q))',
        toolboxBlocks: ['iff_intro', 'assume', 'by_contradiction', 'not_elim', 'or_intro', 'not_intro', 'apply_rule', 'or_elim', 'exfalso', 'contradiction', 'exact'],
        introduction: `# גרירה היא "או"

"אם P אז Q" אומרת: או ש־P לא נכונה, או ש־Q נכונה. כאן מוכיחים את השקילות הזאת בשני הכיוונים, כמו ביחידה 2, שלב 8.

- **הכיוון ←** (מ־¬P ∨ Q ל־P → Q): נניח ¬P ∨ Q ונניח P, ונחלק למקרים. במקרה ¬P יש סתירה עם P, ומסתירה נובע הכול.
- **הכיוון →** (מ־P → Q ל־¬P ∨ Q) קשה יותר: לא ידוע איזה צד של ה"או" נכון. מוכיחים בשלילה, כמו ביחידה 3, שלב 10.`,
        hints: [
            'גררו את הבלוק "כדי להוכיח את ה"אם ורק אם", נוכיח את שני הכיוונים" אל תוך בלוק המטרה.',
            'בכיוון הראשון: נניח P → Q. אחר כך "נוכיח בשלילה": נניח ¬(¬P ∨ Q). לפי השלילה הזאת, די להוכיח ¬P ∨ Q, ובו בחרו את ¬P.',
            'עכשיו נניח P ונגיע לסתירה: שוב לפי ¬(¬P ∨ Q) די להוכיח ¬P ∨ Q, והפעם בחרו את Q. לפי הגרירה P → Q די להוכיח P, ויש לנו אותה ביד.',
            'בכיוון השני: נניח ¬P ∨ Q, ונניח P. נחלק למקרים לפי ¬P ∨ Q: במקרה ¬P, מסתירה נובע הכול, והסתירה היא P ו־¬P. במקרה Q, יש לנו אותה ביד.',
        ],
        conclusion: `עכשיו (A → B) ↔ (¬A ∨ B) היא שקילות. בשלב 6 תשתמשו בה כדי להוכיח גרירה בהוכחת "או".`,
        startXml: goalXml('((P → Q) ↔ (¬P ∨ Q))'),
    }),
    level(4, {
        title: 'משלימים את השלילה של "קיים"',
        name: 'unit5_l4_not_exists_back',
        variableLine: DOMAIN,
        proposition: '(∀ x, ¬P x) → ¬∃ x, P x',
        goalLabel: '((∀x ¬P(x)) → ¬∃x P(x))',
        toolboxBlocks: ['assume', 'not_intro', 'exists_elim', 'forall_elim', 'contradiction'],
        introduction: `# משלימים את השלילה של "קיים"

ביחידה 4, שלב 8, הוכחתם ש־\`(¬∃x P(x)) → (∀x ¬P(x))\`. כאן מוכיחים את הכיוון ההפוך: אם אף עצם לא מקיים את P, אז לא קיים עצם שמקיים את P.`,
        hints: [
            `נניח ∀x ¬P(x), ואחר כך ${NOT_INTRO_BLOCK}: נניח ∃x P(x) ונגיע לסתירה.`,
            'לפי ה"קיים" ∃x P(x), יהי x₀ עצם כך ש־P(x₀).',
            `לפי ה"לכל" ∀x ¬P(x) עבור העצם x₀ נובע ¬P(x₀), ואחר כך ${CONTRADICTION_BLOCK} עם P(x₀).`,
        ],
        conclusion: 'עכשיו ¬∃x P(x) ↔ ∀x ¬P(x) היא שקילות: "לא קיים" פירושו "לכל ... לא".',
        startXml: goalXml('((∀x ¬P(x)) → ¬∃x P(x))'),
    }),
    level(5, {
        title: 'משלימים את השלילה של "לכל"',
        name: 'unit5_l5_not_forall_back',
        variableLine: DOMAIN,
        proposition: '(∃ x, ¬P x) → ¬∀ x, P x',
        goalLabel: '((∃x ¬P(x)) → ¬∀x P(x))',
        toolboxBlocks: ['assume', 'not_intro', 'exists_elim', 'forall_elim', 'contradiction'],
        introduction: `# משלימים את השלילה של "לכל"

ביחידה 4, שלב 10, הוכחתם ש־\`(¬∀x P(x)) → (∃x ¬P(x))\`. זה היה שלב הבונוס, כי צריך שם הוכחה בשלילה. הכיוון ההפוך קל: אם יש עצם שלא מקיים את P, אז לא כל העצמים מקיימים את P.`,
        hints: [
            `נניח ∃x ¬P(x), ואחר כך ${NOT_INTRO_BLOCK}: נניח ∀x P(x) ונגיע לסתירה.`,
            'לפי ה"קיים" ∃x ¬P(x), יהי x₀ עצם כך ש־¬P(x₀).',
            `לפי ה"לכל" ∀x P(x) עבור העצם x₀ נובע P(x₀), ואחר כך ${CONTRADICTION_BLOCK} עם P(x₀).`,
        ],
        conclusion: `עכשיו ¬∀x P(x) ↔ ∃x ¬P(x) היא שקילות: "לא לכל" פירושו "קיים ... לא".
יש בידינו שש שקילויות, ומהשלב הבא משתמשים בהן.`,
        startXml: goalXml('((∃x ¬P(x)) → ¬∀x P(x))'),
    }),
    level(6, {
        title: 'במקום גרירה, "או"',
        name: 'unit5_l6_replace_goal',
        params: '(h : ¬P)',
        proposition: 'P → Q',
        goalLabel: '(P → Q)',
        laws: ['easylean_imp_or'],
        toolboxBlocks: ['replace', 'or_intro', 'exact'],
        introduction: `# במקום גרירה, "או"

לפי השקילות \`(A → B) ↔ (¬A ∨ B)\` משלב 3, להוכיח את P → Q זה כמו להוכיח את ¬P ∨ Q. מותר להחליף את המטרה בטענה ששקולה לה.

הבלוק ${REPLACE_BLOCK} עושה זאת: בוחרים בו את השקילות ואת המקום, המטרה או טענה שבידינו, ובשורה "נחליף" רואים מה יוחלף במה. אפשר לבחור שם גם את הכיוון ההפוך של השקילות, ואם יש כמה חלקים מאותה צורה, להחליף את כולם.
כאן נתונה ההנחה ¬P. אחרי ההחלפה, המטרה היא ¬P ∨ Q, ואת ¬P יש לנו ביד.`,
        newTacticsBlocks: ['replace'],
        newTacticsInfo: [replaceInfo],
        newDefinitions: [implicationAsOr],
        hints: [
            `גררו את הבלוק ${REPLACE_BLOCK} אל תוך בלוק המטרה. בחרו בו את השקילות (A → B) ↔ (¬A ∨ B) ואת המטרה. עכשיו כתוב בו: נחליף את (P → Q) ב־(¬P ∨ Q).`,
            'עכשיו המטרה היא ¬P ∨ Q: הוסיפו את הבלוק של הוכחת "או", ובחרו בו את ¬P.',
            `¬P בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `ההוכחה: "לפי השקילות (A → B) ↔ (¬A ∨ B), נחליף את P → Q ב־¬P ∨ Q. כדי להוכיח ¬P ∨ Q די להוכיח ¬P, ויש לנו אותה ביד."
גרירה שהתנאי שלה לא נכון היא נכונה, מה שלא תהיה המסקנה. זו *אמת ריקה*.`,
        startXml: goalXml('(P → Q)', '¬P'),
    }),
    level(7, {
        title: 'מחליפים בהנחה',
        name: 'unit5_l7_replace_assumption',
        params: '(h : ¬(P ∨ Q))',
        proposition: '¬Q',
        goalLabel: '¬Q',
        laws: ['easylean_not_or'],
        toolboxBlocks: ['replace', 'and_elim', 'exact'],
        introduction: `# מחליפים בהנחה

אפשר להחליף גם בטענה שבידינו. אז הטענה החדשה מצטרפת להנחות, והישנה נשארת.

ביחידה 3, שלב 4, הוכחתם את ¬P מתוך ¬(P ∨ Q) בכללי השלילה. כאן מוכיחים את ¬Q בדרך אחרת: לפי דה מורגן, ¬(P ∨ Q) שקולה ל־¬P ∧ ¬Q, ומה"וגם" נובעים שני הצדדים.`,
        newDefinitions: [deMorganOr],
        hints: [
            `גררו את הבלוק ${REPLACE_BLOCK} אל תוך בלוק המטרה. בחרו בו את דה מורגן ואת ההנחה ¬(P ∨ Q). עכשיו כתוב בו: נחליף את ¬(P ∨ Q) ב־(¬P ∧ ¬Q).`,
            'עכשיו בידינו ¬P ∧ ¬Q: הוסיפו את הבלוק "מה"וגם" ?" עם ¬P ∧ ¬Q.',
            `¬Q בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `ההוכחה: "לפי דה מורגן, ¬(P ∨ Q) פירושו ¬P ∧ ¬Q, ומזה נובע ¬Q."
ביחידה 3 בניתם הוכחה כזאת מהכללים. שקילות שהוכחה פעם אחת חוסכת את העבודה בכל פעם שצריך אותה.`,
        startXml: goalXml('¬Q', '¬(P ∨ Q)'),
    }),
    level(8, {
        title: 'קונטרה־פוזיציה כשיטת הוכחה',
        name: 'unit5_l8_contrapositive',
        proposition: '(¬Q → ¬P) → (P → Q)',
        goalLabel: '((¬Q → ¬P) → (P → Q))',
        laws: ['easylean_contrapositive'],
        toolboxBlocks: ['assume', 'replace', 'exact'],
        introduction: `# קונטרה־פוזיציה כשיטת הוכחה

במתמטיקה מוכיחים הרבה פעמים גרירה דרך ה*קונטרה־פוזיציה* שלה: במקום "אם P אז Q" מוכיחים "אם לא Q אז לא P".
ביחידה 3, שלב 9, הוכחתם את הטענה הזאת בהוכחה בשלילה. עכשיו, כשהקונטרה־פוזיציה היא שקילות, מספיקים מהלכים ספורים.`,
        newDefinitions: [contrapositive],
        hints: [
            `נניח ¬Q → ¬P. המטרה עכשיו: P → Q.`,
            `הוסיפו את הבלוק ${REPLACE_BLOCK}, ובחרו בו את הקונטרה־פוזיציה ואת המטרה. עכשיו כתוב בו: נחליף את (P → Q) ב־(¬Q → ¬P).`,
            `¬Q → ¬P בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
            'או: במקום להחליף במטרה, החליפו בהנחה ¬Q → ¬P, ובחרו את הכיוון "את (¬Q → ¬P) ב־(P → Q)". עכשיו P → Q בידינו.',
        ],
        conclusion: `ביחידה 3 ההוכחה הזאת דרשה הוכחה בשלילה. כאן היא החלפה אחת: "לפי הקונטרה־פוזיציה, להוכיח P → Q זה כמו להוכיח ¬Q → ¬P, ויש לנו אותה ביד."`,
        startXml: goalXml('((¬Q → ¬P) → (P → Q))'),
    }),
    level(9, {
        title: 'שרשרת של החלפות',
        name: 'unit5_l9_chain',
        proposition: '¬(P ∨ ¬Q) → (¬P ∧ Q)',
        goalLabel: '(¬(P ∨ ¬Q) → (¬P ∧ Q))',
        laws: ['easylean_not_or', 'easylean_not_not'],
        toolboxBlocks: ['assume', 'replace', 'exact'],
        introduction: `# שרשרת של החלפות

אפשר להחליף גם *בתוך* טענה, ולהחליף כמה פעמים ברצף, כמו בחישוב: ¬(P ∨ ¬Q) ↔ (¬P ∧ ¬¬Q) ↔ (¬P ∧ Q).
בהחלפה השנייה מחליפים רק את הצד הימני של ה"וגם", ¬¬Q, ב־Q.`,
        newDefinitions: [doubleNegation],
        hints: [
            'נניח ¬(P ∨ ¬Q).',
            `לפי דה מורגן, החליפו בהנחה ¬(P ∨ ¬Q): "נחליף את ¬(P ∨ ¬Q) ב־(¬P ∧ ¬¬Q)".`,
            'לפי השלילה הכפולה, החליפו בהנחה ¬P ∧ ¬¬Q: "נחליף את ¬¬Q ב־Q". עכשיו בידינו ¬P ∧ Q.',
            `¬P ∧ Q בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `ההוכחה היא שרשרת של שקילויות: ¬(P ∨ ¬Q) שקולה ל־¬P ∧ ¬¬Q, וזו שקולה ל־¬P ∧ Q.
כך מוכיחים זהויות באלגברה, וכך מוכיחים גם שקילויות בלוגיקה.`,
        startXml: goalXml('(¬(P ∨ ¬Q) → (¬P ∧ Q))'),
    }),
    level(10, {
        title: 'דוחפים את השלילה פנימה',
        name: 'unit5_l10_push_negation',
        variableLine: RELATION,
        proposition: '(¬∀ x, ∃ y, R x y) → (∃ x, ∀ y, ¬R x y)',
        goalLabel: '((¬∀x ∃y R(x,y)) → (∃x ∀y ¬R(x,y)))',
        laws: ['easylean_not_forall', 'easylean_not_exists'],
        toolboxBlocks: ['assume', 'replace', 'exact'],
        introduction: `# דוחפים את השלילה פנימה

R(x,y) היא *יחס* בין שני עצמים, למשל "x מכיר את y". הטענה ∀x ∃y R(x,y) אומרת: כל אחד מכיר מישהו.
מה פירוש השלילה שלה? מעבירים את השלילה פנימה, כמת אחר כמת, ובכל מעבר "לכל" הופך ל"קיים" ולהפך:
¬∀x ∃y R(x,y) ↔ ∃x ¬∃y R(x,y) ↔ ∃x ∀y ¬R(x,y). כלומר: יש מישהו שלא מכיר אף אחד.
בהחלפה השנייה מחליפים בתוך ה"קיים", מתחת ל־∃x.`,
        newDefinitions: [notForall, notExists],
        hints: [
            'נניח ¬∀x ∃y R(x,y).',
            'לפי השלילה של "לכל", החליפו בהנחה ¬∀x ∃y R(x,y): "נחליף את ¬∀x ∃y R(x,y) ב־∃x ¬∃y R(x,y)".',
            'לפי השלילה של "קיים", החליפו בהנחה ∃x ¬∃y R(x,y): "נחליף את ¬∃y R(x,y) ב־∀y ¬R(x,y)". עכשיו בידינו ∃x ∀y ¬R(x,y).',
            `זו המטרה: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
        ],
        conclusion: `"לא כל אחד מכיר מישהו" פירושו "יש מישהו שלא מכיר אף אחד". כך מוצאים את השלילה של כל טענה עם כמתים: מעבירים את השלילה פנימה, ומחליפים כל כמת שהיא עוברת.`,
        startXml: goalXml('((¬∀x ∃y R(x,y)) → (∃x ∀y ¬R(x,y)))'),
    }),
    level(11, {
        title: 'שלב בונוס: דה מורגן ל"וגם"',
        name: 'unit5_l11_de_morgan_and',
        proposition: '¬(P ∧ Q) → (¬P ∨ ¬Q)',
        goalLabel: '(¬(P ∧ Q) → (¬P ∨ ¬Q))',
        laws: ['easylean_imp_or'],
        toolboxBlocks: ['assume', 'replace', 'not_intro', 'not_elim', 'and_intro', 'exact'],
        introduction: `# בונוס: דה מורגן ל"וגם"

חוק דה מורגן השני: אם לא נכון ש"P וגם Q", אז P לא נכונה או Q לא נכונה.
להוכיח "או" כשלא ידוע איזה צד נכון זה קשה. אבל לפי השקילות משלב 3, להוכיח ¬P ∨ ¬Q זה כמו להוכיח P → ¬Q, וגרירה יודעים להוכיח.
כך שקילויות שהוכחו עוזרות להוכיח חוקים חדשים.`,
        newDefinitions: [implicationAsOr],
        hints: [
            'נניח ¬(P ∧ Q).',
            `הוסיפו את הבלוק ${REPLACE_BLOCK}: השקילות (A → B) ↔ (¬A ∨ B) והמטרה, ובחרו את הכיוון "את (¬P ∨ ¬Q) ב־(P → ¬Q)". עכשיו המטרה היא P → ¬Q.`,
            `נניח P, ואחר כך ${NOT_INTRO_BLOCK}: נניח Q ונגיע לסתירה.`,
            'לפי השלילה ¬(P ∧ Q) די להוכיח P ∧ Q. הוכיחו אותה בשני חלקים: את P ואת Q יש לנו ביד.',
        ],
        conclusion: `סיימתם את יחידה 5, כולל שלב הבונוס! הוכחתם את ¬(A ∧ B) → (¬A ∨ ¬B) בעזרת שקילות, וזה הכיוון הקשה של דה מורגן ל"וגם".
ביחידות הבאות, על קבוצות, ההגדרות הן "וגם", "או" ושלילה, ולכן אותם חוקים מופיעים שם בשפת הקבוצות, למשל חוק דה מורגן לקבוצות.`,
        startXml: goalXml('(¬(P ∧ Q) → (¬P ∨ ¬Q))'),
    }),
];
