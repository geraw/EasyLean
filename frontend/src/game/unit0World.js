import { goalXml } from './levelXml';

// Unit 0 (see blocks/moves.js): getting to know the screen, with one level.
// The first planned error, explained on the screen, is in unit 1, level 2.
// The assumptions keep names only inside Lean (params), where students never see them.

export const unit0WorldName = 'יחידה 0 - היכרות עם הסביבה';

const closeInfo = {
    name: 'סיום ההוכחה',
    doc: 'כאשר אחת ההנחות אומרת בדיוק את מה שרוצים להוכיח, ההוכחה הושלמה. בהוכחה כתובה: "יש לנו ביד בדיוק את מה שאנחנו רוצים להוכיח".',
};

export const unit0Levels = [
    {
        id: 'unit0-1',
        levelNumber: 1,
        totalLevels: 1,
        title: 'המטרה כבר בידינו',
        name: 'unit0_l1_given',
        variableLine: 'variable {P : Prop}',
        params: '(h : P)',
        proposition: 'P',
        goalLabel: 'P',
        objects: [],
        assumptions: [{ name: 'h', prop: 'P' }],
        toolboxBlocks: ['exact'],
        introduction: `# ברוכים הבאים

בכל שלב מוכיחים טענה אחת. בעמודה הזאת מופיעים ההסבר, מה נתון לנו (ההנחות) ומה צריך להוכיח (המטרה).
כאן נתונה ההנחה P, והמטרה היא להוכיח את P.

ההוכחה נבנית מבלוקים, וכל בלוק הוא משפט בהוכחה, כמו בהוכחה שכותבים ביד.
בצד שמאל של אזור העבודה נמצא הארגז "מהלכי הוכחה": לחצו עליו, וגררו את הבלוק "יש לנו ביד בדיוק את מה שאנחנו רוצים להוכיח"
אל תוך בלוק המטרה, למקום שכתוב בו "בנו כאן את ההוכחה". הבלוק מסיים את ההוכחה כשאחת ההנחות שבידינו אומרת בדיוק את המטרה, כמו כאן.

מתחת לאזור העבודה מופיע מצב ההוכחה: "מה יש לנו ביד" ו"מה נשאר להוכיח". כשתסיימו, לחצו על "בדוק הוכחה".`,
        newTacticsBlocks: ['exact'],
        newTacticsInfo: [closeInfo],
        newDefinitions: [],
        hints: [
            'פתחו את הארגז "מהלכי הוכחה" וגררו את הבלוק "יש לנו ביד בדיוק את מה שאנחנו רוצים להוכיח" אל תוך בלוק המטרה.',
            'אחר כך לחצו על "בדוק הוכחה".',
        ],
        conclusion: `ההנחה P אמרה בדיוק את המטרה, ולכן ההוכחה הושלמה. בהוכחה כתובה הייתם כותבים: "P, וזה מה שהיה צריך להוכיח".
לחיצה על בלוק של מהלך מאפשרת לבחור במצב ההוכחה "לפני המהלך" או "אחרי המהלך": לפני המהלך נשאר להוכיח את P, ואחריו לא נשאר דבר להוכיח.
סיימתם את יחידה 0, ואתם מכירים את חלקי המסך. ביחידה 1 נלמד להוכיח גרירות.`,
        startXml: goalXml('P', 'P'),
    },
];
