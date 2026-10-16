import { test, expect } from './helpers';

// A student's walk through units 3-8, as their hints describe each level:
// blocks dragged from the toolbox with the mouse, and fields chosen only
// among the options their menu shows. (The solutions in solutions.spec.js
// are built directly, which does not catch a hint that cannot be followed.) SHOTS=<dir> saves a screenshot of each level; WHERE=1
// logs where each block attached.
const SHOTS = process.env.SHOTS;

// A block's text as shown, row by row.
const phrase = (page, id) => page.evaluate((id) => window.__easyleanWorkspace.getBlockById(id).inputList
    .map((input) => input.fieldRow.filter((f) => f.isVisible()).map((f) => f.getText()).join(' ')).join(' / ')
    .replace(/[\u2066\u2067\u2069]/g, ''), id);

const openToolbox = async (page) => {
    await page.evaluate(() => {
        const toolbox = window.__easyleanWorkspace.getToolbox();
        if (!toolbox.getFlyout().isVisible()) toolbox.setSelectedItem(toolbox.getToolboxItems()[0]);
    });
    await page.waitForTimeout(400);
};

// Screen point of a connection: where a dragged block's top must land. The
// place around it is scrolled into view first, as a student would (in a long
// proof, the part of a block where it lands can be below the window).
const target = async (page, where) => {
    await page.evaluate((where) => {
        const ws = window.__easyleanWorkspace;
        const id = where.goal ? ws.getTopBlocks(true).find((b) => b.type === 'game_goal').id : (where.after || where.into);
        const block = ws.getBlockById(id);
        const connection = where.goal ? block.getInput('PROOF').connection
            : where.after ? block.nextConnection : block.getInput(where.input).connection;
        ws.scrollBoundsIntoView?.(block.getBoundingRectangle());
        // Then the place itself to the middle of the window, away from its edges.
        const svg = ws.getParentSvg().getBoundingClientRect();
        const y = svg.top + ws.getOriginOffsetInPixels().y + connection.y * ws.scale;
        if (y > svg.bottom - 200 || y < svg.top + 100) ws.scroll(ws.scrollX, ws.scrollY - (y - (svg.top + svg.height / 2)));
    }, where);
    await page.waitForTimeout(300);
    return targetPoint(page, where);
};
const targetPoint = (page, where) => page.evaluate((where) => {
    const ws = window.__easyleanWorkspace;
    const goal = ws.getTopBlocks(true).find((b) => b.type === 'game_goal');
    let connection;
    if (where.goal) connection = goal.getInput('PROOF').connection;
    else if (where.after) connection = ws.getBlockById(where.after).nextConnection;
    else connection = ws.getBlockById(where.into).getInput(where.input).connection;
    const svg = ws.getParentSvg().getBoundingClientRect();
    const origin = ws.getOriginOffsetInPixels();
    const scale = ws.scale;
    // Below a block, a student aims a little under its bottom edge.
    const point = { x: svg.left + origin.x + connection.x * scale, y: svg.top + origin.y + connection.y * scale + (where.after ? 6 : 0) };
    // A part's own connection sits right below the end of the part before it:
    // aim at the part's heading, as a student would.
    const heading = where.input && ws.getBlockById(where.into).getField(`${where.input}_TEXT0`);
    if (heading) {
        const rect = heading.getSvgRoot().getBoundingClientRect();
        point.y = rect.top + rect.height / 2;
    }
    return point;
}, where);

const drag = async (page, type, where) => {
    await openToolbox(page);
    const before = await page.evaluate(() => window.__easyleanWorkspace.getAllBlocks(false).map((b) => b.id));
    // A long toolbox is scrolled with the mouse wheel until the block shows.
    for (let tries = 0; tries < 20; tries += 1) {
        const where = await page.evaluate((type) => {
            const flyout = window.__easyleanWorkspace.getToolbox().getFlyout();
            const block = flyout.getWorkspace().getTopBlocks(false).find((b) => b.type === type);
            const area = flyout.getWorkspace().getParentSvg().getBoundingClientRect();
            const rect = block?.getSvgRoot().getBoundingClientRect();
            if (!rect) return null;
            return { below: rect.bottom + 20 > area.bottom, above: rect.top < area.top, x: area.left + area.width / 2, y: area.top + area.height / 2 };
        }, type);
        if (!where || (!where.below && !where.above)) break;
        await page.mouse.move(where.x, where.y);
        await page.mouse.wheel(0, where.below ? 150 : -150);
        await page.waitForTimeout(200);
    }
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
    // Dropped between two neighbouring connections, a block can snap to the
    // other one; a student then moves it to its place, and so does the walk
    // (logged with WHERE=1).
    const moved = await page.evaluate(([id, where]) => {
        const ws = window.__easyleanWorkspace;
        const block = ws.getBlockById(id);
        if (!block) return 'missing';
        const goal = ws.getTopBlocks(true).find((b) => b.type === 'game_goal');
        const connection = where.goal ? goal.getInput('PROOF').connection
            : where.after ? ws.getBlockById(where.after).nextConnection
                : ws.getBlockById(where.into).getInput(where.input).connection;
        if (block.previousConnection.targetConnection === connection) return null;
        block.unplug(true);
        connection.connect(block.previousConnection);
        return 'moved';
    }, [id, where]);
    if (moved === 'missing') throw new Error(`${type} was not dropped`);
    if (moved) {
        if (process.env.WHERE) console.log('MOVED', type);
        await page.waitForTimeout(3500);
    }
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
        .getOptions(false).map(([text, value]) => [String(text).replace(/[\u2066\u2067\u2069]/g, ''), value]), [id, field]);
    const option = options.find(([text]) => text === label);
    if (!option) throw new Error(`menu of ${field} offers ${options.map(([t]) => t).join(' | ')}, not ${label}`);
    await page.evaluate(([id, field, value]) => window.__easyleanWorkspace.getBlockById(id).getField(field).setValue(value), [id, field, option[1]]);
    await page.waitForTimeout(3500);
};

