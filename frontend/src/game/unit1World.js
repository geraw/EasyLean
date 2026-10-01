export const unit1WorldName = 'יחידה 1 - מהנחה למסקנה';

const goalXml = (goal) => `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="game_goal" x="20" y="20" deletable="false" movable="false">
    <field name="GOAL_LABEL">${goal}</field>
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

const useRuleInfo = {
    name: 'שימוש בכלל',
    doc: 'כאשר יש לנו כלל שמוביל למטרה, עוברים להוכיח את התנאי שהכלל דורש.',
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
        params: '',
        proposition: '(P → Q) → P → Q',
        goalLabel: '(P → Q) → P → Q',
        objects: [],
        assumptions: [],
        introduction: `# מהנחה למסקנה

יש לנו כלל שאומר: אם P מתקיימת, אז Q מתקיימת. בנוסף, נניח ש־P מתקיימת.
המטרה היא להסיק את Q.

כדי להשתמש בכלל, עוברים למטרה שהכלל מבקש: P. לאחר מכן אפשר לסגור אותה
בעזרת ההנחה שכבר נתנו.`,
        newTacticsBlocks: ['tactic_apply'],
        newTacticsInfo: [useRuleInfo],
        newDefinitions: [],
        hints: [
            'הוסיפו שתי הנחות: קראו לכלל h1 ולהנחה h2.',
            'השתמשו בכלל h1. המטרה תתחלף ל־P.',
            'סגרו את המטרה החדשה בעזרת h2.',
        ],
        conclusion: `השתמשתם בכלל כדי להחליף מטרה במטרה פשוטה יותר, ואז סגרתם אותה בעזרת הנחה קיימת.`,
        startXml: goalXml('(P → Q) → P → Q'),
    },
    {
        id: 'unit1-3',
        levelNumber: 3,
        totalLevels: 4,
        title: 'סדר ההנחות לא משנה',
        name: 'unit1_l3_reordered',
        variableLine: 'variable {P Q : Prop}',
        params: '',
        proposition: 'P → (P → Q) → Q',
        goalLabel: 'P → (P → Q) → Q',
        objects: [],
        assumptions: [],
        introduction: `# עוקבים אחר מבנה המטרה

לפעמים ההנחות מגיעות בסדר אחר. קודם נקבל הנחה על P, ואחר כך כלל שמוביל
מ־P ל־Q. עדיין אפשר לעבוד באותה דרך: נניח את התנאים לפי הסדר,
נפעיל את הכלל, ונסגור את המטרה בעזרת ההנחה המתאימה.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'הניחו תחילה את P וקראו לה h1, ואחר כך את הכלל וקראו לו h2.',
            'הפעילו את h2 כדי לעבור למטרה P.',
            'סגרו בעזרת h1.',
        ],
        conclusion: `הוכחה טובה עוקבת אחר מבנה המטרה. גם כשהסדר משתנה, העקרונות נשארים זהים.`,
        startXml: goalXml('P → (P → Q) → Q'),
    },
    {
        id: 'unit1-4',
        levelNumber: 4,
        totalLevels: 4,
        title: 'שרשרת של שלוש הנחות',
        name: 'unit1_l4_chain',
        variableLine: 'variable {P Q R : Prop}',
        params: '',
        proposition: '(P → Q) → (Q → R) → P → R',
        goalLabel: '(P → Q) → (Q → R) → P → R',
        objects: [],
        assumptions: [],
        introduction: `# תרגיל מסכם

כאן נחבר שני כללים: הראשון מוביל מ־P ל־Q, והשני מוביל מ־Q ל־R.
לאחר שנניח את שלושת התנאים, נשתמש בכלל השני, אחר כך בכלל הראשון,
ולבסוף בהנחה של P.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'הניחו את שלושת התנאים לפי הסדר: h1, h2, h3.',
            'הפעילו את h2. המטרה החדשה תהיה Q.',
            'הפעילו את h1. המטרה החדשה תהיה P.',
            'סגרו בעזרת h3.',
        ],
        conclusion: `סיימתם את יחידה 1. אתם יודעים לקרוא מטרה, להוסיף הנחות, להפעיל כלל,
ולסגור מטרה בעזרת הנחה מתאימה.`,
        startXml: goalXml('(P → Q) → (Q → R) → P → R'),
    },
];
