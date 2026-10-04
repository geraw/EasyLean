import { goalXml } from './levelXml';

export const unit6WorldName = 'יחידה 6 - שוויון ואינדוקציה';

const rflInfo = {
    name: 'שוויון לפי ההגדרה',
    doc: 'אם שני הצדדים של שוויון שווים לפי ההגדרות עצמן, בלי שום טענה נוספת, השוויון מוכח.',
};
const rewriteInfo = {
    name: 'החלפה לפי שוויון',
    doc: 'אם a = b, אפשר להחליף את a ב־b (משמאל לימין), או את b ב־a (מימין לשמאל), במטרה או בהנחה.',
};
const inductionInfo = {
    name: 'הוכחה באינדוקציה',
    doc: 'כדי להוכיח טענה לכל מספר טבעי n: מוכיחים אותה עבור 0 (בסיס), ומוכיחים שאם היא נכונה עבור k אז היא נכונה עבור k + 1 (צעד).',
};
const calcInfo = {
    name: 'חשבון',
    doc: 'סוגר מטרה של חשבון פשוט (חיבור, כפל במספר, אי־שוויונות), גם בעזרת ההנחות. הוא לא פותח הגדרות.',
};
const algebraInfo = {
    name: 'אלגברה',
    doc: 'סוגר מטרה שדורשת אלגברה, כמו פתיחת סוגריים וכינוס איברים, גם בעזרת ההנחות. הוא לא פותח הגדרות.',
};
const unfoldInfo = (name, definition) => ({ name: `הגדרת ${name}`, doc: definition });

// The typical mistake of level 3, already placed: substituting in the wrong
// direction, in an assumption that does not contain the side being replaced.
const wrongDirectionXml = `
      <block type="logic_rewrite">
        <field name="EQUATION">h</field>
        <field name="DIRECTION">FORWARD</field>
        <field name="TARGET">HYPOTHESIS</field>
        <field name="HYPOTHESIS">hb</field>
      </block>`;

const OBJECTS = 'variable {obj : Type} {P : obj → Prop}';

