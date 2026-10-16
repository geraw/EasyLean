import { test, expect } from './helpers';

// A student's walk through unit 3 of the handwritten version, as its hints
// describe each level: blocks dragged from the toolbox with the mouse, and
// fields chosen only among the options their menu shows. (The solutions in
// handwritten.spec.js are built directly, which does not catch a hint that
// cannot be followed.) SHOTS=<dir> saves a screenshot of each level; WHERE=1
// logs where each block attached.
const SHOTS = process.env.SHOTS;
const WORLD = 'יחידה 3 - שלילה והוכחה בשלילה';

// A block's text as shown, row by row.
const phrase = (page, id) => page.evaluate((id) => window.__easyleanWorkspace.getBlockById(id).inputList
    .map((input) => input.fieldRow.filter((f) => f.isVisible()).map((f) => f.getText()).join(' ')).join(' / ')
    .replace(/[⁦⁩]/g, ''), id);

const openToolbox = async (page) => {
    await page.evaluate(() => {
        const toolbox = window.__easyleanWorkspace.getToolbox();
        if (!toolbox.getFlyout().isVisible()) toolbox.setSelectedItem(toolbox.getToolboxItems()[0]);
    });
    await page.waitForTimeout(400);
};

// Screen point of a connection: where a dragged block's top must land.
const target = (page, where) => page.evaluate((where) => {
    const ws = window.__easyleanWorkspace;
    const goal = ws.getTopBlocks(true).find((b) => b.type === 'game_goal');
    let connection;
    if (where.goal) connection = goal.getInput('PROOF').connection;
    else if (where.after) connection = ws.getBlockById(where.after).nextConnection;
    else connection = ws.getBlockById(where.into).getInput(where.input).connection;
    const svg = ws.getParentSvg().getBoundingClientRect();
    const origin = ws.getOriginOffsetInPixels();
    const scale = ws.scale;
    // A part's own connection sits right below the end of the part before it:
    // aim a little lower, into the part's row.
    const below = where.input ? 8 : 0;
    return { x: svg.left + origin.x + connection.x * scale, y: svg.top + origin.y + connection.y * scale + below };
}, where);

const drag = async (page, type, where) => {
    await openToolbox(page);
    const before = await page.evaluate(() => window.__easyleanWorkspace.getAllBlocks(false).map((b) => b.id));
    // The block as shown in the toolbox, and its top connection relative to it.
    const source = await page.evaluate((type) => {
        const flyout = window.__easyleanWorkspace.getToolbox().getFlyout();
        const block = flyout.getWorkspace().getTopBlocks(false).find((b) => b.type === type);
        if (!block) return null;
        const rect = block.getSvgRoot().getBoundingClientRect();
        const xy = block.getRelativeToSurfaceXY();
        const scale = flyout.getWorkspace().scale;
        const grab = { x: rect.right - 15, y: rect.top + 10 };
        // In RTL a block's x is its right edge.
        const connection = { x: rect.right + (block.previousConnection.x - xy.x) * scale, y: rect.top + (block.previousConnection.y - xy.y) * scale };
        return { grab, dx: grab.x - connection.x, dy: grab.y - connection.y };
    }, type);
    if (!source) throw new Error(`The toolbox has no ${type}`);
    const to = await target(page, where);
    await page.mouse.move(source.grab.x, source.grab.y);
    await page.mouse.down();
    await page.mouse.move(source.grab.x - 30, source.grab.y + 30, { steps: 5 });
    await page.mouse.move(to.x + source.dx, to.y + source.dy, { steps: 20 });
    await page.mouse.up();
    await page.waitForTimeout(3500);
    const id = await page.evaluate((before) => window.__easyleanWorkspace.getAllBlocks(false).map((b) => b.id).find((id) => !before.includes(id)), before);
    const attached = await page.evaluate((id) => !!window.__easyleanWorkspace.getBlockById(id)?.getParent(), id);
    if (!attached) throw new Error(`${type} did not attach where it was dropped`);
    if (process.env.WHERE) console.log('DROP', type, await page.evaluate((id) => {
        const b = window.__easyleanWorkspace.getBlockById(id);
        const p = b.getParent();
        const input = p.inputList.find((i) => i.connection && i.connection.targetBlock() === b);
        return `under ${p.type}${input ? ' in ' + input.name : ' (next)'}; state ${JSON.stringify(b.stateBefore)}`;
    }, id));
    return id;
};

// Chooses a value only if the field's menu offers it (by its shown label).
const choose = async (page, id, field, label) => {
    const options = await page.evaluate(([id, field]) => window.__easyleanWorkspace.getBlockById(id).getField(field)
        .getOptions(false).map(([text, value]) => [String(text).replace(/[⁦⁩]/g, ''), value]), [id, field]);
    const option = options.find(([text]) => text === label);
    if (!option) throw new Error(`menu of ${field} offers ${options.map(([t]) => t).join(' | ')}, not ${label}`);
    await page.evaluate(([id, field, value]) => window.__easyleanWorkspace.getBlockById(id).getField(field).setValue(value), [id, field, option[1]]);
    await page.waitForTimeout(3500);
};

const state = (page) => page.getByRole('region', { name: 'מצב ההוכחה' }).innerText();

