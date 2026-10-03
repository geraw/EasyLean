import { goalXml } from './levelXml';

export const unit4WorldName = 'יחידה 4 - כמתים';

const forallElimInfo = {
    name: 'שימוש ב"לכל"',
    doc: 'מ"לכל x מתקיים P(x)" נובע P(a) לכל עצם a בתחום: מציבים את a במקום x.',
};

const forallIntroInfo = {
    name: 'הוכחת "לכל"',
    doc: 'כדי להוכיח "לכל x מתקיים P(x)" לוקחים עצם שרירותי, למשל x0, שלא ידוע עליו דבר, ומוכיחים P(x0). מה שהוכח לעצם שרירותי נכון לכל עצם.',
};

const existsIntroInfo = {
    name: 'הוכחת "קיים"',
    doc: 'כדי להוכיח "קיים x כך ש־P(x)" בוחרים עצם מתאים a (עד), ומוכיחים P(a).',
};

const existsElimInfo = {
    name: 'שימוש ב"קיים"',
    doc: 'מ"קיים x כך ש־P(x)" מקבלים עצם, למשל x0, שעליו ידוע רק ש־P(x0). נותנים לו שם חדש, ולא מניחים עליו שום דבר אחר.',
};

// The typical mistake of level 6, already placed: choosing a witness before
// taking apart the "there exists" assumption, when no such object exists yet.
const prematureWitnessXml = `
      <block type="tactic_intro">
        <field name="HYPOTHESIS">h</field>
        <next>
          <block type="logic_exists_intro">
            <field name="TERM">x</field>
          </block>
        </next>
      </block>`;

// The domain's type is called obj, so that a : obj reads "a is an object".
const DOMAIN = 'variable {obj : Type} {P Q : obj → Prop}';

