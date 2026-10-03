import { test, expect, openWorld, buildProof, editField, proofStatePanel } from './helpers';

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
