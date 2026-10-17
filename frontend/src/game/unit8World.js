import { goalXml } from './levelXml';

// Unit 8 (see blocks/moves.js): equality and induction, as in Logic and
// Proof (chapter 17) and the Natural Number Game. An equality is used by its statement ("לפי
// השוויון y = x + 7, נחליף את y ב־x + 7 בתוך המטרה"); induction heads its
// parts by what is proved in them, and its step keeps the variable's name
// ("נניח P(n) ונוכיח P(n + 1)"), as in Logic and Proof. Each level offers
// only the moves of its solutions.

export const unit8WorldName = 'יחידה 8 - שוויון ואינדוקציה';

const OBJECTS = 'variable {obj : Type} {P : obj → Prop}';

// The moves as the toolbox shows them, before they are placed.
const RFL_BLOCK = '"שני הצדדים שווים לפי ההגדרה."';
const REWRITE_BLOCK = '"לפי השוויון ? נחליף ..."';
const INDUCTION_BLOCK = '"נוכיח באינדוקציה על ?"';
const UNFOLD_BLOCK = '"נשתמש בהגדרת ? כדי לשכתב ..."';
const CALC_BLOCK = '"נכונות המטרה נובעת מחשבון פשוט."';
const CALC_HYPS_BLOCK = '"נכונות המטרה נובעת מחשבון פשוט ומההנחות שבידינו."';
const ALGEBRA_BLOCK = '"נכונות המטרה נובעת מאלגברה."';
const ALGEBRA_HYPS_BLOCK = '"נכונות המטרה נובעת מאלגברה ומההנחות שבידינו."';
const CLOSE_BLOCK = '"יש לנו ביד בדיוק את מה שאנחנו רוצים להוכיח."';

const rflInfo = {
    name: 'שוויון לפי ההגדרה',
    doc: 'אם שני הצדדים של שוויון שווים לפי ההגדרות עצמן, בלי שום טענה נוספת, השוויון מוכח.',
};
const rewriteInfo = {
    name: 'החלפה לפי שוויון',
    doc: 'אם a = b, אפשר להחליף את a ב־b, או את b ב־a, במטרה או בטענה שבידינו. בהוכחה כתובה: "לפי a = b, נחליף את a ב־b".',
};
const inductionInfo = {
    name: 'הוכחה באינדוקציה',
    doc: 'כדי להוכיח טענה P(n) לכל מספר טבעי n: מוכיחים P(0) (בסיס), ומניחים P(n) (הנחת האינדוקציה) ומוכיחים P(n + 1) (צעד). מהלך שמשתמש בהנחת האינדוקציה כותב זאת, כמו בהוכחה כתובה: "לפי הנחת האינדוקציה ...".',
};
const unfoldInfo = {
    name: 'פתיחת הגדרה',
    doc: 'משכתב לפי ההגדרה של פונקציה שמוגדרת ברקורסיה: בוחרים בבלוק את הפונקציה, את החלק לשכתב (כשיש אחד בלבד, הוא נבחר לבד), ואת המקום, המטרה או טענה שבידינו. הבלוק כותב מה התקבל.',
};
const calcInfo = {
    name: 'חשבון',
    doc: 'סוגר מטרה של חשבון פשוט (חיבור, כפל במספר, אי־שוויונות), מהמטרה לבדה: הוא לא משתמש במה שבידינו, ולא פותח הגדרות. כדי להשתמש בהנחת האינדוקציה, מחליפים לפיה קודם.',
};
const calcHypsInfo = {
    name: 'חשבון בעזרת ההנחות',
    doc: 'כמו "נכונות המטרה נובעת מחשבון פשוט", אבל בעזרת ההנחות שבידינו. משתמשים בו כשאי אפשר להחליף לפי ההנחה, למשל כשהיא אי־שוויון.',
};
const algebraInfo = {
    name: 'אלגברה',
    doc: 'סוגר מטרה שדורשת אלגברה, כמו פתיחת סוגריים וכינוס איברים, מהמטרה לבדה: הוא לא משתמש במה שבידינו, ולא פותח הגדרות.',
};
const algebraHypsInfo = {
    name: 'אלגברה בעזרת ההנחות',
    doc: 'סוגר מטרה שדורשת אלגברה, כמו פתיחת סוגריים וכינוס איברים, בעזרת ההנחות שבידינו. משתמשים בו כשאי אפשר להחליף לפי ההנחה, כי היא לא מופיעה במטרה כמו שהיא. הוא לא פותח הגדרות.',
};
const definition = (symbol, doc) => ({ symbol, doc });