export const unit4Levels = [
    {
        id: 'unit4-1',
        levelNumber: 1,
        totalLevels: 10,
        title: 'משתמשים בהנחה מסוג "לכל"',
        name: 'unit4_l1_forall_elim',
        variableLine: DOMAIN,
        params: '(a : obj) (h : ∀ x, P x)',
        proposition: 'P a',
        goalLabel: 'P(a)',
        objects: [{ name: 'a', type: 'obj' }],
        assumptions: [{ name: 'h', prop: '∀x P(x)' }],
        toolboxBlocks: ['logic_forall_elim', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# "לכל"

מעכשיו הטענות מדברות על *עצמים* מתוך תחום, ועל תכונות שלהם. למשל: התחום הוא הסטודנטים בקורס, ו־P(x) אומרת "x עבר את הבוחן".

הטענה \`∀x P(x)\` נקראת "לכל x מתקיים P(x)": כל עצם בתחום מקיים את P. למשל, "כל הסטודנטים עברו את הבוחן".

כאן נתונים עצם a והנחה \`h : ∀x P(x)\`, והמטרה היא P(a). אם כולם עברו, גם a עבר:
נציב את a בהנחה h, ונקבל את P(a).`,
        newTacticsBlocks: ['logic_forall_elim'],
        newTacticsInfo: [forallElimInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "נציב את העצם ? בהנחה ? מסוג "לכל"", וכתבו בו a ו־h, ושם לתוצאה, למשל ha.',
            'עכשיו ha אומרת בדיוק את המטרה.',
        ],
        conclusion: `הצבתם את a בטענה "לכל x מתקיים P(x)" וקיבלתם P(a). מטענת "לכל" אפשר להסיק את התכונה לכל עצם שתרצו.`,
        startXml: goalXml('P(a)', 'a : obj,  h : ∀x P(x)'),
    },
    {
        id: 'unit4-2',
        levelNumber: 2,
        totalLevels: 10,
        title: '"לכל" וגרירה',
        name: 'unit4_l2_forall_mp',
        variableLine: DOMAIN,
        params: '(a : obj) (h : ∀ x, (P x → Q x)) (hp : P a)',
        proposition: 'Q a',
        goalLabel: 'Q(a)',
        objects: [{ name: 'a', type: 'obj' }],
        assumptions: [
            { name: 'h', prop: '∀x (P(x) → Q(x))' },
            { name: 'hp', prop: 'P(a)' },
        ],
        toolboxBlocks: ['logic_forall_elim', 'tactic_apply_rule', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# "לכל" וגרירה

ההנחה \`h : ∀x (P(x) → Q(x))\` אומרת שכל עצם שמקיים את P מקיים גם את Q. למשל: "כל מי שעבר את הבוחן רשאי לגשת למבחן".

נתון גם ש־a מקיים את P, והמטרה היא Q(a). נציב את a ב־h ונקבל גרירה רגילה, \`P(a) → Q(a)\`,
ואז נשתמש בה כמו ביחידה 1: קדימה, או אחורה.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'הציבו את a ב־h, וקראו לתוצאה ha. יש בידינו ha : P(a) → Q(a).',
            'קדימה: מ־ha ומ־hp הסיקו את Q(a), וסגרו בעזרתה. או אחורה: המסקנה של ha היא המטרה; עברו לתנאי שלה וסגרו בעזרת hp.',
        ],
        conclusion: `הצבה בטענת "לכל" נתנה גרירה על העצם a, ומכאן הכלים של יחידה 1. כך נראות רוב ההוכחות עם "לכל": מציבים, ואז משתמשים בתוצאה.`,
        startXml: goalXml('Q(a)', 'a : obj,  h : ∀x (P(x) → Q(x)),  hp : P(a)'),
    },
    {
        id: 'unit4-3',
        levelNumber: 3,
        totalLevels: 10,
        title: 'מוכיחים טענה מסוג "לכל"',
        name: 'unit4_l3_forall_intro',
        variableLine: DOMAIN,
        params: '',
        proposition: '(∀ x, (P x ∧ Q x)) → (∀ x, P x)',
        goalLabel: '((∀x (P(x) ∧ Q(x))) → (∀x P(x)))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['tactic_intro', 'logic_forall_intro', 'logic_forall_elim', 'logic_and_elim', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# עצם שרירותי

אם כל הסטודנטים עברו גם את הבוחן וגם את התרגיל, אז כל הסטודנטים עברו את הבוחן.

כדי להוכיח "לכל x מתקיים P(x)" לוקחים עצם *שרירותי*, שלא ידוע עליו דבר, ומוכיחים שהוא מקיים את P.
מכיוון שהעצם לא נבחר בשום אופן מיוחד, מה שהוכח עליו נכון לכל עצם.

תנו לעצם שם חדש, למשל x0, ולא x: ה־x שבטענה הוא רק משתנה שמסמן "כל עצם", ואילו x0 הוא עצם מסוים שיש בידינו. השם x0 רק מזכיר מאיזה משתנה הוא בא.
אחרי הנחת התנאי ולקיחת x0, אפשר להציב את x0 בהנחה, כמו בשלבים הקודמים.`,
        newTacticsBlocks: ['logic_forall_intro'],
        newTacticsInfo: [forallIntroInfo],
        newDefinitions: [],
        hints: [
            'הניחו את התנאי וקראו לו h. המטרה היא ∀x P(x).',
            'השתמשו בבלוק "כדי להוכיח "לכל": יהי ? עצם שרירותי" וכתבו בו x0. המטרה היא P(x0).',
            'הציבו את x0 ב־h (למשל hx0 : P(x0) ∧ Q(x0)), הסיקו ממנה את שני הצדדים, וסגרו בצד שמאל.',
        ],
        conclusion: `לקחתם עצם שרירותי x0 והוכחתם עליו את P(x0), ולכן P נכונה לכל עצם.
שימו לב לסדר: קודם לוקחים את x0, ורק אז אפשר להציב אותו בהנחה. לפני כן אין עצם להציב.`,
        startXml: goalXml('((∀x (P(x) ∧ Q(x))) → (∀x P(x)))'),
    },
    {
        id: 'unit4-4',
        levelNumber: 4,
        totalLevels: 10,
        title: '"לכל" וגרירה, בשני הצדדים',
        name: 'unit4_l4_forall_imp',
        variableLine: DOMAIN,
        params: '',
        proposition: '(∀ x, (P x → Q x)) → ((∀ x, P x) → (∀ x, Q x))',
        goalLabel: '((∀x (P(x) → Q(x))) → ((∀x P(x)) → (∀x Q(x))))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['tactic_intro', 'logic_forall_intro', 'logic_forall_elim', 'tactic_apply_rule', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# "לכל" וגרירה, בשני הצדדים

אם כל מי שעבר את הבוחן רשאי לגשת למבחן, וכולם עברו את הבוחן, אז כולם רשאים לגשת למבחן.

כאן משתמשים בשני המהלכים של "לכל": מוכיחים "לכל" בעזרת עצם שרירותי, ומשתמשים בשתי טענות "לכל" על ידי הצבת אותו עצם בשתיהן.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'הניחו את שני התנאים (h1, h2), וקחו עצם שרירותי x0.',
            'הציבו את x0 ב־h1 וב־h2: יש בידינו P(x0) → Q(x0) וגם P(x0).',
            'מהגרירה ומהתנאי שלה הסיקו את Q(x0), או עברו מהמטרה לתנאי של הגרירה.',
        ],
        conclusion: `הצבתם את אותו עצם שרירותי בשתי טענות "לכל", והשתמשתם בתוצאות כמו בגרירות רגילות.`,
        startXml: goalXml('((∀x (P(x) → Q(x))) → ((∀x P(x)) → (∀x Q(x))))'),
    },
    {
        id: 'unit4-5',
        levelNumber: 5,
        totalLevels: 10,
        title: 'מוכיחים טענה מסוג "קיים"',
        name: 'unit4_l5_exists_intro',
        variableLine: DOMAIN,
        params: '(a : obj) (hp : P a)',
        proposition: '∃ x, (P x ∨ Q x)',
        goalLabel: '∃x (P(x) ∨ Q(x))',
        objects: [{ name: 'a', type: 'obj' }],
        assumptions: [{ name: 'hp', prop: 'P(a)' }],
        toolboxBlocks: ['logic_exists_intro', 'logic_or_intro_left', 'logic_or_intro_right', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# "קיים"

הטענה \`∃x P(x)\` נקראת "קיים x כך ש־P(x)": לפחות עצם אחד בתחום מקיים את P. למשל, "יש סטודנט שעבר את הבוחן".

כדי להוכיח "קיים" בוחרים עצם מתאים, *עד*, ומוכיחים שהוא מקיים את התכונה.
כאן נתון ש־a מקיים את P, ולכן הוא עד טוב לטענה "קיים x כך ש־P(x) או Q(x)".`,
        newTacticsBlocks: ['logic_exists_intro'],
        newTacticsInfo: [existsIntroInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "כדי להוכיח "קיים": נבחר את העצם ?" וכתבו בו a. המטרה היא P(a) ∨ Q(a).',
            'בחרו בצד שמאל, וסגרו בעזרת hp.',
        ],
        conclusion: `בחרתם את a כעד והוכחתם שהוא מתאים. כדי להוכיח "קיים" מספיק עד אחד.`,
        startXml: goalXml('∃x (P(x) ∨ Q(x))', 'a : obj,  hp : P(a)'),
    },
    {
        id: 'unit4-6',
        levelNumber: 6,
        totalLevels: 10,
        title: 'משתמשים בהנחה מסוג "קיים"',
        name: 'unit4_l6_exists_elim',
        variableLine: DOMAIN,
        params: '',
        proposition: '(∃ x, (P x ∧ Q x)) → (∃ x, Q x)',
        goalLabel: '((∃x (P(x) ∧ Q(x))) → (∃x Q(x)))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['tactic_intro', 'logic_exists_elim', 'logic_exists_intro', 'logic_and_elim', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# קודם מקבלים עצם, אחר כך בוחרים עד

אם יש סטודנט שעבר גם את הבוחן וגם את התרגיל, אז יש סטודנט שעבר את התרגיל.

ההוכחה כבר התחילה: הנחנו את התנאי, h, ובחרנו עד בשם x. אבל הבלוק אדום: אין בידינו עצם בשם x. ה־x שבטענה הוא רק משתנה, לא עצם.
h אומרת רק שקיים עצם כזה; כדי לקבל אותו, *משתמשים* בהנחת "קיים": מקבלים עצם, נותנים לו שם, וידוע עליו רק מה ש־h אומרת.

הכניסו את השימוש ב־h לפני בחירת העד, ורק אחריו בחרו את העצם שקיבלתם.`,
        newTacticsBlocks: ['logic_exists_elim'],
        newTacticsInfo: [existsElimInfo],
        newDefinitions: [],
        hints: [
            'בין "נניח" לבין בחירת העד, הוסיפו את הבלוק "מההנחה ? מסוג "קיים" נקבל עצם ?": כתבו בו h, שם חדש לעצם, למשל x0, ושם להנחה עליו, למשל hx0.',
            'עכשיו העצם x0 בידינו: כתבו אותו בבחירת העד במקום x. נשאר להוכיח Q(x0).',
            'הסיקו מ־hx0 את שני הצדדים, וסגרו בצד ימין.',
        ],
        conclusion: `מ"קיים" קיבלתם עצם, ורק אחר כך יכולתם לבחור אותו כעד.
זו טעות נפוצה: לבחור עד לפני שיש אחד. כשיש בהנחות "קיים", כדאי להשתמש בה מוקדם.`,
        startXml: goalXml('((∃x (P(x) ∧ Q(x))) → (∃x Q(x)))', 'אין הנחות פתיחה', prematureWitnessXml),
    },
    {
        id: 'unit4-7',
        levelNumber: 7,
        totalLevels: 10,
        title: '"לכל" ו"קיים" יחד',
        name: 'unit4_l7_forall_exists',
        variableLine: DOMAIN,
        params: '',
        proposition: '(∀ x, (P x → Q x)) → ((∃ x, P x) → (∃ x, Q x))',
        goalLabel: '((∀x (P(x) → Q(x))) → ((∃x P(x)) → (∃x Q(x))))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['tactic_intro', 'logic_forall_elim', 'logic_exists_elim', 'logic_exists_intro', 'tactic_apply_rule', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# "לכל" ו"קיים" יחד

אם כל מי שעבר את הבוחן רשאי לגשת למבחן, ויש מי שעבר את הבוחן, אז יש מי שרשאי לגשת למבחן.

מ"קיים" מקבלים עצם; מציבים אותו ב"לכל"; והוא גם העד ל"קיים" שבמטרה.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'הניחו את שני התנאים (h1, h2), וקבלו מ־h2 עצם x0 עם hx0 : P(x0).',
            'הציבו את x0 ב־h1, ובחרו את x0 כעד.',
            'נשאר להוכיח Q(x0): קדימה מהגרירה ומ־hx0, או אחורה לתנאי שלה.',
        ],
        conclusion: `העצם שקיבלתם מ"קיים" שימש פעמיים: הצבתם אותו ב"לכל", ובחרתם בו כעד.`,
        startXml: goalXml('((∀x (P(x) → Q(x))) → ((∃x P(x)) → (∃x Q(x))))'),
    },
    {
        id: 'unit4-8',
        levelNumber: 8,
        totalLevels: 10,
        title: 'שלילה של "קיים"',
        name: 'unit4_l8_not_exists',
        variableLine: DOMAIN,
        params: '',
        proposition: '(¬∃ x, P x) → (∀ x, ¬P x)',
        goalLabel: '((¬∃x P(x)) → (∀x ¬P(x)))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['tactic_intro', 'logic_forall_intro', 'logic_not_intro', 'logic_not_elim', 'logic_exists_intro', 'logic_contradiction', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# שלילה של "קיים"

אם אין אף סטודנט שנכשל, אז כל סטודנט לא נכשל: \`¬∃x P(x)\` גוררת \`∀x ¬P(x)\`.

המטרה היא "לכל", ולכן לוקחים עצם שרירותי x0, ומוכיחים ¬P(x0), כמו ביחידה 3: מניחים P(x0) ומגיעים לסתירה.
הסתירה מגיעה מההנחה ¬∃x P(x): אם P(x0), אז x0 הוא עד ל"קיים".`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'הניחו את התנאי (h), קחו עצם שרירותי x0, והוכיחו את ¬P(x0): הניחו את P(x0) (hp).',
            'הגיעו לסתירה בעזרת השלילה h: נשאר להוכיח ∃x P(x).',
            'בחרו את x0 כעד, וסגרו בעזרת hp.',
        ],
        conclusion: `"אין עצם שמקיים P" פירושו "כל עצם לא מקיים P". הכיוון הזה, וגם ההפוך, לא דורשים עיקרון קלאסי.`,
        startXml: goalXml('((¬∃x P(x)) → (∀x ¬P(x)))'),
    },
    {
        id: 'unit4-9',
        levelNumber: 9,
        totalLevels: 10,
        title: 'תרגיל מסכם: סדר הכמתים',
        name: 'unit4_l9_swap',
        variableLine: 'variable {obj : Type} {R : obj → obj → Prop}',
        params: '',
        proposition: '(∃ x, ∀ y, R x y) → (∀ y, ∃ x, R x y)',
        goalLabel: '((∃x ∀y R(x,y)) → (∀y ∃x R(x,y)))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['tactic_intro', 'logic_forall_intro', 'logic_forall_elim', 'logic_exists_elim', 'logic_exists_intro', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# סדר הכמתים

R(x,y) היא תכונה של שני עצמים, למשל "x עוזר ל־y".
\`∃x ∀y R(x,y)\`: "יש מישהו שעוזר לכולם". \`∀y ∃x R(x,y)\`: "לכל אחד יש מישהו שעוזר לו".

הטענה הראשונה חזקה יותר: אם יש מישהו שעוזר לכולם, אז לכל אחד יש מי שעוזר לו (אותו אדם). הוכיחו זאת.
זכרו את הלקח משלב 6: את העד בוחרים רק אחרי שמקבלים עצם מ"קיים".`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'הניחו את התנאי (h), וקחו עצם שרירותי y0.',
            'קבלו מ־h עצם x0, עם hx0 : ∀y R(x0,y).',
            'בחרו את x0 כעד, הציבו את y0 ב־hx0, וסגרו בעזרת התוצאה.',
        ],
        conclusion: `סדר הכמתים חשוב. הכיוון ההפוך לא נכון: "לכל אחד יש אמא" לא אומר ש"יש מישהי שהיא האמא של כולם".
בהוכחה כאן העד x0 התקבל מההנחה לפני שלקחתם את y0, ולכן הוא לא תלוי בו: אותו x0 מתאים לכל עצם. בכיוון ההפוך העד היה תלוי בעצם שנלקח.`,
        startXml: goalXml('((∃x ∀y R(x,y)) → (∀y ∃x R(x,y)))'),
    },
    {
        id: 'unit4-10',
        levelNumber: 10,
        totalLevels: 10,
        title: 'שלב בונוס: שלילה של "לכל"',
        name: 'unit4_l10_not_forall',
        variableLine: DOMAIN,
        params: '',
        proposition: '(¬∀ x, P x) → (∃ x, ¬P x)',
        goalLabel: '((¬∀x P(x)) → (∃x ¬P(x)))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['tactic_intro', 'logic_by_contradiction', 'logic_forall_intro', 'logic_exists_intro', 'logic_not_intro', 'logic_not_elim', 'logic_contradiction', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# בונוס: שלילה של "לכל"

אם לא נכון שכל הסטודנטים עברו, אז יש סטודנט שלא עבר: \`¬∀x P(x)\` גוררת \`∃x ¬P(x)\`.

*עיקרון קלאסי:* הכיוון הזה, בניגוד לשלב 8, דורש הוכחה בשלילה. מההנחה לא ידוע מי לא עבר, ולכן אין עד לבחור ישירות.
הניחו בשלילה שאין עצם כזה, והגיעו לסתירה עם ההנחה: הראו שאז כולם מקיימים את P.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'הניחו את התנאי (h), והוכיחו בשלילה: hn : ¬∃x ¬P(x). המטרה היא סתירה.',
            'הגיעו לסתירה בעזרת השלילה h: נשאר להוכיח ∀x P(x). קחו עצם שרירותי x0.',
            'הוכיחו את P(x0) בשלילה (hnp : ¬P(x0)), והגיעו לסתירה בעזרת hn: בחרו את x0 כעד, וסגרו בעזרת hnp.',
        ],
        conclusion: `סיימתם את יחידה 4, כולל שלב הבונוס! השלילה עוברת דרך הכמתים: ¬∀ הופך ל־∃¬, ו־¬∃ הופך ל־∀¬.
הכיוון שהוכחתם כאן הוא היחיד מבין הארבעה שדורש עיקרון קלאסי.`,
        startXml: goalXml('((¬∀x P(x)) → (∃x ¬P(x)))'),
    },
];
