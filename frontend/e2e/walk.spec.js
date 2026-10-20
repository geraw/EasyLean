import { test, expect } from './helpers';

// A student's walk through units 4-6, as their hints describe each level:
// blocks dragged from the toolbox with the mouse, and fields chosen only
// among the options their menu shows. (The solutions in solutions.spec.js
// are built directly, which does not catch a hint that cannot be followed.) SHOTS=<dir> saves a screenshot of each level; WHERE=1
// logs where each block attached.
const SHOTS = process.env.SHOTS;

// A block's text as shown, row by row.
const phrase = (page, id) => page.evaluate((id) => window.__easyleanWorkspace.getBlockById(id).inputList
    .map((input) => input.fieldRow.filter((f) => f.isVisible()).map((f) => f.getText()).join(' ')).join(' / ')
    .replace(/[\u2066\u2067\u2069]/g, ''), id);

// Opens the drawer that holds the move (a level may have several).
const openToolbox = async (page, type) => {
    await page.evaluate((type) => {
        const toolbox = window.__easyleanWorkspace.getToolbox();
        const items = toolbox.getToolboxItems();
        const drawer = items.find((item) => (item.getContents?.() || []).some((entry) => entry.type === type)) || items[0];
        if (!toolbox.getFlyout().isVisible() || toolbox.getSelectedItem() !== drawer) toolbox.setSelectedItem(drawer);
    }, type);
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
        // A wide block (long part headings) can put the place beyond a side.
        const x = svg.left + ws.getOriginOffsetInPixels().x + connection.x * ws.scale;
        if (x < svg.left + 250 || x > svg.right - 100) ws.scroll(ws.scrollX - (x - (svg.left + svg.width / 2)), ws.scrollY);
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
    await openToolbox(page, type);
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
    // A menu fills once Lean has given the state before the move: a student
    // waits for it, and so does the walk, a little.
    let options = [];
    let option = null;
    for (let tries = 0; tries < 6 && !option; tries += 1) {
        if (tries) await page.waitForTimeout(2000);
        options = await page.evaluate(([id, field]) => window.__easyleanWorkspace.getBlockById(id).getField(field)
            .getOptions(false).map(([text, value]) => [String(text).replace(/[\u2066\u2067\u2069]/g, ''), value]), [id, field]);
        option = options.find(([text]) => text === label);
    }
    if (!option) throw new Error(`menu of ${field} offers ${options.map(([t]) => t).join(' | ')}, not ${label}`);
    await page.evaluate(([id, field, value]) => window.__easyleanWorkspace.getBlockById(id).getField(field).setValue(value), [id, field, option[1]]);
    await page.waitForTimeout(3500);
};

const state = (page) => page.getByRole('region', { name: 'מצב ההוכחה' }).innerText();

// Each level of unit 4, as its hints describe it.
const UNIT4 = [
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

// Each level of unit 5, as its hints describe it.
const UNIT5 = [
    async (page, log) => {
        const e = await drag(page, 'forall_elim', { goal: true });
        await choose(page, e, 'FORALL', '∀x (P(x))'); await choose(page, e, 'TERM', 'a'); log(await phrase(page, e));
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
        const e2 = await drag(page, 'forall_elim', { after: e1 }); await choose(page, e2, 'FORALL', '∀x (P(x))'); await choose(page, e2, 'TERM', 'x₀');
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
        const x = await drag(page, 'exists_elim', { goal: true }); await choose(page, x, 'EXISTS', '∃x (P(x))'); log(await phrase(page, x));
        const e = await drag(page, 'forall_elim', { after: x }); await choose(page, e, 'FORALL', '∀x (P(x) → Q(x))'); await choose(page, e, 'TERM', 'x₀');
        const f = await drag(page, 'forward', { after: e }); await choose(page, f, 'RULE', '(P(x₀) → Q(x₀))'); await choose(page, f, 'PREMISE', 'P(x₀)'); log(await phrase(page, f));
        const w = await drag(page, 'exists_intro', { after: f }); await choose(page, w, 'TERM', 'x₀');
        await drag(page, 'exact', { after: w });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true });
        const i = await drag(page, 'forall_intro', { after: a }); log(await phrase(page, i));
        const n = await drag(page, 'not_intro', { after: i }); log(await phrase(page, n));
        const e = await drag(page, 'not_elim', { after: n }); await choose(page, e, 'NEGATION', '¬∃x (P(x))'); log(await phrase(page, e));
        const w = await drag(page, 'exists_intro', { after: e }); await choose(page, w, 'TERM', 'x₀');
        await drag(page, 'exact', { after: w });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true });
        const i = await drag(page, 'forall_intro', { after: a }); log(await phrase(page, i));
        const x = await drag(page, 'exists_elim', { after: i }); await choose(page, x, 'EXISTS', '∃x (∀y (R(x,y)))'); log(await phrase(page, x));
        const e = await drag(page, 'forall_elim', { after: x }); await choose(page, e, 'FORALL', '∀y (R(x₀,y))'); await choose(page, e, 'TERM', 'y₀'); log(await phrase(page, e));
        const w = await drag(page, 'exists_intro', { after: e }); await choose(page, w, 'TERM', 'x₀');
        await drag(page, 'exact', { after: w });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true });
        const b1 = await drag(page, 'by_contradiction', { after: a }); log(await phrase(page, b1));
        const e1 = await drag(page, 'not_elim', { after: b1 }); await choose(page, e1, 'NEGATION', '¬∀x (P(x))'); log(await phrase(page, e1));
        const i = await drag(page, 'forall_intro', { after: e1 }); log(await phrase(page, i));
        const b2 = await drag(page, 'by_contradiction', { after: i }); log(await phrase(page, b2));
        const e2 = await drag(page, 'not_elim', { after: b2 }); await choose(page, e2, 'NEGATION', '¬∃x (¬P(x))'); log(await phrase(page, e2));
        const w = await drag(page, 'exists_intro', { after: e2 }); await choose(page, w, 'TERM', 'x₀'); log(await phrase(page, w));
        await drag(page, 'exact', { after: w });
    },
];

