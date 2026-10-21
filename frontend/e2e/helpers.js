import { test as base, expect } from '@playwright/test';
import { correctAnswer, evaluate, kindName, parseFormula, tableColumns, truthRows } from '../src/game/truthTable';
import { unit1WorldName } from '../src/game/unit1World';

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
// Each step is [blockType, { FIELD: value }, { INPUT: [steps] }]: the optional
// third element fills the parts of a rule that splits the proof. Resolves to
// the new block ids, each move before the moves inside it. Every block must be
// in the level's toolbox, as it is for a student.
export const buildProof = (page, steps) => page.evaluate((steps) => {
    const workspace = window.__easyleanWorkspace;
    const offered = new Set(workspace.getToolbox().getToolboxItems()
        .flatMap((item) => item.getContents?.() || []).map((entry) => entry.type));
    const used = (list) => list.flatMap(([type, , parts = {}]) => [type, ...Object.values(parts).flatMap(used)]);
    const missing = used(steps).filter((type) => !offered.has(type));
    if (missing.length) throw new Error(`Not in this level's toolbox: ${[...new Set(missing)].join(', ')}`);
    const goal = workspace.getTopBlocks(true).find((b) => b.type === 'game_goal');
    const ids = [];
    // A move that opens a structure (no next move: see wrap in blocks/moves.js)
    // holds the rest of the steps, unless its inside is given as a part.
    const build = (connection, steps) => {
        for (const [index, [type, fields = {}, parts = {}]] of steps.entries()) {
            const block = workspace.newBlock(type);
            Object.entries(fields).forEach(([name, value]) => block.setFieldValue(value, name));
            block.initSvg();
            block.render();
            connection.connect(block.previousConnection);
            ids.push(block.id);
            Object.entries(parts).forEach(([input, partSteps]) => build(block.getInput(input).connection, partSteps));
            if (!block.nextConnection && block.getInput('BODY') && !parts.BODY) {
                build(block.getInput('BODY').connection, steps.slice(index + 1));
                return;
            }
            connection = block.nextConnection;
        }
    };
    build(goal.getInput('PROOF').connection, steps);
    return ids;
}, steps);

// Removes every move, leaving the goal block with an empty proof.
export const clearProof = (page) => page.evaluate(() => {
    const workspace = window.__easyleanWorkspace;
    workspace.getTopBlocks(true).find((b) => b.type === 'game_goal').getInputTargetBlock('PROOF')?.dispose(false);
});

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

// Unit 1: a truth-table level, its cells filled in with clicks (one for T,
// two for F), and its questions answered.
export const openTruthTable = async (page, index) => {
    await page.goto('');
    await page.getByRole('button', { name: unit1WorldName }).click();
    await page.getByRole('combobox', { name: 'מעבר ישיר לשלב' }).selectOption(String(index));
    await expect(page.getByRole('table', { name: 'טבלת אמת' })).toBeVisible();
};

export const fillTable = async (page, level) => {
    const rows = truthRows(level.variables);
    for (const column of tableColumns(level.variables, level.statements)) {
        for (const [index, row] of rows.entries()) {
            const cell = page.getByRole('button', { name: `${column}, שורה ${index + 1}`, exact: true });
            await cell.click();
            if (!evaluate(parseFormula(column), row)) await cell.click();
        }
    }
};

export const answerQuestions = async (page, level) => {
    for (const [index, question] of level.questions.entries()) {
        const group = page.getByRole('group', { name: `שאלה ${index + 1}` });
        const answer = correctAnswer(level.variables, question);
        if (question.kind === 'equivalent') {
            await group.getByRole('radio', { name: answer.equivalent ? 'כן, הן שקולות' : 'לא, הן לא שקולות' }).check();
            if (!answer.equivalent) await group.getByRole('combobox').selectOption(String(answer.row));
        } else if (question.kind === 'falseRow') {
            await group.getByRole('combobox').selectOption(String(answer.row));
        } else {
            await group.getByRole('radio', { name: kindName(answer.kind), exact: true }).check();
        }
    }
};
