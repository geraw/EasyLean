export const unit1WorldName = 'יחידה 1 - מהנחה למסקנה';

const goalXml = (goal, context = 'אין הנחות פתיחה') => `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="game_goal" x="20" y="20" deletable="false" movable="false">
    <field name="GOAL_LABEL">${goal}</field>
        <field name="CONTEXT_LABEL">${context}</field>
  </block>
</xml>`;

const directProofInfo = {
    name: 'סגירה ישירה',
    doc: 'כאשר אחת ההנחות היא בדיוק המטרה, משתמשים בה כדי לסגור את ההוכחה.',
};

const assumeInfo = {
    name: 'הנחת תנאי',
    doc: 'כדי להוכיח גרירה, מתחילים בהנחת התנאי שלה ונותנים לו שם.',
};

const applyRuleInfo = {
    name: 'מעבר לתנאי של כלל',
    doc: 'אם המטרה היא המסקנה של כלל, עוברים להוכיח את התנאי שלו.',
};

export const unit1Levels = [
    {
        id: 'unit1-1',
        levelNumber: 1,
        totalLevels: 4,
        title: 'אותה טענה משני הצדדים',
        name: 'unit1_l1_identity',
        variableLine: 'variable {P : Prop}',
        params: '',
        proposition: 'P → P',
        goalLabel: 'P → P',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['tactic_intro', 'tactic_exact'],
        introduction: `# מתחילים מהנחה

כדי להוכיח גרירה, מתחילים בהנחת התנאי שלה. כאן נניח שהטענה P מתקיימת,
וניתן לה שם כדי שנוכל להשתמש בה בהמשך.

אחרי ההנחה, המטרה תהיה P. מכיוון שההנחה והמטרה זהות, אפשר לסיים מיד.`,
        newTacticsBlocks: ['tactic_intro', 'tactic_exact'],
        newTacticsInfo: [assumeInfo, directProofInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "נניח את צד שמאל של הגרירה שאנחנו רוצים להוכיח ונקרא להנחה זאת" אל תוך המטרה.',
            'תנו להנחה את השם h, והוסיפו אחריו את הבלוק "מה שאנחנו רוצים להוכיח זה בדיוק" עם h.',
        ],
        conclusion: `התחלתם מהנחה, זיהיתם את המטרה, וסגרתם אותה בעזרת ההנחה עצמה. זהו המבנה הבסיסי של הוכחה ישירה.`,
        startXml: goalXml('P → P'),
    },
    {
        id: 'unit1-2',
        levelNumber: 2,
        totalLevels: 4,
        title: 'הפעלת כלל על הנחה',
        name: 'unit1_l2_apply',
        variableLine: 'variable {P Q : Prop}',
        params: '(h1 : (P → Q)) (h : P)',
        proposition: 'Q',
        goalLabel: 'Q',
        objects: [],
        assumptions: [
            { name: 'h1', prop: 'P → Q' },
            { name: 'h', prop: 'P' },
        ],
        toolboxBlocks: ['tactic_apply_rule', 'tactic_exact'],
        introduction: `# מהנחה למסקנה

יש לנו שתי הנחות פתיחה: h1 אומר שאם P מתקיימת, אז Q מתקיימת, ו־h אומרת ש־P מתקיימת.
המטרה היא להסיק את Q.

כדי להשתמש בכלל, עוברים למטרה שהכלל מבקש: P. לאחר מכן אפשר לסגור אותה בעזרת h.`,
        newTacticsBlocks: ['tactic_apply_rule'],
        newTacticsInfo: [applyRuleInfo],
        newDefinitions: [],
        hints: [
            'גררו את הבלוק "מה שצריך להוכיח הוא בדיוק המסקנה של h1, ולכן נעבור להוכיח את התנאי שלו" אל תוך בלוק המטרה.',
            'הוסיפו אחריו את הבלוק "מה שאנחנו רוצים להוכיח זה בדיוק" עם h.',
        ],
        conclusion: `כתבתם מהלך הוכחה טבעי: מן הכלל h1 ומההנחה h נובעת המסקנה Q.`,
        startXml: goalXml('Q', 'h1 : (P → Q),  h : P'),
    },
    {
        id: 'unit1-3',
        levelNumber: 3,
        totalLevels: 4,
        title: 'קוראים את המטרה לפי הסדר',
        name: 'unit1_l3_reordered',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: '(P → ((P → Q) → Q))',
        goalLabel: '(P → ((P → Q) → Q))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['tactic_intro', 'tactic_apply_rule', 'tactic_exact'],
        introduction: `# קוראים את המטרה לפי הסדר

    המטרה מורכבת משתי גרירות זו בתוך זו. קוראים אותה משמאל לימין: קודם נניח את P,
    אחר כך נניח כלל שמוביל מ־P ל־Q, ולבסוף נשתמש בכלל ובהנחה שכבר בידינו.
    המהלך זהה לשלב הקודם; רק המקום של ההנחה ושל הכלל בתוך המטרה השתנה.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'הניחו תחילה את P וקראו לה h1, ואחר כך את הכלל וקראו לו h2.',
            'השתמשו בבלוק "מה שצריך להוכיח הוא בדיוק המסקנה של h2, ולכן נעבור להוכיח את התנאי שלו".',
            'סגרו בעזרת h1.',
        ],
        conclusion: `הוכחה טובה עוקבת אחר מבנה המטרה: פותחים את הגרירות לפי הסדר,
    ואז משתמשים בכלל ובהנחה המתאימה.`,
        startXml: goalXml('(P → ((P → Q) → Q))'),
    },
    {
        id: 'unit1-4',
        levelNumber: 4,
        totalLevels: 4,
        title: 'שרשרת של שלוש הנחות',
        name: 'unit1_l4_chain',
        variableLine: 'variable {P Q R : Prop}',
        params: '',
        proposition: '((P → Q) → ((Q → R) → (P → R)))',
        goalLabel: '((P → Q) → ((Q → R) → (P → R)))',
        objects: [],
        assumptions: [],
        toolboxBlocks: ['tactic_intro', 'tactic_apply_rule', 'tactic_exact'],
        introduction: `# תרגיל מסכם

כאן נחבר שני כללים: הראשון מוביל מ־P ל־Q, והשני מוביל מ־Q ל־R.
לאחר שנניח את שלושת התנאים, נשתמש בכלל השני, אחר כך בכלל הראשון,
ולבסוף בהנחה של P.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'הניחו את שלושת התנאים לפי הסדר: h1, h2, h3.',
            'השתמשו בבלוק המעבר לתנאי של כלל עם h2. המטרה החדשה תהיה Q.',
            'השתמשו באותו בלוק עם h1. המטרה החדשה תהיה P.',
            'סגרו בעזרת h3.',
        ],
        conclusion: `סיימתם את יחידה 1. אתם יודעים לקרוא מטרה, להוסיף הנחות, להפעיל כלל,
ולסגור מטרה בעזרת הנחה מתאימה.`,
        startXml: goalXml('((P → Q) → ((Q → R) → (P → R)))'),
    },
];