// Types a value in through the menu's last item ("כתיבה ידנית"), as a student would.
const typeIn = async (page, id, field, text) => {
    await page.evaluate(([id, field]) => window.__easyleanWorkspace.getBlockById(id).getField(field).setValue('__write_own__'), [id, field]);
    await page.locator('dialog.blocklyDialog input').fill(text);
    await page.locator('dialog.blocklyDialog').getByRole('button', { name: 'OK' }).click();
    await page.waitForTimeout(3500);
};

const state = (page) => page.getByRole('region', { name: 'מצב ההוכחה' }).innerText();

// Each level of unit 3, as its hints describe it.
const UNIT3 = [
    async (page, log) => {
        const c = await drag(page, 'contradiction', { goal: true });
        await choose(page, c, 'FACT', 'P'); log(await phrase(page, c));
    },
    async (page, log) => {
        const n = await drag(page, 'not_intro', { goal: true }); log(await phrase(page, n)); log(await state(page));
        const c = await drag(page, 'contradiction', { after: n }); await choose(page, c, 'FACT', 'P'); log(await phrase(page, c));
    },
    async (page, log) => {
        const n = await drag(page, 'not_intro', { goal: true }); log(await phrase(page, n));
        const f = await drag(page, 'forward', { after: n }); await choose(page, f, 'RULE', '(P → Q)'); await choose(page, f, 'PREMISE', 'P'); log(await phrase(page, f));
        const c = await drag(page, 'contradiction', { after: f }); await choose(page, c, 'FACT', 'Q'); log(await phrase(page, c));
    },
    async (page, log) => {
        const n = await drag(page, 'not_intro', { goal: true }); log(await phrase(page, n));
        const e = await drag(page, 'not_elim', { after: n }); await choose(page, e, 'NEGATION', '¬(P ∨ Q)'); log(await phrase(page, e));
        const o = await drag(page, 'or_intro', { after: e }); await choose(page, o, 'SIDE', 'P'); log(await phrase(page, o));
        const x = await drag(page, 'exact', { after: o }); log(await phrase(page, x));
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const s = await drag(page, 'and_intro', { after: a }); log(await phrase(page, s));
        for (const [part, side] of [['LEFT', 'P'], ['RIGHT', 'Q']]) {
            const n = await drag(page, 'not_intro', { into: s, input: part }); log(await phrase(page, n));
            const e = await drag(page, 'not_elim', { after: n }); await choose(page, e, 'NEGATION', '¬(P ∨ Q)'); log(await phrase(page, e));
            const o = await drag(page, 'or_intro', { after: e }); await choose(page, o, 'SIDE', side); log(await phrase(page, o));
            await drag(page, 'exact', { after: o });
        }
    },
    async (page, log) => {
        const x = await drag(page, 'exfalso', { goal: true }); log(await phrase(page, x));
        const c = await drag(page, 'contradiction', { after: x }); await choose(page, c, 'FACT', 'P'); log(await phrase(page, c));
    },
    async (page, log) => {
        const k = await drag(page, 'or_elim', { goal: true }); await choose(page, k, 'OR', '(P ∨ Q)'); log(await phrase(page, k));
        const x = await drag(page, 'exfalso', { into: k, input: 'LEFT' }); log(await phrase(page, x));
        const c = await drag(page, 'contradiction', { after: x }); await choose(page, c, 'FACT', 'P'); log(await phrase(page, c));
        await drag(page, 'exact', { into: k, input: 'RIGHT' });
    },
    async (page, log) => {
        const b = await drag(page, 'by_contradiction', { goal: true }); log(await phrase(page, b)); log(await state(page));
        const c = await drag(page, 'contradiction', { after: b }); await choose(page, c, 'FACT', '¬P'); log(await phrase(page, c));
    },
    async (page, log) => {
        const a1 = await drag(page, 'assume', { goal: true }); log(await phrase(page, a1));
        const a2 = await drag(page, 'assume', { after: a1 }); log(await phrase(page, a2));
        const b = await drag(page, 'by_contradiction', { after: a2 }); log(await phrase(page, b));
        const f = await drag(page, 'forward', { after: b }); await choose(page, f, 'RULE', '(¬Q → ¬P)'); await choose(page, f, 'PREMISE', '¬Q'); log(await phrase(page, f));
        const c = await drag(page, 'contradiction', { after: f }); await choose(page, c, 'FACT', 'P'); log(await phrase(page, c));
    },
    async (page, log) => {
        const b = await drag(page, 'by_contradiction', { goal: true }); log(await phrase(page, b));
        const e1 = await drag(page, 'not_elim', { after: b }); await choose(page, e1, 'NEGATION', '¬(P ∨ ¬P)'); log(await phrase(page, e1));
        const o1 = await drag(page, 'or_intro', { after: e1 }); await choose(page, o1, 'SIDE', '¬P'); log(await phrase(page, o1));
        const n = await drag(page, 'not_intro', { after: o1 }); log(await phrase(page, n));
        const e2 = await drag(page, 'not_elim', { after: n }); await choose(page, e2, 'NEGATION', '¬(P ∨ ¬P)'); log(await phrase(page, e2));
        const o2 = await drag(page, 'or_intro', { after: e2 }); await choose(page, o2, 'SIDE', 'P'); log(await phrase(page, o2));
        await drag(page, 'exact', { after: o2 });
    },
];

