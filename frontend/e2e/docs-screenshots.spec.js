import fs from 'node:fs';
import path from 'node:path';
import { test, expect, openWorld, buildProof, clearProof } from './helpers';
import { UNITS } from './solutions';

// Photographs every solution in solutions.js for the curriculum documents:
// docs/curriculum/images/unit<U>-level<L>-<a|b|…>.png. Only runs on request:
//   npm run docs:screenshots
const OUT = path.resolve(import.meta.dirname, '../../docs/curriculum/images');

test.skip(!process.env.DOCS_SCREENSHOTS, 'run with: npm run docs:screenshots');
test.use({ viewport: { width: 2400, height: 2600 }, deviceScaleFactor: 1.5 });

for (const { unit, world, levels } of UNITS) {
    levels.forEach((solutions, index) => {
        solutions.forEach(({ steps }, variant) => {
            const file = `unit${unit}-level${index + 1}-${'abcdefgh'[variant]}.png`;
            test(file, async ({ page }) => {
                await openWorld(page, world);
                await page.getByRole('combobox').selectOption(String(index));
                await clearProof(page);
                await buildProof(page, steps);
                await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
                await expect(page.getByText('הצלחה!').first()).toBeVisible();
                // The goal block with the whole proof inside it, nothing selected.
                const goalId = await page.evaluate(() => {
                    window.__easyleanWorkspace.getAllBlocks(false).forEach((b) => b.unselect?.());
                    return window.__easyleanWorkspace.getTopBlocks(true).find((b) => b.type === 'game_goal').id;
                });
                await page.mouse.move(0, 0);
                const box = await page.locator(`g.blocklyBlock[data-id="${goalId}"]`).boundingBox();
                const pad = 12;
                fs.mkdirSync(OUT, { recursive: true });
                await page.screenshot({
                    path: path.join(OUT, file),
                    clip: { x: box.x - pad, y: box.y - pad, width: box.width + 2 * pad, height: box.height + 2 * pad },
                });
            });
        });
    });
}
