import { test, expect, buildProof, clearProof, openWorld, openTruthTable, fillTable, answerQuestions } from './helpers';
import { unitSolutions } from './solutions';
import { unit1Levels } from '../src/game/unit1World';

// A solved level is celebrated in the middle of the screen, with the way on.

const UNIT2 = unitSolutions(2);

const solveFirstProof = async (page) => {
    await openWorld(page, UNIT2.world);
    await clearProof(page);
    await buildProof(page, UNIT2.levels[0][0].steps);
    await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
};

test('a correct proof is celebrated, and closing the celebration leaves the way on', async ({ page }) => {
    await solveFirstProof(page);
    const celebration = page.getByRole('dialog', { name: 'הצלחה' });
    await expect(celebration).toBeVisible({ timeout: 20000 });
    await expect(celebration).toContainText('ההוכחה נכונה');
    await celebration.getByRole('button', { name: 'להישאר בשלב הזה' }).click();
    await expect(celebration).toBeHidden();
    await page.getByRole('button', { name: 'לשלב הבא' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(`שלב 2/${UNIT2.levels.length}`);
});

test('the celebration leads to the next level', async ({ page }) => {
    await solveFirstProof(page);
    await page.getByRole('dialog', { name: 'הצלחה' }).getByRole('button', { name: 'לשלב הבא' }).click();
    await expect(page.getByRole('dialog', { name: 'הצלחה' })).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(`שלב 2/${UNIT2.levels.length}`);
});

test('a filled-in truth table is celebrated too', async ({ page }) => {
    await openTruthTable(page, 0);
    await fillTable(page, unit1Levels[0]);
    await answerQuestions(page, unit1Levels[0]);
    await page.getByRole('button', { name: 'בדוק טבלה' }).click();
    await expect(page.getByRole('dialog', { name: 'הצלחה' })).toContainText('הטבלה והתשובות נכונות');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'הצלחה' })).toBeHidden();
    await expect(page.getByText('הצלחה!')).toBeVisible();
});