// Each level of unit 4, as its hints describe it.
const UNIT4 = [
    async (page, log) => {
        const e = await drag(page, 'forall_elim', { goal: true });
        await choose(page, e, 'FORALL', '∀x P(x)'); await choose(page, e, 'TERM', 'a'); log(await phrase(page, e));
        await drag(page, 'exact', { after: e });
    },
    async (page, log) => {
        const e = await drag(page, 'forall_elim', { goal: true });
        await choose(page, e, 'FORALL', '∀x (P(x) → Q(x))'); await choose(page, e, 'TERM', 'a'); log(await phrase(page, e));
        const f = await drag(page, 'forward', { after: e }); await choose(page, f, 'RULE', '(P(a) → Q(a))'); await choose(page, f, 'PREMISE', 'P(a)'); log(await phrase(page, f));
        await drag(page, 'exact', { after: f });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const i = await drag(page, 'forall_intro', { after: a }); log(await phrase(page, i));
        const e = await drag(page, 'forall_elim', { after: i }); await choose(page, e, 'FORALL', '∀x (P(x) ∧ Q(x))'); await choose(page, e, 'TERM', 'x₀'); log(await phrase(page, e));
        const d = await drag(page, 'and_elim', { after: e }); await choose(page, d, 'AND', '(P(x₀) ∧ Q(x₀))'); log(await phrase(page, d));
        await drag(page, 'exact', { after: d });
    },
    async (page, log) => {
        const a1 = await drag(page, 'assume', { goal: true });
        const a2 = await drag(page, 'assume', { after: a1 }); log(await phrase(page, a2));
        const i = await drag(page, 'forall_intro', { after: a2 }); log(await phrase(page, i));
        const e1 = await drag(page, 'forall_elim', { after: i }); await choose(page, e1, 'FORALL', '∀x (P(x) → Q(x))'); await choose(page, e1, 'TERM', 'x₀');
        const e2 = await drag(page, 'forall_elim', { after: e1 }); await choose(page, e2, 'FORALL', '∀x P(x)'); await choose(page, e2, 'TERM', 'x₀');
        const f = await drag(page, 'forward', { after: e2 }); await choose(page, f, 'RULE', '(P(x₀) → Q(x₀))'); await choose(page, f, 'PREMISE', 'P(x₀)'); log(await phrase(page, f));
        await drag(page, 'exact', { after: f });
    },
    async (page, log) => {
        const w = await drag(page, 'exists_intro', { goal: true }); await choose(page, w, 'TERM', 'a'); log(await phrase(page, w));
        const o = await drag(page, 'or_intro', { after: w }); await choose(page, o, 'SIDE', 'P(a)'); log(await phrase(page, o));
        await drag(page, 'exact', { after: o });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const x = await drag(page, 'exists_elim', { after: a }); await choose(page, x, 'EXISTS', '∃x (P(x) ∧ Q(x))'); log(await phrase(page, x));
        const d = await drag(page, 'and_elim', { after: x }); await choose(page, d, 'AND', '(P(x₀) ∧ Q(x₀))');
        const w = await drag(page, 'exists_intro', { after: d }); await choose(page, w, 'TERM', 'x₀'); log(await phrase(page, w));
        await drag(page, 'exact', { after: w });
    },
    async (page, log) => {
        const x = await drag(page, 'exists_elim', { goal: true }); await choose(page, x, 'EXISTS', '∃x P(x)'); log(await phrase(page, x));
        const e = await drag(page, 'forall_elim', { after: x }); await choose(page, e, 'FORALL', '∀x (P(x) → Q(x))'); await choose(page, e, 'TERM', 'x₀');
        const f = await drag(page, 'forward', { after: e }); await choose(page, f, 'RULE', '(P(x₀) → Q(x₀))'); await choose(page, f, 'PREMISE', 'P(x₀)'); log(await phrase(page, f));
        const w = await drag(page, 'exists_intro', { after: f }); await choose(page, w, 'TERM', 'x₀');
        await drag(page, 'exact', { after: w });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true });
        const i = await drag(page, 'forall_intro', { after: a }); log(await phrase(page, i));
        const n = await drag(page, 'not_intro', { after: i }); log(await phrase(page, n));
        const e = await drag(page, 'not_elim', { after: n }); await choose(page, e, 'NEGATION', '¬∃x P(x)'); log(await phrase(page, e));
        const w = await drag(page, 'exists_intro', { after: e }); await choose(page, w, 'TERM', 'x₀');
        await drag(page, 'exact', { after: w });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true });
        const i = await drag(page, 'forall_intro', { after: a }); log(await phrase(page, i));
        const x = await drag(page, 'exists_elim', { after: i }); await choose(page, x, 'EXISTS', '∃x ∀y R(x,y)'); log(await phrase(page, x));
        const e = await drag(page, 'forall_elim', { after: x }); await choose(page, e, 'FORALL', '∀y R(x₀,y)'); await choose(page, e, 'TERM', 'y₀'); log(await phrase(page, e));
        const w = await drag(page, 'exists_intro', { after: e }); await choose(page, w, 'TERM', 'x₀');
        await drag(page, 'exact', { after: w });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true });
        const b1 = await drag(page, 'by_contradiction', { after: a }); log(await phrase(page, b1));
        const e1 = await drag(page, 'not_elim', { after: b1 }); await choose(page, e1, 'NEGATION', '¬∀x P(x)'); log(await phrase(page, e1));
        const i = await drag(page, 'forall_intro', { after: e1 }); log(await phrase(page, i));
        const b2 = await drag(page, 'by_contradiction', { after: i }); log(await phrase(page, b2));
        const e2 = await drag(page, 'not_elim', { after: b2 }); await choose(page, e2, 'NEGATION', '¬∃x ¬P(x)'); log(await phrase(page, e2));
        const w = await drag(page, 'exists_intro', { after: e2 }); await choose(page, w, 'TERM', 'x₀'); log(await phrase(page, w));
        await drag(page, 'exact', { after: w });
    },
];

