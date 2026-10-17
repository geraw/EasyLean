import { goalXml } from './levelXml';

// Unit 9 (see blocks/moves.js): structural induction, as in Rosen (recursive
// definitions and structural induction), Enderton (the induction principle
// for formulas) and Logic and Proof (lists and trees). The move of unit 8,
// "נוכיח באינדוקציה על", opens a part for each way the level's structure is
// built (level.structure, see STRUCTURES): a basis for each way without parts
// of the same kind, and a step, with an induction hypothesis for each such
// part, for each of the others. Lists, then binary trees, then formulas,
// whose ways of being built are written as functions (neg(φ), conj(φ,ψ)) so
// that they are not confused with the statements of the proof itself.

export const unit9WorldName = 'יחידה 9 - אינדוקציה מבנית';

// The moves as the toolbox shows them, before they are placed.
const INDUCTION_BLOCK = '"נוכיח באינדוקציה על ?"';
const UNFOLD_BLOCK = '"לפי הגדרת ? נפתח את המטרה"';
const REWRITE_BLOCK = '"לפי השוויון ? נחליף ..."';
const RFL_BLOCK = '"שני הצדדים שווים לפי ההגדרה."';
const CALC_BLOCK = '"המטרה נובעת לפי חשבון."';
const CLOSE_BLOCK = '"יש לנו ביד בדיוק את מה שאנחנו רוצים להוכיח."';

const structuralInductionInfo = {
    name: 'אינדוקציה מבנית',
    doc: 'כדי להוכיח טענה על כל המבנים מסוג מסוים: לכל דרך לבנות מבנה מוכיחים את הטענה, בהנחה שהיא נכונה לחלקים שהוא בנוי מהם (הנחות האינדוקציה). דרך בלי חלקים מאותו סוג היא בסיס, וכל דרך אחרת היא צעד. אותו בלוק כמו ביחידה 8: שם המבנה הוא המספרים הטבעיים, שבנויים מ־0 ומ־n + 1.',
};
const definition = (symbol, doc) => ({ symbol, doc });
const lists = definition('רשימות', 'רשימה היא [] (הרשימה הריקה), או a :: l: האיבר a לפני הרשימה l. כך [1, 2] היא 1 :: 2 :: [].');
const append = definition('שרשור', '[] ++ m = m, ו־(a :: l) ++ m = a :: (l ++ m).');
const length = definition('length', 'length([]) = 0, ו־length(a :: l) = length(l) + 1.');
const trees = definition('עצים בינאריים', 'עץ הוא leaf (עלה), או node(l,r): צומת ששני הילדים שלו הם העצים l ו־r.');
const leavesAndNodes = definition('leaves ו־nodes', 'leaves(leaf) = 1 ו־leaves(node(l,r)) = leaves(l) + leaves(r); nodes(leaf) = 0 ו־nodes(node(l,r)) = nodes(l) + nodes(r) + 1.');
const height = definition('height', 'height(leaf) = 0, ו־height(node(l,r)) = max(height(l),height(r)) + 1.');
const mirror = definition('mirror', 'mirror(leaf) = leaf, ו־mirror(node(l,r)) = node(mirror(r),mirror(l)).');
const formulas = definition('נוסחאות', 'נוסחה היא atom(i) (הפסוק pᵢ), או neg(φ) (נכתבת ¬φ), או conj(φ,ψ) (נכתבת (φ ∧ ψ), עם סוגריים).');
const parentheses = definition('opening ו־closing', 'מספר הסוגריים "(" ו־")" בנוסחה כתובה: opening(atom(i)) = 0, opening(neg(φ)) = opening(φ), opening(conj(φ,ψ)) = opening(φ) + opening(ψ) + 1, וכך גם closing.');
const atomsAndBinaries = definition('atoms ו־binaries', 'מספר הפסוקים ומספר הקשרים הבינאריים בנוסחה: atoms(atom(i)) = 1, binaries(atom(i)) = 0; ¬ לא משנה אף אחד מהם; קשר בינארי מחבר את שני הצדדים ומוסיף 1 ל־binaries.');
const moreConnectives = definition('קשרים נוספים', 'disj(φ,ψ) נכתבת (φ ∨ ψ), ו־imp(φ,ψ) נכתבת (φ → ψ). atoms ו־binaries מוגדרות עליהן כמו על conj.');

const LISTS = 'variable {α : Type}';

