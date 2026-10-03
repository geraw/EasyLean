import { goalXml } from './levelXml';

export const unit5WorldName = 'יחידה 5 - קבוצות';

const subsetElimInfo = {
    name: 'שימוש בהכלה',
    doc: 'A ⊆ B אומרת שכל איבר של A הוא גם איבר של B. לכן אם x0 ∈ A, אז x0 ∈ B.',
};
const subsetIntroInfo = {
    name: 'הוכחת הכלה',
    doc: 'כדי להוכיח A ⊆ B לוקחים איבר שרירותי x0 של A, ומוכיחים ש־x0 ∈ B.',
};
const interInfo = { name: 'הגדרת החיתוך', doc: 'x ∈ A ∩ B פירושו x ∈ A וגם x ∈ B.' };
const unionInfo = { name: 'הגדרת האיחוד', doc: 'x ∈ A ∪ B פירושו x ∈ A או x ∈ B.' };
const setEqInfo = { name: 'שוויון קבוצות', doc: 'שתי קבוצות שוות אם כל אחת מוכלת בשנייה: מוכיחים A ⊆ B וגם B ⊆ A.' };
const complInfo = { name: 'הגדרת המשלים', doc: 'x ∈ Aᶜ פירושו x ∉ A: האיבר לא שייך ל־A.' };
const diffInfo = { name: 'הגדרת ההפרש', doc: 'x ∈ A \\ B פירושו x ∈ A וגם x ∉ B.' };
const emptyInfo = { name: 'הגדרת הקבוצה הריקה', doc: 'x ∈ ∅ פירושו סתירה (⊥): אין אף איבר בקבוצה הריקה.' };
const powersetInfo = { name: 'הגדרת קבוצת החזקה', doc: 'X ∈ 𝒫(A) פירושו X ⊆ A: האיברים של קבוצת החזקה הם תתי־הקבוצות של A.' };
const sUnionInfo = { name: 'הגדרת איחוד משפחה', doc: 'x ∈ ⋃₀ F פירושו: קיימת קבוצה S במשפחה F כך ש־x ∈ S.' };
const sInterInfo = { name: 'הגדרת חיתוך משפחה', doc: 'x ∈ ⋂₀ F פירושו: לכל קבוצה S במשפחה F מתקיים x ∈ S.' };

// The typical mistake of level 3, already placed: using an inclusion before
// there is an element to use it on.
const prematureSubsetXml = `
      <block type="tactic_intro">
        <field name="HYPOTHESIS">h1</field>
        <next>
          <block type="tactic_intro">
            <field name="HYPOTHESIS">h2</field>
            <next>
              <block type="logic_subset_elim">
                <field name="HYPOTHESIS">h1</field>
                <field name="MEMBER">hx</field>
                <field name="NAME">hb</field>
              </block>
            </next>
          </block>
        </next>
      </block>`;

const SETS = 'variable {obj : Type} {A B C : Set obj}';
const FAMILY = 'variable {obj : Type} {A : Set obj} {F : Set (Set obj)}';

const level = (number, fields) => ({
    id: `unit5-${number}`,
    levelNumber: number,
    totalLevels: 17,
    usesSets: true,
    objects: [],
    assumptions: [],
    newTacticsBlocks: [],
    newTacticsInfo: [],
    newDefinitions: [],
    ...fields,
});