// Each level of unit 5, as its hints describe it.
const replace = async (page, where, law, direction, target, log) => {
    const r = await drag(page, 'replace', where);
    await choose(page, r, 'LAW', law);
    await choose(page, r, 'DIRECTION', direction);
    await choose(page, r, 'TARGET', target);
    log(await phrase(page, r));
    return r;
};
const IMP_OR = '(A → B) ↔ (¬A ∨ B)';
const NOT_OR = '¬(A ∨ B) ↔ (¬A ∧ ¬B)';
const UNIT5 = [
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const d = await drag(page, 'and_elim', { after: a }); await choose(page, d, 'AND', '(¬P ∧ ¬Q)'); log(await phrase(page, d));
        const n = await drag(page, 'not_intro', { after: d }); log(await phrase(page, n));
        const k = await drag(page, 'or_elim', { after: n }); await choose(page, k, 'OR', '(P ∨ Q)'); log(await phrase(page, k));
        const c1 = await drag(page, 'contradiction', { into: k, input: 'LEFT' }); await choose(page, c1, 'FACT', 'P');
        const c2 = await drag(page, 'contradiction', { into: k, input: 'RIGHT' }); await choose(page, c2, 'FACT', 'Q');
    },
    async (page, log) => {
        const a1 = await drag(page, 'assume', { goal: true });
        const a2 = await drag(page, 'assume', { after: a1 }); log(await phrase(page, a2));
        const n = await drag(page, 'not_intro', { after: a2 }); log(await phrase(page, n));
        const f = await drag(page, 'forward', { after: n }); await choose(page, f, 'RULE', '(P → Q)'); await choose(page, f, 'PREMISE', 'P'); log(await phrase(page, f));
        const c = await drag(page, 'contradiction', { after: f }); await choose(page, c, 'FACT', 'Q');
    },
    async (page, log) => {
        const k = await drag(page, 'iff_intro', { goal: true }); log(await phrase(page, k));
        const a = await drag(page, 'assume', { into: k, input: 'FORWARD' }); log(await phrase(page, a));
        const b = await drag(page, 'by_contradiction', { after: a }); log(await phrase(page, b));
        const e1 = await drag(page, 'not_elim', { after: b }); await choose(page, e1, 'NEGATION', '¬(¬P ∨ Q)');
        const o1 = await drag(page, 'or_intro', { after: e1 }); await choose(page, o1, 'SIDE', '¬P');
        const n = await drag(page, 'not_intro', { after: o1 }); log(await phrase(page, n));
        const e2 = await drag(page, 'not_elim', { after: n }); await choose(page, e2, 'NEGATION', '¬(¬P ∨ Q)');
        const o2 = await drag(page, 'or_intro', { after: e2 }); await choose(page, o2, 'SIDE', 'Q');
        const r = await drag(page, 'apply_rule', { after: o2 }); await choose(page, r, 'RULE', '(P → Q)'); log(await phrase(page, r));
        await drag(page, 'exact', { after: r });
        const a1 = await drag(page, 'assume', { into: k, input: 'BACKWARD' });
        const a2 = await drag(page, 'assume', { after: a1 }); log(await phrase(page, a2));
        const c = await drag(page, 'or_elim', { after: a2 }); await choose(page, c, 'OR', '(¬P ∨ Q)'); log(await phrase(page, c));
        const x = await drag(page, 'exfalso', { into: c, input: 'LEFT' }); log(await phrase(page, x));
        const t = await drag(page, 'contradiction', { after: x }); await choose(page, t, 'FACT', 'P');
        await drag(page, 'exact', { into: c, input: 'RIGHT' });
    },
    ...[['∃x P(x)', '∀x ¬P(x)'], ['∃x ¬P(x)', '∀x P(x)']].map(([exists, forall]) => async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const n = await drag(page, 'not_intro', { after: a }); log(await phrase(page, n));
        const e = await drag(page, 'exists_elim', { after: n }); await choose(page, e, 'EXISTS', exists); log(await phrase(page, e));
        const f = await drag(page, 'forall_elim', { after: e }); await choose(page, f, 'FORALL', forall); await choose(page, f, 'TERM', 'x₀'); log(await phrase(page, f));
        const c = await drag(page, 'contradiction', { after: f }); await choose(page, c, 'FACT', 'P(x₀)');
    }),
    async (page, log) => {
        const r = await replace(page, { goal: true }, IMP_OR, 'את (A → B) ב־(¬A ∨ B)', 'המטרה', log); log(await state(page));
        const o = await drag(page, 'or_intro', { after: r }); await choose(page, o, 'SIDE', '¬P'); log(await phrase(page, o));
        await drag(page, 'exact', { after: o });
    },
    async (page, log) => {
        const r = await replace(page, { goal: true }, NOT_OR, 'את ¬(A ∨ B) ב־(¬A ∧ ¬B)', '¬(P ∨ Q)', log);
        const d = await drag(page, 'and_elim', { after: r }); await choose(page, d, 'AND', '(¬P ∧ ¬Q)'); log(await phrase(page, d));
        await drag(page, 'exact', { after: d });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const r = await replace(page, { after: a }, '(A → B) ↔ (¬B → ¬A)', 'את (A → B) ב־(¬B → ¬A)', 'המטרה', log);
        await drag(page, 'exact', { after: r });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const r1 = await replace(page, { after: a }, NOT_OR, 'את ¬(A ∨ B) ב־(¬A ∧ ¬B)', '¬(P ∨ ¬Q)', log);
        const r2 = await replace(page, { after: r1 }, '¬¬A ↔ A', 'את ¬¬A ב־A', '(¬P ∧ ¬¬Q)', log);
        await drag(page, 'exact', { after: r2 });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const r1 = await replace(page, { after: a }, '¬∀x P(x) ↔ ∃x ¬P(x)', 'את ¬∀x P(x) ב־∃x ¬P(x)', '¬∀x ∃y R(x,y)', log);
        const r2 = await replace(page, { after: r1 }, '¬∃x P(x) ↔ ∀x ¬P(x)', 'את ¬∃x P(x) ב־∀x ¬P(x)', '∃x ¬∃y R(x,y)', log); log(await state(page));
        await drag(page, 'exact', { after: r2 });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const r = await replace(page, { after: a }, IMP_OR, 'את (¬A ∨ B) ב־(A → B)', 'המטרה', log);
        const a2 = await drag(page, 'assume', { after: r }); log(await phrase(page, a2));
        const n = await drag(page, 'not_intro', { after: a2 }); log(await phrase(page, n));
        const e = await drag(page, 'not_elim', { after: n }); await choose(page, e, 'NEGATION', '¬(P ∧ Q)'); log(await phrase(page, e));
        const s = await drag(page, 'and_intro', { after: e }); log(await phrase(page, s));
        await drag(page, 'exact', { into: s, input: 'LEFT' });
        await drag(page, 'exact', { into: s, input: 'RIGHT' });
    },
];

