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
        title: 'הקדמה והטקטיקה exact',
        name: 'subset_l1_exact',
        variableLine: 'variable {U : Type}',
        params: '(x : U) (A : Set U) (h : x ∈ A)',
        proposition: 'x ∈ A',
        goalLabel: 'x ∈ A',
        objects: [
            { name: 'x', type: 'Element' },
            { name: 'A', type: 'Set' },
        ],
        assumptions: [
            { name: 'h', prop: 'x ∈ A' },
        ],
        introduction: `# הקדמה

בכל שלב במשחק תצטרכו להוכיח טענה מתמטית. ההוכחה שלכם תיבדק על ידי קוד Lean,
ואם היא נכונה תוכלו לעבור לשלב הבא.

נתחיל מלהוכיח טענות טריוויאליות וככל שנתקדם נוכיח טענות יותר מורכבות.

בשלב הראשון תוכיחו שאם \`A\` היא קבוצה של איברים,
 ו-\`x ∈ A\`, אז \`x ∈ A\`.

למטה תוכלו לראות את \`x\` ו-\`A\`
תחת "עצמים", ואת \`h : x ∈ A\` תחת "הנחות". האות \`h\` כאן נקראת *מזהה*
(identifier) של ההנחה \`x ∈ A\`.
את הטענה שנרצה להוכיח תראו תחת "מטרה",
והגדרות חדשות כמו שייכות לקבוצה תמצאו תחת "הגדרה חדשה".

על מנת להוכיח טענות תצטרכו להשתמש בטקטיקות ומשפטים שיופיעו בארגז הכלים בצד ימין.
ככל שתתקדמו בשלבים, תלמדו טקטיקות חדשות ומשפטים חדשים.

הטקטיקה הראשונה שתלמדו נקראת \`exact\`,
והיא מופיעה בסוף הוכחה: אם יש לכם הנחה \`h\`
שהיא בדיוק מה שרציתם להוכיח, נשתמש בבלוק "מה שאנחנו רוצים להוכיח זה בדיוק  \`h\`"
וזה יסיים את ההוכחה.

את הבלוק תגררו מתוך חלונית "טקטיקות" לתוך בלוק המטרה, ליד "בנו כאן את ההוכחה". 
תוכלו לשנות את תיבת הטקסט בתוך הבלוק שתתאים למזהה ההנחה שאתם צריכים.

כשתרצו לבדוק את ההוכחה, לחצו על "בדוק הוכחה". אם ההוכחה נכונה, תוכלו לעבור לשלב הבא.
`,

        newTacticsBlocks: ['tactic_exact'],
        newTheoremBlocks: [],
        newDefinitions: [
            {
                symbol: '∈',
                doc: '\`x ∈ A\` פירושו ש-\`x\` הוא איבר בקבוצה \`A\`. כדי להקליד את הסימן \`∈\` יש להקליד \`\\in\` או \`\\mem\`.',
            },
        ],
        hints: [
            `כדי להשלים את ההוכחה, גררו מארגז הכלים את הבלוק "מה שאנחנו רוצים להוכיח זה בדיוק",
             הכניסו \`h\` בתיבת הטקסט שבתוכו, ולחצו על "בדוק הוכחה".`,
        ],
        conclusion: `כל הכבוד! השלמתם את ההוכחה הראשונה שלכם! 🎉

על אף שזו הייתה טענה טריוויאלית, עיקר העניין הוא ללמוד איך להשתמש בבלוקים ובטקטיקות כדי לבנות הוכחות.
בהמשך נלמד טקטיקות נוספות, ונראה איך להשתמש בהן כדי להוכיח טענות יותר מעניינות.
        `,
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
        title: 'שימוש במשפטים והכלה (⊆)',
        name: 'subset_l2_subhyp',
        variableLine: 'variable {U : Type}',
        params: '(x : U) (A B : Set U) (h1 : A ⊆ B) (h2 : x ∈ A)',
        proposition: 'x ∈ B',
        goalLabel: 'x ∈ B',
        objects: [
            { name: 'x', type: 'Element' },
            { name: 'A', type: 'Set' },
            { name: 'B', type: 'Set' },
        ],
        assumptions: [
            { name: 'h1', prop: 'A ⊆ B' },
            { name: 'h2', prop: 'x ∈ A' },
        ],
        introduction: `אם \`A\` ו-\`B\` הן קבוצות, נאמר ש-\`A\` היא *תת-קבוצה* (subset) של \`B\`
        (או ש \`A\` מוכלת ב \`B\`)
        אם כל איבר של \`A\` הוא גם איבר של \`B\`.
        נשתמש בסימון \`A ⊆ B\` בשביל לסמן ש \`A\` מוכלת ב \`B\`. 

בשלב זה יש לנו קבוצות \`A, B\` ואיבר \`x\`, עם ההנחות \`h1 : A ⊆ B\` ו-\`h2 : x ∈ A\`. מטרת השלב היא להוכיח ש-\`x ∈ B\`.

כדי להוכיח זאת נשתמש במשפט "הוכחת שייכות על ידי הכלה" שתוכלו למצוא בחלונית "משפטים".
תצטרכו לערוך את תיבות הטקסט של המשפט שיתאימו להנחות, ולגרור אותו לתוך בלוק המטרה.

משפט זה יוצר הנחה חדשה \`h\`, שתוכלו להשתמש בה כדי להוכיח את המטרה הסופית עם הטקטיקה שלמדתם בשלב הקודם.
ניתן לחבר בלוקים זה לזה על ידי גרירתם אחד מתחת לשני.

נסו כעת להשלים את ההוכחה. אם אתם צריכים רמז, לחצו על "הצג רמז".`,
        newTacticsBlocks: [],
        newTheoremBlocks: ['theorem_modus_ponens_sets'],
        newDefinitions: [
            {
                symbol: '⊆',
                doc: `\`A ⊆ B\` פירושו ש-A היא תת-קבוצה של B. פורמלית:

\`\`\`
A ⊆ B := ∀ x, x ∈ A → x ∈ B
\`\`\`

                 כדי להקליד את הסימן ⊆ יש להקליד \`\\sub\`.`,
            },
        ],
        hints: [
            `צריך להשתמש במשפט "הוכחת שייכות על ידי הכלה", להחליף בו את \`h1\` ואת \`h2\`
            ולגרור אותו לתוך בלוק המטרה. לאחר מכן, תצטרכו להשתמש בבלוק "מה שאנחנו רוצים להוכיח זה בדיוק" עם ההנחה החדשה שנוצרה כדי לסיים את ההוכחה.`,
        ],
        conclusion: `כל הכבוד! השלמתם את ההוכחה השנייה שלכם! 🎉
        
        למדתם להשתמש במשפטים, להתאים אותם לשמות ההנחות שלכם ולשלב אותם עם טקטיקות שלמדתם.
        `,


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
            { name: 'x', type: 'Element' },
            { name: 'A', type: 'Set' },
            { name: 'B', type: 'Set' },
            { name: 'C', type: 'Set' },
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
        newTheoremBlocks: ['theorem_subset_transitive'],
        // newTacticsInfo: [
        //     {
        //         name: 'have',
        //         doc: 'הטקטיקה have מוסיפה טענה חדשה לרשימת ההנחות, בתנאי שאפשר להוכיח אותה מההנחות הקיימות. יש לתת לטענה החדשה זיהוי שלא נמצא כבר בשימוש, ולבנות הוכחה עבורה בתוך הבלוק.',
        //     },
        // ],
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
