import { goalXml } from '../game/levelXml';

// Unit 0 of the handwritten version (see blocks.js): the first level of
// game/unit0World.js. Its second level, a planned error fixed by choosing
// another assumption, has no counterpart here, since closing does not point to
// an assumption; the planned error is in unit 1, level 2.
// The assumptions keep names only inside Lean (params), where students never see them.

export const unit0WorldName = 'יחידה 0 - היכרות עם הסביבה';

const closeInfo = {
    name: 'סיום ההוכחה',
    doc: 'כאשר אחת ההנחות אומרת בדיוק את מה שצריך להוכיח, ההוכחה הושלמה. בכתב יד: "הגענו בדיוק למה שצריך להוכיח".',
};

export const unit0Levels = [
    {
        id: 'hw-unit0-1',
        levelNumber: 1,
        totalLevels: 1,
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
בצד שמאל של אזור העבודה נמצא הארגז "מהלכי הוכחה": לחצו עליו, וגררו את הבלוק "הגענו בדיוק למה שצריך להוכיח"
אל תוך בלוק המטרה, למקום שכתוב בו "בנו כאן את ההוכחה". הבלוק מסיים את ההוכחה כשאחת ההנחות שבידינו אומרת בדיוק את המטרה, כמו כאן.

מתחת לאזור העבודה מופיע מצב ההוכחה: "מה יש לנו ביד" ו"מה נשאר להוכיח". כשתסיימו, לחצו על "בדוק הוכחה".`,
        newTacticsBlocks: ['hw_exact'],
        newTacticsInfo: [closeInfo],
        newDefinitions: [],
        hints: [
            'פתחו את הארגז "מהלכי הוכחה" וגררו את הבלוק "הגענו בדיוק למה שצריך להוכיח" אל תוך בלוק המטרה.',
            'אחר כך לחצו על "בדוק הוכחה".',
        ],
        conclusion: `ההנחה P אמרה בדיוק את המטרה, ולכן ההוכחה הושלמה. בכתב יד הייתם כותבים: "P, וזה מה שהיה צריך להוכיח".
לחיצה על בלוק של מהלך מאפשרת לבחור במצב ההוכחה "לפני המהלך" או "אחרי המהלך": לפני המהלך נשאר להוכיח את P, ואחריו לא נשאר דבר להוכיח.
סיימתם את יחידה 0, ואתם מכירים את חלקי המסך. ביחידה 1 נלמד להוכיח גרירות.`,
        startXml: goalXml('P', 'P'),
    },
];