// Each level of unit 6, as its hints describe it.
const unfold = async (page, after, statement, log) => {
    const u = await drag(page, 'unfold', after);
    await choose(page, u, 'STATEMENT', statement);
    log(await phrase(page, u));
    return u;
};
const UNIT6 = [
    async (page, log) => {
        const e = await drag(page, 'subset_elim', { goal: true });
        await choose(page, e, 'SUBSET', 'A ⊆ B'); await choose(page, e, 'MEMBER', 'x₀ ∈ A'); log(await phrase(page, e));
        await drag(page, 'exact', { after: e });
    },
    async (page, log) => {
        const a1 = await drag(page, 'assume', { goal: true });
        const a2 = await drag(page, 'assume', { after: a1 });
        const i = await drag(page, 'subset_intro', { after: a2 }); log(await phrase(page, i));
        const e1 = await drag(page, 'subset_elim', { after: i }); await choose(page, e1, 'SUBSET', 'A ⊆ B'); await choose(page, e1, 'MEMBER', 'x₀ ∈ A');
        const e2 = await drag(page, 'subset_elim', { after: e1 }); await choose(page, e2, 'SUBSET', 'B ⊆ C'); await choose(page, e2, 'MEMBER', 'x₀ ∈ B'); log(await phrase(page, e2));
        await drag(page, 'exact', { after: e2 });
    },
    async (page, log) => {
        const i = await drag(page, 'subset_intro', { goal: true }); log(await phrase(page, i));
        const u = await unfold(page, { after: i }, 'x₀ ∈ A ∩ B', log);
        const d = await drag(page, 'and_elim', { after: u }); await choose(page, d, 'AND', '(x₀ ∈ A ∧ x₀ ∈ B)');
        await drag(page, 'exact', { after: d });
    },
    async (page, log) => {
        const i = await drag(page, 'subset_intro', { goal: true });
        const u = await unfold(page, { after: i }, 'x₀ ∈ A ∪ B', log);
        const o = await drag(page, 'or_intro', { after: u }); await choose(page, o, 'SIDE', 'x₀ ∈ A');
        await drag(page, 'exact', { after: o });
    },
    async (page, log) => {
        const i = await drag(page, 'subset_intro', { goal: true });
        const u = await unfold(page, { after: i }, 'x₀ ∈ A ∪ B', log);
        const k = await drag(page, 'or_elim', { after: u }); await choose(page, k, 'OR', '(x₀ ∈ A ∨ x₀ ∈ B)'); log(await phrase(page, k));
        for (const [part, subset, member] of [['LEFT', 'A ⊆ C', 'x₀ ∈ A'], ['RIGHT', 'B ⊆ C', 'x₀ ∈ B']]) {
            const e = await drag(page, 'subset_elim', { into: k, input: part }); await choose(page, e, 'SUBSET', subset); await choose(page, e, 'MEMBER', member);
            await drag(page, 'exact', { after: e });
        }
    },
    async (page, log) => {
        const q = await drag(page, 'set_eq', { goal: true }); log(await phrase(page, q));
        for (const [part, from, to] of [['FIRST', 'A ∩ B', 'B ∩ A'], ['SECOND', 'B ∩ A', 'A ∩ B']]) {
            const [l, r] = from.split(' ∩ ');
            const i = await drag(page, 'subset_intro', { into: q, input: part });
            const u1 = await unfold(page, { after: i }, `x₀ ∈ ${from}`, log);
            const d = await drag(page, 'and_elim', { after: u1 }); await choose(page, d, 'AND', `(x₀ ∈ ${l} ∧ x₀ ∈ ${r})`);
            const u2 = await unfold(page, { after: d }, `x₀ ∈ ${to}`, log);
            const s = await drag(page, 'and_intro', { after: u2 });
            await drag(page, 'exact', { into: s, input: 'LEFT' });
            await drag(page, 'exact', { into: s, input: 'RIGHT' });
        }
    },
    async (page, log) => {
        const i = await drag(page, 'subset_intro', { goal: true }); log(await phrase(page, i));
        const u1 = await unfold(page, { after: i }, 'x₀ ∈ A ∩ (B ∪ C)', log);
        const d = await drag(page, 'and_elim', { after: u1 }); await choose(page, d, 'AND', '(x₀ ∈ A ∧ x₀ ∈ B ∪ C)');
        const u2 = await unfold(page, { after: d }, 'x₀ ∈ B ∪ C', log);
        const u3 = await unfold(page, { after: u2 }, 'x₀ ∈ A ∩ B ∪ A ∩ C', log);
        const k = await drag(page, 'or_elim', { after: u3 }); await choose(page, k, 'OR', '(x₀ ∈ B ∨ x₀ ∈ C)');
        for (const [part, side, set] of [['LEFT', 'x₀ ∈ A ∩ B', 'x₀ ∈ A ∩ B'], ['RIGHT', 'x₀ ∈ A ∩ C', 'x₀ ∈ A ∩ C']]) {
            const o = await drag(page, 'or_intro', { into: k, input: part }); await choose(page, o, 'SIDE', side);
            const u = await unfold(page, { after: o }, set, log);
            const s = await drag(page, 'and_intro', { after: u });
            await drag(page, 'exact', { into: s, input: 'LEFT' });
            await drag(page, 'exact', { into: s, input: 'RIGHT' });
        }
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true });
        const i = await drag(page, 'subset_intro', { after: a }); log(await phrase(page, i));
        const u1 = await unfold(page, { after: i }, 'x₀ ∈ Bᶜ', log);
        const u2 = await unfold(page, { after: u1 }, 'x₀ ∈ Aᶜ', log);
        const n = await drag(page, 'not_intro', { after: u2 }); log(await phrase(page, n));
        const e = await drag(page, 'subset_elim', { after: n }); await choose(page, e, 'SUBSET', 'A ⊆ B'); await choose(page, e, 'MEMBER', 'x₀ ∈ A');
        const c = await drag(page, 'contradiction', { after: e }); await choose(page, c, 'FACT', 'x₀ ∈ B'); log(await phrase(page, c));
    },
    async (page, log) => {
        const i = await drag(page, 'subset_intro', { goal: true });
        const u1 = await unfold(page, { after: i }, 'x₀ ∈ A \\ B', log);
        const d = await drag(page, 'and_elim', { after: u1 }); await choose(page, d, 'AND', '(x₀ ∈ A ∧ ¬x₀ ∈ B)');
        const u2 = await unfold(page, { after: d }, 'x₀ ∈ A ∩ Bᶜ', log);
        const s = await drag(page, 'and_intro', { after: u2 });
        await drag(page, 'exact', { into: s, input: 'LEFT' });
        const u3 = await unfold(page, { into: s, input: 'RIGHT' }, 'x₀ ∈ Bᶜ', log);
        await drag(page, 'exact', { after: u3 });
    },
    async (page, log) => {
        const i = await drag(page, 'subset_intro', { goal: true });
        const u = await unfold(page, { after: i }, 'x₀ ∈ ∅', log);
        const x = await drag(page, 'exfalso', { after: u });
        await drag(page, 'exact', { after: x });
    },
    async (page, log) => {
        const q = await drag(page, 'set_eq', { goal: true }); log(await phrase(page, q));
        const i1 = await drag(page, 'subset_intro', { into: q, input: 'FIRST' });
        const u1 = await unfold(page, { after: i1 }, 'x₀ ∈ (A ∪ B)ᶜ', log);
        const u2 = await unfold(page, { after: u1 }, 'x₀ ∈ Aᶜ ∩ Bᶜ', log);
        const s = await drag(page, 'and_intro', { after: u2 });
        for (const [part, set, side] of [['LEFT', 'x₀ ∈ Aᶜ', 'x₀ ∈ A'], ['RIGHT', 'x₀ ∈ Bᶜ', 'x₀ ∈ B']]) {
            const u = await unfold(page, { into: s, input: part }, set, log);
            const n = await drag(page, 'not_intro', { after: u });
            const e = await drag(page, 'not_elim', { after: n }); await choose(page, e, 'NEGATION', '¬x₀ ∈ A ∪ B');
            const g = await unfold(page, { after: e }, 'x₀ ∈ A ∪ B', log);
            const o = await drag(page, 'or_intro', { after: g }); await choose(page, o, 'SIDE', side);
            await drag(page, 'exact', { after: o });
        }
        const i2 = await drag(page, 'subset_intro', { into: q, input: 'SECOND' });
        const v1 = await unfold(page, { after: i2 }, 'x₀ ∈ Aᶜ ∩ Bᶜ', log);
        const d = await drag(page, 'and_elim', { after: v1 }); await choose(page, d, 'AND', '(x₀ ∈ Aᶜ ∧ x₀ ∈ Bᶜ)');
        const v2 = await unfold(page, { after: d }, 'x₀ ∈ Aᶜ', log);
        const v3 = await unfold(page, { after: v2 }, 'x₀ ∈ Bᶜ', log);
        const v4 = await unfold(page, { after: v3 }, 'x₀ ∈ (A ∪ B)ᶜ', log);
        const n = await drag(page, 'not_intro', { after: v4 });
        const v5 = await unfold(page, { after: n }, 'x₀ ∈ A ∪ B', log);
        const k = await drag(page, 'or_elim', { after: v5 }); await choose(page, k, 'OR', '(x₀ ∈ A ∨ x₀ ∈ B)');
        for (const [part, fact] of [['LEFT', 'x₀ ∈ A'], ['RIGHT', 'x₀ ∈ B']]) {
            const c = await drag(page, 'contradiction', { into: k, input: part }); await choose(page, c, 'FACT', fact);
        }
    },
];

