import { test, expect, openWorld, buildProof, clearProof } from './helpers';
import { UNITS } from './solutions';

// Every documented solution is accepted, built only from the level's toolbox.
for (const { unit, world, levels } of UNITS) {
    levels.forEach((solutions, index) => {
        solutions.forEach(({ label, steps }, variant) => {
            test(`unit ${unit}, level ${index + 1}: ${label} (${variant + 1}/${solutions.length})`, async ({ page }) => {
                await openWorld(page, world);
                await page.getByRole('combobox').selectOption(String(index));
                await clearProof(page);
                await buildProof(page, steps);
                await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
                await expect(page.getByText('הצלחה!').first()).toBeVisible();
            });
        });
    });
}
