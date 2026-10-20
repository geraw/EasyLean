import { describe, expect, it } from 'vitest';
import { checkTable, correctAnswer, differingRows, explainValue, formulaKey, parseFormula, showFormula, statementKind, tableColumns, truthRows, evaluate } from './truthTable';
import { unit1Levels } from './unit1World';

const TWO = ['α', 'β'];

// A table filled in correctly: cells[column][row].
const solvedCells = (level) => Object.fromEntries(tableColumns(level.variables, level.statements).map((column) => [
    column, Object.fromEntries(truthRows(level.variables).map((row, index) => [index, evaluate(parseFormula(column), row)])),
]));

describe('statements', () => {
    it('read ¬ first, then ∧, ∨, →, ↔, and are written as in the lecture', () => {
        expect(formulaKey('¬α→β')).toBe('¬α → β');
        expect(formulaKey('¬(α∧β)')).toBe('¬(α ∧ β)');
        expect(formulaKey('α ∧ ¬β ∨ ¬α ∧ β')).toBe('(α ∧ ¬β) ∨ (¬α ∧ β)');
        expect(formulaKey('¬β -> ¬α')).toBe('¬β → ¬α');
        expect(formulaKey('α → β → α')).toBe('α → (β → α)');
        expect(formulaKey('p ↑ (q ↑ q)')).toBe('p ↑ (q ↑ q)');
        expect(formulaKey('¬¬α')).toBe('¬¬α');
        expect(() => parseFormula('α ∧')).toThrow();
        expect(() => parseFormula('(α ∧ β')).toThrow();
    });

    it('have rows in the course order, T before F, the first statement slowest', () => {
        expect(truthRows(TWO).map((row) => `${row.α}${row.β}`)).toEqual(['truetrue', 'truefalse', 'falsetrue', 'falsefalse']);
    });

    it('have a column for each part, inner ones first, each once', () => {
        expect(tableColumns(TWO, ['¬α → β', 'α ∨ β'])).toEqual(['¬α', '¬α → β', 'α ∨ β']);
        expect(tableColumns(TWO, ['¬¬α', '¬(α ∧ β)', '¬α ∨ ¬β'])).toEqual(['¬α', '¬¬α', 'α ∧ β', '¬(α ∧ β)', '¬β', '¬α ∨ ¬β']);
    });

    it('take their value from the truth table of the main connective', () => {
        const [tt, tf, ft, ff] = truthRows(TWO);
        const column = (text) => [tt, tf, ft, ff].map((row) => evaluate(parseFormula(text), row));
        expect(column('α ∨ β')).toEqual([true, true, true, false]);
        expect(column('α ∧ β')).toEqual([true, false, false, false]);
        expect(column('α → β')).toEqual([true, false, true, true]);
        expect(column('α ↔ β')).toEqual([true, false, false, true]);
        expect(column('α ↑ β')).toEqual([false, true, true, true]);
    });

    it('explain a value by the main connective and the values of its parts', () => {
        const [, tf] = truthRows(TWO);
        expect(explainValue('¬α → β', tf)).toBe('המילה הראשית של ¬α → β היא →, וגרירה שקרית רק כשהתנאי נכון והמסקנה שקרית: רק אז ההבטחה מופרת. כאן ¬α היא F ו־β היא F, ולכן ¬α → β היא T.');
        expect(explainValue('¬(α ∧ β)', tf)).toBe('המילה הראשית של ¬(α ∧ β) היא ¬. כאן α ∧ β היא F, ולכן השלילה שלה, ¬(α ∧ β), היא T.');
    });

    it('are equivalent when their columns are the same, and are classified by their column', () => {
        expect(differingRows(TWO, '¬α → β', 'α ∨ β')).toEqual([]);
        expect(differingRows(TWO, 'α → β', 'β → α')).toEqual([1, 2]);
        expect(statementKind(TWO, 'α ∨ ¬α')).toBe('tautology');
        expect(statementKind(TWO, 'α ∧ ¬α')).toBe('contradiction');
        expect(statementKind(TWO, 'α → β')).toBe('neither');
    });
});

describe('checking a table', () => {
    const level = unit1Levels[3];

    it('marks the wrong cells, and explains the first by its main connective', () => {
        const cells = solvedCells(level);
        cells['¬β → ¬α'][1] = true;
        const result = checkTable(level, cells, []);
        expect(result.ok).toBe(false);
        expect(result.wrong).toEqual([{ column: '¬β → ¬α', row: 1 }]);
        expect(result.message).toContain('בשורה 2 (α=T, β=F), בעמודה ¬β → ¬α');
        expect(result.message).toContain('כאן ¬β היא T ו־¬α היא F, ולכן ¬β → ¬α היא F.');
    });

    it('asks for every cell, then for every answer, and a counterexample when they are not equivalent', () => {
        expect(checkTable(level, {}, []).message).toContain('עוד לא מילאתם');
        const cells = solvedCells(level);
        expect(checkTable(level, cells, []).message).toContain('ענו על שאלה 1');
        const answers = [{ equivalent: true }, { equivalent: true }, { equivalent: true }];
        expect(checkTable(level, cells, answers).message).toContain('יש שורה שבה הערכים שלהן שונים');
        answers[2] = { equivalent: false };
        expect(checkTable(level, cells, answers).message).toContain('בחרו שורה שבה α → β ו־β → α שונות');
        answers[2] = { equivalent: false, row: 0 };
        expect(checkTable(level, cells, answers).message).toContain('בשורה 1 יש ל־α → β ו־β → α אותו ערך');
        answers[2] = { equivalent: false, row: 2 };
        expect(checkTable(level, cells, answers)).toMatchObject({ ok: true });
    });
});

describe.each(unit1Levels.map((level) => [level.id, level]))('level %s', (_, level) => {
    it('is solved by its table and the answers to its questions', () => {
        const answers = level.questions.map((question) => correctAnswer(level.variables, question));
        expect(checkTable(level, solvedCells(level), answers)).toMatchObject({ ok: true });
    });

    it('asks about statements it has columns for, written as the table writes them', () => {
        const columns = new Set([...level.variables, ...tableColumns(level.variables, level.statements)]);
        level.statements.forEach((statement) => expect(formulaKey(statement)).toBe(statement));
        level.questions.flatMap((q) => (q.kind === 'equivalent' ? [q.left, q.right] : [q.formula]))
            .forEach((statement) => expect(columns.has(showFormula(parseFormula(statement))), statement).toBe(true));
    });

    it('is numbered in the unit', () => {
        expect(level.levelNumber).toBe(unit1Levels.indexOf(level) + 1);
        expect(level.totalLevels).toBe(unit1Levels.length);
    });
});