// Each level of unit 7, as its hints describe it.
const UNIT7 = [
    async (page, log) => {
        const u = await unfold(page, { goal: true }, 'A ∈ 𝒫(A ∪ B)', log);
        const i = await drag(page, 'subset_intro', { after: u }); log(await phrase(page, i));
        const g = await unfold(page, { after: i }, 'x₀ ∈ A ∪ B', log);
        const o = await drag(page, 'or_intro', { after: g }); await choose(page, o, 'SIDE', 'x₀ ∈ A');
        await drag(page, 'exact', { after: o });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true });
        const i1 = await drag(page, 'subset_intro', { after: a }); log(await phrase(page, i1));
        const u1 = await unfold(page, { after: i1 }, 'X₀ ∈ 𝒫(A)', log);
        const u2 = await unfold(page, { after: u1 }, 'X₀ ∈ 𝒫(B)', log);
        const i2 = await drag(page, 'subset_intro', { after: u2 }); log(await phrase(page, i2));
        const e1 = await drag(page, 'subset_elim', { after: i2 }); await choose(page, e1, 'SUBSET', 'X₀ ⊆ A'); await choose(page, e1, 'MEMBER', 'x₀ ∈ X₀');
        const e2 = await drag(page, 'subset_elim', { after: e1 }); await choose(page, e2, 'SUBSET', 'A ⊆ B'); await choose(page, e2, 'MEMBER', 'x₀ ∈ A');
        await drag(page, 'exact', { after: e2 });
    },
    async (page, log) => {
        const u = await unfold(page, { goal: true }, '∅ ∈ 𝒫(A)', log);
        const i = await drag(page, 'subset_intro', { after: u });
        const e = await unfold(page, { after: i }, 'x₀ ∈ ∅', log);
        const x = await drag(page, 'exfalso', { after: e });
        await drag(page, 'exact', { after: x });
    },
    async (page, log) => {
        const i = await drag(page, 'subset_intro', { goal: true });
        const u = await unfold(page, { after: i }, 'x₀ ∈ ⋃₀ F', log);
        const w = await drag(page, 'exists_intro', { after: u }); await choose(page, w, 'TERM', 'A'); log(await phrase(page, w));
        const s = await drag(page, 'and_intro', { after: w });
        await drag(page, 'exact', { into: s, input: 'LEFT' });
        await drag(page, 'exact', { into: s, input: 'RIGHT' });
    },
    async (page, log) => {
        const i = await drag(page, 'subset_intro', { goal: true });
        const u = await unfold(page, { after: i }, 'x₀ ∈ ⋂₀ F', log);
        const e = await drag(page, 'forall_elim', { after: u }); await choose(page, e, 'FORALL', '∀S (S ∈ F → x₀ ∈ S)'); await choose(page, e, 'TERM', 'A'); log(await phrase(page, e));
        const f = await drag(page, 'forward', { after: e }); await choose(page, f, 'RULE', '(A ∈ F → x₀ ∈ A)'); await choose(page, f, 'PREMISE', 'A ∈ F');
        await drag(page, 'exact', { after: f });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true });
        const i = await drag(page, 'subset_intro', { after: a }); log(await phrase(page, i));
        const u = await unfold(page, { after: i }, 'x₀ ∈ ⋃₀ F', log);
        const x = await drag(page, 'exists_elim', { after: u }); await choose(page, x, 'EXISTS', '∃S (S ∈ F ∧ x₀ ∈ S)'); log(await phrase(page, x));
        const d = await drag(page, 'and_elim', { after: x }); await choose(page, d, 'AND', '(S₀ ∈ F ∧ x₀ ∈ S₀)');
        const e = await drag(page, 'forall_elim', { after: d }); await choose(page, e, 'FORALL', '∀S (S ∈ F → S ⊆ A)'); await choose(page, e, 'TERM', 'S₀'); log(await phrase(page, e));
        const f = await drag(page, 'forward', { after: e }); await choose(page, f, 'RULE', '(S₀ ∈ F → S₀ ⊆ A)'); await choose(page, f, 'PREMISE', 'S₀ ∈ F');
        const m = await drag(page, 'subset_elim', { after: f }); await choose(page, m, 'SUBSET', 'S₀ ⊆ A'); await choose(page, m, 'MEMBER', 'x₀ ∈ S₀'); log(await phrase(page, m));
        await drag(page, 'exact', { after: m });
    },
];

