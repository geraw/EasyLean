import { goalXml } from '../game/levelXml';

// Unit 0 of the handwritten version (see blocks.js): the same two levels as
// game/unit0World.js, with assumptions chosen by what they say, not by name.
// The assumptions keep names only inside Lean (params), where students never see them.

export const unit0WorldName = 'יחידה 0 - היכרות עם הסביבה';

const closeInfo = {
    name: 'סיום לפי הנחה',
    doc: 'כאשר אחת ההנחות אומרת בדיוק את מה שצריך להוכיח, ההוכחה הושלמה. בכתב יד: "לפי ההנחה, P", וזה מה שהיה צריך להוכיח.',
};

export const unit0Levels = [
    {
        id: 'hw-unit0-1',
        levelNumber: 1,
        totalLevels: 2,
        title: 'המטרה כבר בידינו',
        name: 'hw_unit0_l1_given',
        variableLine: 'variable {P : Prop}',
        params: '(h : P)',
        proposition: 'P',
        goalLabel: 'P',
        objects: [],
        assumptions: [{ name: 'h', prop: 'P' }],
        toolboxBlocks: ['hw_exact'],
        introduction: `# ברוכים הבאים

בכל שלב מוכיחים טענה אחת. בעמודה הזאת מופיעים ההסבר, מה נתון לנו (ההנחות) ומה צריך להוכיח (המטרה).
כאן נתונה ההנחה P, והמטרה היא להוכיח את P.

ההוכחה נבנית מבלוקים, וכל בלוק הוא משפט בהוכחה, כמו בהוכחה שכותבים ביד.
בצד שמאל של אזור העבודה נמצא הארגז "מהלכי הוכחה": לחצו עליו, וגררו את הבלוק "לפי ההנחה ? וזה בדיוק מה שצריך להוכיח"
אל תוך בלוק המטרה, למקום שכתוב בו "בנו כאן את ההוכחה".

בבלוק יש שדה מסומן ?. לחצו עליו ובחרו מהרשימה את ההנחה שהמהלך משתמש בה, כאן P.
ברשימה מופיעות ההנחות שבידינו באותו מקום בהוכחה. אפשר גם לבחור "כתיבה ידנית" ולכתוב את הטענה בעצמכם.

מתחת לאזור העבודה מופיע מצב ההוכחה: "מה יש לנו ביד" ו"מה נשאר להוכיח". כשתסיימו, לחצו על "בדוק הוכחה".`,
        newTacticsBlocks: ['hw_exact'],
        newTacticsInfo: [closeInfo],
        newDefinitions: [],
        hints: [
            'פתחו את הארגז "מהלכי הוכחה" וגררו את הבלוק "לפי ההנחה ? וזה בדיוק מה שצריך להוכיח" אל תוך בלוק המטרה.',
            'לחצו על ה־? בבלוק ובחרו P מהרשימה. אחר כך לחצו על "בדוק הוכחה".',
        ],
        conclusion: `ההנחה P אמרה בדיוק את המטרה, ולכן ההוכחה הושלמה. בכתב יד הייתם כותבים: "לפי ההנחה, P", וזה מה שהיה צריך להוכיח.
לחיצה על בלוק של מהלך מאפשרת לבחור במצב ההוכחה "לפני המהלך" או "אחרי המהלך": לפני המהלך נשאר להוכיח את P, ואחריו לא נשאר דבר להוכיח.`,
        startXml: goalXml('P', 'P'),
    },
    {
        id: 'hw-unit0-2',
        levelNumber: 2,
        totalLevels: 2,
        title: 'בוחרים את ההנחה הנכונה',
        name: 'hw_unit0_l2_choose',
        variableLine: 'variable {P Q : Prop}',
        params: '(h : P) (h2 : Q)',
        proposition: 'Q',
        goalLabel: 'Q',
        objects: [],
        assumptions: [
            { name: 'h', prop: 'P' },
            { name: 'h2', prop: 'Q' },
        ],
        toolboxBlocks: ['hw_exact'],
        introduction: `# טעות היא חלק מהדרך

הפעם יש שתי הנחות: P ו־Q. המטרה היא Q.

בלוק המטרה כבר מכיל מהלך, אבל המהלך שגוי: הוא מסיים לפי ההנחה P, ו־P היא לא מה שצריך להוכיח.
לכן הבלוק אדום, ומופיע עליו סמל אזהרה (!). לחצו על הסמל כדי לקרוא מה הבעיה. אותו הסבר מופיע גם במצב ההוכחה.

כדי לתקן, לחצו על P בתוך הבלוק ובחרו את ההנחה שאומרת בדיוק את המטרה. כשהמהלך נכון, הסימון האדום נעלם.

אם נתקעתם, הכפתור "הצג רמז" נותן רמזים, אחד בכל פעם.`,
        newTacticsBlocks: [],
        newTacticsInfo: [],
        newDefinitions: [],
        hints: [
            'איזו הנחה אומרת Q? אותה צריך לבחור בבלוק.',
            'לחצו על P בתוך הבלוק, בחרו Q מהרשימה, ולחצו על "בדוק הוכחה".',
        ],
        conclusion: `תיקנתם את המהלך: ההנחה P לא אמרה את המטרה, וההנחה Q אמרה אותה בדיוק.
סיימתם את יחידה 0, ואתם מכירים את חלקי המסך. ביחידה 1 נלמד להוכיח גרירות.`,
        // Starts with a wrong move on purpose, so the first error is planned and explained.
        startXml: goalXml('Q', 'P,  Q', '<block type="hw_exact"><field name="FACT">P</field></block>'),
    },
];
