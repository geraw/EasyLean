import { test, expect, openTruthTable, fillTable, answerQuestions } from './helpers';
import { unit1Levels } from '../src/game/unit1World';

// Unit 1, as a student does it: every cell filled in with clicks (one for T,
// two for F), the questions answered, and the table checked.

unit1Levels.forEach((level, index) => {
    test(`unit 1, level ${index + 1}: the table and the answers`, async ({ page }) => {
        await openTruthTable(page, index);
        await fillTable(page, level);
        await answerQuestions(page, level);
        await page.getByRole('button', { name: 'בדוק טבלה' }).click();
        await expect(page.getByText('הצלחה!')).toBeVisible();
        await expect(page.getByRole('button', { name: index < unit1Levels.length - 1 ? 'לשלב הבא' : 'ליחידה 2' })).toBeEnabled();
    });
});

test('a wrong cell is marked and explained by the main connective', async ({ page }) => {
    await openTruthTable(page, 0);
    // "או" is inclusive: α ∨ β is T in the first row, not F.
    const cell = page.getByRole('button', { name: 'α ∨ β, שורה 1', exact: true });
    await cell.click();
    await cell.click();
    await page.getByRole('button', { name: 'בדוק טבלה' }).click();
    // As a student reads it, without the invisible marks that keep formulas left to right.
    const alert = async () => (await page.getByRole('alert').innerText()).replace(/[\u2066\u2067\u2069]/g, '');
    await expect.poll(alert).toContain('בטבלה תא אחד שגוי, והוא מסומן באדום: בשורה 1 (α=T, β=T), בעמודה α ∨ β.');
    await expect.poll(alert).toContain('"או" שקרית רק כששני הצדדים שקריים ("או" כולל)');
    await expect(cell).toHaveCSS('background-color', 'rgb(253, 226, 225)');
});

test('after the last level, the button leads to the proofs of unit 2', async ({ page }) => {
    await openTruthTable(page, unit1Levels.length - 1);
    const level = unit1Levels.at(-1);
    await fillTable(page, level);
    await answerQuestions(page, level);
    await page.getByRole('button', { name: 'בדוק טבלה' }).click();
    await page.getByRole('button', { name: 'ליחידה 2' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('יחידה 2');
});
