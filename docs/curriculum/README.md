# תכנית בלוקים להוכחות ב-Lean (לוגיקה ותורת הקבוצות)

<div dir="rtl">

מסמכי התכנון של EasyLean: אילו בלוקי Blockly נדרשים ללימוד אסטרטגיות הוכחה בקורס לוגיקה ותורת הקבוצות, איך כל יחידה בנויה, ואיזה כלים נדרשים כדי שהבלוקים יפיקו ויאמתו קוד Lean.

דרישות הקורס, עקרונות העיצוב וההחלטות מתועדים כאן, יחד עם הקוד, כדי שהתכנון לא יהיה תלוי במסמך חיצוני ושינוי ביחידה יעדכן את המסמך שלה באותו PR.
אב-טיפוס מוקדם ליחידה 1 נמצא בפרויקט הנפרד `proof-blocks-tutorial` (Blockly 12 + Lean 4); המימוש עצמו הוא EasyLean.

## מבנה

כל יחידה מתועדת בקובץ משלה, ומספר הקובץ הוא מספר היחידה. המסמכים הכלליים נמצאים בתיקייה `design/`.

| יחידה | קובץ | נושא |
|---|---|---|
| 0 | [00-getting-started.md](00-getting-started.md) | היכרות עם הסביבה: חלקי המסך, הנחה מול מטרה |
| 1 | [01-implications.md](01-implications.md) | גרירה: הנחת התנאי, ומעבר מהמסקנה לתנאי |
| 2 | [02-and-or-iff.md](02-and-or-iff.md) | וגם, או, אם ורק אם |
| 3 | [03-negation.md](03-negation.md) | שלילה והוכחה בשלילה |
| 4 | [04-quantifiers.md](04-quantifiers.md) | כמתים |
| 5 | [05-sets.md](05-sets.md) | קבוצות |
| 6 | [06-equality-and-induction.md](06-equality-and-induction.md) | שוויון ואינדוקציה |

| מסמך כללי | תוכן |
|---|---|
| [design/principles.md](design/principles.md) | עקרונות עיצוב לבלוקים |
| [design/general-blocks.md](design/general-blocks.md) | בלוקים כלליים, מיחידה 2 ואילך |
| [design/architecture-and-tools.md](design/architecture-and-tools.md) | ארכיטקטורה וכלים נדרשים |
| [design/prototype-gap.md](design/prototype-gap.md) | הפער בין האב-טיפוס הקיים לדרישות |
| [design/open-decisions.md](design/open-decisions.md) | החלטות פתוחות |

## סטטוס

טיוטה ראשונה (2026-10-01). הקטלוג והארכיטקטורה הם הצעות לדיון, לא החלטות סופיות.

</div>
