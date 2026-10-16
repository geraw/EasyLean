import { test, expect } from './helpers';

// A student's walk through units 3 and 4 of the handwritten version, as their hints
// describe each level: blocks dragged from the toolbox with the mouse, and
// fields chosen only among the options their menu shows. (The solutions in
// handwritten.spec.js are built directly, which does not catch a hint that
// cannot be followed.) SHOTS=<dir> saves a screenshot of each level; WHERE=1
// logs where each block attached.
const SHOTS = process.env.SHOTS;

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

// Each level of unit 3, as its hints describe it.
const UNIT3 = [
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

// Each level of unit 4, as its hints describe it.
const UNIT4 = [
    async (page, log) => {
        const e = await drag(page, 'hw_forall_elim', { goal: true });
        await choose(page, e, 'FORALL', '∀x P(x)'); await choose(page, e, 'TERM', 'a'); log(await phrase(page, e));
        await drag(page, 'hw_exact', { after: e });
    },
    async (page, log) => {
        const e = await drag(page, 'hw_forall_elim', { goal: true });
        await choose(page, e, 'FORALL', '∀x (P(x) → Q(x))'); await choose(page, e, 'TERM', 'a'); log(await phrase(page, e));
        const f = await drag(page, 'hw_forward', { after: e }); await choose(page, f, 'RULE', '(P(a) → Q(a))'); await choose(page, f, 'PREMISE', 'P(a)'); log(await phrase(page, f));
        await drag(page, 'hw_exact', { after: f });
    },
    async (page, log) => {
        const a = await drag(page, 'hw_assume', { goal: true }); log(await phrase(page, a));
        const i = await drag(page, 'hw_forall_intro', { after: a }); log(await phrase(page, i));
        const e = await drag(page, 'hw_forall_elim', { after: i }); await choose(page, e, 'FORALL', '∀x (P(x) ∧ Q(x))'); await choose(page, e, 'TERM', 'x₀'); log(await phrase(page, e));
        const d = await drag(page, 'hw_and_elim', { after: e }); await choose(page, d, 'AND', '(P(x₀) ∧ Q(x₀))'); log(await phrase(page, d));
        await drag(page, 'hw_exact', { after: d });
    },
    async (page, log) => {
        const a1 = await drag(page, 'hw_assume', { goal: true });
        const a2 = await drag(page, 'hw_assume', { after: a1 }); log(await phrase(page, a2));
        const i = await drag(page, 'hw_forall_intro', { after: a2 }); log(await phrase(page, i));
        const e1 = await drag(page, 'hw_forall_elim', { after: i }); await choose(page, e1, 'FORALL', '∀x (P(x) → Q(x))'); await choose(page, e1, 'TERM', 'x₀');
        const e2 = await drag(page, 'hw_forall_elim', { after: e1 }); await choose(page, e2, 'FORALL', '∀x P(x)'); await choose(page, e2, 'TERM', 'x₀');
        const f = await drag(page, 'hw_forward', { after: e2 }); await choose(page, f, 'RULE', '(P(x₀) → Q(x₀))'); await choose(page, f, 'PREMISE', 'P(x₀)'); log(await phrase(page, f));
        await drag(page, 'hw_exact', { after: f });
    },
    async (page, log) => {
        const w = await drag(page, 'hw_exists_intro', { goal: true }); await choose(page, w, 'TERM', 'a'); log(await phrase(page, w));
        const o = await drag(page, 'hw_or_intro', { after: w }); await choose(page, o, 'SIDE', 'P(a)'); log(await phrase(page, o));
        await drag(page, 'hw_exact', { after: o });
    },
    async (page, log) => {
        const a = await drag(page, 'hw_assume', { goal: true }); log(await phrase(page, a));
        const x = await drag(page, 'hw_exists_elim', { after: a }); await choose(page, x, 'EXISTS', '∃x (P(x) ∧ Q(x))'); log(await phrase(page, x));
        const d = await drag(page, 'hw_and_elim', { after: x }); await choose(page, d, 'AND', '(P(x₀) ∧ Q(x₀))');
        const w = await drag(page, 'hw_exists_intro', { after: d }); await choose(page, w, 'TERM', 'x₀'); log(await phrase(page, w));
        await drag(page, 'hw_exact', { after: w });
    },
    async (page, log) => {
        const x = await drag(page, 'hw_exists_elim', { goal: true }); await choose(page, x, 'EXISTS', '∃x P(x)'); log(await phrase(page, x));
        const e = await drag(page, 'hw_forall_elim', { after: x }); await choose(page, e, 'FORALL', '∀x (P(x) → Q(x))'); await choose(page, e, 'TERM', 'x₀');
        const f = await drag(page, 'hw_forward', { after: e }); await choose(page, f, 'RULE', '(P(x₀) → Q(x₀))'); await choose(page, f, 'PREMISE', 'P(x₀)'); log(await phrase(page, f));
        const w = await drag(page, 'hw_exists_intro', { after: f }); await choose(page, w, 'TERM', 'x₀');
        await drag(page, 'hw_exact', { after: w });
    },
    async (page, log) => {
        const a = await drag(page, 'hw_assume', { goal: true });
        const i = await drag(page, 'hw_forall_intro', { after: a }); log(await phrase(page, i));
        const n = await drag(page, 'hw_not_intro', { after: i }); log(await phrase(page, n));
        const e = await drag(page, 'hw_not_elim', { after: n }); await choose(page, e, 'NEGATION', '¬∃x P(x)'); log(await phrase(page, e));
        const w = await drag(page, 'hw_exists_intro', { after: e }); await choose(page, w, 'TERM', 'x₀');
        await drag(page, 'hw_exact', { after: w });
    },
    async (page, log) => {
        const a = await drag(page, 'hw_assume', { goal: true });
        const i = await drag(page, 'hw_forall_intro', { after: a }); log(await phrase(page, i));
        const x = await drag(page, 'hw_exists_elim', { after: i }); await choose(page, x, 'EXISTS', '∃x ∀y R(x,y)'); log(await phrase(page, x));
        const e = await drag(page, 'hw_forall_elim', { after: x }); await choose(page, e, 'FORALL', '∀y R(x₀,y)'); await choose(page, e, 'TERM', 'y₀'); log(await phrase(page, e));
        const w = await drag(page, 'hw_exists_intro', { after: e }); await choose(page, w, 'TERM', 'x₀');
        await drag(page, 'hw_exact', { after: w });
    },
    async (page, log) => {
        const a = await drag(page, 'hw_assume', { goal: true });
        const b1 = await drag(page, 'hw_by_contradiction', { after: a }); log(await phrase(page, b1));
        const e1 = await drag(page, 'hw_not_elim', { after: b1 }); await choose(page, e1, 'NEGATION', '¬∀x P(x)'); log(await phrase(page, e1));
        const i = await drag(page, 'hw_forall_intro', { after: e1 }); log(await phrase(page, i));
        const b2 = await drag(page, 'hw_by_contradiction', { after: i }); log(await phrase(page, b2));
        const e2 = await drag(page, 'hw_not_elim', { after: b2 }); await choose(page, e2, 'NEGATION', '¬∃x ¬P(x)'); log(await phrase(page, e2));
        const w = await drag(page, 'hw_exists_intro', { after: e2 }); await choose(page, w, 'TERM', 'x₀'); log(await phrase(page, w));
        await drag(page, 'hw_exact', { after: w });
    },
];

const UNITS = [
    { unit: 3, world: 'יחידה 3 - שלילה והוכחה בשלילה', walks: UNIT3 },
    { unit: 4, world: 'יחידה 4 - כמתים', walks: UNIT4 },
];

for (const { unit, world, walks } of UNITS) {
    walks.forEach((walk, index) => {
        test(`student walk, unit ${unit} level ${index + 1}`, async ({ page }) => {
            test.setTimeout(150000);
            await page.setViewportSize({ width: 1500, height: 1000 });
            await page.goto('handwritten.html');
            await page.getByRole('button', { name: world }).click();
            await page.waitForSelector('svg.blocklySvg g.game_goal');
            await page.getByRole('combobox').selectOption(String(index));
            await page.waitForTimeout(1500);
            const lines = [];
            await walk(page, (line) => lines.push(line));
            await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
            await page.waitForTimeout(3000);
            if (SHOTS) await page.screenshot({ path: `${SHOTS}/u${unit}l${index + 1}.png` });
            if (process.env.WHERE) console.log(`UNIT ${unit} LEVEL ${index + 1}\n  ${lines.join('\n  ')}`);
            await expect(page.getByText('הצלחה!').first()).toBeVisible();
        });
    });
}
