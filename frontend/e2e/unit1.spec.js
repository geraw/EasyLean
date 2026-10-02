import { test, expect, openWorld, buildProof, selectMove, selectedBlockIds, evaluatedBlockIds, editField, proofStatePanel, settledProofState } from './helpers';

const UNIT1 = 'יחידה 1 - מהנחה למסקנה';
const SOLUTION = [['tactic_intro', { HYPOTHESIS: 'h' }], ['tactic_exact', { TERM: 'h' }]];

test.beforeEach(async ({ page }) => {
    await openWorld(page, UNIT1);
});

test('solving level 1 lets the student continue', async ({ page }) => {
    await buildProof(page, SOLUTION);
    await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
    await expect(page.getByRole('button', { name: 'לשלב הבא' })).toBeVisible();
});

test('a wrong proof is rejected', async ({ page }) => {
    await buildProof(page, [['tactic_intro', { HYPOTHESIS: 'h' }], ['tactic_exact', { TERM: 'nope' }]]);
    await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
    await expect(page.getByText('עדיין לא. בדקו את סדר מהלכי ההוכחה ונסו שוב.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'לשלב הבא' })).toHaveCount(0);
});

test('selecting a move shows the proof state before and after it', async ({ page }) => {
    const [intro, exact] = await buildProof(page, SOLUTION);

    let panel = await selectMove(page, exact);
    await page.getByLabel('לפני המהלך').check();
    await expect(panel).toContainText('h : P');
    await expect(panel).not.toContainText('ההוכחה הושלמה');
    await page.getByLabel('אחרי המהלך').check();
    await expect(panel).toContainText('ההוכחה הושלמה');
    await expect(panel).not.toContainText('עדיין לא הוספנו הנחות');
    await expect(panel).not.toContainText('מה נשאר להוכיח');

    panel = await selectMove(page, intro);
    await page.getByLabel('לפני המהלך').check();
    await expect(panel).toContainText('P : Prop');
    await expect(panel).not.toContainText('h : P');
    await expect(panel).toContainText('(P → P)');
    await page.getByLabel('אחרי המהלך').check();
    await expect(panel).toContainText('h : P');
});

// Regression: clicking the before/after controls used to take focus away from
// Blockly, which drops its selection (and, with it, the move being inspected).
test('switching between before and after keeps the move selected', async ({ page }) => {
    const [intro, exact] = await buildProof(page, SOLUTION);
    const panel = proofStatePanel(page);
    const toggleTimes = async (times) => {
        for (let i = 0; i < times; i++) {
            const label = i % 2 ? 'לפני המהלך' : 'אחרי המהלך';
            // Alternate between clicking the radio and clicking its text.
            if (i % 4 < 2) await page.getByLabel(label).check();
            else await panel.getByText(label).click();
        }
    };

    for (const blockId of [intro, exact, intro]) {
        await selectMove(page, blockId);
        await toggleTimes(4);
        expect(await selectedBlockIds(page)).toEqual([blockId]);
        expect(await evaluatedBlockIds(page)).toEqual([blockId]);
    }
});

test('the evaluated move is marked, separately from Blockly\'s selection', async ({ page }) => {
    const [intro, exact] = await buildProof(page, SOLUTION);
    expect(await evaluatedBlockIds(page)).toEqual([]);

    await selectMove(page, exact);
    expect(await evaluatedBlockIds(page)).toEqual([exact]);

    // Clicking empty workspace drops Blockly's selection but keeps the evaluated move.
    const canvas = await page.locator('svg.blocklySvg').first().boundingBox();
    await page.mouse.click(canvas.x + 150, canvas.y + canvas.height - 150);
    await expect.poll(() => selectedBlockIds(page)).toEqual([]);
    expect(await evaluatedBlockIds(page)).toEqual([exact]);
    expect(intro).toBeTruthy();
});

// Blockly deselects a block while one of its fields is being edited.
test('editing a field evaluates that block', async ({ page }) => {
    const [intro, exact] = await buildProof(page, SOLUTION);
    await selectMove(page, exact);

    await editField(page, intro);
    await expect.poll(() => evaluatedBlockIds(page)).toEqual([intro]);
    await page.getByLabel('לפני המהלך').check();
    const panel = await settledProofState(page);
    await expect(panel).not.toContainText('h : P');
    await expect(panel).toContainText('(P → P)');
    // The editor is still open, and typing keeps the marker in place.
    await expect(page.locator('.blocklyHtmlInput')).toBeFocused();
    await page.keyboard.type('2');
    await page.keyboard.press('Enter');
    expect(await evaluatedBlockIds(page)).toEqual([intro]);
});

test('deleting the evaluated move moves the marker to the block Blockly selects next', async ({ page }) => {
    const [, exact] = await buildProof(page, SOLUTION);
    await selectMove(page, exact);
    await page.keyboard.press('Delete');
    await expect(page.locator(`g.blocklyBlock[data-id="${exact}"]`)).toHaveCount(0);
    await expect.poll(() => evaluatedBlockIds(page)).toEqual(await selectedBlockIds(page));
    expect(await evaluatedBlockIds(page)).not.toContain(exact);
});

test('the proof state panel fits on the screen', async ({ page }) => {
    const [, exact] = await buildProof(page, SOLUTION);
    const box = await (await selectMove(page, exact)).boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize().height);
});
