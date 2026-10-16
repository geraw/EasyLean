# ארכיטקטורה וכלים

<div dir="rtl">

## רכיבים

```
Blockly (מהלכי הוכחה)
   │  עץ בלוקים
   ▼
מחולל Lean  ──►  קוד Lean של המשפט וההוכחה
   │
   ▼
שרת Lean  ──►  מצב ההוכחה לפני כל מהלך, והודעות שגיאה
   │
   ▼
שכבת משוב בעברית  ──►  נוסחאות בבלוקים, מצב ההוכחה, הסברים ורמזים
```

| רכיב | תפקיד | איפה |
|---|---|---|
| מהלכי הוכחה | הבלוקים, הכיתוב שלהם והקוד שהם מייצרים | `frontend/src/blocks/moves.js`, ובלוק המטרה ב־`gameBlocks.js` |
| שלבים | המשפט, ההנחות, הארגז, הטקסטים והרמזים של כל שלב | `frontend/src/game/unit*World.js` |
| מחולל Lean | עץ הבלוקים → משפט ב־Lean, כולל חלקים של מהלכים שמפצלים את ההוכחה | `frontend/src/game/gameLeanCode.js`, `frontend/src/generator/lean.js` |
| מצב ההוכחה לפני כל מהלך | בדיקה אחת של Lean, עם משפט לכל מהלך שנקטע לפניו; ממנה נבנות הרשימות והנוסחאות שבבלוקים | `frontend/src/game/moveStates.js` |
| משוב | מצב ההוכחה לפני ואחרי מהלך, והסברי שגיאות במונחי הטענות | `frontend/src/game/GameWorkspace.jsx`, `moveExplanations.js`, `leanErrors.js` |
| שרת | מקבל קוד Lean, מריץ את Lean ומחזיר את הפלט | `backend/server.js` |
| בדיקות | יחידה (Vitest), שרת (`node:test`), וקצה לקצה מול Lean אמיתי (Playwright) | `frontend/src/**/*.test.js`, `backend/test/`, `frontend/e2e/` |

## מנוע מצב ההוכחה

**הוחלט:** לעבוד ישירות עם Lean, בכל היחידות, ולא עם מנוע JS משלנו. Lean מחזיר את המטרות ואת ההנחות בכל מקום בהוכחה, ואת הודעות השגיאה, והן ממופות לעברית. Mathlib לא בשימוש: מה שנדרש (קבוצות, פונקציות על הטבעיים, וכמה כללים שמבחינים בין גרירה ל"לכל") מוגדר בקטע קצר לפני כל הוכחה (`LEAN_PRELUDE`, `SET_PRELUDE`, `NAT_PRELUDE` ב־`frontend/src/generator/lean.js`), וכך כל בדיקה מהירה.

## כלים

- **Blockly** (דרך `react-blockly`), עם React ו־**Vite**.
- **Lean 4** דרך **elan**, בלי Mathlib.
- **שרת** Node.js ו־Express (`backend/`), שמריץ את Lean על הקוד שהוא מקבל.
- **בדיקות**: Vitest, `node:test`, ו־Playwright, שמריץ את האתר האמיתי בדפדפן מול Lean.

## שלב כהגדרה

כל שלב מוגדר כאובייקט אחד בקובץ היחידה, למשל:

```js
{
    id: 'unit1-2',
    title: 'שימוש בגרירה: מחליפים את המטרה',
    variableLine: 'variable {P Q : Prop}',
    params: '(h1 : (P → Q)) (h : P)',   // לשמות האלה יש תפקיד רק ב־Lean; הסטודנט לא רואה אותם
    proposition: 'Q',
    toolboxBlocks: ['apply_rule', 'exact'],
    introduction: '…', hints: ['…'], conclusion: '…',
    startXml: goalXml('Q', '(P → Q),  P', …),
}
```

הפתרונות של כל השלבים מוגדרים ב־`frontend/e2e/solutions.js`, ובדיקה אוטומטית מוודאת שכל פתרון מתקבל, ושבארגז של כל שלב יש רק מהלכים שאחד הפתרונות משתמש בהם.

</div>
