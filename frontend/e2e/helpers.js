import { test as base, expect } from '@playwright/test';

const MAIN_CANVAS = 'svg.blocklySvg > g.blocklyWorkspace > g.blocklyBlockCanvas';

// Fails any test during which the page threw an uncaught error.
export const test = base.extend({
    page: async ({ page }, use) => {
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await use(page);
        expect(errors, 'uncaught page errors').toEqual([]);
    },
});

export { expect };

export const openWorld = async (page, worldName) => {
    await page.goto('');
    await page.getByRole('button', { name: worldName }).click();
    await page.waitForSelector(`${MAIN_CANVAS} > g.game_goal`);
};

// Appends moves to the goal's proof through the dev-only workspace hook.
// Each step is [blockType, { FIELD: value }]; resolves to the new block ids.
export const buildProof = (page, steps) => page.evaluate((steps) => {
    const workspace = window.__easyleanWorkspace;
    const goal = workspace.getTopBlocks(true).find((b) => b.type === 'game_goal');
    let connection = goal.getInput('PROOF').connection;
    return steps.map(([type, fields = {}]) => {
        const block = workspace.newBlock(type);
        Object.entries(fields).forEach(([name, value]) => block.setFieldValue(value, name));
        block.initSvg();
        block.render();
        connection.connect(block.previousConnection);
        connection = block.nextConnection;
        return block.id;
    });
}, steps);

// Clicks a block like a user would: on its own top row (the right edge, as the
// workspace is RTL). A locator click waits for the block to stop moving, which
// matters because the workspace resizes whenever the proof state panel does.
export const clickBlock = async (page, blockId) => {
    const path = page.locator(`${MAIN_CANVAS} g.blocklyBlock[data-id="${blockId}"] > path.blocklyPath`);
    const box = await path.boundingBox();
    await path.click({ position: { x: box.width - 8, y: 8 } });
};

export const selectedBlockIds = (page) => page.evaluate((canvas) =>
    [...document.querySelectorAll(`${canvas} g.blocklySelected`)].map((g) => g.getAttribute('data-id')), MAIN_CANVAS);

// Blocks carrying our own "evaluated move" marker (independent of Blockly's selection).
export const evaluatedBlockIds = (page) => page.evaluate((canvas) =>
    [...document.querySelectorAll(`${canvas} g.easyleanEvaluated`)].map((g) => g.getAttribute('data-id')), MAIN_CANVAS);

// Opens the inline editor of a block's first editable field.
export const editField = async (page, blockId) => {
    await page.locator(`${MAIN_CANVAS} g.blocklyBlock[data-id="${blockId}"] > g.blocklyEditableField`).first().click();
    await expect(page.locator('.blocklyHtmlInput')).toBeFocused();
};

export const proofStatePanel = (page) => page.getByRole('region', { name: 'מצב ההוכחה' });

const LOADING = 'Lean בודק';

// Waits for the backend round-trip, then returns the panel for assertions.
export const settledProofState = async (page) => {
    const panel = proofStatePanel(page);
    await expect(panel).not.toContainText(LOADING);
    return panel;
};

// Selects a different move and waits for its proof state to arrive (the
// request is debounced, so the panel would otherwise still show the old move).
export const selectMove = async (page, blockId) => {
    await clickBlock(page, blockId);
    await expect(proofStatePanel(page)).toContainText(LOADING);
    return settledProofState(page);
};
