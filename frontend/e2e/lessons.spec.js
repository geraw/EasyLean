import { test, expect } from './helpers';

// The course is in lessons, one for each lecture, and each lesson has an
// address that can be shared: …/#lesson2 opens the second lesson, and
// …/#unit9 a unit of it.

const LESSON1 = 'שיעור 1: קשרים, כמתים ומבני הוכחה';
const LESSON2 = 'שיעור 2: קבוצות';
const unitTab = (page, name) => page.getByRole('button', { name: new RegExp(`^${name}`) });

test('a lesson shows only its own units, and its address names it', async ({ page }) => {
    await page.goto('');
    await expect(page.getByRole('button', { name: LESSON1 })).toBeVisible();
    await expect(unitTab(page, 'יחידה 1 ')).toBeVisible();
    await expect(unitTab(page, 'יחידה 8 ')).toHaveCount(0);
    await expect(page).toHaveURL(/#lesson1$/);

    await page.getByRole('button', { name: LESSON2 }).click();
    await expect(page).toHaveURL(/#lesson2$/);
    await expect(unitTab(page, 'יחידה 8 ')).toBeVisible();
    await expect(unitTab(page, 'יחידה 1 ')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('יחידה 8');
});

test('the address of a lesson opens it, and of a unit, that unit', async ({ page }) => {
    await page.goto('#lesson2');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('יחידה 8');

    await page.goto('#unit9');
    // Blockly fetches its sounds as a workspace opens; in WebKit, a reload
    // that cancels them leaves Blockly an unhandled "Load failed".
    await page.waitForLoadState('networkidle');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('יחידה 9');

    // Following a link to another lesson, from an open page, opens it.
    await page.goto('#lesson1');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('יחידה 1');
});
