import { test, expect, buildProof, clearProof } from './helpers';
import { HANDWRITTEN_UNITS } from './handwrittenSolutions';

// The handwritten version (handwritten.html): moves read like a written proof,
// and assumptions are chosen by their statement.

const openHandwritten = async (page, worldName, levelIndex = 0) => {
    await page.goto('handwritten.html');
    await page.getByRole('button', { name: worldName }).click();
    await page.waitForSelector('svg.blocklySvg g.game_goal');
    await page.getByRole('combobox').selectOption(String(levelIndex));
};

const UNIT0 = HANDWRITTEN_UNITS[0].world;
const UNIT1 = HANDWRITTEN_UNITS[1].world;

// A move's text and the options of one of its fields, as students read them.
const moveText = (page, blockId) => page.evaluate((id) => {
    const block = window.__easyleanWorkspace.getBlockById(id);
    return [0, 1, 2, 3].map((index) => block.getFieldValue(`PHRASE${index}`)).filter(Boolean).join(' ').replace(/[⁦⁩]/g, '');
}, blockId);
const fieldOptions = (page, blockId, field) => page.evaluate(([id, name]) => window.__easyleanWorkspace.getBlockById(id).getField(name)
    .getOptions(false).map(([label]) => label.replace(/[⁦⁩]/g, '')), [blockId, field]);

for (const { unit, world, levels } of HANDWRITTEN_UNITS) {
    levels.forEach((solutions, index) => {
        solutions.forEach(({ label, steps }, variant) => {
            test(`handwritten unit ${unit}, level ${index + 1}: ${label} (${variant + 1}/${solutions.length})`, async ({ page }) => {
                await openHandwritten(page, world, index);
                await clearProof(page);
                await buildProof(page, steps);
                await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
                await expect(page.getByText('הצלחה!').first()).toBeVisible();
            });
        });
    });
}

test('the planned error of unit 0 is explained by statements', async ({ page }) => {
    await openHandwritten(page, UNIT0, 1);
    const state = page.getByRole('region', { name: 'מצב ההוכחה' });
    await expect(state.getByRole('alert')).toContainText('ההנחה P היא לא מה שצריך להוכיח: צריך להוכיח Q');
});

test('a move offers the assumptions in hand before it, and reads like a written proof', async ({ page }) => {
    await openHandwritten(page, UNIT1, 4);
    const [first, second, third, forward] = await buildProof(page, [['hw_assume'], ['hw_assume'], ['hw_assume'], ['hw_forward']]);
    await expect.poll(() => moveText(page, first)).toBe('כדי להוכיח את הגרירה, נניח (P → Q) ונוכיח ((Q → R) → (P → R))');
    await expect.poll(() => moveText(page, second)).toBe('כדי להוכיח את הגרירה, נניח (Q → R) ונוכיח (P → R)');
    await expect.poll(() => moveText(page, third)).toBe('כדי להוכיח את הגרירה, נניח P ונוכיח R');
    await expect.poll(() => fieldOptions(page, forward, 'RULE')).toEqual(['?', '(P → Q)', '(Q → R)', 'P', '✎ כתיבה ידנית...']);
    await page.evaluate((id) => window.__easyleanWorkspace.getBlockById(id).setFieldValue('P → Q', 'RULE'), forward);
    await expect.poll(() => moveText(page, forward)).toBe('נובע Q');
    const state = page.getByRole('region', { name: 'מצב ההוכחה' });
    await expect(state).toContainText('(P → Q)');
    // Assumptions are listed by statement only, never as "name : statement".
    await expect(state).not.toContainText(' : ');
});

test('a statement can be typed in instead of chosen', async ({ page }) => {
    await openHandwritten(page, UNIT1, 1);
    const [backward] = await buildProof(page, [['hw_apply_rule']]);
    // Choosing the menu's last item opens Blockly's prompt.
    await page.evaluate((id) => window.__easyleanWorkspace.getBlockById(id).getField('RULE').setValue('__write_own__'), backward);
    await page.locator('dialog.blocklyDialog input').fill('P -> Q');
    await page.locator('dialog.blocklyDialog').getByRole('button', { name: 'OK' }).click();
    await expect.poll(() => page.evaluate((id) => window.__easyleanWorkspace.getBlockById(id).getFieldValue('RULE'), backward)).toBe('P → Q');
    await expect.poll(() => moveText(page, backward)).toBe('כדי להוכיח Q די להוכיח P');
});
