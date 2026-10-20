// Truth tables (unit 1): formulas over atomic statements (α, β, p, q, ...)
// with ¬ ∧ ∨ → ↔ and ↑ (NAND), their values in every assignment, and the
// explanation of a value by the main connective, as in the course: the value
// of a statement is set by its main connective and the values of its parts.
// Checked here, without Lean: a truth table is a computation, not a proof.

// Binding strength, for reading a statement typed in a level: ¬ first, then
// ∧ (and ↑), ∨, →, ↔.
const BINARY = { '∧': 4, '↑': 4, '∨': 3, '→': 2, '↔': 1 };
const RIGHT_ASSOCIATIVE = new Set(['→']);

const tokenize = (text) => {
    const tokens = [];
    for (const char of text.replace(/->/g, '→').replace(/<->/g, '↔')) {
        if (/\s/.test(char)) continue;
        if ('()¬'.includes(char) || char in BINARY) tokens.push(char);
        else if (/\p{L}/u.test(char)) tokens.push(char);
        else throw new Error(`unexpected "${char}" in ${text}`);
    }
    return tokens;
};

export const parseFormula = (text) => {
    const tokens = tokenize(text);
    let position = 0;
    const peek = () => tokens[position];
    const take = (expected) => {
        const token = tokens[position];
        if (expected && token !== expected) throw new Error(`expected "${expected}" in ${text}`);
        position += 1;
        return token;
    };
    const atom = () => {
        const token = take();
        if (token === '¬') return { op: '¬', arg: atom() };
        if (token === '(') {
            const inner = binary(0);
            take(')');
            return inner;
        }
        if (token && /\p{L}/u.test(token)) return { op: 'var', name: token };
        throw new Error(`unexpected end of ${text}`);
    };
    const binary = (minimum) => {
        let left = atom();
        while (peek() in BINARY && BINARY[peek()] >= minimum) {
            const op = take();
            const right = binary(RIGHT_ASSOCIATIVE.has(op) ? BINARY[op] : BINARY[op] + 1);
            left = { op, left, right };
        }
        return left;
    };
    const formula = binary(0);
    if (position !== tokens.length) throw new Error(`unexpected "${peek()}" in ${text}`);
    return formula;
};

// Written like the lecture: ¬α → β, ¬(α ∧ β), (α ∧ ¬β) ∨ (¬α ∧ β). A negation
// binds to what follows it; a part with a connective of two sides is always
// in parentheses, so no one needs to know which connective binds first.
export const showFormula = (formula) => {
    if (formula.op === 'var') return formula.name;
    const part = (inner) => (inner.op === 'var' || inner.op === '¬' ? showFormula(inner) : `(${showFormula(inner)})`);
    if (formula.op === '¬') return `¬${part(formula.arg)}`;
    return `${part(formula.left)} ${formula.op} ${part(formula.right)}`;
};

export const formulaKey = (text) => showFormula(parseFormula(text));

export const evaluate = (formula, row) => {
    switch (formula.op) {
        case 'var': return row[formula.name];
        case '¬': return !evaluate(formula.arg, row);
        case '∧': return evaluate(formula.left, row) && evaluate(formula.right, row);
        case '↑': return !(evaluate(formula.left, row) && evaluate(formula.right, row));
        case '∨': return evaluate(formula.left, row) || evaluate(formula.right, row);
        case '→': return !evaluate(formula.left, row) || evaluate(formula.right, row);
        case '↔': return evaluate(formula.left, row) === evaluate(formula.right, row);
        default: throw new Error(`unknown connective ${formula.op}`);
    }
};

// The rows, in the course's order: T before F, the first statement slowest.
export const truthRows = (variables) => variables.reduceRight(
    (rows, name) => [true, false].flatMap((value) => rows.map((row) => ({ [name]: value, ...row }))),
    [{}],
);

export const tf = (value) => (value ? 'T' : 'F');
export const showRow = (variables, row) => variables.map((name) => `${name}=${tf(row[name])}`).join(', ');

// The columns of a table for the given statements: their parts, inner ones
// first (the atomic statements, which open the table, aside), each once.
export const tableColumns = (variables, statements) => {
    const columns = [];
    const add = (formula) => {
        if (formula.op === 'var') return;
        if (formula.op === '¬') add(formula.arg);
        else { add(formula.left); add(formula.right); }
        const text = showFormula(formula);
        if (!columns.includes(text)) columns.push(text);
    };
    statements.forEach((statement) => add(parseFormula(statement)));
    return columns.filter((column) => !variables.includes(column));
};

// Why a statement has its value in a row, by its main connective.
export const explainValue = (text, row) => {
    const formula = parseFormula(text);
    const value = tf(evaluate(formula, row));
    const shown = showFormula(formula);
    if (formula.op === 'var') return `ב${shown} השורה קובעת את הערך: ${value}.`;
    if (formula.op === '¬') {
        const arg = showFormula(formula.arg);
        return `המילה הראשית של ${shown} היא ¬. כאן ${arg} היא ${tf(evaluate(formula.arg, row))}, ולכן השלילה שלה, ${shown}, היא ${value}.`;
    }
    const left = showFormula(formula.left);
    const right = showFormula(formula.right);
    const values = `כאן ${left} היא ${tf(evaluate(formula.left, row))} ו־${right} היא ${tf(evaluate(formula.right, row))}`;
    const rule = {
        '∧': '"וגם" נכונה רק כששני הצדדים נכונים',
        '∨': '"או" שקרית רק כששני הצדדים שקריים ("או" כולל)',
        '→': 'גרירה שקרית רק כשהתנאי נכון והמסקנה שקרית: רק אז ההבטחה מופרת',
        '↔': '"אם ורק אם" נכונה בדיוק כששני הצדדים שווים בערך האמת שלהם',
        '↑': 'NAND היא השלילה של "וגם": היא שקרית רק כששני הצדדים נכונים',
    }[formula.op];
    return `המילה הראשית של ${shown} היא ${formula.op}, ו${rule}. ${values}, ולכן ${shown} היא ${value}.`;
};

