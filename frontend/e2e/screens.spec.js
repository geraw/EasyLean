import { test, expect, swipe } from './helpers';
import { unit1Levels, unit1WorldName } from '../src/game/unit1World';
import { unit2Levels, unit2WorldName } from '../src/game/unit2World';
import { unit3Levels, unit3WorldName } from '../src/game/unit3World';
import { unit4Levels, unit4WorldName } from '../src/game/unit4World';
import { unit5Levels, unit5WorldName } from '../src/game/unit5World';
import { unit6Levels, unit6WorldName } from '../src/game/unit6World';
import { unit7Levels, unit7WorldName } from '../src/game/unit7World';

// Every level fits the screen of each project (a laptop, and an iPad upright
// and on its side): what a student needs is on it, or can be scrolled to with
// a finger. A student on an iPad could not reach the check button, nor scroll
// the toolbox.

const PROOF_UNITS = [
    [unit2WorldName, unit2Levels], [unit3WorldName, unit3Levels], [unit4WorldName, unit4Levels],
    [unit5WorldName, unit5Levels], [unit6WorldName, unit6Levels], [unit7WorldName, unit7Levels],
];

const openUnit = async (page, worldName) => {
    await page.goto('');
    await page.getByRole('button', { name: worldName }).click();
};

const goToLevel = (page, index) => page.getByRole('combobox', { name: 'מעבר ישיר לשלב' }).selectOption(String(index));

test(`every level of ${unit1WorldName} shows its check button`, async ({ page }) => {
    await openUnit(page, unit1WorldName);
    for (const index of unit1Levels.keys()) {
        await goToLevel(page, index);
        await expect(page.getByRole('button', { name: 'בדוק טבלה' }), `level ${index + 1}`).toBeInViewport({ ratio: 1 });
    }
});

for (const [worldName, levels] of PROOF_UNITS) {
    test(`every level of ${worldName} shows its check button and proof state`, async ({ page }) => {
        await openUnit(page, worldName);
        await page.waitForSelector('svg.blocklySvg g.game_goal');
        for (const index of levels.keys()) {
            await goToLevel(page, index);
            await expect(page.getByRole('button', { name: 'בדוק הוכחה' }), `level ${index + 1}`).toBeInViewport({ ratio: 1 });
            await expect(page.getByRole('region', { name: 'מצב ההוכחה' }), `level ${index + 1}`).toBeInViewport({ ratio: 1 });
        }
    });
}

// The open toolbox: whether it is longer than its height, how far it is
// scrolled, its middle, and where to put a finger on the first block that
// shows whole in it (at the block's right edge, as the toolbox is RTL).
const toolbox = (page) => page.evaluate(() => {
    const flyout = window.__easyleanWorkspace.getToolbox().getFlyout();
    const area = flyout.getWorkspace().getParentSvg().getBoundingClientRect();
    const block = flyout.getWorkspace().getTopBlocks(true)
        .map((b) => ({ type: b.type, rect: b.getSvgRoot().getBoundingClientRect() }))
        .find(({ rect }) => rect.top >= area.top && rect.bottom <= area.bottom);
    return {
        scrollable: flyout.isVisible() && flyout.isScrollable(),
        scrollY: flyout.getWorkspace().scrollY,
        middle: (area.top + area.bottom) / 2,
        type: block.type,
        x: block.rect.right - 20,
        y: block.rect.top + 15,
    };
});

// The toolbox once the screen has settled: the proof state panel below the
// workspace grows when Lean answers, and the toolbox's height with it.
const settledToolbox = async (page) => {
    let last = await toolbox(page);
    for (let tries = 0; tries < 20; tries += 1) {
        await page.waitForTimeout(300);
        const now = await toolbox(page);
        if (now.middle === last.middle) return now;
        last = now;
    }
    return last;
};

const blockTypes = (page) => page.evaluate(() => window.__easyleanWorkspace.getAllBlocks(false).map((b) => b.type));

test('on a touch screen, a swipe scrolls a long toolbox and a sideways drag takes a block out', async ({ page }) => {
    test.skip(!test.info().project.use.hasTouch, 'a touch screen only');
    // The first level whose toolbox is longer than the screen.
    let found = null;
    for (const [worldName, levels] of PROOF_UNITS) {
        await openUnit(page, worldName);
        await page.waitForSelector('svg.blocklySvg g.game_goal');
        for (const index of levels.keys()) {
            await goToLevel(page, index);
            await page.locator('.blocklyToolboxCategory').first().tap();
            if ((await settledToolbox(page)).scrollable) { found = `${worldName}, level ${index + 1}`; break; }
        }
        if (found) break;
    }
    expect(found, 'a level whose toolbox needs scrolling').not.toBeNull();

    const before = await toolbox(page);
    const blocks = await blockTypes(page);
    await swipe(page, before.x, before.middle + 60, 0, -120);
    const after = await toolbox(page);
    expect(after.scrollY, found).not.toBe(before.scrollY);
    expect(after.scrollable, 'the toolbox stays open').toBe(true);
    expect(await blockTypes(page)).toEqual(blocks);

    // The toolbox is on the left, and the proof on its right: the block under
    // the finger, where the toolbox was scrolled to, comes out.
    await swipe(page, after.x, after.y, 200, 30);
    expect(await blockTypes(page)).toEqual([...blocks, after.type]);
});