// Each level of unit 6, as its hints describe it.
const replace = async (page, where, law, direction, target, log) => {
    const r = await drag(page, 'replace', where);
    // The place first: the direction shows what is replaced there.
    await choose(page, r, 'LAW', law);
    await choose(page, r, 'TARGET', target);
    await choose(page, r, 'DIRECTION', direction);
    log(await phrase(page, r));
    return r;
};
const IMP_OR = '(A → B) ↔ (¬A ∨ B)';
const NOT_OR = '¬(A ∨ B) ↔ (¬A ∧ ¬B)';
const UNIT6 = [
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
    ...[['∃x (P(x))', '∀x (¬P(x))'], ['∃x (¬P(x))', '∀x (P(x))']].map(([exists, forall]) => async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const n = await drag(page, 'not_intro', { after: a }); log(await phrase(page, n));
        const e = await drag(page, 'exists_elim', { after: n }); await choose(page, e, 'EXISTS', exists); log(await phrase(page, e));
        const f = await drag(page, 'forall_elim', { after: e }); await choose(page, f, 'FORALL', forall); await choose(page, f, 'TERM', 'x₀'); log(await phrase(page, f));
        const c = await drag(page, 'contradiction', { after: f }); await choose(page, c, 'FACT', 'P(x₀)');
    }),
    async (page, log) => {
        const r = await replace(page, { goal: true }, IMP_OR, 'את (P → Q) ב־(¬P ∨ Q)', 'המטרה', log); log(await state(page));
        const o = await drag(page, 'or_intro', { after: r }); await choose(page, o, 'SIDE', '¬P'); log(await phrase(page, o));
        await drag(page, 'exact', { after: o });
    },
    async (page, log) => {
        const r = await replace(page, { goal: true }, NOT_OR, 'את ¬(P ∨ Q) ב־(¬P ∧ ¬Q)', '¬(P ∨ Q)', log);
        const d = await drag(page, 'and_elim', { after: r }); await choose(page, d, 'AND', '(¬P ∧ ¬Q)'); log(await phrase(page, d));
        await drag(page, 'exact', { after: d });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const r = await replace(page, { after: a }, '(A → B) ↔ (¬B → ¬A)', 'את (P → Q) ב־(¬Q → ¬P)', 'המטרה', log);
        await drag(page, 'exact', { after: r });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const r1 = await replace(page, { after: a }, NOT_OR, 'את ¬(P ∨ ¬Q) ב־(¬P ∧ ¬¬Q)', '¬(P ∨ ¬Q)', log);
        const r2 = await replace(page, { after: r1 }, '¬¬A ↔ A', 'את ¬¬Q ב־Q', '(¬P ∧ ¬¬Q)', log);
        await drag(page, 'exact', { after: r2 });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const r1 = await replace(page, { after: a }, '¬∀x (P(x)) ↔ ∃x (¬P(x))', 'את ¬∀x (∃y (R(x,y))) ב־∃x (¬∃y (R(x,y)))', '¬∀x (∃y (R(x,y)))', log);
        const r2 = await replace(page, { after: r1 }, '¬∃x (P(x)) ↔ ∀x (¬P(x))', 'את ¬∃y (R(x,y)) ב־∀y (¬R(x,y))', '∃x (¬∃y (R(x,y)))', log); log(await state(page));
        await drag(page, 'exact', { after: r2 });
    },
    async (page, log) => {
        const k = await drag(page, 'iff_intro', { goal: true }); log(await phrase(page, k));
        const a = await drag(page, 'assume', { into: k, input: 'FORWARD' }); log(await phrase(page, a));
        const s = await drag(page, 'and_intro', { after: a }); log(await phrase(page, s));
        const b = await drag(page, 'by_contradiction', { into: s, input: 'LEFT' }); log(await phrase(page, b));
        const e1 = await drag(page, 'not_elim', { after: b }); await choose(page, e1, 'NEGATION', '¬(P → Q)'); log(await phrase(page, e1));
        const a1 = await drag(page, 'assume', { after: e1 }); log(await phrase(page, a1));
        const x = await drag(page, 'exfalso', { after: a1 });
        const c1 = await drag(page, 'contradiction', { after: x }); await choose(page, c1, 'FACT', 'P');
        const n = await drag(page, 'not_intro', { into: s, input: 'RIGHT' }); log(await phrase(page, n));
        const e2 = await drag(page, 'not_elim', { after: n }); await choose(page, e2, 'NEGATION', '¬(P → Q)');
        const a2 = await drag(page, 'assume', { after: e2 });
        await drag(page, 'exact', { after: a2 });
        const a3 = await drag(page, 'assume', { into: k, input: 'BACKWARD' }); log(await phrase(page, a3));
        const d = await drag(page, 'and_elim', { after: a3 }); await choose(page, d, 'AND', '(P ∧ ¬Q)'); log(await phrase(page, d));
        const n2 = await drag(page, 'not_intro', { after: d }); log(await phrase(page, n2));
        const f = await drag(page, 'forward', { after: n2 }); await choose(page, f, 'RULE', '(P → Q)'); await choose(page, f, 'PREMISE', 'P');
        const c2 = await drag(page, 'contradiction', { after: f }); await choose(page, c2, 'FACT', 'Q');
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const r1 = await replace(page, { after: a }, '¬∀x (P(x)) ↔ ∃x (¬P(x))', 'את ¬∀x (P(x) → Q(x)) ב־∃x (¬(P(x) → Q(x)))', '¬∀x (P(x) → Q(x))', log);
        const r2 = await replace(page, { after: r1 }, '¬(A → B) ↔ (A ∧ ¬B)', 'את ¬(P(x) → Q(x)) ב־(P(x) ∧ ¬Q(x))', '∃x (¬(P(x) → Q(x)))', log); log(await state(page));
        await drag(page, 'exact', { after: r2 });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const r = await replace(page, { after: a }, IMP_OR, 'את (¬P ∨ ¬Q) ב־(P → ¬Q)', 'המטרה', log);
        const a2 = await drag(page, 'assume', { after: r }); log(await phrase(page, a2));
        const n = await drag(page, 'not_intro', { after: a2 }); log(await phrase(page, n));
        const e = await drag(page, 'not_elim', { after: n }); await choose(page, e, 'NEGATION', '¬(P ∧ Q)'); log(await phrase(page, e));
        const s = await drag(page, 'and_intro', { after: e }); log(await phrase(page, s));
        await drag(page, 'exact', { into: s, input: 'LEFT' });
        await drag(page, 'exact', { into: s, input: 'RIGHT' });
    },
];

const UNITS = [
    { unit: 4, world: 'יחידה 4 - שלילה והוכחה בשלילה', walks: UNIT4 },
    { unit: 5, world: 'יחידה 5 - כמתים', walks: UNIT5 },
    { unit: 6, world: 'יחידה 6 - שקילויות לוגיות', walks: UNIT6 },
];

// The walks of a unit: a list, for every level, or by level number, for some.
for (const { unit, world, walks } of UNITS) {
    const byIndex = Array.isArray(walks) ? walks.map((walk, index) => [index, walk]) : Object.entries(walks).map(([number, walk]) => [Number(number) - 1, walk]);
    byIndex.forEach(([index, walk]) => {
        test(`student walk, unit ${unit} level ${index + 1}`, async ({ page }) => {
            test.setTimeout(900000);
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
