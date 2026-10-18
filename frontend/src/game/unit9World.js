import { goalXml } from './levelXml';

// Unit 9 (see blocks/moves.js): functions, as in the course: a function
// f : obj → obj is written f(x); injective and surjective are definitions,
// read with the move "לפי ההגדרה" (which writes (g ∘ f)(x) as g(f(x))), as
// are the image f[A] and the preimage f⁻¹[B] (FUNCTION_PRELUDE in
// generator/lean.js). The values of the functions at the objects in hand,
// f(x₀), are offered where an object is chosen. The bonus is Cantor's
// theorem, with a set given by a property, {x | ¬x ∈ f(x)}. Each level
// offers only the moves of its solutions.

export const unit9WorldName = 'יחידה 9 - פונקציות';

const FUNCTIONS = 'variable {obj : Type} {f g : obj → obj}';
const IMAGES = 'variable {obj : Type} {f : obj → obj} {A B : Set obj}';

// The moves as the toolbox shows them, before they are placed.
const UNFOLD_BLOCK = '"לפי ההגדרה, ?"';
const FORALL_ELIM_BLOCK = '"לפי ה"לכל" ? עבור העצם ?"';
const REWRITE_BLOCK = '"לפי השוויון ? נחליף ..."';
const CLAIM_BLOCK = '"נוכיח קודם את טענת העזר ?"';

const definition = (symbol, doc) => ({ symbol, doc });
const functions = definition('פונקציה', 'פונקציה f מתאימה לכל עצם x עצם אחד, f(x). ההרכבה g ∘ f היא "קודם f, ואחר כך g": (g ∘ f)(x) = g(f(x)).');
const injective = definition('חד־חד־ערכית', 'injective(f) פירושו ∀x (∀y (f(x) = f(y) → x = y)): עצמים שונים הולכים לעצמים שונים.');
const surjective = definition('על', 'surjective(f) פירושו ∀y (∃x (f(x) = y)): כל עצם הוא ערך של f.');
const image = definition('תמונה', 'f[A] היא קבוצת הערכים של f על A: y ∈ f[A] פירושו ∃x (x ∈ A ∧ f(x) = y).');
const preimage = definition('תמונה הפוכה', 'f⁻¹[B] היא קבוצת העצמים ש־f שולחת ל־B: x ∈ f⁻¹[B] פירושו f(x) ∈ B.');
const byProperty = definition('קבוצה לפי תכונה', '{x | P(x)} היא קבוצת העצמים שמקיימים את P: a ∈ {x | P(x)} פירושו P(a).');

const level = (number, fields) => ({
    id: `unit9-${number}`,
    levelNumber: number,
    totalLevels: 9,
    variableLine: FUNCTIONS,
    params: '',
    usesSets: true,
    usesFunctions: true,
    objects: [],
    assumptions: [],
    newTacticsBlocks: [],
    newTacticsInfo: [],
    newDefinitions: [],
    ...fields,
});

