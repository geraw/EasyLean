import { test, expect, buildProof, clearProof, openWorld, openTruthTable } from './helpers';
import { unitSolutions } from './solutions';
import { unit1Levels } from '../src/game/unit1World';

// The feedback button sends, with the student's remarks and images, where
// they are and the state of their work.

const UNIT2 = unitSolutions(2);
// The smallest PNG: one transparent pixel.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

test('feedback sends the remarks, images and contact details, with the place and the proof state', async ({ page }) => {
    let sent = null;
    await page.route('**/feedback', async (route) => {
        sent = route.request().postDataJSON();
        await route.fulfill({ json: { id: 'test' } });
    });
    await openWorld(page, UNIT2.world);
    await page.getByRole('combobox').selectOption('1');
    await clearProof(page);
    await buildProof(page, UNIT2.levels[1][0].steps.slice(0, 1));

    await page.getByRole('button', { name: 'משוב' }).click();
    const dialog = page.getByRole('dialog', { name: 'משוב' });
    await expect(dialog).toContainText(`${UNIT2.world}, שלב 2/${UNIT2.levels.length}`);
    await expect(dialog.getByRole('button', { name: 'שליחה' })).toBeDisabled();
    await dialog.getByRole('textbox', { name: 'ההערות שלך' }).fill('לא הבנתי את הרמז');
    await dialog.locator('input[type=file]').setInputFiles({ name: 'mine.png', mimeType: 'image/png', buffer: PNG });
    await expect(dialog.getByRole('img', { name: 'תמונה 1' })).toBeVisible();
    await dialog.getByRole('textbox', { name: 'מייל' }).fill('student@example.com');
    await dialog.getByRole('button', { name: 'שליחה' }).click();
    await expect(dialog).toContainText('תודה! המשוב נשלח.');

    expect(sent.comment).toBe('לא הבנתי את הרמז');
    expect(sent.contact).toEqual({ name: '', email: 'student@example.com', phone: '' });
    expect(sent.images).toHaveLength(1);
    expect(sent.images[0].dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(sent.screenshot).toMatch(/^data:image\/jpeg;base64,/);
    expect(sent.context).toMatchObject({ kind: 'proof', unit: { mode: 'unit2' }, level: { number: 2 } });
    expect(sent.context.proof).toContain('נניח');
    expect(sent.context.blocksXml).toContain('game_goal');
    expect(sent.context.proofState.before.goals.length).toBeGreaterThan(0);
});

test('feedback from a truth table sends the table as filled in', async ({ page }) => {
    let sent = null;
    await page.route('**/feedback', async (route) => {
        sent = route.request().postDataJSON();
        await route.fulfill({ json: { id: 'test' } });
    });
    await openTruthTable(page, 0);
    await page.getByRole('button', { name: 'משוב' }).click();
    const dialog = page.getByRole('dialog', { name: 'משוב' });
    // The screenshot can be left out.
    await dialog.getByRole('checkbox').uncheck();
    await dialog.getByRole('textbox', { name: 'ההערות שלך' }).fill('הטבלה נוחה');
    await dialog.getByRole('button', { name: 'שליחה' }).click();
    await expect(dialog).toContainText('תודה! המשוב נשלח.');
    expect(sent.screenshot).toBeNull();
    expect(sent.context).toMatchObject({ kind: 'truthTable', level: { number: 1 } });
    expect(sent.context.table).toHaveLength(2 ** unit1Levels[0].variables.length);
});

test('when feedback cannot be sent, what was written stays, to try again', async ({ page }) => {
    await page.route('**/feedback', (route) => route.fulfill({ status: 500, json: {} }));
    await openTruthTable(page, 0);
    await page.getByRole('button', { name: 'משוב' }).click();
    const dialog = page.getByRole('dialog', { name: 'משוב' });
    await dialog.getByRole('textbox', { name: 'ההערות שלך' }).fill('משהו');
    await dialog.getByRole('button', { name: 'שליחה' }).click();
    await expect(dialog.getByRole('alert')).toContainText('לא הצלחנו לשלוח');
    await expect(dialog.getByRole('textbox', { name: 'ההערות שלך' })).toHaveValue('משהו');
});