const level = (number, fields) => ({
    id: `unit6-${number}`,
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

export const unit6Levels = [
    level(1, {
        title: 'שוויון לפי ההגדרה',
        name: 'unit6_l1_rfl',
        params: '(n : Nat)',
        proposition: 'n + 0 = n',
        goalLabel: 'n + 0 = n',
        objects: [{ name: 'n', type: 'ℕ' }],
        toolboxBlocks: ['logic_rfl'],
        introduction: `# שוויון לפי ההגדרה

ביחידה הזאת הטענות מדברות על *מספרים טבעיים*: 0, 1, 2, ...

החיבור מוגדר כך: \`n + 0 = n\`, ו־\`n + (m + 1) = (n + m) + 1\`. לכן הטענה \`n + 0 = n\` נכונה *לפי ההגדרה*: שני הצדדים הם אותו דבר.`,
        newTacticsBlocks: ['logic_rfl'],
        newTacticsInfo: [rflInfo],
        hints: ['גררו את הבלוק "שני הצדדים שווים לפי ההגדרה".'],
        conclusion: `שוויון ששני צדדיו זהים לפי ההגדרות מוכח מיד. זה עיקרון הרפלקסיביות: כל דבר שווה לעצמו.`,
        startXml: goalXml('n + 0 = n', 'n : ℕ'),
    }),
    level(2, {
        title: 'מחליפים לפי שוויון',
        name: 'unit6_l2_rewrite',
        params: '(x y : Nat) (h : y = x + 7)',
        proposition: '2 * y = 2 * (x + 7)',
        goalLabel: '2 · y = 2 · (x + 7)',
        objects: [{ name: 'x', type: 'ℕ' }, { name: 'y', type: 'ℕ' }],
        assumptions: [{ name: 'h', prop: 'y = x + 7' }],
        toolboxBlocks: ['logic_rewrite', 'logic_rfl'],
        introduction: `# מחליפים לפי שוויון

נתון ש־\`y = x + 7\`. אם שני דברים שווים, אפשר להחליף אחד בשני בכל מקום.

החליפו לפי h את y ב־\`x + 7\`, כלומר את הצד השמאלי של השוויון בצד הימני שלו. אחר כך שני הצדדים של המטרה זהים.`,
        newTacticsBlocks: ['logic_rewrite'],
        newTacticsInfo: [rewriteInfo],
        hints: [
            'גררו את הבלוק "נחליף לפי השוויון ?", כתבו בו h, ובחרו "משמאל לימין" ו"המטרה".',
            'עכשיו המטרה היא 2 · (x + 7) = 2 · (x + 7): שני הצדדים שווים לפי ההגדרה.',
        ],
        conclusion: `החלפתם את y לפי השוויון h, ואחר כך שני הצדדים היו זהים. זה העיקרון השני של שוויון: מותר להחליף שווה בשווה.`,
        startXml: goalXml('2 · y = 2 · (x + 7)', 'x y : ℕ,  h : y = x + 7'),
    }),
    level(3, {
        title: 'כיוון ההחלפה',
        name: 'unit6_l3_direction',
        usesNat: false,
        variableLine: OBJECTS,
        params: '(a b : obj) (h : a = b) (hb : P b)',
        proposition: 'P a',
        goalLabel: 'P(a)',
        objects: [{ name: 'a', type: 'obj' }, { name: 'b', type: 'obj' }],
        assumptions: [{ name: 'h', prop: 'a = b' }, { name: 'hb', prop: 'P(b)' }],
        toolboxBlocks: ['logic_rewrite', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# כיוון ההחלפה

שוויון אפשר להפעיל בשני כיוונים: \`a = b\` מאפשרת להחליף את a ב־b (משמאל לימין), וגם את b ב־a (מימין לשמאל).

נתון ש־a = b, וש־b מקיים את P. המטרה היא P(a). ההוכחה כבר התחילה: החלפנו לפי h משמאל לימין בהנחה hb. אבל הבלוק אדום: ב־P(b) אין a שאפשר להחליף.
תקנו את הכיוון, או החליפו במקום אחר.`,
        hints: [
            'בבלוק, בחרו "מימין לשמאל": ב־hb יש b, והוא יוחלף ב־a. אחר כך hb אומרת בדיוק את המטרה.',
            'או: בחרו "המטרה" ו"משמאל לימין": ה־a שבמטרה יוחלף ב־b, ו־hb תסגור אותה.',
        ],
        conclusion: `הכיוון של ההחלפה תלוי במה שרוצים להחליף ובמקום: משמאל לימין מחליף את הצד השמאלי, ומימין לשמאל את הצד הימני.`,
        startXml: goalXml('P(a)', 'a b : obj,  h : a = b,  hb : P(b)', wrongDirectionXml),
    }),
    level(4, {
        title: 'שרשרת של שוויונות',
        name: 'unit6_l4_trans',
        usesNat: false,
        variableLine: 'variable {obj : Type}',
        params: '(a b c : obj) (h1 : a = b) (h2 : b = c)',
        proposition: 'a = c',
        goalLabel: 'a = c',
        objects: [{ name: 'a', type: 'obj' }, { name: 'b', type: 'obj' }, { name: 'c', type: 'obj' }],
        assumptions: [{ name: 'h1', prop: 'a = b' }, { name: 'h2', prop: 'b = c' }],
        toolboxBlocks: ['logic_rewrite', 'logic_rfl', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# שרשרת של שוויונות

אם a = b ו־b = c, אז a = c. זו *הטרנזיטיביות* של השוויון, והיא נובעת מהעיקרון של החלפה: מחליפים במטרה את a ב־b, ומקבלים את h2.`,
        hints: [
            'החליפו לפי h1 משמאל לימין במטרה: המטרה תהיה b = c.',
            'עכשיו h2 אומרת בדיוק את המטרה.',
        ],
        conclusion: `גם הטרנזיטיביות וגם הסימטריה של שוויון (מ־a = b נובע b = a) נובעות משני העקרונות: כל דבר שווה לעצמו, ומותר להחליף שווה בשווה.`,
        startXml: goalXml('a = c', 'a b c : obj,  h1 : a = b,  h2 : b = c'),
    }),
    level(5, {
        title: 'אינדוקציה ראשונה',
        name: 'unit6_l5_double',
        params: '(n : Nat)',
        proposition: 'double n = n + n',
        goalLabel: 'double(n) = n + n',
        objects: [{ name: 'n', type: 'ℕ' }],
        toolboxBlocks: ['logic_induction', 'logic_unfold_double', 'logic_rewrite', 'logic_rfl', 'logic_calc', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# אינדוקציה

הפונקציה double מוגדרת *ברקורסיה*: \`double(0) = 0\`, ו־\`double(k + 1) = double(k) + 2\`. נוכיח ש־double(n) = n + n *לכל* n.

אי אפשר לבדוק את כל המספרים אחד אחד. *אינדוקציה* מוכיחה את הטענה בשני חלקים:
*בסיס*: הטענה נכונה עבור 0. *צעד*: אם הטענה נכונה עבור k (זו *הנחת האינדוקציה*), היא נכונה גם עבור k + 1.
מ־0 עוברים ל־1, מ־1 ל־2, וכן הלאה: הטענה נכונה לכל n.

בכל חלק, פתחו את ההגדרה של double. בצעד, החליפו לפי הנחת האינדוקציה, ואת השאר משלים חשבון פשוט.`,
        newTacticsBlocks: ['logic_induction', 'logic_unfold_double', 'logic_calc'],
        newTacticsInfo: [inductionInfo, unfoldInfo('double', 'double(0) = 0, ו־double(k + 1) = double(k) + 2.'), calcInfo],
        hints: [
            'גררו את הבלוק "נוכיח באינדוקציה על ?" וכתבו בו n. בצעד, קראו למספר k ולהנחת האינדוקציה ih.',
            'בבסיס: פתחו את ההגדרה של double במטרה; המטרה 0 = 0 + 0 נכונה לפי ההגדרה.',
            'בצעד: פתחו את double במטרה, החליפו לפי ih משמאל לימין, ואת השאר המטרה נובעת לפי חשבון.',
        ],
        conclusion: `הוכחתם בסיס וצעד, ולכן הטענה נכונה לכל n. שימו לב שהחשבון לבדו לא הספיק: הוא לא פותח את ההגדרה של double ולא יודע מה אומרת הנחת האינדוקציה עד שמחליפים לפיה.`,
        startXml: goalXml('double(n) = n + n', 'n : ℕ'),
    }),
    level(6, {
        title: '0 + n = n',
        name: 'unit6_l6_zero_add',
        params: '(n : Nat)',
        proposition: '0 + n = n',
        goalLabel: '0 + n = n',
        objects: [{ name: 'n', type: 'ℕ' }],
        toolboxBlocks: ['logic_induction', 'logic_unfold_add', 'logic_rewrite', 'logic_rfl', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# 0 + n = n

בשלב 1 ראינו ש־\`n + 0 = n\` לפי ההגדרה. האם גם \`0 + n = n\`? לא לפי ההגדרה: החיבור מוגדר לפי המחובר *השני*, ו־n כאן הוא מספר כלשהו.

לכן צריך אינדוקציה. בצעד, פתחו את הגדרת החיבור: \`0 + (k + 1) = (0 + k) + 1\`, והחליפו לפי הנחת האינדוקציה. הפעם אין חשבון: רק הגדרות והחלפות.`,
        newTacticsBlocks: ['logic_unfold_add'],
        newTacticsInfo: [unfoldInfo('החיבור', 'n + 0 = n, ו־n + (m + 1) = (n + m) + 1.')],
        hints: [
            'אינדוקציה על n (k, ih). בבסיס, 0 + 0 = 0 נכון לפי ההגדרה.',
            'בצעד: פתחו את הגדרת החיבור במטרה, החליפו לפי ih משמאל לימין, ושני הצדדים זהים.',
        ],
        conclusion: `n + 0 = n נכון לפי ההגדרה, אבל 0 + n = n דרש אינדוקציה. סימטריה שנראית מובנת מאליה צריכה הוכחה.`,
        startXml: goalXml('0 + n = n', 'n : ℕ'),
    }),
    level(7, {
        title: 'צעד בלי בסיס',
        name: 'unit6_l7_no_base',
        params: '(k : Nat)',
        proposition: '(k + 1 ≤ k) → (k + 1 + 1 ≤ k + 1)',
        goalLabel: '((k + 1 ≤ k) → (k + 1 + 1 ≤ k + 1))',
        objects: [{ name: 'k', type: 'ℕ' }],
        toolboxBlocks: ['tactic_intro', 'logic_calc', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# צעד בלי בסיס

נסתכל על הטענה P(n): \`n + 1 ≤ n\`. היא *לא* נכונה: אף מספר לא גדול מעצמו.
ובכל זאת, הצעד שלה נכון: אם P(k), אז P(k + 1). הוכיחו את הצעד הזה.`,
        hints: [
            'הניחו את התנאי (h : k + 1 ≤ k).',
            'המטרה נובעת לפי חשבון מ־h.',
        ],
        conclusion: `הצעד נכון, אבל הטענה P(n) לא נכונה לאף n, כי הבסיס, 0 + 1 ≤ 0, לא נכון.
צעד לבד לא מספיק: בלי בסיס אין מאיפה להתחיל, והשרשרת "מ־0 ל־1, מ־1 ל־2" לא מתחילה בכלל.`,
        startXml: goalXml('((k + 1 ≤ k) → (k + 1 + 1 ≤ k + 1))', 'k : ℕ'),
    }),
    level(8, {
        title: 'אינדוקציה ואי־שוויון',
        name: 'unit6_l8_pow',
        params: '(n : Nat)',
        proposition: 'n + 1 ≤ 2 ^ n',
        goalLabel: 'n + 1 ≤ 2 ^ n',
        objects: [{ name: 'n', type: 'ℕ' }],
        toolboxBlocks: ['logic_induction', 'logic_unfold_pow', 'logic_calc', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# אינדוקציה ואי־שוויון

אינדוקציה מוכיחה גם אי־שוויונות. נוכיח ש־\`n + 1 ≤ 2^n\` לכל n.

בצעד, פתחו את הגדרת החזקה, \`2^(k + 1) = 2^k · 2\`, ואז המטרה נובעת לפי חשבון מהנחת האינדוקציה.`,
        newTacticsBlocks: ['logic_unfold_pow'],
        newTacticsInfo: [unfoldInfo('החזקה', '2^0 = 1, ו־2^(k + 1) = 2^k · 2.')],
        hints: [
            'אינדוקציה על n (k, ih). בבסיס, 0 + 1 ≤ 2^0 נובע לפי חשבון.',
            'בצעד: פתחו את הגדרת החזקה במטרה; עכשיו המטרה נובעת לפי חשבון מ־ih.',
        ],
        conclusion: `הנחת האינדוקציה אומרת ש־k + 1 ≤ 2^k, והכפלה ב־2 נותנת את הצעד. גם כאן החשבון השלים רק אחרי שפתחתם את ההגדרה.`,
        startXml: goalXml('n + 1 ≤ 2 ^ n', 'n : ℕ'),
    }),
    level(9, {
        title: 'סכום המספרים',
        name: 'unit6_l9_sum',
        params: '(n : Nat)',
        proposition: '2 * sumTo n = n * (n + 1)',
        goalLabel: '2 · sumTo(n) = n · (n + 1)',
        objects: [{ name: 'n', type: 'ℕ' }],
        toolboxBlocks: ['logic_induction', 'logic_unfold_sumto', 'logic_rewrite', 'logic_rfl', 'logic_calc', 'logic_algebra', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# סכום המספרים

\`sumTo(n)\` הוא הסכום \`0 + 1 + ... + n\`. הוא מוגדר ברקורסיה: \`sumTo(0) = 0\`, ו־\`sumTo(k + 1) = sumTo(k) + (k + 1)\`.

נוכיח את הנוסחה הקלאסית: פעמיים הסכום הוא n · (n + 1). בצעד צריך אלגברה (פתיחת סוגריים), ולכן יש כאן גם בלוק של אלגברה.`,
        newTacticsBlocks: ['logic_unfold_sumto', 'logic_algebra'],
        newTacticsInfo: [unfoldInfo('sumTo', 'sumTo(0) = 0, ו־sumTo(k + 1) = sumTo(k) + (k + 1).'), algebraInfo],
        hints: [
            'אינדוקציה על n (k, ih). בבסיס: פתחו את sumTo במטרה; שני הצדדים שווים לפי ההגדרה.',
            'בצעד: פתחו את sumTo במטרה; עכשיו המטרה נובעת לפי אלגברה מ־ih.',
        ],
        conclusion: `זו הנוסחה ש־Gauss מצא, לפי הסיפור, בגיל צעיר: \`0 + 1 + ... + n = n(n + 1)/2\`. האינדוקציה מוכיחה אותה לכל n.`,
        startXml: goalXml('2 · sumTo(n) = n · (n + 1)', 'n : ℕ'),
    }),
    level(10, {
        title: 'תרגיל מסכם: זוגי או אי־זוגי',
        name: 'unit6_l10_even_odd',
        params: '(n : Nat)',
        proposition: '(∃ j, n = 2 * j) ∨ (∃ j, n = 2 * j + 1)',
        goalLabel: '(∃j (n = 2 · j)) ∨ (∃j (n = 2 · j + 1))',
        objects: [{ name: 'n', type: 'ℕ' }],
        toolboxBlocks: ['logic_induction', 'logic_or_elim', 'logic_or_intro_left', 'logic_or_intro_right', 'logic_exists_elim', 'logic_exists_intro', 'logic_rfl', 'logic_calc', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# תרגיל מסכם: זוגי או אי־זוגי

כל מספר טבעי הוא זוגי (\`n = 2 · j\`) או אי־זוגי (\`n = 2 · j + 1\`). נוכיח זאת באינדוקציה, יחד עם הכלים של יחידות 2 ו־4.

בצעד, הנחת האינדוקציה היא "או": חלקו למקרים. אם k זוגי, k + 1 אי־זוגי; ואם k אי־זוגי, k + 1 זוגי. בכל מקרה, קבלו את ה־j מההנחה, ובחרו עד מתאים.`,
        hints: [
            'אינדוקציה על n (k, ih). בבסיס: בחרו בצד שמאל, ו־0 הוא העד (0 = 2 · 0 לפי ההגדרה).',
            'בצעד: חלקו למקרים לפי ih. במקרה הזוגי, קבלו m עם hm : k = 2 · m, בחרו בצד ימין, ו־m הוא העד.',
            'במקרה האי־זוגי, קבלו m עם hm : k = 2 · m + 1, בחרו בצד שמאל, והעד הוא m + 1. בכל מקרה המטרה נובעת לפי חשבון מ־hm.',
        ],
        conclusion: `אינדוקציה עובדת יחד עם כל הכלים הקודמים: כאן הנחת האינדוקציה הייתה "או", ובכל מקרה בחרתם עד ל"קיים".
בשלב הבונוס תוכיחו נוסחה נוספת לסכום.`,
        startXml: goalXml('(∃j (n = 2 · j)) ∨ (∃j (n = 2 · j + 1))', 'n : ℕ'),
    }),
    level(11, {
        title: 'שלב בונוס: סכום האי־זוגיים',
        name: 'unit6_l11_odd_sum',
        params: '(n : Nat)',
        proposition: 'oddSum n = n * n',
        goalLabel: 'oddSum(n) = n · n',
        objects: [{ name: 'n', type: 'ℕ' }],
        toolboxBlocks: ['logic_induction', 'logic_unfold_oddsum', 'logic_rewrite', 'logic_rfl', 'logic_algebra', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# בונוס: סכום האי־זוגיים

\`oddSum(n)\` הוא סכום n המספרים האי־זוגיים הראשונים: \`1 + 3 + 5 + ...\`. הוא מוגדר ברקורסיה: \`oddSum(0) = 0\`, ו־\`oddSum(k + 1) = oddSum(k) + (2k + 1)\`.

הסכום הוא תמיד ריבוע: \`1 = 1\`, \`1 + 3 = 4\`, \`1 + 3 + 5 = 9\`. הוכיחו שזה נכון לכל n.`,
        newTacticsBlocks: ['logic_unfold_oddsum'],
        newTacticsInfo: [unfoldInfo('oddSum', 'oddSum(0) = 0, ו־oddSum(k + 1) = oddSum(k) + (2k + 1).')],
        hints: [
            'אינדוקציה על n (k, ih). בבסיס: פתחו את oddSum במטרה; שני הצדדים שווים לפי ההגדרה.',
            'בצעד: פתחו את oddSum במטרה, החליפו לפי ih, והמטרה נובעת לפי אלגברה.',
        ],
        conclusion: `סיימתם את יחידה 6, כולל שלב הבונוס! סכום n האי־זוגיים הראשונים הוא n²: כל אי־זוגי מוסיף "מסגרת" לריבוע הקודם.`,
        startXml: goalXml('oddSum(n) = n · n', 'n : ℕ'),
    }),
];
