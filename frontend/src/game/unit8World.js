import { goalXml } from './levelXml';

// Unit 8 (see blocks/moves.js): equality, then relations, as in the course.
// Equality first, by its two principles (as in Logic and Proof, chapter
// 17): a statement whose sides are the same by the definitions is proved
// ("שני הצדדים שווים לפי ההגדרה"), and an equality is used by its statement
// ("לפי השוויון y = x + 7, נחליף את y ב־x + 7 בתוך המטרה"). Then relations: a relation on
// the objects is a set of ordered pairs (R : Set (obj × obj)), so the moves of
// unit 6 work on it: an inclusion of relations takes an arbitrary pair
// ("יהי (x₀, y₀) ∈ R"), and the inverse, the composition (first S, then R,
// as in the course) and the equivalence class are read by their definitions,
// as are the properties of a relation (reflexive, symmetric, transitive,
// antisymmetric), with the move "לפי ההגדרה" (RELATION_PRELUDE in
// generator/lean.js). Each level offers only the moves of its solutions.

export const unit8WorldName = 'יחידה 8 - שוויון ויחסים';

const RELATIONS = 'variable {obj : Type} {R S : Set (obj × obj)}';

// The moves as the toolbox shows them, before they are placed.
const RFL_BLOCK = '"שני הצדדים שווים לפי ההגדרה."';
const REWRITE_BLOCK = '"לפי השוויון ? נחליף ..."';
const SUBSET_INTRO_BLOCK = '"כדי להוכיח הכלה: יהי איבר של הקבוצה המוכלת, ונוכיח שהוא שייך לקבוצה המכילה"';
const SET_EQ_BLOCK = '"כדי להוכיח שוויון קבוצות, נוכיח שתי הכלות"';
const UNFOLD_BLOCK = '"לפי ההגדרה, ?"';
const CLAIM_BLOCK = '"נוכיח קודם את טענת העזר ?"';
const FORALL_ELIM_BLOCK = '"לפי ה"לכל" ? עבור העצם ?"';
const CLOSE_BLOCK = '"יש לנו ביד בדיוק את מה שאנחנו רוצים להוכיח."';

const rflInfo = {
    name: 'שוויון לפי ההגדרה',
    doc: 'אם שני הצדדים של שוויון שווים לפי ההגדרות עצמן, בלי שום טענה נוספת, השוויון מוכח.',
};
const rewriteInfo = {
    name: 'החלפה לפי שוויון',
    doc: 'אם a = b, אפשר להחליף את a ב־b, או את b ב־a, במטרה או בטענה שבידינו. בהוכחה כתובה: "לפי a = b, נחליף את a ב־b".',
};
const definition = (symbol, doc) => ({ symbol, doc });
const relation = definition('יחס', 'יחס R על העצמים הוא קבוצה של זוגות סדורים: (x, y) ∈ R פירושו ש־x ביחס R ל־y. כמו כל קבוצה, שני יחסים שווים אם כל אחד מוכל בשני.');
const inverse = definition('היחס ההפוך', '(x, y) ∈ R⁻¹ פירושו (y, x) ∈ R.');
const composition = definition('הרכבה', '(x, y) ∈ (R ∘ S) פירושו ∃z ((x, z) ∈ S ∧ (z, y) ∈ R): קודם S, ואחר כך R.');
const reflexive = definition('רפלקסיביות', 'reflexive(R) פירושו ∀x ((x, x) ∈ R): כל עצם ביחס לעצמו.');
const symmetric = definition('סימטריות', 'symmetric(R) פירושו ∀x (∀y ((x, y) ∈ R → (y, x) ∈ R)).');
const transitive = definition('טרנזיטיביות', 'transitive(R) פירושו ∀x (∀y (∀z (((x, y) ∈ R ∧ (y, z) ∈ R) → (x, z) ∈ R))).');
const antisymmetric = definition('אנטי־סימטריות', 'antisymmetric(R) פירושו ∀x (∀y (((x, y) ∈ R ∧ (y, x) ∈ R) → x = y)).');
const equivalenceClass = definition('מחלקת שקילות', '[a]_R היא קבוצת העצמים ש־a ביחס R אליהם: x ∈ [a]_R פירושו (a, x) ∈ R.');