const level = (number, fields) => ({
    id: `unit8-${number}`,
    levelNumber: number,
    totalLevels: 11,
    usesNat: true,
    variableLine: '',
    objects: [],
    assumptions: [],
    newTacticsBlocks: [],
    newTacticsInfo: [],
    newDefinitions: [],
    ...fields,
});

export const unit8Levels = [
    level(1, {
        title: 'שוויון לפי ההגדרה',
        name: 'unit8_l1_rfl',
        params: '(n : Nat)',
        proposition: 'n + 0 = n',
        goalLabel: 'n + 0 = n',
        objects: [{ name: 'n', type: 'ℕ' }],
        toolboxBlocks: ['rfl'],
        introduction: `# שוויון לפי ההגדרה

ביחידה הזאת הטענות מדברות על *מספרים טבעיים*: 0, 1, 2, ... כאן n הוא מספר טבעי כלשהו.

החיבור מוגדר כך: \`n + 0 = n\`, ו־\`n + (m + 1) = (n + m) + 1\`. לכן הטענה \`n + 0 = n\` נכונה *לפי ההגדרה*: שני הצדדים הם אותו דבר.
הבלוק ${RFL_BLOCK} סוגר מטרה כזאת.`,
        newTacticsBlocks: ['rfl'],
        newTacticsInfo: [rflInfo],
        newDefinitions: [definition('החיבור', 'n + 0 = n, ו־n + (m + 1) = (n + m) + 1.')],
        hints: [`גררו את הבלוק ${RFL_BLOCK} אל תוך בלוק המטרה.`],
        conclusion: `שוויון ששני צדדיו זהים לפי ההגדרות מוכח מיד. זה עיקרון הרפלקסיביות: כל דבר שווה לעצמו.`,
        startXml: goalXml('n + 0 = n'),
    }),
    level(2, {
        title: 'מחליפים לפי שוויון',
        name: 'unit8_l2_rewrite',
        params: '(x y : Nat) (h : y = x + 7)',
        proposition: '2 * y = 2 * (x + 7)',
        goalLabel: '2 · y = 2 · (x + 7)',
        objects: [{ name: 'x', type: 'ℕ' }, { name: 'y', type: 'ℕ' }],
        assumptions: [{ name: 'h', prop: 'y = x + 7' }],
        toolboxBlocks: ['rewrite', 'rfl'],
        introduction: `# מחליפים לפי שוויון

נתון ש־\`y = x + 7\`. אם שני דברים שווים, אפשר להחליף אחד בשני בכל מקום, כמו שביחידה 5 החלפתם טענה בטענה ששקולה לה.

הבלוק ${REWRITE_BLOCK} עושה זאת: בוחרים בו את השוויון, את ההחלפה (את y ב־x + 7, או להפך), ואיפה להחליף: במטרה או בטענה שבידינו.
בהוכחה כתובה: "לפי y = x + 7, נחליף את y ב־x + 7 במטרה". אחר כך שני הצדדים של המטרה זהים.`,
        newTacticsBlocks: ['rewrite'],
        newTacticsInfo: [rewriteInfo],
        hints: [
            `גררו את הבלוק ${REWRITE_BLOCK} אל תוך בלוק המטרה, ובחרו בו y = x + 7, את ההחלפה "את y ב־x + 7", ו"המטרה".`,
            `עכשיו המטרה היא 2 · (x + 7) = 2 · (x + 7): הוסיפו את הבלוק ${RFL_BLOCK}.`,
        ],
        conclusion: `החלפתם את y לפי השוויון, ואחר כך שני הצדדים היו זהים. זה העיקרון השני של שוויון: מותר להחליף שווה בשווה.`,
        startXml: goalXml('2 · y = 2 · (x + 7)', 'y = x + 7'),
    }),
    level(3, {
        title: 'כיוון ההחלפה',
        name: 'unit8_l3_direction',
        usesNat: false,
        variableLine: OBJECTS,
        params: '(a b : obj) (h : a = b) (hb : P b)',
        proposition: 'P a',
        goalLabel: 'P(a)',
        objects: [{ name: 'a', type: 'obj' }, { name: 'b', type: 'obj' }],
        assumptions: [{ name: 'h', prop: 'a = b' }, { name: 'hb', prop: 'P(b)' }],
        toolboxBlocks: ['rewrite', 'exact'],
        introduction: `# כיוון ההחלפה

שוויון אפשר להפעיל בשני כיוונים: מ־\`a = b\` אפשר להחליף את a ב־b, וגם את b ב־a.

נתון ש־a = b, וש־b מקיים את P. המטרה היא P(a). יש שתי דרכים:
להחליף את b ב־a בתוך הטענה P(b) שבידינו, ולקבל P(a); או להחליף את a ב־b במטרה, ולקבל P(b), שכבר בידינו.`,
        hints: [
            `גררו את הבלוק ${REWRITE_BLOCK}, ובחרו בו a = b, את ההחלפה "את b ב־a", ואת P(b). עכשיו P(a) בידינו.`,
            `הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
            'או: בחרו בבלוק את ההחלפה "את a ב־b" ו"המטרה": המטרה תהיה P(b), וזה בידינו.',
        ],
        conclusion: `ההחלפה תלויה במה שרוצים להחליף ובמקום: בטענה שבידינו או במטרה.`,
        startXml: goalXml('P(a)', 'a = b,  P(b)'),
    }),
    level(4, {
        title: 'שרשרת של שוויונות',
        name: 'unit8_l4_trans',
        usesNat: false,
        variableLine: 'variable {obj : Type}',
        params: '(a b c : obj) (h1 : a = b) (h2 : b = c)',
        proposition: 'a = c',
        goalLabel: 'a = c',
        objects: [{ name: 'a', type: 'obj' }, { name: 'b', type: 'obj' }, { name: 'c', type: 'obj' }],
        assumptions: [{ name: 'h1', prop: 'a = b' }, { name: 'h2', prop: 'b = c' }],
        toolboxBlocks: ['rewrite', 'exact'],
        introduction: `# שרשרת של שוויונות

אם a = b ו־b = c, אז a = c. זו *הטרנזיטיביות* של השוויון, והיא נובעת מהחלפה: מחליפים במטרה את a ב־b, ומקבלים b = c, שכבר בידינו.
אפשר גם להחליף במטרה את c ב־b, ולקבל a = b.`,
        hints: [
            `גררו את הבלוק ${REWRITE_BLOCK}, ובחרו בו a = b, את ההחלפה "את a ב־b", ו"המטרה". המטרה תהיה b = c.`,
            `b = c בידינו: הוסיפו את הבלוק ${CLOSE_BLOCK}.`,
            'או: לפי b = c, החליפו במטרה את c ב־b. המטרה תהיה a = b, וזה בידינו.',
        ],
        conclusion: `גם הטרנזיטיביות וגם הסימטריה של שוויון (מ־a = b נובע b = a) נובעות משני העקרונות: כל דבר שווה לעצמו, ומותר להחליף שווה בשווה.`,
        startXml: goalXml('a = c', 'a = b,  b = c'),
    }),
    level(5, {
        title: 'אינדוקציה ראשונה',
        name: 'unit8_l5_double',
        params: '(n : Nat)',
        proposition: 'double n = n + n',
        goalLabel: 'double(n) = n + n',
        objects: [{ name: 'n', type: 'ℕ' }],
        toolboxBlocks: ['induction', 'unfold_function', 'rewrite', 'rfl', 'calc'],
        introduction: `# אינדוקציה

הפונקציה double מוגדרת *ברקורסיה*: \`double(0) = 0\`, ו־\`double(n + 1) = double(n) + 2\`. נוכיח ש־double(n) = n + n *לכל* n.

אי אפשר לבדוק את כל המספרים אחד אחד. *אינדוקציה* מוכיחה את הטענה בשני חלקים:
*בסיס*: הטענה נכונה עבור 0. *צעד*: אם הטענה נכונה עבור n (זו *הנחת האינדוקציה*), היא נכונה גם עבור n + 1.
מ־0 עוברים ל־1, מ־1 ל־2, וכן הלאה: הטענה נכונה לכל n.

הבלוק ${INDUCTION_BLOCK} מפצל את ההוכחה לשני החלקים, ובראש כל חלק כתוב מה מוכיחים בו.
בכל חלק פתחו את ההגדרה של double. בצעד, החליפו לפי הנחת האינדוקציה, ואת השאר משלים חשבון.`,
        newTacticsBlocks: ['induction', 'unfold_function', 'calc'],
        newTacticsInfo: [inductionInfo, unfoldInfo, calcInfo],
        newDefinitions: [definition('double', 'double(0) = 0, ו־double(n + 1) = double(n) + 2.')],
        hints: [
            `גררו את הבלוק ${INDUCTION_BLOCK} אל תוך בלוק המטרה, ובחרו בו n. בראש החלקים כתוב: בסיס: נוכיח double(0) = 0 + 0; צעד: נניח double(n) = n + n ונוכיח double(n + 1) = (n + 1) + (n + 1).`,
            `בבסיס: ${UNFOLD_BLOCK} עם double, ואחריו ${RFL_BLOCK}.`,
            `בצעד: ${UNFOLD_BLOCK} עם double. אחר כך ${REWRITE_BLOCK} עם הנחת האינדוקציה double(n) = n + n, "את double(n) ב־n + n", במטרה. לבסוף ${CALC_BLOCK}`,
        ],
        conclusion: `הוכחתם בסיס וצעד, ולכן הטענה נכונה לכל n. שימו לב שהחשבון לבדו לא הספיק: הוא לא פותח את ההגדרה של double, ולא משתמש בהנחת האינדוקציה עד שמחליפים לפיה.`,
        startXml: goalXml('double(n) = n + n'),
    }),
    level(6, {
        title: '0 + n = n',
        name: 'unit8_l6_zero_add',
        params: '(n : Nat)',
        proposition: '0 + n = n',
        goalLabel: '0 + n = n',
        objects: [{ name: 'n', type: 'ℕ' }],
        toolboxBlocks: ['induction', 'unfold_function', 'rewrite', 'rfl'],
        introduction: `# 0 + n = n

בשלב 1 ראינו ש־\`n + 0 = n\` לפי ההגדרה. האם גם \`0 + n = n\`? לא לפי ההגדרה: החיבור מוגדר לפי המחובר *השני*, ו־n כאן הוא מספר כלשהו.
לכן צריך אינדוקציה. בצעד, פתחו את הגדרת החיבור: \`0 + (n + 1) = (0 + n) + 1\`, והחליפו לפי הנחת האינדוקציה. הפעם אין חשבון: רק הגדרות והחלפות.`,
        hints: [
            `אינדוקציה על n. בבסיס, 0 + 0 = 0 נכון לפי ההגדרה: ${RFL_BLOCK}`,
            `בצעד: ${UNFOLD_BLOCK} עם החיבור, ואחריו ${REWRITE_BLOCK} עם 0 + n = n, "את 0 + n ב־n", במטרה. שני הצדדים זהים.`,
        ],
        conclusion: `n + 0 = n נכון לפי ההגדרה, אבל 0 + n = n דרש אינדוקציה. סימטריה שנראית מובנת מאליה צריכה הוכחה.`,
        startXml: goalXml('0 + n = n'),
    }),
    level(7, {
        title: 'צעד בלי בסיס',
        name: 'unit8_l7_no_base',
        params: '(n : Nat)',
        proposition: '(n + 1 ≤ n) → (n + 1 + 1 ≤ n + 1)',
        goalLabel: '((n + 1 ≤ n) → (n + 1 + 1 ≤ n + 1))',
        objects: [{ name: 'n', type: 'ℕ' }],
        toolboxBlocks: ['assume', 'calc_hyps'],
        newTacticsBlocks: ['calc_hyps'],
        newTacticsInfo: [calcHypsInfo],
        introduction: `# צעד בלי בסיס

נסתכל על הטענה P(n): \`n + 1 ≤ n\`. היא *לא* נכונה: אף מספר לא גדול מעצמו.
ובכל זאת, הצעד שלה נכון: אם P(n), אז P(n + 1). הוכיחו את הצעד הזה.`,
        hints: [
            'נניח את התנאי, n + 1 ≤ n.',
            `התנאי הוא אי־שוויון, ולכן אי אפשר להחליף לפיו; נכונות המטרה נובעת מחשבון פשוט בעזרתו: ${CALC_HYPS_BLOCK}`,
        ],
        conclusion: `הצעד נכון, אבל הטענה P(n) לא נכונה לאף n, כי הבסיס, 0 + 1 ≤ 0, לא נכון.
צעד לבד לא מספיק: בלי בסיס אין מאיפה להתחיל, והשרשרת "מ־0 ל־1, מ־1 ל־2" לא מתחילה בכלל.`,
        startXml: goalXml('((n + 1 ≤ n) → (n + 1 + 1 ≤ n + 1))'),
    }),
    level(8, {
        title: 'אינדוקציה ואי־שוויון',
        name: 'unit8_l8_pow',
        params: '(n : Nat)',
        proposition: 'n + 1 ≤ 2 ^ n',
        goalLabel: 'n + 1 ≤ 2 ^ n',
        objects: [{ name: 'n', type: 'ℕ' }],
        toolboxBlocks: ['induction', 'unfold_function', 'calc', 'calc_hyps'],
        introduction: `# אינדוקציה ואי־שוויון

אינדוקציה מוכיחה גם אי־שוויונות. נוכיח ש־\`n + 1 ≤ 2^n\` לכל n.
בצעד, פתחו את הגדרת החזקה, \`2^(n + 1) = 2^n · 2\`. הנחת האינדוקציה היא אי־שוויון, ואי אפשר להחליף לפיה, ולכן החשבון משתמש בה: ${CALC_HYPS_BLOCK}`,
        newDefinitions: [definition('החזקה', '2^0 = 1, ו־2^(n + 1) = 2^n · 2.')],
        hints: [
            `אינדוקציה על n. בבסיס, 0 + 1 ≤ 2^0 נובע מחשבון פשוט: ${CALC_BLOCK}`,
            `בצעד: ${UNFOLD_BLOCK} עם החזקה, ואחריו ${CALC_HYPS_BLOCK}`,
        ],
        conclusion: `הנחת האינדוקציה אומרת ש־n + 1 ≤ 2^n, והכפלה ב־2 נותנת את הצעד.`,
        startXml: goalXml('n + 1 ≤ 2 ^ n'),
    }),
    level(9, {
        title: 'סכום המספרים',
        name: 'unit8_l9_sum',
        params: '(n : Nat)',
        proposition: '2 * sumTo n = n * (n + 1)',
        goalLabel: '2 · sumTo(n) = n · (n + 1)',
        objects: [{ name: 'n', type: 'ℕ' }],
        toolboxBlocks: ['induction', 'unfold_function', 'rfl', 'algebra_hyps'],
        introduction: `# סכום המספרים

\`sumTo(n)\` הוא הסכום \`0 + 1 + ... + n\`. הוא מוגדר ברקורסיה: \`sumTo(0) = 0\`, ו־\`sumTo(n + 1) = sumTo(n) + (n + 1)\`.
נוכיח את הנוסחה הקלאסית: פעמיים הסכום הוא n · (n + 1). בצעד צריך אלגברה (פתיחת סוגריים). הנחת האינדוקציה מדברת על 2 · sumTo(n), אבל אחרי פתיחת ההגדרה המטרה מדברת על 2 · (sumTo(n) + (n + 1)), ולכן אי אפשר להחליף לפיה: האלגברה משתמשת בה, ${ALGEBRA_HYPS_BLOCK}`,
        newTacticsBlocks: ['algebra_hyps'],
        newTacticsInfo: [algebraHypsInfo],
        newDefinitions: [definition('sumTo', 'sumTo(0) = 0, ו־sumTo(n + 1) = sumTo(n) + (n + 1).')],
        hints: [
            `אינדוקציה על n. בבסיס: ${UNFOLD_BLOCK} עם sumTo, ואחריו ${RFL_BLOCK}`,
            `בצעד: ${UNFOLD_BLOCK} עם sumTo, ואחריו ${ALGEBRA_HYPS_BLOCK}`,
        ],
        conclusion: `זו הנוסחה ש־Gauss מצא, לפי הסיפור, בגיל צעיר: \`0 + 1 + ... + n = n(n + 1)/2\`. האינדוקציה מוכיחה אותה לכל n.`,
        startXml: goalXml('2 · sumTo(n) = n · (n + 1)'),
    }),
    level(10, {
        title: 'תרגיל מסכם: זוגי או אי־זוגי',
        name: 'unit8_l10_even_odd',
        params: '(n : Nat)',
        proposition: '(∃ j, n = 2 * j) ∨ (∃ j, n = 2 * j + 1)',
        goalLabel: '(∃j (n = 2 · j)) ∨ (∃j (n = 2 · j + 1))',
        objects: [{ name: 'n', type: 'ℕ' }],
        toolboxBlocks: ['induction', 'or_elim', 'or_intro', 'exists_elim', 'exists_intro', 'rfl', 'calc_hyps'],
        introduction: `# תרגיל מסכם: זוגי או אי־זוגי

כל מספר טבעי הוא זוגי (\`n = 2 · j\`) או אי־זוגי (\`n = 2 · j + 1\`). נוכיח זאת באינדוקציה, יחד עם הכלים של יחידות 2 ו־4.

בצעד, הנחת האינדוקציה היא "או": חלקו למקרים. אם n זוגי, n + 1 אי־זוגי; ואם n אי־זוגי, n + 1 זוגי.
בכל מקרה, קבלו את העצם j₀ מטענת ה"קיים", ובחרו עד מתאים. עד שאינו ברשימה, כמו 0 או j₀ + 1, כותבים ב"כתיבה ידנית".`,
        hints: [
            `אינדוקציה על n. בבסיס: די להוכיח את הצד הראשון, ∃j (0 = 2 · j); בחרו את העד 0 (בכתיבה ידנית), ואחריו ${RFL_BLOCK}`,
            'בצעד: חלקו למקרים לפי הנחת האינדוקציה. במקרה הזוגי: לפי ה"קיים" ∃j (n = 2 · j), יהי j₀ כזה; די להוכיח את הצד השני, והעד הוא j₀.',
            `במקרה האי־זוגי: יהי j₀ עם n = 2 · j₀ + 1; די להוכיח את הצד הראשון, והעד הוא j₀ + 1 (בכתיבה ידנית). בכל מקרה החשבון משתמש במה שידוע על j₀: ${CALC_HYPS_BLOCK}`,
        ],
        conclusion: `אינדוקציה עובדת יחד עם כל הכלים הקודמים: כאן הנחת האינדוקציה הייתה "או", ובכל מקרה בחרתם עד ל"קיים".
בשלב הבונוס תוכיחו נוסחה נוספת לסכום.`,
        startXml: goalXml('(∃j (n = 2 · j)) ∨ (∃j (n = 2 · j + 1))'),
    }),
    level(11, {
        title: 'שלב בונוס: סכום האי־זוגיים',
        name: 'unit8_l11_odd_sum',
        params: '(n : Nat)',
        proposition: 'oddSum n = n * n',
        goalLabel: 'oddSum(n) = n · n',
        objects: [{ name: 'n', type: 'ℕ' }],
        toolboxBlocks: ['induction', 'unfold_function', 'rewrite', 'rfl', 'algebra'],
        introduction: `# בונוס: סכום האי־זוגיים

\`oddSum(n)\` הוא סכום n המספרים האי־זוגיים הראשונים: \`1 + 3 + 5 + ...\`. הוא מוגדר ברקורסיה: \`oddSum(0) = 0\`, ו־\`oddSum(n + 1) = oddSum(n) + (2n + 1)\`.
הסכום הוא תמיד ריבוע: \`1 = 1\`, \`1 + 3 = 4\`, \`1 + 3 + 5 = 9\`. הוכיחו שזה נכון לכל n.
כאן אפשר להחליף לפי הנחת האינדוקציה, ואחר כך מספיקה אלגברה מהמטרה לבדה: ${ALGEBRA_BLOCK}`,
        newTacticsBlocks: ['algebra'],
        newTacticsInfo: [algebraInfo],
        newDefinitions: [definition('oddSum', 'oddSum(0) = 0, ו־oddSum(n + 1) = oddSum(n) + (2n + 1).')],
        hints: [
            `אינדוקציה על n. בבסיס: ${UNFOLD_BLOCK} עם oddSum, ואחריו ${RFL_BLOCK}`,
            `בצעד: ${UNFOLD_BLOCK} עם oddSum, ${REWRITE_BLOCK} עם הנחת האינדוקציה, "את oddSum(n) ב־n · n", במטרה, ואז ${ALGEBRA_BLOCK}`,
        ],
        conclusion: `סיימתם את יחידה 8, כולל שלב הבונוס! סכום n האי־זוגיים הראשונים הוא n²: כל אי־זוגי מוסיף "מסגרת" לריבוע הקודם.`,
        startXml: goalXml('oddSum(n) = n · n'),
    }),
];