// Each level, as its hints describe it.
const WALKS = [
    async (page, log) => {
        const c = await drag(page, 'hw_contradiction', { goal: true });
        await choose(page, c, 'FACT', 'P'); log(await phrase(page, c));
    },
    async (page, log) => {
        const n = await drag(page, 'hw_not_intro', { goal: true }); log(await phrase(page, n)); log(await state(page));
        const c = await drag(page, 'hw_contradiction', { after: n }); await choose(page, c, 'FACT', 'P'); log(await phrase(page, c));
    },
    async (page, log) => {
        const n = await drag(page, 'hw_not_intro', { goal: true }); log(await phrase(page, n));
        const f = await drag(page, 'hw_forward', { after: n }); await choose(page, f, 'RULE', '(P → Q)'); await choose(page, f, 'PREMISE', 'P'); log(await phrase(page, f));
        const c = await drag(page, 'hw_contradiction', { after: f }); await choose(page, c, 'FACT', 'Q'); log(await phrase(page, c));
    },
    async (page, log) => {
        const n = await drag(page, 'hw_not_intro', { goal: true }); log(await phrase(page, n));
        const e = await drag(page, 'hw_not_elim', { after: n }); await choose(page, e, 'NEGATION', '¬(P ∨ Q)'); log(await phrase(page, e));
        const o = await drag(page, 'hw_or_intro', { after: e }); await choose(page, o, 'SIDE', 'P'); log(await phrase(page, o));
        const x = await drag(page, 'hw_exact', { after: o }); log(await phrase(page, x));
    },
    async (page, log) => {
        const a = await drag(page, 'hw_assume', { goal: true }); log(await phrase(page, a));
        const s = await drag(page, 'hw_and_intro', { after: a }); log(await phrase(page, s));
        for (const [part, side] of [['LEFT', 'P'], ['RIGHT', 'Q']]) {
            const n = await drag(page, 'hw_not_intro', { into: s, input: part }); log(await phrase(page, n));
            const e = await drag(page, 'hw_not_elim', { after: n }); await choose(page, e, 'NEGATION', '¬(P ∨ Q)'); log(await phrase(page, e));
            const o = await drag(page, 'hw_or_intro', { after: e }); await choose(page, o, 'SIDE', side); log(await phrase(page, o));
            await drag(page, 'hw_exact', { after: o });
        }
    },
    async (page, log) => {
        const x = await drag(page, 'hw_exfalso', { goal: true }); log(await phrase(page, x));
        const c = await drag(page, 'hw_contradiction', { after: x }); await choose(page, c, 'FACT', 'P'); log(await phrase(page, c));
    },
    async (page, log) => {
        const k = await drag(page, 'hw_or_elim', { goal: true }); await choose(page, k, 'OR', '(P ∨ Q)'); log(await phrase(page, k));
        const x = await drag(page, 'hw_exfalso', { into: k, input: 'LEFT' }); log(await phrase(page, x));
        const c = await drag(page, 'hw_contradiction', { after: x }); await choose(page, c, 'FACT', 'P'); log(await phrase(page, c));
        await drag(page, 'hw_exact', { into: k, input: 'RIGHT' });
    },
    async (page, log) => {
        const b = await drag(page, 'hw_by_contradiction', { goal: true }); log(await phrase(page, b)); log(await state(page));
        const c = await drag(page, 'hw_contradiction', { after: b }); await choose(page, c, 'FACT', '¬P'); log(await phrase(page, c));
    },
    async (page, log) => {
        const a1 = await drag(page, 'hw_assume', { goal: true }); log(await phrase(page, a1));
        const a2 = await drag(page, 'hw_assume', { after: a1 }); log(await phrase(page, a2));
        const b = await drag(page, 'hw_by_contradiction', { after: a2 }); log(await phrase(page, b));
        const f = await drag(page, 'hw_forward', { after: b }); await choose(page, f, 'RULE', '(¬Q → ¬P)'); await choose(page, f, 'PREMISE', '¬Q'); log(await phrase(page, f));
        const c = await drag(page, 'hw_contradiction', { after: f }); await choose(page, c, 'FACT', 'P'); log(await phrase(page, c));
    },
    async (page, log) => {
        const b = await drag(page, 'hw_by_contradiction', { goal: true }); log(await phrase(page, b));
        const e1 = await drag(page, 'hw_not_elim', { after: b }); await choose(page, e1, 'NEGATION', '¬(P ∨ ¬P)'); log(await phrase(page, e1));
        const o1 = await drag(page, 'hw_or_intro', { after: e1 }); await choose(page, o1, 'SIDE', '¬P'); log(await phrase(page, o1));
        const n = await drag(page, 'hw_not_intro', { after: o1 }); log(await phrase(page, n));
        const e2 = await drag(page, 'hw_not_elim', { after: n }); await choose(page, e2, 'NEGATION', '¬(P ∨ ¬P)'); log(await phrase(page, e2));
        const o2 = await drag(page, 'hw_or_intro', { after: e2 }); await choose(page, o2, 'SIDE', 'P'); log(await phrase(page, o2));
        await drag(page, 'hw_exact', { after: o2 });
    },
];

WALKS.forEach((walk, index) => {
    test(`student walk, unit 3 level ${index + 1}`, async ({ page }) => {
        test.setTimeout(120000);
        await page.setViewportSize({ width: 1500, height: 1000 });
        await page.goto('handwritten.html');
        await page.getByRole('button', { name: WORLD }).click();
        await page.waitForSelector('svg.blocklySvg g.game_goal');
        await page.getByRole('combobox').selectOption(String(index));
        await page.waitForTimeout(1500);
        const lines = [];
        await walk(page, (line) => lines.push(line));
        await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
        await page.waitForTimeout(3000);
        if (SHOTS) await page.screenshot({ path: `${SHOTS}/l${index + 1}.png` });
        if (process.env.WHERE) console.log(`LEVEL ${index + 1}\n  ${lines.join('\n  ')}`);
        await expect(page.getByText('הצלחה!').first()).toBeVisible();
    });
});
