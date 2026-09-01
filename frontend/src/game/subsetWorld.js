// Data for the "Subset World" game mode, following
// https://adam.math.hhu.de/#/g/djvelleman/stg4 (world: Subset).
// Since our backend runs plain Lean 4 (no Mathlib), we polyfill a minimal
// `Set` type with `∈` and `⊆` notation that behaves like Mathlib's, so the
// tactics and hint text from the original game apply unchanged.
export const SET_PREAMBLE = `def Set (α : Type) := α → Prop
def Set.mem (x : α) (s : Set α) : Prop := s x
instance : Membership α (Set α) := ⟨fun s x => Set.mem x s⟩
def Set.Subset (s₁ s₂ : Set α) := ∀ ⦃x⦄, x ∈ s₁ → x ∈ s₂
instance : HasSubset (Set α) := ⟨Set.Subset⟩
`;

export const worldName = 'עולם תת-קבוצות';

export const subsetLevels = [
    {
        id: 'subset-1',
        levelNumber: 1,
        totalLevels: 6,
        title: 'הטקטיקה exact',
        name: 'subset_l1_exact',
        variableLine: 'variable {U : Type}',
        params: '(x : U) (A : Set U) (h : x ∈ A)',
        proposition: 'x ∈ A',
        goalLabel: 'x ∈ A',
        objects: [
            { name: 'U', type: 'Type' },
            { name: 'x', type: 'U' },
            { name: 'A', type: 'Set U' },
        ],
        assumptions: [
            { name: 'h', prop: 'x ∈ A' },
        ],
        introduction: `# קראו את זה קודם

בכל שלב במשחק הזה תצטרכו להוכיח טענה מתמטית ("המטרה"). כשתיתנו הוכחה לטענה
שמתקבלת על ידי Lean, אומרים שה"סגרתם" (closed) את המטרה.

בשלב הראשון הזה תוכיחו שאם \`x\` שייך ליקום \`U\`, \`A\` היא קבוצה של איברים
מתוך \`U\`, ו-\`x ∈ A\`, אז \`x ∈ A\`. תראו את \`U : Type\`, \`x : U\` ו-\`A : Set U\`
תחת "עצמים" מימין, ואת \`h : x ∈ A\` תחת "הנחות". האות \`h\` כאן נקראת *מזהה*
(identifier) של ההנחה \`x ∈ A\`.

תוכיחו טענות ב-Lean בעזרת "טקטיקות". הטקטיקה הראשונה שתלמדו נקראת \`exact\`,
והיא סוגרת את המטרה: אם יש לכם ביטוי שהוא הוכחה מדויקת למטרה, \`exact\` עם
הביטוי הזה יסגור אותה.`,
        newTacticsBlocks: ['tactic_exact'],
        newTacticsInfo: [
            {
                name: 'exact',
                doc: 'משתמשים ב-exact כדי לסגור מטרה. אם ביטוי t הוא הוכחה למטרה, אז exact t יסגור אותה. אפשר לחשוב על "exact" כ"זו בדיוק ההוכחה הדרושה".',
            },
        ],
        newDefinitions: [
            {
                symbol: '∈',
                doc: '`x ∈ A` פירושו ש-x הוא איבר של A. כדי להקליד את הסימן ∈ יש להקליד \\in או \\mem.',
            },
        ],
        hints: [
            'כדי להשלים את ההוכחה, גררו מארגז הכלים את הבלוק "מה שאנחנו רוצים להוכיח זה בדיוק" (exact), הכניסו h בתיבת הטקסט שבתוכו, ולחצו על "בדוק הוכחה".',
        ],
        conclusion: `כל הכבוד! השלמתם את ההוכחה המאומתת הראשונה שלכם! 🎉

אף שהטענה הזו הייתה טריוויאלית, היא ממחישה עובדה חשובה: קראנו ל-\`h\` "מזהה"
של ההנחה \`x ∈ A\`, אבל Lean גם מזהה אותו כ*הוכחה* לטענה \`x ∈ A\`. בכל פעם
שתראו \`h : P\` ברשימת ההנחות, כאשר \`P\` היא טענה כלשהי, Lean תזהה את \`h\`
כהוכחה לטענה \`P\`.

זכרו ש-\`exact\` היא *טקטיקה*. שימו לב: למרות ש-\`h\` היא הוכחה למטרה \`x ∈ A\`,
לא הייתם יכולים לסגור את המטרה רק על ידי כתיבת \`h\` — לאורך המשחק כל מהלך
חייב להפעיל טקטיקה.`,
        startXml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="game_goal" x="20" y="20" deletable="false" movable="false">
    <field name="GOAL_LABEL">x ∈ A</field>
  </block>
</xml>`,
    },
    {
        id: 'subset-2',
        levelNumber: 2,
        totalLevels: 6,
        title: 'הנחת הכלה (⊆)',
        name: 'subset_l2_subhyp',
        variableLine: 'variable {U : Type}',
        params: '(x : U) (A B : Set U) (h1 : A ⊆ B) (h2 : x ∈ A)',
        proposition: 'x ∈ B',
        goalLabel: 'x ∈ B',
        objects: [
            { name: 'U', type: 'Type' },
            { name: 'x', type: 'U' },
            { name: 'A', type: 'Set U' },
            { name: 'B', type: 'Set U' },
        ],
        assumptions: [
            { name: 'h1', prop: 'A ⊆ B' },
            { name: 'h2', prop: 'x ∈ A' },
        ],
        introduction: `אם \`A\` ו-\`B\` הן קבוצות, אומרים ש-\`A\` היא *תת-קבוצה* (subset) של \`B\` אם
כל איבר של \`A\` הוא גם איבר של \`B\`. הסימון \`A ⊆ B\` פירושו ש-\`A\` היא
תת-קבוצה של \`B\`. (כדי להקליד את הסימן ⊆, יש להקליד \\sub ואז רווח.)

אם יש לכם \`h1 : A ⊆ B\`, אז \`h1\` היא הוכחה לכך שאם משהו הוא איבר של \`A\`,
אז הוא גם איבר של \`B\`. לכן, אם יש לכם גם \`h2 : x ∈ A\`, תוכלו להפעיל את
\`h1\` על \`h2\` כדי להסיק ש-\`x ∈ B\`. כדי להפעיל את \`h1\` על \`h2\`, פשוט
כותבים \`h1\` ואחריו \`h2\`, עם רווח ביניהם. כלומר, \`h1 h2\` היא הוכחה ל-\`x ∈ B\`.

נסו להשתמש בזה כדי להשלים את השלב הזה. אם אתם צריכים רמז, לחצו על "הצג רמז".`,
        newTacticsBlocks: ['tactic_apply'],
        newTacticsInfo: [],
        newDefinitions: [
            {
                symbol: '⊆',
                doc: '`A ⊆ B` פירושו ש-A היא תת-קבוצה של B. כדי להקליד את הסימן ⊆ יש להקליד \\sub.',
            },
        ],
        hints: [
            'מכיוון ש-`h1 h2` היא הוכחה ל-`x ∈ B`, אפשר לסגור את המטרה עם `exact h1 h2`. השתמשו שוב בבלוק exact, אבל הפעם הכניסו בתיבת הטקסט את הביטוי "h1 h2".',
        ],
        conclusion: `הדוגמה הזו ממחישה טוב יותר איך משתמשים בטקטיקת \`exact\` בדרך כלל.
לעיתים קרובות \`exact\` מלווה בביטוי שמשלב כמה הנחות יחד. בשלבים הבאים
נראה עוד דרכים לשלב הנחות כדי להוכיח מטרה.

שימו לב שבהוכחה הזו, אפשר לחשוב על \`h1\` כעל פונקציה שאפשר להפעיל אותה
על הוכחה לכל טענה מהצורה \`x ∈ A\`, כדי לקבל הוכחה ל-\`x ∈ B\`. הוכחות רבות
ב-Lean מתנהגות כמו פונקציות.`,
        startXml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="game_goal" x="20" y="20" deletable="false" movable="false">
    <field name="GOAL_LABEL">x ∈ B</field>
  </block>
</xml>`,
    },
    {
        id: 'subset-3',
        levelNumber: 3,
        totalLevels: 6,
        title: 'הטקטיקה have',
        name: 'subset_l3_have',
        variableLine: 'variable {U : Type}',
        params: '(x : U) (A B C : Set U) (h1 : A ⊆ B) (h2 : B ⊆ C) (h3 : x ∈ A)',
        proposition: 'x ∈ C',
        goalLabel: 'x ∈ C',
        objects: [
            { name: 'U', type: 'Type' },
            { name: 'x', type: 'U' },
            { name: 'A', type: 'Set U' },
            { name: 'B', type: 'Set U' },
            { name: 'C', type: 'Set U' },
        ],
        assumptions: [
            { name: 'h1', prop: 'A ⊆ B' },
            { name: 'h2', prop: 'B ⊆ C' },
            { name: 'h3', prop: 'x ∈ A' },
        ],
        introduction: `בשלב הזה יש לנו את ההנחות \`h1 : A ⊆ B\`, \`h2 : B ⊆ C\`, ו-\`h3 : x ∈ A\`.
כפי שראינו בשלב הקודם, \`h1 h3\` היא הוכחה לכך ש-\`x ∈ B\`. לצערנו, זו אינה
המטרה שלנו, אז לא נוכל לסגור את המטרה ישירות עם \`exact h1 h3\`.

עם זאת, אפשר להשתמש בהוכחה \`h1 h3\` כדי להצדיק הוספה של \`h4 : x ∈ B\`
לרשימת ההנחות שלנו. לשם כך נשתמש בטקטיקה חדשה: \`have\`.

הבלוק "נוכיח טענת עזר" מוסיף הנחה חדשה: קובעים לה שם (זהות) וטענה, ובתוכו
בונים הוכחה לטענה הזו (למשל עם בלוק exact). לאחר שההנחה נוספה, אפשר
להמשיך להוכיח את המטרה המקורית באמצעות הבלוק החדש הזה.`,
        newTacticsBlocks: ['tactic_have'],
        newTacticsInfo: [
            {
                name: 'have',
                doc: 'הטקטיקה have מוסיפה טענה חדשה לרשימת ההנחות, בתנאי שאפשר להוכיח אותה מההנחות הקיימות. יש לתת לטענה החדשה זיהוי שלא נמצא כבר בשימוש, ולבנות הוכחה עבורה בתוך הבלוק.',
            },
        ],
        newDefinitions: [],
        hints: [
            'התחילו בבלוק "נוכיח טענת עזר": קראו לו h4, וכתבו כטענה "x ∈ B". בתוך הבלוק, השתמשו בבלוק exact עם הביטוי "h1 h3".',
            'אחרי שהוספתם את h4 : x ∈ B, הוסיפו מתחת לבלוק have בלוק exact נוסף עם הביטוי "h2 h4" כדי לסגור את המטרה הסופית.',
        ],
        conclusion: `אפשר להשתמש בטקטיקת \`have\` כדי להוסיף טענה חדשה לרשימת ההנחות, כל עוד
אפשר להצדיק אותה עם הוכחה. לקבלת מידע נוסף, אפשר ללחוץ על \`have\` ברשימת
הטקטיקות מימין.`,
        startXml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="game_goal" x="20" y="20" deletable="false" movable="false">
    <field name="GOAL_LABEL">x ∈ C</field>
  </block>
</xml>`,
    },
];