// Each level of unit 8, as its hints describe it.
const rewrite = async (page, where, equation, direction, target, log) => {
    const r = await drag(page, 'rewrite', where);
    await choose(page, r, 'EQUATION', equation);
    await choose(page, r, 'DIRECTION', direction);
    await choose(page, r, 'TARGET', target);
    log(await phrase(page, r));
    return r;
};
const unfoldFunction = async (page, where, name) => {
    const u = await drag(page, 'unfold_function', where);
    await choose(page, u, 'FUNCTION', name);
    return u;
};
const induction = async (page, log) => {
    const i = await drag(page, 'induction', { goal: true });
    await choose(page, i, 'VARIABLE', 'n');
    log(await phrase(page, i));
    return i;
};
const UNIT8 = [
    async (page) => { await drag(page, 'rfl', { goal: true }); },
    async (page, log) => {
        const r = await rewrite(page, { goal: true }, 'y = x + 7', 'את y ב־x + 7', 'המטרה', log);
        await drag(page, 'rfl', { after: r });
    },
    async (page, log) => {
        const r = await rewrite(page, { goal: true }, 'a = b', 'את b ב־a', 'P(b)', log);
        await drag(page, 'exact', { after: r });
    },
    async (page, log) => {
        const r = await rewrite(page, { goal: true }, 'a = b', 'את a ב־b', 'המטרה', log);
        await drag(page, 'exact', { after: r });
    },
    async (page, log) => {
        const i = await induction(page, log);
        const b = await unfoldFunction(page, { into: i, input: 'BASE' }, 'double');
        await drag(page, 'rfl', { after: b });
        const u = await unfoldFunction(page, { into: i, input: 'STEP' }, 'double');
        const r = await rewrite(page, { after: u }, 'double(n) = n + n', 'את double(n) ב־n + n', 'המטרה', log);
        await drag(page, 'calc', { after: r });
    },
    async (page, log) => {
        const i = await induction(page, log);
        await drag(page, 'rfl', { into: i, input: 'BASE' });
        const u = await unfoldFunction(page, { into: i, input: 'STEP' }, 'החיבור');
        const r = await rewrite(page, { after: u }, '0 + n = n', 'את 0 + n ב־n', 'המטרה', log);
        await drag(page, 'rfl', { after: r });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        await drag(page, 'calc', { after: a });
    },
    async (page, log) => {
        const i = await induction(page, log);
        await drag(page, 'calc', { into: i, input: 'BASE' });
        const u = await unfoldFunction(page, { into: i, input: 'STEP' }, 'החזקה');
        await drag(page, 'calc', { after: u });
    },
    async (page, log) => {
        const i = await induction(page, log);
        const b = await unfoldFunction(page, { into: i, input: 'BASE' }, 'sumTo');
        await drag(page, 'rfl', { after: b });
        const u = await unfoldFunction(page, { into: i, input: 'STEP' }, 'sumTo');
        await drag(page, 'algebra', { after: u });
    },
    async (page, log) => {
        const i = await induction(page, log);
        const o = await drag(page, 'or_intro', { into: i, input: 'BASE' }); await choose(page, o, 'SIDE', '∃j (0 = 2 · j)');
        const w = await drag(page, 'exists_intro', { after: o }); await typeIn(page, w, 'TERM', '0'); log(await phrase(page, w));
        await drag(page, 'rfl', { after: w });
        const k = await drag(page, 'or_elim', { into: i, input: 'STEP' }); await choose(page, k, 'OR', '((∃j (n = 2 · j)) ∨ (∃j (n = 2 · j + 1)))'); log(await phrase(page, k));
        for (const [part, exists, side, witness] of [['LEFT', '∃j (n = 2 · j)', '∃j (n + 1 = 2 · j + 1)', 'j₀'], ['RIGHT', '∃j (n = 2 · j + 1)', '∃j (n + 1 = 2 · j)', 'j₀ + 1']]) {
            const x = await drag(page, 'exists_elim', { into: k, input: part }); await choose(page, x, 'EXISTS', exists); log(await phrase(page, x));
            const s = await drag(page, 'or_intro', { after: x }); await choose(page, s, 'SIDE', side);
            const v = await drag(page, 'exists_intro', { after: s });
            if (witness === 'j₀') await choose(page, v, 'TERM', witness); else await typeIn(page, v, 'TERM', witness);
            log(await phrase(page, v));
            await drag(page, 'calc', { after: v });
        }
    },
    async (page, log) => {
        const i = await induction(page, log);
        const b = await unfoldFunction(page, { into: i, input: 'BASE' }, 'oddSum');
        await drag(page, 'rfl', { after: b });
        const u = await unfoldFunction(page, { into: i, input: 'STEP' }, 'oddSum');
        const r = await rewrite(page, { after: u }, 'oddSum(n) = n · n', 'את oddSum(n) ב־n · n', 'המטרה', log);
        await drag(page, 'algebra', { after: r });
    },
];

const UNITS = [
    { unit: 3, world: 'יחידה 3 - שלילה והוכחה בשלילה', walks: UNIT3 },
    { unit: 4, world: 'יחידה 4 - כמתים', walks: UNIT4 },
    { unit: 5, world: 'יחידה 5 - שקילויות לוגיות', walks: UNIT5 },
    { unit: 6, world: 'יחידה 6 - קבוצות', walks: UNIT6 },
    { unit: 7, world: 'יחידה 7 - קבוצות של קבוצות', walks: UNIT7 },
    { unit: 8, world: 'יחידה 8 - שוויון ואינדוקציה', walks: UNIT8 },
];

for (const { unit, world, walks } of UNITS) {
    walks.forEach((walk, index) => {
        test(`student walk, unit ${unit} level ${index + 1}`, async ({ page }) => {
            test.setTimeout(400000);
            await page.setViewportSize({ width: 1500, height: 1000 });
            await page.goto('');
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