const level = (number, fields) => ({
    id: `unit9-${number}`,
    levelNumber: number,
    totalLevels: 9,
    variableLine: '',
    assumptions: [],
    newTacticsBlocks: [],
    newTacticsInfo: [],
    newDefinitions: [],
    ...fields,
});

export const unit9Levels = [
    level(1, {
        title: 'אינדוקציה על רשימות',
        name: 'unit9_l1_append_nil',
        structure: 'List',
        variableLine: LISTS,
        params: '(l : List α)',
        proposition: 'l ++ [] = l',
        goalLabel: 'l ++ [] = l',
        objects: [{ name: 'l', type: 'רשימה' }],
        toolboxBlocks: ['induction', 'unfold_function', 'rewrite', 'rfl'],
        introduction: `# אינדוקציה על רשימות

ביחידה 8 הוכחתם טענות על כל המספרים הטבעיים. המספרים *בנויים* מ־0 ומ־n + 1, ולכן באינדוקציה יש שני חלקים: בסיס (0) וצעד (מ־n ל־n + 1).
באותה דרך מוכיחים טענות על כל מבנה שבנוי בכמה דרכים מוגדרות. זו *אינדוקציה מבנית*.

*רשימה* בנויה בשתי דרכים: \`[]\`, הרשימה הריקה, או \`a :: l\`, האיבר a לפני הרשימה l. ולכן גם כאן יש שני חלקים:
*בסיס*: הטענה נכונה עבור []. *צעד*: אם היא נכונה עבור l (הנחת האינדוקציה), היא נכונה גם עבור a :: l.

השרשור \`l ++ m\` מוגדר לפי הרשימה הראשונה: \`[] ++ m = m\`, ו־\`(a :: l) ++ m = a :: (l ++ m)\`. נוכיח ש־l ++ [] = l לכל רשימה l.
זה כמו n + 0 = n ו־0 + n = n ביחידה 8: השרשור עם [] *משמאל* נכון לפי ההגדרה, אבל *מימין* דורש אינדוקציה.`,
        newTacticsInfo: [structuralInductionInfo],
        newDefinitions: [lists, append],
        hints: [
            `גררו את הבלוק ${INDUCTION_BLOCK} אל תוך בלוק המטרה, ובחרו בו l. בראש החלקים כתוב: בסיס: נוכיח [] ++ [] = []; צעד: נניח l ++ [] = l ונוכיח (a :: l) ++ [] = a :: l.`,
            `בבסיס: ${RFL_BLOCK}`,
            `בצעד: ${UNFOLD_BLOCK} עם ++. עכשיו המטרה היא a :: (l ++ []) = a :: l. אחר כך ${REWRITE_BLOCK} עם הנחת האינדוקציה l ++ [] = l, "את l ++ [] ב־l", במטרה, ולבסוף ${RFL_BLOCK}`,
        ],
        conclusion: `הוכחתם את הבסיס, ואת הצעד בעזרת הנחת האינדוקציה, ולכן הטענה נכונה לכל רשימה: כל רשימה בנויה מ־[] בצעדים של "איבר לפני רשימה".`,
        startXml: goalXml('l ++ [] = l'),
    }),
    level(2, {
        title: 'האורך של שרשור',
        name: 'unit9_l2_length_append',
        structure: 'List',
        variableLine: LISTS,
        params: '(l m : List α)',
        proposition: 'List.length (l ++ m) = List.length l + List.length m',
        goalLabel: 'length(l ++ m) = length(l) + length(m)',
        objects: [{ name: 'l', type: 'רשימה' }, { name: 'm', type: 'רשימה' }],
        toolboxBlocks: ['induction', 'unfold_function', 'calc'],
        introduction: `# האורך של שרשור

האורך מוגדר גם הוא לפי מבנה הרשימה: \`length([]) = 0\`, ו־\`length(a :: l) = length(l) + 1\`.
נוכיח שהאורך של שרשור הוא סכום האורכים. יש כאן שתי רשימות, אבל האינדוקציה היא על l בלבד, זו שהשרשור מוגדר לפיה; m נשארת כמו שהיא.`,
        newDefinitions: [length],
        hints: [
            'אינדוקציה על l.',
            `בבסיס: ${UNFOLD_BLOCK} עם ++, ואחריו אותו בלוק עם length, ולבסוף ${CALC_BLOCK}`,
            `בצעד: ${UNFOLD_BLOCK} עם ++, ואחר כך פעמיים עם length: פעם בצד שמאל ופעם בצד ימין. החשבון משלים בעזרת הנחת האינדוקציה: ${CALC_BLOCK}`,
        ],
        conclusion: 'length(l ++ m) = length(l) + length(m) לכל שתי רשימות. האינדוקציה הייתה על הרשימה שההגדרות "מפרקות", ו־m נשארה קבועה לאורך כל ההוכחה.',
        startXml: goalXml('length(l ++ m) = length(l) + length(m)'),
    }),
    level(3, {
        title: 'השרשור אסוציאטיבי',
        name: 'unit9_l3_append_assoc',
        structure: 'List',
        variableLine: LISTS,
        params: '(l m k : List α)',
        proposition: 'l ++ (m ++ k) = (l ++ m) ++ k',
        goalLabel: 'l ++ (m ++ k) = (l ++ m) ++ k',
        objects: [{ name: 'l', type: 'רשימה' }, { name: 'm', type: 'רשימה' }, { name: 'k', type: 'רשימה' }],
        toolboxBlocks: ['induction', 'unfold_function', 'rewrite', 'rfl'],
        introduction: `# השרשור אסוציאטיבי

כמו בחיבור, בשרשור לא משנה איך שמים את הסוגריים: l ++ (m ++ k) = (l ++ m) ++ k. שוב האינדוקציה היא על l.
בצעד פותחים את ההגדרה של ++ בכל מקום שבו a :: l עומדת משמאל לשרשור, עד שבשני הצדדים כתוב a :: ..., ואז מחליפים לפי הנחת האינדוקציה.`,
        hints: [
            `אינדוקציה על l. בבסיס: ${RFL_BLOCK}`,
            `בצעד: ${UNFOLD_BLOCK} עם ++, שלוש פעמים. כל פעם נפתח שרשור אחד שמתחיל ב־a :: l.`,
            `עכשיו המטרה היא a :: (l ++ (m ++ k)) = a :: ((l ++ m) ++ k): ${REWRITE_BLOCK} עם הנחת האינדוקציה, "את l ++ (m ++ k) ב־(l ++ m) ++ k", במטרה, ולבסוף ${RFL_BLOCK}`,
        ],
        conclusion: 'השרשור אסוציאטיבי. בצעד פתחתם את ההגדרה שלוש פעמים, ורק אז הנחת האינדוקציה התאימה למה שנשאר להוכיח.',
        startXml: goalXml('l ++ (m ++ k) = (l ++ m) ++ k'),
    }),
    level(4, {
        title: 'עצים: עלים וצמתים',
        name: 'unit9_l4_leaves_nodes',
        structure: 'Tree',
        params: '(t : Tree)',
        proposition: 'leaves t = nodes t + 1',
        goalLabel: 'leaves(t) = nodes(t) + 1',
        objects: [{ name: 't', type: 'עץ' }],
        toolboxBlocks: ['induction', 'unfold_function', 'rfl', 'calc'],
        introduction: `# עצים: עלים וצמתים

*עץ בינארי* בנוי בשתי דרכים: \`leaf\`, עלה, או \`node(l,r)\`, צומת עם שני ילדים, העצים l ו־r.
לכן באינדוקציה על עצים יש בסיס (leaf), וצעד עם *שתי* הנחות אינדוקציה: אם הטענה נכונה עבור l וגם עבור r, היא נכונה עבור node(l,r).

נוכיח שבכל עץ יש עלה אחד יותר מצמתים: leaves(t) = nodes(t) + 1.`,
        newDefinitions: [trees, leavesAndNodes],
        hints: [
            `גררו את הבלוק ${INDUCTION_BLOCK} אל תוך בלוק המטרה, ובחרו בו t. בראש הצעד כתוב: נניח leaves(l) = nodes(l) + 1 ו־leaves(r) = nodes(r) + 1, ונוכיח leaves(node(l,r)) = nodes(node(l,r)) + 1.`,
            `בבסיס: ${RFL_BLOCK}`,
            `בצעד: ${UNFOLD_BLOCK} עם leaves, ואחריו עם nodes. החשבון משלים בעזרת שתי הנחות האינדוקציה: ${CALC_BLOCK}`,
        ],
        conclusion: 'בכל עץ בינארי יש עלה אחד יותר מצמתים. בצעד השתמשתם בשתי הנחות אינדוקציה, אחת לכל ילד.',
        startXml: goalXml('leaves(t) = nodes(t) + 1'),
    }),
    level(5, {
        title: 'הגובה',
        name: 'unit9_l5_height_nodes',
        structure: 'Tree',
        params: '(t : Tree)',
        proposition: 'height t ≤ nodes t',
        goalLabel: 'height(t) ≤ nodes(t)',
        objects: [{ name: 't', type: 'עץ' }],
        toolboxBlocks: ['induction', 'unfold_function', 'calc'],
        introduction: `# הגובה

הגובה של עץ הוא אורך המסלול הארוך ביותר מהשורש לעלה: \`height(leaf) = 0\`, ו־\`height(node(l,r)) = max(height(l),height(r)) + 1\`.
נוכיח שהגובה לא גדול ממספר הצמתים. החשבון יודע מה זה max, אבל לא את ההגדרות של height ו־nodes, ולכן פותחים אותן קודם.`,
        newDefinitions: [height],
        hints: [
            'אינדוקציה על t.',
            `בבסיס: ${UNFOLD_BLOCK} עם height, ואחריו עם nodes, ולבסוף ${CALC_BLOCK}`,
            `בצעד אותו דבר: פתחו את height ואת nodes, והחשבון משלים בעזרת שתי הנחות האינדוקציה.`,
        ],
        conclusion: 'height(t) ≤ nodes(t) לכל עץ. אינדוקציה מוכיחה גם אי־שוויונות, כמו ביחידה 8.',
        startXml: goalXml('height(t) ≤ nodes(t)'),
    }),
    level(6, {
        title: 'מראה של מראה',
        name: 'unit9_l6_mirror_mirror',
        structure: 'Tree',
        params: '(t : Tree)',
        proposition: 'mirror (mirror t) = t',
        goalLabel: 'mirror(mirror(t)) = t',
        objects: [{ name: 't', type: 'עץ' }],
        toolboxBlocks: ['induction', 'unfold_function', 'rewrite', 'rfl'],
        introduction: `# מראה של מראה

\`mirror(t)\` הוא העץ t בהיפוך ימין ושמאל: \`mirror(node(l,r)) = node(mirror(r),mirror(l))\`.
אם הופכים פעמיים, חוזרים לעץ המקורי. כאן אין חשבון: רק הגדרות והחלפות, כל אחת לפי הנחת אינדוקציה אחרת.`,
        newDefinitions: [mirror],
        hints: [
            `אינדוקציה על t. בבסיס: ${RFL_BLOCK}`,
            `בצעד: ${UNFOLD_BLOCK} עם mirror, פעמיים. עכשיו המטרה היא node(mirror(mirror(l)),mirror(mirror(r))) = node(l,r).`,
            `${REWRITE_BLOCK} עם mirror(mirror(l)) = l, ואחריו עם mirror(mirror(r)) = r, ולבסוף ${RFL_BLOCK}`,
        ],
        conclusion: 'mirror(mirror(t)) = t לכל עץ. כל הנחת אינדוקציה החליפה את מה שקרה בילד אחד.',
        startXml: goalXml('mirror(mirror(t)) = t'),
    }),
    level(7, {
        title: 'נוסחאות: סוגריים מאוזנים',
        name: 'unit9_l7_balanced',
        structure: 'Formula',
        params: '(φ : Formula)',
        proposition: 'opening φ = closing φ',
        goalLabel: 'opening(φ) = closing(φ)',
        objects: [{ name: 'φ', type: 'נוסחה' }],
        toolboxBlocks: ['induction', 'unfold_function', 'rfl', 'exact', 'calc'],
        introduction: `# נוסחאות: סוגריים מאוזנים

גם נוסחאות של לוגיקה הן מבנים: נוסחה היא פסוק \`atom(i)\`, או שלילה של נוסחה, \`neg(φ)\` (נכתבת ¬φ), או "וגם" של שתי נוסחאות, \`conj(φ,ψ)\` (נכתבת (φ ∧ ψ), עם סוגריים).
כאן הנוסחאות הן *העצמים* שעליהם מוכיחים, ולכן הן כתובות כפונקציות, כדי שלא יתבלבלו עם הטענות של ההוכחה עצמה.

נוכיח שבכל נוסחה מספר הסוגריים הפותחים שווה למספר הסוגריים הסוגרים. לנוסחאות יש שלוש דרכים להיבנות, ולכן לאינדוקציה שלושה חלקים: בסיס (פסוק), וצעד לכל קשר.`,
        newDefinitions: [formulas, parentheses],
        hints: [
            `גררו את הבלוק ${INDUCTION_BLOCK} אל תוך בלוק המטרה, ובחרו בו φ. יש בו שלושה חלקים: פסוק, ¬ ו־∧.`,
            `בבסיס: ${RFL_BLOCK}`,
            `בצעד של ¬: ${UNFOLD_BLOCK} עם opening, ואחריו עם closing. מה שנשאר הוא בדיוק הנחת האינדוקציה: ${CLOSE_BLOCK}`,
            `בצעד של ∧: פתחו את opening ואת closing, והחשבון משלים: ${CALC_BLOCK}`,
        ],
        conclusion: 'בכל נוסחה הסוגריים מאוזנים. זו הדוגמה הקלסית לאינדוקציה על נוסחאות (Enderton): מוכיחים לפסוקים, ומראים שכל קשר שומר על התכונה.',
        startXml: goalXml('opening(φ) = closing(φ)'),
    }),
    level(8, {
        title: 'פסוקים וקשרים',
        name: 'unit9_l8_atoms_binaries',
        structure: 'Formula',
        params: '(φ : Formula)',
        proposition: 'atoms φ = binaries φ + 1',
        goalLabel: 'atoms(φ) = binaries(φ) + 1',
        objects: [{ name: 'φ', type: 'נוסחה' }],
        toolboxBlocks: ['induction', 'unfold_function', 'rfl', 'exact', 'calc'],
        introduction: `# פסוקים וקשרים

בנוסחה (p₁ ∧ ¬p₂) יש שני פסוקים וקשר בינארי אחד. נוכיח שבכל נוסחה יש פסוק אחד יותר מקשרים בינאריים: atoms(φ) = binaries(φ) + 1.
השלילה לא משנה אף אחד מהמספרים, וקשר בינארי מחבר שני צדדים. ההוכחה דומה לעלים ולצמתים בשלב 4: נוסחה היא מעין עץ.`,
        newDefinitions: [atomsAndBinaries],
        hints: [
            `אינדוקציה על φ. בבסיס: ${RFL_BLOCK}`,
            `בצעד של ¬: פתחו את atoms ואת binaries; מה שנשאר הוא הנחת האינדוקציה: ${CLOSE_BLOCK}`,
            `בצעד של ∧: פתחו את atoms ואת binaries, והחשבון משלים: ${CALC_BLOCK}`,
        ],
        conclusion: 'atoms(φ) = binaries(φ) + 1 לכל נוסחה. Rosen מביא טענות כאלה כדוגמאות לאינדוקציה מבנית על נוסחאות.',
        startXml: goalXml('atoms(φ) = binaries(φ) + 1'),
    }),
    level(9, {
        title: 'שלב בונוס: כל הקשרים',
        name: 'unit9_l9_all_connectives',
        structure: 'Formula5',
        params: '(φ : Formula)',
        proposition: 'atoms φ = binaries φ + 1',
        goalLabel: 'atoms(φ) = binaries(φ) + 1',
        objects: [{ name: 'φ', type: 'נוסחה' }],
        toolboxBlocks: ['induction', 'unfold_function', 'rfl', 'exact', 'calc'],
        introduction: `# בונוס: כל הקשרים

עכשיו לנוסחאות יש גם "או", \`disj(φ,ψ)\`, וגרירה, \`imp(φ,ψ)\`. אותה טענה, אבל לאינדוקציה יש חמישה חלקים: בסיס, וצעד לכל קשר.
החלקים של הקשרים הבינאריים דומים זה לזה: בכל דרך לבנות נוסחה צריך להראות שהטענה נשמרת.`,
        newDefinitions: [moreConnectives],
        hints: [
            `אינדוקציה על φ. בבסיס: ${RFL_BLOCK}`,
            `בצעד של ¬: פתחו את atoms ואת binaries; מה שנשאר הוא הנחת האינדוקציה: ${CLOSE_BLOCK}`,
            `בכל אחד משלושת הצעדים של ∧, ∨ ו־→: פתחו את atoms ואת binaries, והחשבון משלים: ${CALC_BLOCK}`,
        ],
        conclusion: `סיימתם את יחידה 9, כולל שלב הבונוס! באינדוקציה מבנית יש חלק לכל דרך לבנות את המבנה: כשמוסיפים קשר לשפה, מוסיפים צעד להוכחה.`,
        startXml: goalXml('atoms(φ) = binaries(φ) + 1'),
    }),
];