export const unit9Levels = [
    level(1, {
        title: 'הרכבה של פונקציות חד־חד־ערכיות',
        name: 'unit9_l1_injective_comp',
        proposition: 'injective f → injective g → injective (g ∘ f)',
        goalLabel: '(injective(f) → (injective(g) → injective(g ∘ f)))',
        toolboxBlocks: ['assume', 'unfold', 'forall_intro', 'forall_elim', 'forward', 'exact'],
        introduction: `# פונקציות

*פונקציה* f מתאימה לכל עצם x עצם אחד, \`f(x)\`. ההרכבה \`g ∘ f\` היא "קודם f, ואחר כך g": \`(g ∘ f)(x) = g(f(x))\`.

f היא *חד־חד־ערכית* אם עצמים שונים הולכים לעצמים שונים: לפי ההגדרה, \`injective(f)\` פירושו \`∀x (∀y (f(x) = f(y) → x = y))\`.
נוכיח שהרכבה של שתי פונקציות חד־חד־ערכיות היא חד־חד־ערכית. בהצבה ב"לכל" אפשר לבחור גם ערך של פונקציה, כמו f(x₀): הוא מופיע ברשימה.`,
        newDefinitions: [functions, injective],
        hints: [
            'נניח את שתי ההנחות, ופתחו את ההגדרות בשלושת המקומות. במטרה מתקבל ∀x (∀y (g(f(x)) = g(f(y)) → x = y)): יהיו x₀, y₀, ונניח g(f(x₀)) = g(f(y₀)).',
            `${FORALL_ELIM_BLOCK} בהנחה על g, עם f(x₀) ואחר כך עם f(y₀), ונובע f(x₀) = f(y₀). אחר כך אותו דבר בהנחה על f, עם x₀ ו־y₀.`,
        ],
        conclusion: 'g ∘ f חד־חד־ערכית: מ־g(f(x₀)) = g(f(y₀)) מורידים קודם את g, ואחר כך את f.',
        startXml: goalXml('(injective(f) → (injective(g) → injective(g ∘ f)))'),
    }),
    level(2, {
        title: 'הרכבה של פונקציות על',
        name: 'unit9_l2_surjective_comp',
        proposition: 'surjective f → surjective g → surjective (g ∘ f)',
        goalLabel: '(surjective(f) → (surjective(g) → surjective(g ∘ f)))',
        toolboxBlocks: ['assume', 'unfold', 'forall_intro', 'forall_elim', 'exists_elim', 'exists_intro', 'rewrite', 'exact'],
        introduction: `# הרכבה של פונקציות על

f היא *על* אם כל עצם הוא ערך שלה: לפי ההגדרה, \`surjective(f)\` פירושו \`∀y (∃x (f(x) = y))\`.
נוכיח שהרכבה של שתי פונקציות על היא על. בכל צעד מקבלים עצם מ"קיים", ובסוף בוחרים אותו כעד.`,
        newDefinitions: [surjective],
        hints: [
            'נניח את ההנחות ופתחו את ההגדרות. יהי y₀: לפי ההנחה על g יש x₀ עם g(x₀) = y₀, ולפי ההנחה על f יש x₁ עם f(x₁) = x₀.',
            `בחרו את x₁ כעד. המטרה היא g(f(x₁)) = y₀: ${REWRITE_BLOCK} לפי f(x₁) = x₀, והתוצאה בידינו.`,
        ],
        conclusion: 'g ∘ f על: כדי להגיע ל־y₀, חוזרים צעד אחד אחורה דרך g, וצעד נוסף דרך f.',
        startXml: goalXml('(surjective(f) → (surjective(g) → surjective(g ∘ f)))'),
    }),
    level(3, {
        title: 'מהרכבה חד־חד־ערכית',
        name: 'unit9_l3_injective_of_comp',
        proposition: 'injective (g ∘ f) → injective f',
        goalLabel: '(injective(g ∘ f) → injective(f))',
        toolboxBlocks: ['assume', 'unfold', 'forall_intro', 'forall_elim', 'apply_rule', 'rewrite', 'rfl'],
        introduction: `# מהרכבה חד־חד־ערכית

שאלה שחוזרת במבחנים: אם g ∘ f חד־חד־ערכית, אז f חד־חד־ערכית (אבל g לא בהכרח).
כאן משתמשים בהנחה *אחורה*: כדי להוכיח x₀ = y₀, די להוכיח g(f(x₀)) = g(f(y₀)), ואת זה נותן השוויון f(x₀) = f(y₀).`,
        hints: [
            'נניח, ופתחו את שתי ההגדרות. יהיו x₀, y₀, ונניח f(x₀) = f(y₀).',
            `הציבו בהנחה את x₀ ואת y₀, והשתמשו בגרירה אחורה. במטרה g(f(x₀)) = g(f(y₀)), ${REWRITE_BLOCK} לפי f(x₀) = f(y₀), ושני הצדדים שווים.`,
        ],
        conclusion: 'אם g ∘ f חד־חד־ערכית, גם f חד־חד־ערכית. g לא חייבת להיות: היא צריכה להיות חד־חד־ערכית רק על הערכים של f.',
        startXml: goalXml('(injective(g ∘ f) → injective(f))'),
    }),
    level(4, {
        title: 'מהרכבה על',
        name: 'unit9_l4_surjective_of_comp',
        proposition: 'surjective (g ∘ f) → surjective g',
        goalLabel: '(surjective(g ∘ f) → surjective(g))',
        toolboxBlocks: ['assume', 'unfold', 'forall_intro', 'forall_elim', 'exists_elim', 'exists_intro', 'exact'],
        introduction: `# מהרכבה על

הטענה המקבילה: אם g ∘ f על, אז g על. הפעם העד הוא ערך של פונקציה.`,
        hints: ['פתחו את ההגדרות, יהי y₀, והציבו אותו בהנחה. יש x₀ עם g(f(x₀)) = y₀. העד שמתאים ל־g הוא f(x₀): הוא ברשימה.'],
        conclusion: 'אם g ∘ f על, גם g על, והעד הוא f(x₀). f לא חייבת להיות על.',
        startXml: goalXml('(surjective(g ∘ f) → surjective(g))'),
    }),
    level(5, {
        title: 'תמונה של חיתוך',
        name: 'unit9_l5_image_inter',
        variableLine: IMAGES,
        proposition: 'Set.image f (A ∩ B) ⊆ Set.image f A ∩ Set.image f B',
        goalLabel: 'f[A ∩ B] ⊆ f[A] ∩ f[B]',
        toolboxBlocks: ['subset_intro', 'unfold', 'exists_elim', 'and_elim', 'and_intro', 'exists_intro', 'exact'],
        introduction: `# תמונה

\`f[A]\` היא *התמונה* של A: הערכים של f על האיברים של A. לפי ההגדרה, \`y ∈ f[A]\` פירושו \`∃x (x ∈ A ∧ f(x) = y)\`.
נוכיח ש־f[A ∩ B] ⊆ f[A] ∩ f[B].`,
        newDefinitions: [image],
        hints: [
            'יהי y₀ ∈ f[A ∩ B]. פתחו את ההגדרה: יש x₀ עם x₀ ∈ (A ∩ B) ו־f(x₀) = y₀.',
            'פתחו את ההגדרות במטרה. בכל צד בחרו את x₀ כעד.',
        ],
        conclusion: 'f[A ∩ B] ⊆ f[A] ∩ f[B]. ההכלה ההפוכה לא תמיד נכונה: אם f שולחת איבר של A ואיבר של B לאותו ערך. היא נכונה כש־f חד־חד־ערכית.',
        startXml: goalXml('f[A ∩ B] ⊆ f[A] ∩ f[B]'),
    }),
    level(6, {
        title: 'תמונה הפוכה של חיתוך',
        name: 'unit9_l6_preimage_inter',
        variableLine: IMAGES,
        proposition: 'Set.preimage f (A ∩ B) = Set.preimage f A ∩ Set.preimage f B',
        goalLabel: 'f⁻¹[A ∩ B] = f⁻¹[A] ∩ f⁻¹[B]',
        toolboxBlocks: ['set_eq', 'subset_intro', 'unfold', 'and_elim', 'and_intro', 'exact'],
        introduction: `# תמונה הפוכה

\`f⁻¹[B]\` היא *התמונה ההפוכה* של B: העצמים ש־f שולחת ל־B. לפי ההגדרה, \`x ∈ f⁻¹[B]\` פירושו \`f(x) ∈ B\`.
התמונה ההפוכה מתנהגת יפה יותר מהתמונה: f⁻¹[A ∩ B] = f⁻¹[A] ∩ f⁻¹[B], לכל f.`,
        newDefinitions: [preimage],
        hints: ['שתי הכלות. בכל אחת, יהי x₀, ופתחו את כל ההגדרות: של התמונה ההפוכה ושל החיתוך.'],
        conclusion: 'לתמונה ההפוכה יש שוויון, בלי תנאי על f. זה נכון גם לאיחוד ולהפרש.',
        startXml: goalXml('f⁻¹[A ∩ B] = f⁻¹[A] ∩ f⁻¹[B]'),
    }),
    level(7, {
        title: 'תמונה של תמונה הפוכה',
        name: 'unit9_l7_image_preimage',
        variableLine: IMAGES,
        proposition: 'Set.image f (Set.preimage f B) ⊆ B',
        goalLabel: 'f[f⁻¹[B]] ⊆ B',
        toolboxBlocks: ['subset_intro', 'unfold', 'exists_elim', 'and_elim', 'rewrite', 'exact'],
        introduction: `# תמונה של תמונה הפוכה

נוכיח ש־f[f⁻¹[B]] ⊆ B: הערכים של העצמים ש־f שולחת ל־B נמצאים ב־B.`,
        hints: ['יהי y₀ ∈ f[f⁻¹[B]]. פתחו את ההגדרות: יש x₀ עם f(x₀) ∈ B ו־f(x₀) = y₀. החליפו לפי השוויון בטענה f(x₀) ∈ B.'],
        conclusion: 'f[f⁻¹[B]] ⊆ B. שוויון יש כש־f על.',
        startXml: goalXml('f[f⁻¹[B]] ⊆ B'),
    }),
    level(8, {
        title: 'תמונה הפוכה של תמונה',
        name: 'unit9_l8_preimage_image',
        variableLine: IMAGES,
        proposition: 'injective f → Set.preimage f (Set.image f A) ⊆ A',
        goalLabel: '(injective(f) → f⁻¹[f[A]] ⊆ A)',
        toolboxBlocks: ['assume', 'unfold', 'subset_intro', 'exists_elim', 'and_elim', 'forall_elim', 'forward', 'rewrite', 'exact'],
        introduction: `# תמונה הפוכה של תמונה

תמיד A ⊆ f⁻¹[f[A]]. ההכלה ההפוכה דורשת שהפונקציה תהיה חד־חד־ערכית: אחרת יש עצם מחוץ ל־A עם אותו ערך כמו איבר של A.`,
        hints: [
            'נניח, ופתחו את ההגדרה של injective(f). יהי x₀ ∈ f⁻¹[f[A]]: פתחו את ההגדרות, ויש x₁ עם x₁ ∈ A ו־f(x₁) = f(x₀).',
            'הציבו ב־injective את x₁ ואת x₀, ונובע x₁ = x₀. החליפו לפי השוויון הזה בטענה x₁ ∈ A.',
        ],
        conclusion: 'כש־f חד־חד־ערכית, f⁻¹[f[A]] = A. החד־חד־ערכיות היא בדיוק מה שמונע מעצם "זר" להיכנס.',
        startXml: goalXml('(injective(f) → f⁻¹[f[A]] ⊆ A)'),
    }),
    level(9, {
        title: 'שלב בונוס: משפט קנטור',
        name: 'unit9_l9_cantor',
        variableLine: 'variable {obj : Type}',
        params: '(f : obj → Set obj)',
        proposition: '¬surjective f',
        goalLabel: '¬surjective(f)',
        terms: ['setOf fun z => ¬z ∈ f z', 'setOf fun z => z ∈ f z'],
        claims: ['¬x₀ ∈ f x₀', 'x₀ ∈ setOf fun z => ¬z ∈ f z', 'x₀ ∈ f x₀'],
        toolboxBlocks: ['not_intro', 'unfold', 'forall_elim', 'exists_elim', 'claim', 'rewrite', 'contradiction', 'exact'],
        introduction: `# בונוס: משפט קנטור

f מתאימה לכל עצם *קבוצה* של עצמים. משפט קנטור: f לא יכולה להיות על, כלומר יש קבוצה שאינה ערך של f. לכן יש "יותר" קבוצות של עצמים מעצמים.

הרעיון הוא *האלכסון*: הקבוצה D = {z | ¬z ∈ f(z)}, של העצמים שלא שייכים לקבוצה ש־f מתאימה להם. אם D = f(x₀), אז x₀ ∈ D אם ורק אם ¬x₀ ∈ D, וזו סתירה.`,
        newDefinitions: [byProperty],
        hints: [`נניח ש־f על ונגיע לסתירה. הציבו בהגדרה את D, כלומר {z | ¬z ∈ f(z)} (היא ברשימה), וקבלו x₀ עם f(x₀) = D. הוכיחו קודם ¬x₀ ∈ f(x₀) (${CLAIM_BLOCK}), ואז x₀ ∈ D, והחליפו בה לפי השוויון.`],
        conclusion: 'סיימתם את יחידה 9, כולל שלב הבונוס! זה משפט קנטור: אין פונקציה על מעצמים לקבוצות של עצמים. אותו טיעון מראה שקבוצת החזקה של קבוצה "גדולה" ממנה, ושאין קבוצה של כל הקבוצות.',
        startXml: goalXml('¬surjective(f)'),
    }),
];
