import { goalXml } from './levelXml';

export const unit0WorldName = 'יחידה 0 - היכרות עם הסביבה';

const directProofInfo = {
    name: 'סגירה ישירה',
    doc: 'כאשר אחת ההנחות אומרת בדיוק את המטרה, משתמשים בה כדי לסגור את ההוכחה.',
};

// A short, hands-on tour of the screen (see docs/curriculum/00-getting-started.md):
// each part of the screen is named in the level where it is first used.
export const unit0Levels = [
    {
        id: 'unit0-1',
        levelNumber: 1,
        totalLevels: 2,
        title: 'המטרה כבר בידינו',
        name: 'unit0_l1_given',
        variableLine: 'variable {P : Prop}',
        params: '(h : P)',
        proposition: 'P',
        goalLabel: 'P',
        objects: [],
        assumptions: [{ name: 'h', prop: 'P' }],
        toolboxBlocks: ['tactic_exact'],
        introduction: `# ברוכים הבאים

בכל שלב מוכיחים טענה אחת. בעמודה הזאת מופיעים ההסבר, מה נתון לנו (ההנחות) ומה צריך להוכיח (המטרה).

כאן נתונה לנו ההנחה \`h : P\`, כלומר טענה בשם h שאומרת P. המטרה היא להוכיח את P.

ההוכחה נבנית מבלוקים. בצד שמאל של אזור העבודה נמצא הארגז "מהלכי הוכחה": לחצו עליו,
וגררו את הבלוק "מה שאנחנו רוצים להוכיח זה בדיוק" אל תוך בלוק המטרה, למקום שכתוב בו "בנו כאן את ההוכחה".

מתחת לאזור העבודה מופיע מצב ההוכחה: "מה יש לנו ביד" ו"מה נשאר להוכיח". כשתסיימו, לחצו על "בדוק הוכחה".`,
        newTacticsBlocks: ['tactic_exact'],
        newTacticsInfo: [directProofInfo],
        newDefinitions: [],
        hints: [
            'פתחו את הארגז "מהלכי הוכחה" וגררו את הבלוק "מה שאנחנו רוצים להוכיח זה בדיוק" אל תוך בלוק המטרה.',
            'השם בבלוק צריך להיות h, ההנחה שאומרת P. אחר כך לחצו על "בדוק הוכחה".',
        ],
        conclusion: `ההנחה h אמרה בדיוק את המטרה, ולכן סגרתם את ההוכחה בעזרתה. מצב ההוכחה הראה לכם בכל רגע מה יש ביד ומה נשאר להוכיח.`,
        startXml: goalXml('P', 'h : P'),
    },
    {
        id: 'unit0-2',
        levelNumber: 2,
        totalLevels: 2,
        title: 'בוחרים את ההנחה הנכונה',
        name: 'unit0_l2_choose',
        variableLine: 'variable {P Q : Prop}',
        params: '(h : P) (h2 : Q)',
        proposition: 'Q',
        goalLabel: 'Q',
        objects: [],
        assumptions: [
            { name: 'h', prop: 'P' },
            { name: 'h2', prop: 'Q' },
        ],
        toolboxBlocks: ['tactic_exact'],
        introduction: `# טעות היא חלק מהדרך

הפעם יש שתי הנחות: h אומרת P, ו־h2 אומרת Q. המטרה היא Q.

בלוק המטרה כבר מכיל מהלך, אבל המהלך שגוי: הוא סוגר את המטרה בעזרת h. לכן הבלוק אדום, ומופיע עליו סמל אזהרה (!).
לחצו על הסמל כדי לקרוא מה הבעיה. אותו הסבר מופיע גם במצב ההוכחה.

כדי לתקן, לחצו על השם h בתוך הבלוק והקלידו את שם ההנחה שאומרת בדיוק את המטרה. כשהמהלך נכון, הסימון האדום נעלם.

אם נתקעתם, הכפתור "הצג רמז" נותן רמזים, אחד בכל פעם.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'איזו הנחה אומרת Q? את השם שלה צריך לכתוב בבלוק.',
            'לחצו על h בתוך הבלוק, כתבו h2, ולחצו על "בדוק הוכחה".',
        ],
        conclusion: `תיקנתם את המהלך: במקום ההנחה h, שאומרת P, השתמשתם ב־h2, שאומרת בדיוק את המטרה Q.
סיימתם את יחידה 0, ואתם מכירים את חלקי המסך. ביחידה 1 נלמד להוכיח גרירות.`,
        // Starts with a wrong move on purpose, so the first error is planned and explained.
        startXml: goalXml('Q', 'h : P,  h2 : Q', '<block type="tactic_exact"><field name="TERM">h</field></block>'),
    },
];