export const unit5Levels = [
    level(1, {
        title: 'משתמשים בהכלה',
        name: 'unit5_l1_subset_elim',
        variableLine: SETS,
        params: '(x0 : obj) (h : A ⊆ B) (hx : x0 ∈ A)',
        proposition: 'x0 ∈ B',
        goalLabel: 'x0 ∈ B',
        objects: [{ name: 'x0', type: 'obj' }],
        assumptions: [{ name: 'h', prop: 'A ⊆ B' }, { name: 'hx', prop: 'x0 ∈ A' }],
        toolboxBlocks: ['logic_subset_elim', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# קבוצות והכלה

*קבוצה* היא אוסף של עצמים מהתחום, ו־\`x0 ∈ A\` אומרת ש־x0 *שייך* ל־A. למשל: A היא קבוצת הסטודנטים שעברו את הבוחן, ו־B קבוצת הסטודנטים שרשאים לגשת למבחן.

\`A ⊆ B\` נקראת "A מוכלת ב־B": כל איבר של A הוא גם איבר של B. זו בעצם טענת "לכל": לכל x, אם x ∈ A אז x ∈ B.

כאן נתון ש־A ⊆ B וש־x0 ∈ A, והמטרה היא x0 ∈ B: מההכלה ומהשייכות ל־A נסיק את השייכות ל־B.`,
        newTacticsBlocks: ['logic_subset_elim'],
        newTacticsInfo: [subsetElimInfo],
        hints: [
            'גררו את הבלוק "מההכלה ? ומהשייכות ? נסיק שייכות לקבוצה הגדולה", וכתבו בו h ו־hx, ושם לתוצאה, למשל hb.',
            'עכשיו hb אומרת בדיוק את המטרה.',
        ],
        conclusion: `מ־A ⊆ B ומ־x0 ∈ A הסקתם x0 ∈ B. משתמשים בהכלה בדיוק כמו בגרירה: השייכות לקבוצה הקטנה היא התנאי, והשייכות לגדולה היא המסקנה.`,
        startXml: goalXml('x0 ∈ B', 'x0 : obj,  h : A ⊆ B,  hx : x0 ∈ A'),
    }),
    level(2, {
        title: 'שרשרת של הכלות',
        name: 'unit5_l2_subset_chain',
        variableLine: SETS,
        params: '(x0 : obj) (h1 : A ⊆ B) (h2 : B ⊆ C) (hx : x0 ∈ A)',
        proposition: 'x0 ∈ C',
        goalLabel: 'x0 ∈ C',
        objects: [{ name: 'x0', type: 'obj' }],
        assumptions: [{ name: 'h1', prop: 'A ⊆ B' }, { name: 'h2', prop: 'B ⊆ C' }, { name: 'hx', prop: 'x0 ∈ A' }],
        toolboxBlocks: ['logic_subset_elim', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# שרשרת של הכלות

אם A מוכלת ב־B, ו־B מוכלת ב־C, ו־x0 ∈ A, אז x0 ∈ C. השתמשו בשתי ההכלות זו אחר זו, כמו בשרשרת הגרירות של יחידה 1.`,
        hints: [
            'מ־h1 ומ־hx הסיקו x0 ∈ B (למשל hb).',
            'מ־h2 ומ־hb הסיקו x0 ∈ C, וסגרו בעזרתה.',
        ],
        conclusion: `השתמשתם בשתי הכלות ברצף: מ־A ל־B, ומ־B ל־C.`,
        startXml: goalXml('x0 ∈ C', 'x0 : obj,  h1 : A ⊆ B,  h2 : B ⊆ C,  hx : x0 ∈ A'),
    }),
    level(3, {
        title: 'מוכיחים הכלה',
        name: 'unit5_l3_subset_trans',
        variableLine: SETS,
        params: '',
        proposition: '(A ⊆ B) → ((B ⊆ C) → (A ⊆ C))',
        goalLabel: '((A ⊆ B) → ((B ⊆ C) → (A ⊆ C)))',
        toolboxBlocks: ['tactic_intro', 'logic_subset_intro', 'logic_subset_elim', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# מוכיחים הכלה

כדי להוכיח \`A ⊆ C\` לוקחים איבר *שרירותי* של A, למשל x0, ומוכיחים שהוא שייך ל־C, כמו בהוכחת "לכל" ביחידה 4.

ההוכחה כבר התחילה: הנחנו את שתי ההכלות, ומיד השתמשנו ב־h1 עם שייכות בשם hx. אבל הבלוק אדום: עוד אין בידינו איבר, ולא שייכות שלו.
קודם לוקחים איבר של A, ורק אז אפשר להשתמש בהכלות.`,
        newTacticsBlocks: ['logic_subset_intro'],
        newTacticsInfo: [subsetIntroInfo],
        hints: [
            'הכניסו לפני הבלוק האדום את הבלוק "כדי להוכיח הכלה: יהי ? איבר של הקבוצה הקטנה", וכתבו בו x0 ו־hx. יש בידינו hx : x0 ∈ A.',
            'עכשיו הבלוק כבר לא אדום: יש בידינו hb : x0 ∈ B.',
            'הסיקו מ־h2 ומ־hb את x0 ∈ C, וסגרו בעזרתה.',
        ],
        conclusion: `לקחתם איבר שרירותי של A והראיתם שהוא ב־C, ולכן A ⊆ C: ההכלה טרנזיטיבית.
כמו ב"לכל": קודם לוקחים איבר, ורק אז משתמשים בהכלות עליו.`,
        startXml: goalXml('((A ⊆ B) → ((B ⊆ C) → (A ⊆ C)))', 'אין הנחות פתיחה', prematureSubsetXml),
    }),
    level(4, {
        title: 'חיתוך',
        name: 'unit5_l4_inter',
        variableLine: SETS,
        params: '',
        proposition: 'A ∩ B ⊆ A',
        goalLabel: 'A ∩ B ⊆ A',
        toolboxBlocks: ['logic_subset_intro', 'logic_unfold_inter', 'logic_and_elim', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# חיתוך

\`A ∩ B\` היא *החיתוך* של A ו־B: הקבוצה של האיברים ששייכים לשתיהן. למשל: הסטודנטים שעברו גם את הבוחן וגם את התרגיל.

לפי ההגדרה, \`x0 ∈ A ∩ B\` פירושו \`x0 ∈ A ∧ x0 ∈ B\`. כדי להשתמש בזה, *פותחים את ההגדרה*: הבלוק "לפי הגדרת החיתוך" הופך שייכות לחיתוך ל"וגם", ומשם ממשיכים כמו ביחידה 2.`,
        newTacticsBlocks: ['logic_unfold_inter'],
        newTacticsInfo: [interInfo],
        hints: [
            'קחו איבר x0 של A ∩ B, עם hx : x0 ∈ A ∩ B.',
            'גררו את הבלוק "לפי הגדרת החיתוך, נפתח את", בחרו בו "ההנחה" וכתבו hx. עכשיו hx : x0 ∈ A ∧ x0 ∈ B.',
            'הסיקו מ־hx את שני הצדדים, וסגרו בצד שמאל.',
        ],
        conclusion: `החיתוך מוכל בכל אחת מהקבוצות. אחרי פתיחת ההגדרה נשארה טענת "וגם" רגילה.`,
        startXml: goalXml('A ∩ B ⊆ A'),
    }),
    level(5, {
        title: 'שייכות לחיתוך',
        name: 'unit5_l5_subset_inter',
        variableLine: SETS,
        params: '(h1 : A ⊆ B) (h2 : A ⊆ C)',
        proposition: 'A ⊆ B ∩ C',
        goalLabel: 'A ⊆ B ∩ C',
        assumptions: [{ name: 'h1', prop: 'A ⊆ B' }, { name: 'h2', prop: 'A ⊆ C' }],
        toolboxBlocks: ['logic_subset_intro', 'logic_subset_elim', 'logic_unfold_inter', 'logic_and_intro', 'logic_and_combine', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# שייכות לחיתוך

אם A מוכלת גם ב־B וגם ב־C, אז היא מוכלת בחיתוך שלהן.

הפעם פותחים את הגדרת החיתוך *במטרה*: \`x0 ∈ B ∩ C\` הופכת ל־\`x0 ∈ B ∧ x0 ∈ C\`, ומוכיחים את שני הצדדים.`,
        hints: [
            'קחו איבר x0 של A (hx), ופתחו את הגדרת החיתוך במטרה.',
            'הוכיחו את שני הצדדים בשני חלקים: בכל חלק, השתמשו בהכלה המתאימה ובשייכות hx.',
        ],
        conclusion: `פתחתם את ההגדרה במטרה, והוכחתם "וגם" בשני חלקים. פתיחת הגדרה עובדת גם בהנחות וגם במטרה.`,
        startXml: goalXml('A ⊆ B ∩ C', 'h1 : A ⊆ B,  h2 : A ⊆ C'),
    }),
    level(6, {
        title: 'איחוד',
        name: 'unit5_l6_union',
        variableLine: SETS,
        params: '(h1 : A ⊆ C) (h2 : B ⊆ C)',
        proposition: 'A ∪ B ⊆ C',
        goalLabel: 'A ∪ B ⊆ C',
        assumptions: [{ name: 'h1', prop: 'A ⊆ C' }, { name: 'h2', prop: 'B ⊆ C' }],
        toolboxBlocks: ['logic_subset_intro', 'logic_subset_elim', 'logic_unfold_union', 'logic_or_elim', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# איחוד

\`A ∪ B\` הוא *האיחוד* של A ו־B: האיברים ששייכים לפחות לאחת מהן. לפי ההגדרה, \`x0 ∈ A ∪ B\` פירושו \`x0 ∈ A ∨ x0 ∈ B\`.

אם A ו־B מוכלות שתיהן ב־C, גם האיחוד שלהן מוכל ב־C. אחרי פתיחת ההגדרה, חלקו למקרים כמו ביחידה 2.`,
        newTacticsBlocks: ['logic_unfold_union'],
        newTacticsInfo: [unionInfo],
        hints: [
            'קחו איבר x0 של A ∪ B (hx), ופתחו את הגדרת האיחוד בהנחה hx.',
            'חלקו למקרים לפי hx (למשל ha : x0 ∈ A, hb : x0 ∈ B).',
            'בכל מקרה, השתמשו בהכלה המתאימה וסגרו.',
        ],
        conclusion: `שייכות לאיחוד היא "או", ולכן משתמשים בה בחלוקה למקרים.`,
        startXml: goalXml('A ∪ B ⊆ C', 'h1 : A ⊆ C,  h2 : B ⊆ C'),
    }),
    level(7, {
        title: 'שוויון קבוצות',
        name: 'unit5_l7_inter_comm',
        variableLine: SETS,
        params: '',
        proposition: 'A ∩ B = B ∩ A',
        goalLabel: 'A ∩ B = B ∩ A',
        toolboxBlocks: ['logic_set_eq', 'logic_subset_intro', 'logic_unfold_inter', 'logic_and_elim', 'logic_and_intro', 'logic_and_combine', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# שוויון קבוצות

שתי קבוצות *שוות* אם יש להן בדיוק אותם איברים, כלומר כל אחת מוכלת בשנייה.
לכן כדי להוכיח \`A ∩ B = B ∩ A\` מוכיחים שתי הכלות: \`A ∩ B ⊆ B ∩ A\`, וגם \`B ∩ A ⊆ A ∩ B\`.`,
        newTacticsBlocks: ['logic_set_eq'],
        newTacticsInfo: [setEqInfo],
        hints: [
            'גררו את הבלוק "נוכיח שוויון קבוצות בשתי הכלות". בכל חלק יש הכלה להוכיח.',
            'בכל חלק: קחו איבר, פתחו את הגדרת החיתוך בהנחה ובמטרה, והחליפו את סדר הצדדים.',
        ],
        conclusion: `הוכחתם שוויון בשתי הכלות. זו הדרך הרגילה להוכיח שוויון קבוצות; הכלה אחת לבדה לא מספיקה.`,
        startXml: goalXml('A ∩ B = B ∩ A'),
    }),
    level(8, {
        title: 'פילוג',
        name: 'unit5_l8_distrib',
        variableLine: SETS,
        params: '',
        proposition: 'A ∩ (B ∪ C) ⊆ (A ∩ B) ∪ (A ∩ C)',
        goalLabel: 'A ∩ (B ∪ C) ⊆ (A ∩ B) ∪ (A ∩ C)',
        toolboxBlocks: ['logic_subset_intro', 'logic_unfold_inter', 'logic_unfold_union', 'logic_and_elim', 'logic_and_intro', 'logic_and_combine', 'logic_or_elim', 'logic_or_intro_left', 'logic_or_intro_right', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# פילוג

חיתוך מתפלג על איחוד: אם x0 שייך ל־A וגם ל־B או ל־C, אז הוא שייך ל־A ∩ B או ל־A ∩ C.
זו הגרסה של שלב 2.9 (פילוג "וגם" על "או") בשפת הקבוצות: אחרי פתיחת ההגדרות, ההוכחה זהה.`,
        hints: [
            'קחו איבר x0, ופתחו את הגדרת החיתוך בהנחה: x0 ∈ A וגם x0 ∈ B ∪ C.',
            'פתחו את הגדרת האיחוד בהנחה השנייה, וחלקו למקרים.',
            'בכל מקרה: פתחו את הגדרת האיחוד במטרה, בחרו צד, פתחו את הגדרת החיתוך, והוכיחו "וגם".',
        ],
        conclusion: `אחרי פתיחת ההגדרות נשארה בדיוק הוכחת הפילוג משלב 2.9. כך רוב הטענות על קבוצות: פותחים הגדרות ומשתמשים בלוגיקה.`,
        startXml: goalXml('A ∩ (B ∪ C) ⊆ (A ∩ B) ∪ (A ∩ C)'),
    }),
    level(9, {
        title: 'משלים',
        name: 'unit5_l9_compl',
        variableLine: SETS,
        params: '',
        proposition: '(A ⊆ B) → (Bᶜ ⊆ Aᶜ)',
        goalLabel: '((A ⊆ B) → (Bᶜ ⊆ Aᶜ))',
        toolboxBlocks: ['tactic_intro', 'logic_subset_intro', 'logic_subset_elim', 'logic_unfold_compl', 'logic_not_intro', 'logic_contradiction', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# משלים

\`Aᶜ\` היא *המשלים* של A: כל העצמים בתחום שלא שייכים ל־A. לפי ההגדרה, \`x0 ∈ Aᶜ\` פירושו \`x0 ∉ A\`.

אם A מוכלת ב־B, אז המשלים של B מוכל במשלים של A: מי שלא ב־B, בוודאי לא ב־A. אחרי פתיחת ההגדרות, השתמשו בכלים של יחידה 3.`,
        newTacticsBlocks: ['logic_unfold_compl'],
        newTacticsInfo: [complInfo],
        hints: [
            'הניחו את ההכלה (h), קחו איבר x0 של Bᶜ (hx), ופתחו את הגדרת המשלים בהנחה hx ובמטרה.',
            'המטרה היא x0 ∉ A: הוכיחו שלילה, והניחו ha : x0 ∈ A.',
            'מ־h ומ־ha הסיקו x0 ∈ B, והיא סותרת את hx.',
        ],
        conclusion: `משלים הוא שלילה של שייכות. ההכלה מתהפכת: מ־A ⊆ B נובע Bᶜ ⊆ Aᶜ.`,
        startXml: goalXml('((A ⊆ B) → (Bᶜ ⊆ Aᶜ))'),
    }),
    level(10, {
        title: 'הפרש',
        name: 'unit5_l10_diff',
        variableLine: SETS,
        params: '',
        proposition: 'A \\ B ⊆ A ∩ Bᶜ',
        goalLabel: 'A \\ B ⊆ A ∩ Bᶜ',
        toolboxBlocks: ['logic_subset_intro', 'logic_unfold_diff', 'logic_unfold_inter', 'logic_unfold_compl', 'logic_and_elim', 'logic_and_intro', 'logic_and_combine', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# הפרש

\`A \\ B\` הוא *ההפרש* של A ו־B: האיברים של A שלא שייכים ל־B. לפי ההגדרה, \`x0 ∈ A \\ B\` פירושו \`x0 ∈ A ∧ x0 ∉ B\`.

זה בדיוק החיתוך של A עם המשלים של B. הוכיחו את אחת ההכלות.`,
        newTacticsBlocks: ['logic_unfold_diff'],
        newTacticsInfo: [diffInfo],
        hints: [
            'קחו איבר x0 (hx), ופתחו את הגדרת ההפרש בהנחה hx, ואת הגדרת החיתוך במטרה.',
            'הסיקו מ־hx את שני הצדדים, והוכיחו את שני הצדדים של המטרה. בצד ימין, פתחו את הגדרת המשלים במטרה.',
        ],
        conclusion: `ההפרש A \\ B שווה ל־A ∩ Bᶜ: שתי הגדרות שונות לאותה קבוצה.`,
        startXml: goalXml('A \\ B ⊆ A ∩ Bᶜ'),
    }),
    level(11, {
        title: 'תרגיל מסכם: חוק דה מורגן לקבוצות',
        name: 'unit5_l11_de_morgan',
        variableLine: SETS,
        params: '',
        proposition: '(A ∪ B)ᶜ = Aᶜ ∩ Bᶜ',
        goalLabel: '(A ∪ B)ᶜ = Aᶜ ∩ Bᶜ',
        toolboxBlocks: ['logic_set_eq', 'logic_subset_intro', 'logic_unfold_inter', 'logic_unfold_union', 'logic_unfold_compl', 'logic_and_elim', 'logic_and_intro', 'logic_or_elim', 'logic_or_intro_left', 'logic_or_intro_right', 'logic_not_intro', 'logic_not_elim', 'logic_contradiction', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# תרגיל מסכם: חוק דה מורגן לקבוצות

המשלים של איחוד הוא החיתוך של המשלימים: מי שלא שייך לאף אחת מהקבוצות, לא שייך ל־A וגם לא שייך ל־B.
זה חוק דה מורגן משלב 3.6, בשפת הקבוצות. הוכיחו את שתי ההכלות.`,
        hints: [
            'הכלה ראשונה: קחו איבר (hx : x0 ∈ (A ∪ B)ᶜ), פתחו את הגדרת המשלים בהנחה ואת הגדרת החיתוך במטרה.',
            'בכל חלק פתחו את הגדרת המשלים במטרה, הוכיחו שלילה, והגיעו לסתירה בעזרת hx: הוכיחו שייכות לאיחוד.',
            'הכלה שנייה: פתחו את החיתוך בהנחה ואת המשלים בכל מקום, הניחו שייכות לאיחוד, וחלקו למקרים.',
        ],
        conclusion: `הוכחתם את חוק דה מורגן לקבוצות. כמו בשאר היחידה: אחרי פתיחת ההגדרות נשארת הוכחה לוגית מוכרת.`,
        startXml: goalXml('(A ∪ B)ᶜ = Aᶜ ∩ Bᶜ'),
    }),
    level(12, {
        title: 'הקבוצה הריקה',
        name: 'unit5_l12_empty_subset',
        variableLine: SETS,
        params: '',
        proposition: '∅ ⊆ A',
        goalLabel: '∅ ⊆ A',
        toolboxBlocks: ['logic_subset_intro', 'logic_unfold_empty', 'logic_false_implies', 'tactic_apply_rule', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# הקבוצה הריקה

\`∅\` היא *הקבוצה הריקה*: אין בה אף איבר. לפי ההגדרה, \`x0 ∈ ∅\` פירושו סתירה (⊥).

הקבוצה הריקה מוכלת בכל קבוצה. נראה את זה כמו כל הכלה: ניקח איבר של ∅. אבל אין כזה, ולכן ההנחה עליו היא סתירה, ומסתירה נובע הכול (שלב 3.3).`,
        newTacticsBlocks: ['logic_unfold_empty'],
        newTacticsInfo: [emptyInfo],
        hints: [
            'קחו איבר x0 של ∅ (hx), ופתחו את הגדרת הקבוצה הריקה בהנחה hx: hx : ⊥.',
            'השתמשו בגרירה "סתירה גוררת x0 ∈ A" (כתבו בה x0 ∈ A), ועברו לתנאי שלה, או הסיקו קדימה.',
        ],
        conclusion: `∅ מוכלת בכל קבוצה, כי אין בה איבר שיכול להפריך את ההכלה. זה נובע מ"מסתירה נובע הכול".`,
        startXml: goalXml('∅ ⊆ A'),
    }),
    level(13, {
        title: 'קבוצה ומשלימה',
        name: 'unit5_l13_inter_compl',
        variableLine: SETS,
        params: '',
        proposition: 'A ∩ Aᶜ = ∅',
        goalLabel: 'A ∩ Aᶜ = ∅',
        toolboxBlocks: ['logic_set_eq', 'logic_subset_intro', 'logic_unfold_inter', 'logic_unfold_compl', 'logic_unfold_empty', 'logic_and_elim', 'logic_and_intro', 'logic_not_intro', 'logic_contradiction', 'logic_false_implies', 'tactic_apply_rule', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# קבוצה ומשלימה

אין איבר ששייך גם ל־A וגם למשלים שלה: \`A ∩ Aᶜ = ∅\`. זה עיקרון הסתירה (שלב 3.2) בשפת הקבוצות.

כדי להוכיח שקבוצה שווה ל־∅ מוכיחים שתי הכלות. ההכלה ∅ ⊆ A ∩ Aᶜ דומה לשלב הקודם.`,
        hints: [
            'הכלה ראשונה: קחו איבר, פתחו את החיתוך והמשלים בהנחה, ואת הקבוצה הריקה במטרה: המטרה היא סתירה.',
            'הכלה שנייה: קחו איבר של ∅ (סתירה), פתחו את החיתוך במטרה, ובכל צד השתמשו בסתירה. בצד ימין פתחו גם את המשלים במטרה.',
        ],
        conclusion: `A ∩ Aᶜ = ∅: אין איבר ששייך לקבוצה וגם למשלים שלה.`,
        startXml: goalXml('A ∩ Aᶜ = ∅'),
    }),
    level(14, {
        title: 'קבוצת החזקה',
        name: 'unit5_l14_powerset',
        variableLine: SETS,
        params: '',
        proposition: '(A ⊆ B) → (𝒫 A ⊆ 𝒫 B)',
        goalLabel: '((A ⊆ B) → (𝒫(A) ⊆ 𝒫(B)))',
        toolboxBlocks: ['tactic_intro', 'logic_subset_intro', 'logic_subset_elim', 'logic_unfold_powerset', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# קבוצת החזקה

\`𝒫(A)\` היא *קבוצת החזקה* של A: הקבוצה של כל תתי־הקבוצות של A. האיברים שלה הם קבוצות, ולפי ההגדרה \`X ∈ 𝒫(A)\` פירושו \`X ⊆ A\`.

אם A ⊆ B, כל תת־קבוצה של A היא גם תת־קבוצה של B. כאן האיבר שלוקחים הוא קבוצה, למשל X.`,
        newTacticsBlocks: ['logic_unfold_powerset'],
        newTacticsInfo: [powersetInfo],
        hints: [
            'הניחו את ההכלה (h), וקחו איבר X של 𝒫(A), עם hX. פתחו את הגדרת קבוצת החזקה בהנחה hX ובמטרה.',
            'עכשיו צריך להוכיח X ⊆ B: קחו איבר x0 של X, ושרשרו את ההכלות X ⊆ A ו־A ⊆ B.',
        ],
        conclusion: `האיברים של קבוצת החזקה הם קבוצות, אבל ההוכחה זהה: לוקחים איבר, פותחים הגדרה, ומשתמשים בהכלות.`,
        startXml: goalXml('((A ⊆ B) → (𝒫(A) ⊆ 𝒫(B)))'),
    }),
    level(15, {
        title: 'איחוד של משפחה',
        name: 'unit5_l15_sunion',
        variableLine: FAMILY,
        params: '(hA : A ∈ F)',
        proposition: 'A ⊆ ⋃₀ F',
        goalLabel: 'A ⊆ ⋃₀ F',
        assumptions: [{ name: 'hA', prop: 'A ∈ F' }],
        toolboxBlocks: ['logic_subset_intro', 'logic_unfold_sunion', 'logic_exists_intro', 'logic_and_intro', 'logic_and_combine', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# איחוד של משפחה

F היא *משפחה* של קבוצות: קבוצה שהאיברים שלה הם קבוצות. \`⋃₀ F\` הוא האיחוד של כל הקבוצות במשפחה: לפי ההגדרה, \`x0 ∈ ⋃₀ F\` פירושו שקיימת קבוצה S ב־F כך ש־x0 ∈ S.

אם A היא אחת הקבוצות במשפחה, היא מוכלת באיחוד. העד ל"קיים" הוא A עצמה.`,
        newTacticsBlocks: ['logic_unfold_sunion'],
        newTacticsInfo: [sUnionInfo],
        hints: [
            'קחו איבר x0 של A (hx), ופתחו את הגדרת איחוד המשפחה במטרה.',
            'בחרו את A כעד, והוכיחו את שני הצדדים בעזרת hA ו־hx.',
        ],
        conclusion: `איחוד של משפחה הוא טענת "קיים", ולכן מוכיחים שייכות אליו בבחירת עד: הקבוצה מהמשפחה שהאיבר שייך אליה.`,
        startXml: goalXml('A ⊆ ⋃₀ F', 'hA : A ∈ F'),
    }),
    level(16, {
        title: 'חיתוך של משפחה',
        name: 'unit5_l16_sinter',
        variableLine: FAMILY,
        params: '(hA : A ∈ F)',
        proposition: '⋂₀ F ⊆ A',
        goalLabel: '⋂₀ F ⊆ A',
        assumptions: [{ name: 'hA', prop: 'A ∈ F' }],
        toolboxBlocks: ['logic_subset_intro', 'logic_unfold_sinter', 'logic_forall_elim', 'tactic_apply_rule', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# חיתוך של משפחה

\`⋂₀ F\` הוא החיתוך של כל הקבוצות במשפחה: לפי ההגדרה, \`x0 ∈ ⋂₀ F\` פירושו שלכל קבוצה S ב־F מתקיים x0 ∈ S.

אם A היא אחת הקבוצות במשפחה, החיתוך מוכל בה: מציבים את A בטענת ה"לכל".`,
        newTacticsBlocks: ['logic_unfold_sinter'],
        newTacticsInfo: [sInterInfo],
        hints: [
            'קחו איבר x0 של ⋂₀ F (hx), ופתחו את הגדרת חיתוך המשפחה בהנחה hx.',
            'הציבו את A ב־hx: מקבלים A ∈ F → x0 ∈ A. הסיקו ממנה ומ־hA את x0 ∈ A.',
        ],
        conclusion: `חיתוך של משפחה הוא טענת "לכל", ולכן משתמשים בו בהצבה: כאן הצבתם קבוצה, A.`,
        startXml: goalXml('⋂₀ F ⊆ A', 'hA : A ∈ F'),
    }),
    level(17, {
        title: 'שלב בונוס: משלים של משלים',
        name: 'unit5_l17_compl_compl',
        variableLine: SETS,
        params: '',
        proposition: '(Aᶜ)ᶜ = A',
        goalLabel: '(Aᶜ)ᶜ = A',
        toolboxBlocks: ['logic_set_eq', 'logic_subset_intro', 'logic_unfold_compl', 'logic_not_intro', 'logic_not_elim', 'logic_by_contradiction', 'logic_contradiction', 'logic_modus_ponens', 'tactic_exact'],
        introduction: `# בונוס: משלים של משלים

המשלים של המשלים של A הוא A עצמה. זו השלילה הכפולה של שלבים 3.4 ו־3.7, בשפת הקבוצות.

*עיקרון קלאסי:* ההכלה \`(Aᶜ)ᶜ ⊆ A\` דורשת הוכחה בשלילה, כמו ¬¬P → P. ההכלה השנייה לא דורשת.`,
        hints: [
            'הכלה ראשונה: קחו איבר (hx), פתחו את הגדרת המשלים בהנחה hx, והוכיחו בשלילה ש־x0 ∈ A.',
            'הגיעו לסתירה בעזרת השלילה hx: נשאר להוכיח x0 ∈ Aᶜ; פתחו את הגדרת המשלים במטרה.',
            'הכלה שנייה: פתחו את הגדרת המשלים במטרה, הוכיחו שלילה, ופתחו את המשלים בהנחה החדשה.',
        ],
        conclusion: `סיימתם את יחידה 5, כולל שלב הבונוס! כל הטענות על קבוצות הפכו, אחרי פתיחת ההגדרות, להוכחות לוגיות מהיחידות הקודמות.`,
        startXml: goalXml('(Aᶜ)ᶜ = A'),
    }),
];
