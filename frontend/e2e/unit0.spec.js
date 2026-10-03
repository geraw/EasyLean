import { test, expect, openWorld, buildProof, editField, proofStatePanel, settledProofState } from './helpers';

const UNIT0 = 'יחידה 0 - היכרות עם הסביבה';

test.beforeEach(async ({ page }) => {
    await openWorld(page, UNIT0);
});

test('level 1: closing the goal with the given assumption', async ({ page }) => {
    await buildProof(page, [['tactic_exact', { TERM: 'h' }]]);
    await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
    await expect(page.getByRole('button', { name: 'לשלב הבא' })).toBeVisible();
});

test('level 2 starts with an explained mistake, and fixing it solves the level', async ({ page }) => {
    await page.getByRole('combobox').selectOption('1');
    await expect(proofStatePanel(page).getByRole('alert')).toContainText('h אומרת P, אבל המטרה היא Q.');

    const [startBlockId] = await page.evaluate(() => window.__easyleanWorkspace.getAllBlocks(false)
        .filter((b) => b.type === 'tactic_exact').map((b) => b.id));
    await editField(page, startBlockId);
    await page.keyboard.press('End');
    await page.keyboard.type('2');
    await page.keyboard.press('Enter');
    await expect(proofStatePanel(page).getByRole('alert')).toHaveCount(0);

    await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
    await page.getByRole('button', { name: 'ליחידה 1' }).click();
    await expect(page.getByRole('heading', { name: /יחידה 1 - מהנחה למסקנה — שלב 1\/5/ })).toBeVisible();
});

test('a field left as ? gets a gentle prompt, and the state before the move', async ({ page }) => {
    const [move] = await buildProof(page, [['tactic_exact']]);
    const panel = await settledProofState(page);
    await expect(panel.getByRole('status')).toContainText('בבלוק הזה יש שדה מסומן ?');
    await expect(panel).toContainText('h : P');
    await expect(panel.getByRole('alert')).toHaveCount(0);
    // A field to fill in is not a mistake: the block keeps its colour.
    const colour = () => page.evaluate((id) => window.__easyleanWorkspace.getBlockById(id).getColour(), move);
    expect(await colour()).not.toBe('#d93025');

    await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
    await expect(page.getByRole('button', { name: 'לשלב הבא' })).toHaveCount(0);

    await editField(page, move);
    await page.keyboard.press('Backspace');
    await page.keyboard.type('h');
    await page.keyboard.press('Enter');
    await expect(proofStatePanel(page).getByRole('status')).toHaveCount(0);
    await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
    await expect(page.getByRole('button', { name: 'לשלב הבא' })).toBeVisible();
});