const pairsInfo = {
    name: 'הכלה של יחסים',
    doc: 'האיברים של יחס הם זוגות, ולכן כדי להוכיח R ⊆ S לוקחים זוג שרירותי: "יהי (x₀, y₀) ∈ R; נוכיח (x₀, y₀) ∈ S". זה אותו בלוק של הוכחת הכלה מיחידה 6.',
};

const level = (number, fields) => ({
    id: `unit8-${number}`,
    levelNumber: number,
    totalLevels: 14,
    variableLine: RELATIONS,
    params: '',
    usesSets: true,
    usesRelations: true,
    objects: [],
    assumptions: [],
    newTacticsBlocks: [],
    newTacticsInfo: [],
    newDefinitions: [],
    ...fields,
});

export const unit8Levels = [
    level(1, {
        title: 'שוויון הוא רפלקסיבי',
        name: 'unit8_l1_refl',
        usesSets: false,
        usesRelations: false,
        variableLine: 'variable {obj : Type}',
        params: '(a : obj)',
        proposition: 'a = a',
        goalLabel: 'a = a',
        objects: [{ name: 'a', type: 'obj' }],
        toolboxBlocks: ['rfl'],
        introduction: `# שוויון

היחידה הזאת עוסקת ב*יחסים*, ומתחילה ביחס המוכר ביותר: *שוויון*. שני עקרונות קובעים איך מוכיחים שוויון ואיך משתמשים בו, וכל השאר נובע מהם.

העיקרון הראשון: כל דבר שווה לעצמו. שוויון ששני הצדדים שלו זהים מוכח מיד, בבלוק ${RFL_BLOCK}`,
        newTacticsBlocks: ['rfl'],
        newTacticsInfo: [rflInfo],
        hints: [`גררו את הבלוק ${RFL_BLOCK} אל תוך בלוק המטרה.`],
        conclusion: 'a = a לכל עצם a: השוויון *רפלקסיבי*. בשלבים הבאים תראו שהוא גם סימטרי וטרנזיטיבי.',
        startXml: goalXml('a = a'),
    }),
    level(2, {
        title: 'מחליפים שווה בשווה',
        name: 'unit8_l2_substitute',
        params: '(a b c : obj) (h : a = b) (hR : (a, c) ∈ R)',
        proposition: '(b, c) ∈ R',
        goalLabel: '(b, c) ∈ R',
        objects: [{ name: 'a', type: 'obj' }, { name: 'b', type: 'obj' }, { name: 'c', type: 'obj' }],
        toolboxBlocks: ['rewrite', 'exact'],
        introduction: `# מחליפים שווה בשווה

העיקרון השני: אם a = b, אפשר להחליף את a ב־b, או את b ב־a, בכל טענה. כמו שביחידה 5 החלפתם טענה בטענה ששקולה לה, כאן מחליפים עצם בעצם ששווה לו.

R הוא *יחס*: \`(a, c) ∈ R\` פירושו ש־a ביחס R ל־c, למשל "a מכיר את c" (על יחסים בהרחבה, מהשלב החמישי).
נתון ש־a = b ו־(a, c) ∈ R. הבלוק ${REWRITE_BLOCK} מחליף: בוחרים בו את השוויון, את ההחלפה (את a ב־b, או להפך), ואת המקום: המטרה, או טענה שבידינו.`,
        newTacticsBlocks: ['rewrite'],
        newTacticsInfo: [rewriteInfo],
        hints: [
            `גררו את הבלוק ${REWRITE_BLOCK} אל תוך בלוק המטרה, ובחרו בו a = b, את (a, c) ∈ R, ואת ההחלפה "את a ב־b". עכשיו (b, c) ∈ R בידינו.`,
            `הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
            'או: החליפו במטרה את b ב־a. המטרה תהיה (a, c) ∈ R, וזה בידינו.',
        ],
        conclusion: 'אם a = b, כל מה שנכון על a נכון גם על b: מותר להחליף שווה בשווה. ההחלפה אפשרית בטענה שבידינו או במטרה, ובכל אחד משני הכיוונים.',
        startXml: goalXml('(b, c) ∈ R', 'a = b,  (a, c) ∈ R'),
    }),
    level(3, {
        title: 'שוויון הוא סימטרי',
        name: 'unit8_l3_symm',
        usesSets: false,
        usesRelations: false,
        variableLine: 'variable {obj : Type}',
        params: '(a b : obj) (h : a = b)',
        proposition: 'b = a',
        goalLabel: 'b = a',
        objects: [{ name: 'a', type: 'obj' }, { name: 'b', type: 'obj' }],
        toolboxBlocks: ['rewrite', 'rfl'],
        introduction: `# שוויון הוא סימטרי

אם a = b, אז b = a. גם זה נובע משני העקרונות: מחליפים במטרה את a ב־b, ומקבלים b = b, ששני הצדדים שלו זהים.`,
        hints: [
            `גררו את הבלוק ${REWRITE_BLOCK}, ובחרו בו a = b, את ההחלפה "את a ב־b", ו"המטרה". המטרה תהיה b = b.`,
            `הוסיפו את הבלוק ${RFL_BLOCK}`,
        ],
        conclusion: 'מ־a = b נובע b = a: השוויון *סימטרי*.',
        startXml: goalXml('b = a', 'a = b'),
    }),
    level(4, {
        title: 'שוויון הוא טרנזיטיבי',
        name: 'unit8_l4_trans',
        usesSets: false,
        usesRelations: false,
        variableLine: 'variable {obj : Type}',
        params: '(a b c : obj) (h1 : a = b) (h2 : b = c)',
        proposition: 'a = c',
        goalLabel: 'a = c',
        objects: [{ name: 'a', type: 'obj' }, { name: 'b', type: 'obj' }, { name: 'c', type: 'obj' }],
        assumptions: [{ name: 'h1', prop: 'a = b' }, { name: 'h2', prop: 'b = c' }],
        toolboxBlocks: ['rewrite', 'exact'],
        introduction: `# שוויון הוא טרנזיטיבי

אם a = b ו־b = c, אז a = c. זו *הטרנזיטיביות* של השוויון, והיא נובעת מהחלפה: מחליפים במטרה את a ב־b, ומקבלים b = c, שכבר בידינו.
אפשר גם להחליף במטרה את c ב־b, ולקבל a = b.`,
        hints: [
            `גררו את הבלוק ${REWRITE_BLOCK}, ובחרו בו a = b, את ההחלפה "את a ב־b", ו"המטרה". המטרה תהיה b = c.`,
            `b = c בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
            'או: לפי b = c, החליפו במטרה את c ב־b. המטרה תהיה a = b, וזה בידינו.',
        ],
        conclusion: `השוויון *טרנזיטיבי*. יחד עם השלבים הקודמים: השוויון רפלקסיבי, סימטרי וטרנזיטיבי, ושלוש התכונות נובעות משני העקרונות, כל דבר שווה לעצמו ומותר להחליף שווה בשווה.
יחס עם שלוש התכונות האלה נקרא *יחס שקילות*. בשלבים הבאים תראו מה זה יחס באופן כללי, ואת התכונות האלה לכל יחס.`,
        startXml: goalXml('a = c', 'a = b,  b = c'),
    }),
    level(5, {
        title: 'היחס ההפוך',
        name: 'unit8_l5_inverse_inverse',
        proposition: 'R⁻¹⁻¹ = R',
        goalLabel: '(R⁻¹)⁻¹ = R',
        toolboxBlocks: ['set_eq', 'subset_intro', 'unfold', 'exact'],
        newTacticsInfo: [pairsInfo],
        introduction: `# יחסים

*יחס* R על העצמים הוא קבוצה של זוגות סדורים: \`(x, y) ∈ R\` פירושו ש־x ביחס R ל־y, למשל "x מכיר את y". מכיוון שיחס הוא קבוצה, כל מה שלמדתם על קבוצות עובד גם עליו.

\`R⁻¹\` הוא *היחס ההפוך*: לפי ההגדרה, \`(x, y) ∈ R⁻¹\` פירושו \`(y, x) ∈ R\`. נוכיח שאם הופכים פעמיים, חוזרים ל־R.
מוכיחים שוויון בשתי הכלות, כמו ביחידה 6. האיברים של יחס הם זוגות, ולכן בכל הכלה לוקחים זוג: "יהי (x₀, y₀)".`,
        newDefinitions: [relation, inverse],
        hints: [
            `גררו את הבלוק ${SET_EQ_BLOCK} אל תוך בלוק המטרה, ובכל חלק ${SUBSET_INTRO_BLOCK}: יהי (x₀, y₀).`,
            'בהכלה הראשונה: פתחו את הגדרת היחס ההפוך ב־(x₀, y₀) ∈ (R⁻¹)⁻¹, ושוב במה שמתקבל, (y₀, x₀) ∈ R⁻¹. עכשיו (x₀, y₀) ∈ R בידינו.',
            'בהכלה השנייה: אותן שתי פתיחות, הפעם במטרה.',
        ],
        conclusion: '(R⁻¹)⁻¹ = R. הפעלתם על יחסים את כל מה שלמדתם על קבוצות: שוויון בשתי הכלות, הכלה בעזרת איבר, ופתיחת הגדרות. ההבדל היחיד הוא שהאיבר הוא זוג.',
        startXml: goalXml('(R⁻¹)⁻¹ = R'),
    }),
    level(6, {
        title: 'הרכבה',
        name: 'unit8_l6_inverse_of_composition',
        proposition: '(R ∘ S)⁻¹ ⊆ S⁻¹ ∘ R⁻¹',
        goalLabel: '(R ∘ S)⁻¹ ⊆ S⁻¹ ∘ R⁻¹',
        toolboxBlocks: ['subset_intro', 'unfold', 'exists_elim', 'and_elim', 'exists_intro', 'and_intro', 'exact'],
        introduction: `# הרכבה

\`R ∘ S\` היא *ההרכבה* של R ו־S: קודם S, ואחר כך R. לפי ההגדרה, \`(x, y) ∈ (R ∘ S)\` פירושו \`∃z ((x, z) ∈ S ∧ (z, y) ∈ R)\`: יש תחנת ביניים z.

נוכיח שההפוך של הרכבה הוא ההרכבה של ההפוכים, בסדר ההפוך: (R ∘ S)⁻¹ ⊆ S⁻¹ ∘ R⁻¹. ההגדרה של ההרכבה היא "קיים", ולכן משתמשים בה כמו ביחידה 4: מקבלים ממנה את תחנת הביניים, ובמטרה בוחרים אותה.`,
        newDefinitions: [composition],
        hints: [
            'יהי (x₀, y₀) ∈ (R ∘ S)⁻¹. פתחו את ההגדרות: פירושו (y₀, x₀) ∈ (R ∘ S), ופירוש זה הוא ∃z ((y₀, z) ∈ S ∧ (z, x₀) ∈ R).',
            'לפי ה"קיים", יהי z₀ כזה, ומה"וגם" נובעים שני הצדדים.',
            'פתחו את ההגדרה במטרה, (x₀, y₀) ∈ (S⁻¹ ∘ R⁻¹), ובחרו את z₀ כתחנת הביניים. בכל צד של ה"וגם" פתחו את הגדרת היחס ההפוך: מה שנשאר בידינו.',
        ],
        conclusion: 'גם ההכלה ההפוכה נכונה, ולכן (R ∘ S)⁻¹ = S⁻¹ ∘ R⁻¹: כמו לנעול גרביים ואחר כך נעליים, ההפוך הוא לחלוץ קודם את הנעליים.',
        startXml: goalXml('(R ∘ S)⁻¹ ⊆ S⁻¹ ∘ R⁻¹'),
    }),
    level(7, {
        title: 'יחס רפלקסיבי',
        name: 'unit8_l7_reflexive',
        proposition: 'reflexive R → R ⊆ R ∘ R',
        goalLabel: '(reflexive(R) → R ⊆ R ∘ R)',
        toolboxBlocks: ['assume', 'unfold', 'subset_intro', 'exists_intro', 'and_intro', 'forall_elim', 'exact'],
        introduction: `# יחס רפלקסיבי

יחס R הוא *רפלקסיבי* אם כל עצם ביחס לעצמו. גם זו הגדרה, ופותחים אותה באותו בלוק, ${UNFOLD_BLOCK}: \`reflexive(R)\` פירושו \`∀x ((x, x) ∈ R)\`.

נוכיח שאם R רפלקסיבי, אז R ⊆ R ∘ R. בכל זוג (x₀, y₀) ∈ R, צריך תחנת ביניים: אפשר לעבור מ־x₀ ל־y₀, ואחר כך להישאר ב־y₀.`,
        newDefinitions: [reflexive],
        hints: [
            'נניח reflexive(R), ופתחו את ההגדרה שלה. אחר כך יהי (x₀, y₀) ∈ R, ופתחו את הגדרת ההרכבה במטרה.',
            `בחרו את y₀ כתחנת הביניים. הצד הראשון בידינו, ואת הצד השני, (y₀, y₀) ∈ R, נותן ${FORALL_ELIM_BLOCK} עם y₀.`,
        ],
        conclusion: 'R ⊆ R ∘ R לכל יחס רפלקסיבי. בשלב 9 תראו שההכלה ההפוכה, R ∘ R ⊆ R, היא בדיוק טרנזיטיביות.',
        startXml: goalXml('(reflexive(R) → R ⊆ R ∘ R)'),
    }),
    level(8, {
        title: 'יחס סימטרי',
        name: 'unit8_l8_symmetric',
        proposition: 'symmetric R ↔ R⁻¹ ⊆ R',
        goalLabel: '(symmetric(R) ↔ R⁻¹ ⊆ R)',
        claims: ['(y₀, x₀) ∈ R⁻¹', '(x₀, y₀) ∈ R⁻¹', '(y₀, x₀) ∈ R'],
        toolboxBlocks: ['iff_intro', 'assume', 'unfold', 'subset_intro', 'forall_elim', 'forward', 'forall_intro', 'claim', 'subset_elim', 'exact'],
        introduction: `# יחס סימטרי

יחס R הוא *סימטרי* אם כל זוג ביחס נמצא בו גם הפוך: \`symmetric(R)\` פירושו \`∀x (∀y ((x, y) ∈ R → (y, x) ∈ R))\`.

נוכיח ש־R סימטרי אם ורק אם R⁻¹ ⊆ R: אפשר לנסח את התכונה בלי כמתים, כהכלה של יחסים.
בכיוון ←, כדי להשתמש בהכלה R⁻¹ ⊆ R צריך זוג ב־R⁻¹: זה המקום לטענת עזר.`,
        newDefinitions: [symmetric],
        hints: [
            'בכיוון →: פתחו את ההגדרה של symmetric(R). יהי (x₀, y₀) ∈ R⁻¹: פירושו (y₀, x₀) ∈ R. הציבו בהגדרה את y₀ ואת x₀, והשתמשו בגרירה שמתקבלת.',
            `בכיוון ←: פתחו את ההגדרה במטרה, ויהיו x₀ ו־y₀ עם (x₀, y₀) ∈ R. בעזרת ${CLAIM_BLOCK} הוכיחו קודם (y₀, x₀) ∈ R⁻¹, ואז לפי ההכלה R⁻¹ ⊆ R.`,
        ],
        conclusion: 'symmetric(R) אם ורק אם R⁻¹ ⊆ R. בעצם אז גם R⁻¹ = R. כך מנסחים תכונות של יחסים בשפה של קבוצות, וזה נוח בהוכחות.',
        startXml: goalXml('(symmetric(R) ↔ R⁻¹ ⊆ R)'),
    }),
    level(9, {
        title: 'יחס טרנזיטיבי',
        name: 'unit8_l9_transitive',
        proposition: 'transitive R ↔ R ∘ R ⊆ R',
        goalLabel: '(transitive(R) ↔ R ∘ R ⊆ R)',
        claims: ['(x₀, z₀) ∈ R ∘ R', '(x₀, y₀) ∈ R ∘ R', '(y₀, z₀) ∈ R ∘ R'],
        toolboxBlocks: ['iff_intro', 'assume', 'unfold', 'subset_intro', 'exists_elim', 'forall_elim', 'forward', 'forall_intro', 'and_elim', 'claim', 'exists_intro', 'and_intro', 'subset_elim', 'exact'],
        introduction: `# יחס טרנזיטיבי

יחס R הוא *טרנזיטיבי* אם אפשר לדלג על תחנת ביניים: \`transitive(R)\` פירושו \`∀x (∀y (∀z (((x, y) ∈ R ∧ (y, z) ∈ R) → (x, z) ∈ R)))\`.

נוכיח ש־R טרנזיטיבי אם ורק אם R ∘ R ⊆ R. כמו בשלב הקודם, התכונה היא הכלה של יחסים.`,
        newDefinitions: [transitive],
        hints: [
            'בכיוון →: פתחו את ההגדרה של transitive(R). יהי (x₀, y₀) ∈ (R ∘ R); לפי ההגדרה ולפי ה"קיים" יש z₀ עם (x₀, z₀) ∈ R ∧ (z₀, y₀) ∈ R. הציבו בהגדרה את x₀, z₀ ו־y₀, בסדר הזה.',
            'בכיוון ←: פתחו את ההגדרה במטרה, ויהיו x₀, y₀, z₀ עם (x₀, y₀) ∈ R ∧ (y₀, z₀) ∈ R. הוכיחו קודם את טענת העזר (x₀, z₀) ∈ (R ∘ R) (תחנת הביניים: y₀), ואז לפי ההכלה.',
        ],
        conclusion: 'transitive(R) אם ורק אם R ∘ R ⊆ R. יחד עם שלב 7: ביחס רפלקסיבי וטרנזיטיבי, R ∘ R = R.',
        startXml: goalXml('(transitive(R) ↔ R ∘ R ⊆ R)'),
    }),
    level(10, {
        title: 'אנטי־סימטריות של חיתוך',
        name: 'unit8_l10_antisymmetric_inter',
        proposition: 'antisymmetric R → antisymmetric (R ∩ S)',
        goalLabel: '(antisymmetric(R) → antisymmetric(R ∩ S))',
        toolboxBlocks: ['assume', 'unfold', 'forall_intro', 'and_elim', 'forall_elim', 'apply_rule', 'and_intro', 'exact'],
        introduction: `# אנטי־סימטריות של חיתוך

יחס R הוא *אנטי־סימטרי* אם שני עצמים שכל אחד מהם ביחס לשני שווים: \`antisymmetric(R)\` פירושו \`∀x (∀y (((x, y) ∈ R ∧ (y, x) ∈ R) → x = y))\`. למשל ≤ על המספרים.

נוכיח שאם R אנטי־סימטרי, גם R ∩ S אנטי־סימטרי, יהיה S אשר יהיה. כך מוכיחים שחיתוך של סדרים חלקיים הוא סדר חלקי.`,
        newDefinitions: [antisymmetric],
        hints: [
            'נניח antisymmetric(R) ופתחו את ההגדרה שלה, ואת ההגדרה במטרה. יהיו x₀, y₀, ונניח את ה"וגם".',
            'מה"וגם", ומפתיחת הגדרת החיתוך בשני הזוגות, נובעים (x₀, y₀) ∈ R ו־(y₀, x₀) ∈ R. הציבו בהגדרה של antisymmetric(R) את x₀ ואת y₀, והשתמשו בגרירה אחורה.',
        ],
        conclusion: 'אנטי־סימטריות עוברת ליחס קטן יותר, כמו רפלקסיביות שעוברת ליחס גדול יותר. בחיתוך של שני סדרים חלקיים, גם רפלקסיביות וגם טרנזיטיביות נשמרות, ולכן הוא סדר חלקי.',
        startXml: goalXml('(antisymmetric(R) → antisymmetric(R ∩ S))'),
    }),
    level(11, {
        title: 'המינימום יחיד',
        name: 'unit8_l11_minimum_unique',
        params: '(m n : obj) (hR : antisymmetric R) (hm : ∀ x, (m, x) ∈ R) (hn : ∀ x, (n, x) ∈ R)',
        proposition: 'm = n',
        goalLabel: 'm = n',
        objects: [{ name: 'm', type: 'obj' }, { name: 'n', type: 'obj' }],
        toolboxBlocks: ['unfold', 'forall_elim', 'apply_rule', 'and_intro', 'exact'],
        introduction: `# המינימום יחיד

ביחס סדר R, עצם m הוא *מינימום* אם הוא ביחס לכל עצם: ∀x ((m, x) ∈ R).
נוכיח שביחס אנטי־סימטרי יש לכל היותר מינימום אחד: אם גם m וגם n מינימום, אז m = n.`,
        hints: [`פתחו את ההגדרה של antisymmetric(R), והציבו בה את m ואת n. לפי הגרירה, די להוכיח את ה"וגם", ואת כל צד שלו נותן ${FORALL_ELIM_BLOCK} באחת ההנחות.`],
        conclusion: 'בסדר חלקי יש לכל היותר מינימום אחד. לכן מדברים על "המינימום", בה"א הידיעה.',
        startXml: goalXml('m = n', 'antisymmetric(R),  ∀x ((m, x) ∈ R),  ∀x ((n, x) ∈ R)'),
    }),
    level(12, {
        title: 'מחלקות שקילות',
        name: 'unit8_l12_equivalence_classes',
        params: '(a b : obj) (hS : symmetric R) (hT : transitive R) (hab : (a, b) ∈ R)',
        proposition: '[a]_R = [b]_R',
        goalLabel: '[a]_R = [b]_R',
        objects: [{ name: 'a', type: 'obj' }, { name: 'b', type: 'obj' }],
        toolboxBlocks: ['unfold', 'set_eq', 'subset_intro', 'forall_elim', 'apply_rule', 'and_intro', 'forward', 'exact'],
        introduction: `# מחלקות שקילות

יחס רפלקסיבי, סימטרי וטרנזיטיבי הוא *יחס שקילות*. \`[a]_R\` היא *מחלקת השקילות* של a: העצמים ש־a ביחס אליהם. לפי ההגדרה, \`x ∈ [a]_R\` פירושו \`(a, x) ∈ R\`.

נוכיח שאם a ביחס ל־b, אז יש להם אותה מחלקה. כאן מספיקות הסימטריות והטרנזיטיביות.`,
        newDefinitions: [equivalenceClass],
        hints: [
            'פתחו את ההגדרה של transitive(R), ואחר כך שתי הכלות. בכל אחת, יהי x₀ ופתחו את הגדרת המחלקה בהנחה ובמטרה.',
            'בהכלה הראשונה, (a, x₀) ∈ R בידינו וצריך (b, x₀) ∈ R: הציבו בטרנזיטיביות את b, a ו־x₀. את (b, a) ∈ R נותנת הסימטריות, אחרי הצבה של a ושל b.',
            'בהכלה השנייה, (b, x₀) ∈ R בידינו וצריך (a, x₀) ∈ R: הציבו בטרנזיטיביות את a, b ו־x₀.',
        ],
        conclusion: 'אם a ביחס ל־b, אז [a]_R = [b]_R. כל עצם במחלקה "מייצג" אותה.',
        startXml: goalXml('[a]_R = [b]_R', 'symmetric(R),  transitive(R),  (a, b) ∈ R'),
    }),
    level(13, {
        title: 'מחלקות נחתכות',
        name: 'unit8_l13_classes_meet',
        params: '(a b c : obj) (hS : symmetric R) (hT : transitive R) (ha : c ∈ [a]_R) (hb : c ∈ [b]_R)',
        proposition: '(a, b) ∈ R',
        goalLabel: '(a, b) ∈ R',
        objects: [{ name: 'a', type: 'obj' }, { name: 'b', type: 'obj' }, { name: 'c', type: 'obj' }],
        toolboxBlocks: ['unfold', 'forall_elim', 'apply_rule', 'and_intro', 'forward', 'exact'],
        introduction: `# מחלקות נחתכות

נוכיח שאם יש עצם c בשתי המחלקות, [a]_R ו־[b]_R, אז a ביחס ל־b. יחד עם השלב הקודם: שתי מחלקות שנחתכות שוות. לכן מחלקות השקילות שוות או זרות: הן *חלוקה* של העצמים.`,
        hints: ['פתחו את ההגדרות של שתי ההנחות על c, ואת ההגדרה של transitive(R). הציבו בה את a, c ו־b. את (c, b) ∈ R נותנת הסימטריות.'],
        conclusion: 'שתי מחלקות שקילות שנחתכות שוות (בעזרת שלב 12). לכן כל יחס שקילות מחלק את העצמים למחלקות זרות, וכל חלוקה כזאת באה מיחס שקילות.',
        startXml: goalXml('(a, b) ∈ R', 'symmetric(R),  transitive(R),  c ∈ [a]_R,  c ∈ [b]_R'),
    }),
    level(14, {
        title: 'שלב בונוס: הרכבה של יחסים טרנזיטיביים',
        name: 'unit8_l14_transitive_composition',
        params: '(hR : transitive R) (hS : transitive S) (hc : R ∘ S = S ∘ R)',
        proposition: 'transitive (R ∘ S)',
        goalLabel: 'transitive(R ∘ S)',
        claims: ['(z₁, z₂) ∈ S ∘ R', '(z₁, z₂) ∈ R ∘ S', '(x₀, z₀) ∈ S'],
        toolboxBlocks: ['unfold', 'forall_intro', 'assume', 'and_elim', 'exists_elim', 'claim', 'exists_intro', 'and_intro', 'rewrite', 'forall_elim', 'apply_rule', 'exact'],
        introduction: `# בונוס: הרכבה של יחסים טרנזיטיביים

שאלה ממבחן (2023ב, מועד ב): אם R ו־S טרנזיטיביים, ו־R ∘ S = S ∘ R, אז גם R ∘ S טרנזיטיבי.

מ־(x₀, y₀) ∈ (R ∘ S) ומ־(y₀, z₀) ∈ (R ∘ S) מקבלים ארבעה צעדים: S, R, S, R. בשני הצעדים האמצעיים, R ואחריו S, יש זוג ב־S ∘ R, ולפי השוויון שבידינו אפשר להחליף את הסדר שלהם. אז שני צעדי S באים יחד, ושני צעדי R באים יחד, וכל זוג מתאחד בעזרת הטרנזיטיביות.`,
        hints: ['אחרי פתיחת ההגדרות ושני ה"קיים", יש z₁ ו־z₂ באמצע. הוכיחו את טענת העזר (z₁, z₂) ∈ (S ∘ R), החליפו בה לפי R ∘ S = S ∘ R, ופתחו שוב את ההגדרה.'],
        conclusion: 'סיימתם את יחידה 8, כולל שלב הבונוס! השוויון R ∘ S = S ∘ R שימש כהחלפה של יחסים בתוך טענת שייכות, כמו בשלבים 2–4.',
        startXml: goalXml('transitive(R ∘ S)', 'transitive(R),  transitive(S),  R ∘ S = S ∘ R'),
    }),
];