// Two statements are logically equivalent when their columns are the same.
export const differingRows = (variables, first, second) => {
    const [a, b] = [parseFormula(first), parseFormula(second)];
    return truthRows(variables).map((row, index) => [row, index]).filter(([row]) => evaluate(a, row) !== evaluate(b, row)).map(([, index]) => index);
};

// 'tautology' (T in every row), 'contradiction' (F in every row), or 'neither'.
export const statementKind = (variables, text) => {
    const formula = parseFormula(text);
    const values = truthRows(variables).map((row) => evaluate(formula, row));
    if (values.every(Boolean)) return 'tautology';
    if (!values.some(Boolean)) return 'contradiction';
    return 'neither';
};

// The answer to a question of a level, as checkTable expects it.
export const correctAnswer = (variables, question) => {
    if (question.kind === 'equivalent') {
        const rows = differingRows(variables, question.left, question.right);
        return rows.length === 0 ? { equivalent: true } : { equivalent: false, row: rows[0] };
    }
    if (question.kind === 'falseRow') {
        const formula = parseFormula(question.formula);
        return { row: truthRows(variables).findIndex((row) => !evaluate(formula, row)) };
    }
    return { kind: statementKind(variables, question.formula) };
};

const KIND_NAMES = { tautology: 'טאוטולוגיה', contradiction: 'סתירה', neither: 'לא טאוטולוגיה ולא סתירה' };
export const kindName = (kind) => KIND_NAMES[kind];

// Checks a filled table (cells[column][row]: true, false or undefined) and the
// answers to the level's questions. Gives the wrong cells, and one message:
// what to fix first, in terms of the statements.
export const checkTable = (level, cells, answers) => {
    const rows = truthRows(level.variables);
    const columns = tableColumns(level.variables, level.statements);
    const wrong = [];
    let empty = 0;
    columns.forEach((column) => {
        const formula = parseFormula(column);
        rows.forEach((row, index) => {
            const cell = cells[column]?.[index];
            if (cell === undefined) empty += 1;
            else if (cell !== evaluate(formula, row)) wrong.push({ column, row: index });
        });
    });
    if (wrong.length > 0) {
        const [first] = wrong;
        const where = `בשורה ${first.row + 1} (${showRow(level.variables, rows[first.row])})`;
        const count = wrong.length === 1 ? 'בטבלה תא אחד שגוי, והוא מסומן באדום:' : `בטבלה ${wrong.length} תאים שגויים, והם מסומנים באדום. הראשון:`;
        return { ok: false, wrong, message: `${count} ${where}, בעמודה ${first.column}. ${explainValue(first.column, rows[first.row])}` };
    }
    if (empty > 0) return { ok: false, wrong, message: 'עוד לא מילאתם את כל הטבלה: בכל תא בוחרים T או F.' };
    for (const [index, question] of (level.questions || []).entries()) {
        const answer = answers[index] || {};
        const correct = correctAnswer(level.variables, question);
        const number = (level.questions.length > 1) ? ` ${index + 1}` : '';
        if (question.kind === 'equivalent') {
            const pair = `${formulaKey(question.left)} ו־${formulaKey(question.right)}`;
            if (answer.equivalent === undefined) return { ok: false, wrong, message: `ענו על שאלה${number}: האם ${pair} שקולות?` };
            if (answer.equivalent !== correct.equivalent) {
                return { ok: false, wrong, message: correct.equivalent
                    ? `השוו שוב את העמודות של ${pair}: שתי טענות שקולות כשיש להן אותו ערך בכל שורה.`
                    : `השוו שוב את העמודות של ${pair}: יש שורה שבה הערכים שלהן שונים.` };
            }
            if (!correct.equivalent) {
                if (answer.row === undefined) return { ok: false, wrong, message: `בשאלה${number}: בחרו שורה שבה ${pair} שונות. זו דוגמה נגדית לשקילות.` };
                if (!differingRows(level.variables, question.left, question.right).includes(answer.row)) {
                    return { ok: false, wrong, message: `בשאלה${number}: בשורה ${answer.row + 1} יש ל־${pair} אותו ערך. בחרו שורה שבה הערכים שלהן שונים.` };
                }
            }
        } else if (question.kind === 'falseRow') {
            const formula = formulaKey(question.formula);
            if (answer.row === undefined) return { ok: false, wrong, message: `ענו על שאלה${number}: באיזו שורה ${formula} שקרית?` };
            if (answer.row !== correct.row) return { ok: false, wrong, message: `בשאלה${number}: בשורה ${answer.row + 1} הטענה ${formula} נכונה. חפשו בעמודה שלה את השורה שבה היא F.` };
        } else {
            const formula = formulaKey(question.formula);
            if (answer.kind === undefined) return { ok: false, wrong, message: `ענו על שאלה${number}: מה ${formula}?` };
            if (answer.kind !== correct.kind) {
                return { ok: false, wrong, message: `בשאלה${number}: הסתכלו שוב בעמודה של ${formula}. טאוטולוגיה היא T בכל השורות, וסתירה היא F בכל השורות.` };
            }
        }
    }
    return { ok: true, wrong, message: '' };
};
