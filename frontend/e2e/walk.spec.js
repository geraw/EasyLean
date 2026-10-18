import { test, expect } from './helpers';

// A student's walk through units 3-12, as their hints describe each level:
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

// Each level of unit 5, as its hints describe it.
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
        const u = await unfold(page, { after: i }, 'x₀ ∈ (A ∩ B)', log);
        const d = await drag(page, 'and_elim', { after: u }); await choose(page, d, 'AND', '(x₀ ∈ A ∧ x₀ ∈ B)');
        await drag(page, 'exact', { after: d });
    },
    async (page, log) => {
        const i = await drag(page, 'subset_intro', { goal: true });
        const u = await unfold(page, { after: i }, 'x₀ ∈ (A ∪ B)', log);
        const o = await drag(page, 'or_intro', { after: u }); await choose(page, o, 'SIDE', 'x₀ ∈ A');
        await drag(page, 'exact', { after: o });
    },
    async (page, log) => {
        const i = await drag(page, 'subset_intro', { goal: true });
        const u = await unfold(page, { after: i }, 'x₀ ∈ (A ∪ B)', log);
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
            const u1 = await unfold(page, { after: i }, `x₀ ∈ (${from})`, log);
            const d = await drag(page, 'and_elim', { after: u1 }); await choose(page, d, 'AND', `(x₀ ∈ ${l} ∧ x₀ ∈ ${r})`);
            const u2 = await unfold(page, { after: d }, `x₀ ∈ (${to})`, log);
            const s = await drag(page, 'and_intro', { after: u2 });
            await drag(page, 'exact', { into: s, input: 'LEFT' });
            await drag(page, 'exact', { into: s, input: 'RIGHT' });
        }
    },
    async (page, log) => {
        const i = await drag(page, 'subset_intro', { goal: true }); log(await phrase(page, i));
        const u1 = await unfold(page, { after: i }, 'x₀ ∈ (A ∩ (B ∪ C))', log);
        const d = await drag(page, 'and_elim', { after: u1 }); await choose(page, d, 'AND', '(x₀ ∈ A ∧ x₀ ∈ (B ∪ C))');
        const u2 = await unfold(page, { after: d }, 'x₀ ∈ (B ∪ C)', log);
        const u3 = await unfold(page, { after: u2 }, 'x₀ ∈ ((A ∩ B) ∪ (A ∩ C))', log);
        const k = await drag(page, 'or_elim', { after: u3 }); await choose(page, k, 'OR', '(x₀ ∈ B ∨ x₀ ∈ C)');
        for (const [part, side, set] of [['LEFT', 'x₀ ∈ (A ∩ B)', 'x₀ ∈ (A ∩ B)'], ['RIGHT', 'x₀ ∈ (A ∩ C)', 'x₀ ∈ (A ∩ C)']]) {
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
        const u1 = await unfold(page, { after: i }, 'x₀ ∈ (C \\ B)', log);
        const d = await drag(page, 'and_elim', { after: u1 }); await choose(page, d, 'AND', '(x₀ ∈ C ∧ ¬x₀ ∈ B)');
        const u2 = await unfold(page, { after: d }, 'x₀ ∈ (C \\ A)', log);
        const s = await drag(page, 'and_intro', { after: u2 });
        await drag(page, 'exact', { into: s, input: 'LEFT' });
        const n = await drag(page, 'not_intro', { into: s, input: 'RIGHT' }); log(await phrase(page, n));
        const e = await drag(page, 'subset_elim', { after: n }); await choose(page, e, 'SUBSET', 'A ⊆ B'); await choose(page, e, 'MEMBER', 'x₀ ∈ A');
        const c = await drag(page, 'contradiction', { after: e }); await choose(page, c, 'FACT', 'x₀ ∈ B'); log(await phrase(page, c));
    },
    async (page, log) => {
        const i = await drag(page, 'subset_intro', { goal: true });
        const u1 = await unfold(page, { after: i }, 'x₀ ∈ (A \\ (A \\ B))', log);
        const d = await drag(page, 'and_elim', { after: u1 }); await choose(page, d, 'AND', '(x₀ ∈ A ∧ ¬x₀ ∈ (A \\ B))');
        const u2 = await unfold(page, { after: d }, 'x₀ ∈ (A ∩ B)', log);
        const s = await drag(page, 'and_intro', { after: u2 });
        await drag(page, 'exact', { into: s, input: 'LEFT' });
        const b = await drag(page, 'by_contradiction', { into: s, input: 'RIGHT' }); log(await phrase(page, b));
        const e = await drag(page, 'not_elim', { after: b }); await choose(page, e, 'NEGATION', '¬x₀ ∈ (A \\ B)');
        const u3 = await unfold(page, { after: e }, 'x₀ ∈ (A \\ B)', log);
        const t = await drag(page, 'and_intro', { after: u3 });
        await drag(page, 'exact', { into: t, input: 'LEFT' });
        await drag(page, 'exact', { into: t, input: 'RIGHT' });
    },
    async (page, log) => {
        const i = await drag(page, 'subset_intro', { goal: true }); log(await phrase(page, i));
        const u1 = await unfold(page, { after: i }, 'x₀ ∈ (A ∆ B)', log);
        const u2 = await unfold(page, { after: u1 }, 'x₀ ∈ ((A ∪ B) \\ (A ∩ B))', log);
        const k = await drag(page, 'or_elim', { after: u2 }); await choose(page, k, 'OR', '(x₀ ∈ (A \\ B) ∨ x₀ ∈ (B \\ A))'); log(await phrase(page, k));
        for (const [part, mine, other, side] of [['LEFT', 'A', 'B', 'x₀ ∈ A'], ['RIGHT', 'B', 'A', 'x₀ ∈ B']]) {
            const u = await unfold(page, { into: k, input: part }, `x₀ ∈ (${mine} \\ ${other})`, log);
            const d = await drag(page, 'and_elim', { after: u }); await choose(page, d, 'AND', `(x₀ ∈ ${mine} ∧ ¬x₀ ∈ ${other})`);
            const s = await drag(page, 'and_intro', { after: d }); log(await phrase(page, s));
            const g = await unfold(page, { into: s, input: 'LEFT' }, 'x₀ ∈ (A ∪ B)', log);
            const o = await drag(page, 'or_intro', { after: g }); await choose(page, o, 'SIDE', side);
            await drag(page, 'exact', { after: o });
            const n = await drag(page, 'not_intro', { into: s, input: 'RIGHT' }); log(await phrase(page, n));
            const h = await unfold(page, { after: n }, 'x₀ ∈ (A ∩ B)', log);
            const e = await drag(page, 'and_elim', { after: h }); await choose(page, e, 'AND', '(x₀ ∈ A ∧ x₀ ∈ B)');
            const c = await drag(page, 'contradiction', { after: e }); await choose(page, c, 'FACT', `x₀ ∈ ${other}`);
        }
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
        const u1 = await unfold(page, { after: i1 }, 'x₀ ∈ (A \\ (B ∪ C))', log);
        const d1 = await drag(page, 'and_elim', { after: u1 }); await choose(page, d1, 'AND', '(x₀ ∈ A ∧ ¬x₀ ∈ (B ∪ C))');
        const u2 = await unfold(page, { after: d1 }, 'x₀ ∈ ((A \\ B) ∩ (A \\ C))', log);
        const s = await drag(page, 'and_intro', { after: u2 });
        for (const [part, set, side] of [['LEFT', 'x₀ ∈ (A \\ B)', 'x₀ ∈ B'], ['RIGHT', 'x₀ ∈ (A \\ C)', 'x₀ ∈ C']]) {
            const u = await unfold(page, { into: s, input: part }, set, log);
            const t = await drag(page, 'and_intro', { after: u });
            await drag(page, 'exact', { into: t, input: 'LEFT' });
            const n = await drag(page, 'not_intro', { into: t, input: 'RIGHT' });
            const e = await drag(page, 'not_elim', { after: n }); await choose(page, e, 'NEGATION', '¬x₀ ∈ (B ∪ C)');
            const g = await unfold(page, { after: e }, 'x₀ ∈ (B ∪ C)', log);
            const o = await drag(page, 'or_intro', { after: g }); await choose(page, o, 'SIDE', side);
            await drag(page, 'exact', { after: o });
        }
        const i2 = await drag(page, 'subset_intro', { into: q, input: 'SECOND' });
        const v1 = await unfold(page, { after: i2 }, 'x₀ ∈ ((A \\ B) ∩ (A \\ C))', log);
        const d2 = await drag(page, 'and_elim', { after: v1 }); await choose(page, d2, 'AND', '(x₀ ∈ (A \\ B) ∧ x₀ ∈ (A \\ C))');
        const v2 = await unfold(page, { after: d2 }, 'x₀ ∈ (A \\ B)', log);
        const d3 = await drag(page, 'and_elim', { after: v2 }); await choose(page, d3, 'AND', '(x₀ ∈ A ∧ ¬x₀ ∈ B)');
        const v3 = await unfold(page, { after: d3 }, 'x₀ ∈ (A \\ C)', log);
        const d4 = await drag(page, 'and_elim', { after: v3 }); await choose(page, d4, 'AND', '(x₀ ∈ A ∧ ¬x₀ ∈ C)');
        const v4 = await unfold(page, { after: d4 }, 'x₀ ∈ (A \\ (B ∪ C))', log);
        const t = await drag(page, 'and_intro', { after: v4 });
        await drag(page, 'exact', { into: t, input: 'LEFT' });
        const n = await drag(page, 'not_intro', { into: t, input: 'RIGHT' });
        const v5 = await unfold(page, { after: n }, 'x₀ ∈ (B ∪ C)', log);
        const k = await drag(page, 'or_elim', { after: v5 }); await choose(page, k, 'OR', '(x₀ ∈ B ∨ x₀ ∈ C)');
        for (const [part, fact] of [['LEFT', 'x₀ ∈ B'], ['RIGHT', 'x₀ ∈ C']]) {
            const c = await drag(page, 'contradiction', { into: k, input: part }); await choose(page, c, 'FACT', fact);
        }
    },
];

// Each level of unit 7, as its hints describe it.
const UNIT7 = [
    async (page, log) => {
        const u = await unfold(page, { goal: true }, 'A ∈ 𝒫(A ∪ B)', log);
        const i = await drag(page, 'subset_intro', { after: u }); log(await phrase(page, i));
        const g = await unfold(page, { after: i }, 'x₀ ∈ (A ∪ B)', log);
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
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const c = await drag(page, 'claim', { after: a }); await choose(page, c, 'CLAIM', 'A ∈ 𝒫(A)'); log(await phrase(page, c));
        const u = await unfold(page, { into: c, input: 'PROOF' }, 'A ∈ 𝒫(A)', log);
        const i = await drag(page, 'subset_intro', { after: u }); log(await phrase(page, i));
        await drag(page, 'exact', { after: i });
        const m = await drag(page, 'subset_elim', { after: c }); await choose(page, m, 'SUBSET', '𝒫(A) ⊆ 𝒫(B)'); await choose(page, m, 'MEMBER', 'A ∈ 𝒫(A)'); log(await phrase(page, m));
        const u2 = await unfold(page, { after: m }, 'A ∈ 𝒫(B)', log);
        await drag(page, 'exact', { after: u2 });
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
        const u = await unfold(page, { after: i }, 'x₀ ∈ ⋃F', log);
        const w = await drag(page, 'exists_intro', { after: u }); await choose(page, w, 'TERM', 'A'); log(await phrase(page, w));
        const s = await drag(page, 'and_intro', { after: w });
        await drag(page, 'exact', { into: s, input: 'LEFT' });
        await drag(page, 'exact', { into: s, input: 'RIGHT' });
    },
    async (page, log) => {
        const i = await drag(page, 'subset_intro', { goal: true });
        const u = await unfold(page, { after: i }, 'x₀ ∈ ⋂F', log);
        const e = await drag(page, 'forall_elim', { after: u }); await choose(page, e, 'FORALL', '∀S (S ∈ F → x₀ ∈ S)'); await choose(page, e, 'TERM', 'A'); log(await phrase(page, e));
        const f = await drag(page, 'forward', { after: e }); await choose(page, f, 'RULE', '(A ∈ F → x₀ ∈ A)'); await choose(page, f, 'PREMISE', 'A ∈ F');
        await drag(page, 'exact', { after: f });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true });
        const i = await drag(page, 'subset_intro', { after: a }); log(await phrase(page, i));
        const u = await unfold(page, { after: i }, 'x₀ ∈ ⋃F', log);
        const x = await drag(page, 'exists_elim', { after: u }); await choose(page, x, 'EXISTS', '∃S (S ∈ F ∧ x₀ ∈ S)'); log(await phrase(page, x));
        const d = await drag(page, 'and_elim', { after: x }); await choose(page, d, 'AND', '(S₀ ∈ F ∧ x₀ ∈ S₀)');
        const e = await drag(page, 'forall_elim', { after: d }); await choose(page, e, 'FORALL', '∀S (S ∈ F → S ⊆ A)'); await choose(page, e, 'TERM', 'S₀'); log(await phrase(page, e));
        const f = await drag(page, 'forward', { after: e }); await choose(page, f, 'RULE', '(S₀ ∈ F → S₀ ⊆ A)'); await choose(page, f, 'PREMISE', 'S₀ ∈ F');
        const m = await drag(page, 'subset_elim', { after: f }); await choose(page, m, 'SUBSET', 'S₀ ⊆ A'); await choose(page, m, 'MEMBER', 'x₀ ∈ S₀'); log(await phrase(page, m));
        await drag(page, 'exact', { after: m });
    },
];

// Arithmetic or algebra with the assumptions it uses, chosen as their menus show them.
const fromFacts = async (page, type, where, facts, log) => {
    const c = await drag(page, type, where);
    for (const [index, fact] of facts.entries()) await choose(page, c, index ? `AND${index}` : 'FACT', index ? `ו־${fact}` : fact);
    log(await phrase(page, c));
    return c;
};

// Each level of unit 9, as its hints describe it.
const UNIT9 = [
    async (page, log) => {
        const a1 = await drag(page, 'assume', { goal: true });
        const a2 = await drag(page, 'assume', { after: a1 }); log(await phrase(page, a2));
        let last = a2;
        for (const statement of ['injective(f)', 'injective(g)', 'injective(g ∘ f)']) last = await unfold(page, { after: last }, statement, log);
        const i1 = await drag(page, 'forall_intro', { after: last });
        const i2 = await drag(page, 'forall_intro', { after: i1 });
        const a3 = await drag(page, 'assume', { after: i2 }); log(await phrase(page, a3));
        const e = await instantiate(page, { after: a3 }, '∀x (∀y (g(x) = g(y) → x = y))', ['f(x₀)', 'f(y₀)'], log);
        const f1 = await drag(page, 'forward', { after: e }); await choose(page, f1, 'RULE', '(g(f(x₀)) = g(f(y₀)) → f(x₀) = f(y₀))'); await choose(page, f1, 'PREMISE', 'g(f(x₀)) = g(f(y₀))');
        const e2 = await instantiate(page, { after: f1 }, '∀x (∀y (f(x) = f(y) → x = y))', ['x₀', 'y₀'], log);
        const f2 = await drag(page, 'forward', { after: e2 }); await choose(page, f2, 'RULE', '(f(x₀) = f(y₀) → x₀ = y₀)'); await choose(page, f2, 'PREMISE', 'f(x₀) = f(y₀)');
        await drag(page, 'exact', { after: f2 });
    },
    async (page, log) => {
        const a1 = await drag(page, 'assume', { goal: true });
        let last = await drag(page, 'assume', { after: a1 });
        for (const statement of ['surjective(f)', 'surjective(g)', 'surjective(g ∘ f)']) last = await unfold(page, { after: last }, statement, log);
        const i = await drag(page, 'forall_intro', { after: last }); log(await phrase(page, i));
        const e1 = await instantiate(page, { after: i }, '∀y (∃x (g(x) = y))', ['y₀'], log);
        const x1 = await drag(page, 'exists_elim', { after: e1 }); await choose(page, x1, 'EXISTS', '∃x (g(x) = y₀)'); log(await phrase(page, x1));
        const e2 = await instantiate(page, { after: x1 }, '∀y (∃x (f(x) = y))', ['x₀'], log);
        const x2 = await drag(page, 'exists_elim', { after: e2 }); await choose(page, x2, 'EXISTS', '∃x (f(x) = x₀)'); log(await phrase(page, x2));
        const w = await drag(page, 'exists_intro', { after: x2 }); await choose(page, w, 'TERM', 'x₁'); log(await phrase(page, w));
        const r = await rewrite(page, { after: w }, 'f(x₁) = x₀', 'את f(x₁) ב־x₀', 'המטרה', log);
        await drag(page, 'exact', { after: r });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true });
        const u1 = await unfold(page, { after: a }, 'injective(g ∘ f)', log);
        const u2 = await unfold(page, { after: u1 }, 'injective(f)', log);
        const i1 = await drag(page, 'forall_intro', { after: u2 });
        const i2 = await drag(page, 'forall_intro', { after: i1 });
        const a2 = await drag(page, 'assume', { after: i2 }); log(await phrase(page, a2));
        const e = await instantiate(page, { after: a2 }, '∀x (∀y (g(f(x)) = g(f(y)) → x = y))', ['x₀', 'y₀'], log);
        const b = await drag(page, 'apply_rule', { after: e }); await choose(page, b, 'RULE', '(g(f(x₀)) = g(f(y₀)) → x₀ = y₀)'); log(await phrase(page, b));
        const r = await rewrite(page, { after: b }, 'f(x₀) = f(y₀)', 'את f(x₀) ב־f(y₀)', 'המטרה', log);
        await drag(page, 'rfl', { after: r });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true });
        const u1 = await unfold(page, { after: a }, 'surjective(g ∘ f)', log);
        const u2 = await unfold(page, { after: u1 }, 'surjective(g)', log);
        const i = await drag(page, 'forall_intro', { after: u2 });
        const e = await instantiate(page, { after: i }, '∀y (∃x (g(f(x)) = y))', ['y₀'], log);
        const x = await drag(page, 'exists_elim', { after: e }); await choose(page, x, 'EXISTS', '∃x (g(f(x)) = y₀)');
        const w = await drag(page, 'exists_intro', { after: x }); await choose(page, w, 'TERM', 'f(x₀)'); log(await phrase(page, w));
        await drag(page, 'exact', { after: w });
    },
    async (page, log) => {
        const i = await drag(page, 'subset_intro', { goal: true }); log(await phrase(page, i));
        const u = await unfold(page, { after: i }, 'y₀ ∈ f[A ∩ B]', log);
        const x = await drag(page, 'exists_elim', { after: u }); await choose(page, x, 'EXISTS', '∃x (x ∈ (A ∩ B) ∧ f(x) = y₀)');
        const d = await drag(page, 'and_elim', { after: x }); await choose(page, d, 'AND', '(x₀ ∈ (A ∩ B) ∧ f(x₀) = y₀)');
        const v = await unfold(page, { after: d }, 'x₀ ∈ (A ∩ B)', log);
        const d2 = await drag(page, 'and_elim', { after: v }); await choose(page, d2, 'AND', '(x₀ ∈ A ∧ x₀ ∈ B)');
        const g = await unfold(page, { after: d2 }, 'y₀ ∈ (f[A] ∩ f[B])', log);
        const s = await drag(page, 'and_intro', { after: g });
        for (const [part, set] of [['LEFT', 'A'], ['RIGHT', 'B']]) {
            const h = await unfold(page, { into: s, input: part }, `y₀ ∈ f[${set}]`, log);
            const w = await drag(page, 'exists_intro', { after: h }); await choose(page, w, 'TERM', 'x₀');
            const k = await drag(page, 'and_intro', { after: w });
            await drag(page, 'exact', { into: k, input: 'LEFT' });
            await drag(page, 'exact', { into: k, input: 'RIGHT' });
        }
    },
    async (page, log) => {
        const q = await drag(page, 'set_eq', { goal: true }); log(await phrase(page, q));
        const i1 = await drag(page, 'subset_intro', { into: q, input: 'FIRST' });
        const u1 = await unfold(page, { after: i1 }, 'x₀ ∈ f⁻¹[A ∩ B]', log);
        const u2 = await unfold(page, { after: u1 }, 'f(x₀) ∈ (A ∩ B)', log);
        const d = await drag(page, 'and_elim', { after: u2 }); await choose(page, d, 'AND', '(f(x₀) ∈ A ∧ f(x₀) ∈ B)');
        const g = await unfold(page, { after: d }, 'x₀ ∈ (f⁻¹[A] ∩ f⁻¹[B])', log);
        const s = await drag(page, 'and_intro', { after: g });
        for (const [part, set] of [['LEFT', 'A'], ['RIGHT', 'B']]) {
            const h = await unfold(page, { into: s, input: part }, `x₀ ∈ f⁻¹[${set}]`, log);
            await drag(page, 'exact', { after: h });
        }
        const i2 = await drag(page, 'subset_intro', { into: q, input: 'SECOND' });
        const v1 = await unfold(page, { after: i2 }, 'x₀ ∈ (f⁻¹[A] ∩ f⁻¹[B])', log);
        const d2 = await drag(page, 'and_elim', { after: v1 }); await choose(page, d2, 'AND', '(x₀ ∈ f⁻¹[A] ∧ x₀ ∈ f⁻¹[B])');
        let last = d2;
        for (const statement of ['x₀ ∈ f⁻¹[A]', 'x₀ ∈ f⁻¹[B]', 'x₀ ∈ f⁻¹[A ∩ B]', 'f(x₀) ∈ (A ∩ B)']) last = await unfold(page, { after: last }, statement, log);
        const k = await drag(page, 'and_intro', { after: last });
        await drag(page, 'exact', { into: k, input: 'LEFT' });
        await drag(page, 'exact', { into: k, input: 'RIGHT' });
    },
    async (page, log) => {
        const i = await drag(page, 'subset_intro', { goal: true }); log(await phrase(page, i));
        const u = await unfold(page, { after: i }, 'y₀ ∈ f[f⁻¹[B]]', log);
        const x = await drag(page, 'exists_elim', { after: u }); await choose(page, x, 'EXISTS', '∃x (x ∈ f⁻¹[B] ∧ f(x) = y₀)');
        const d = await drag(page, 'and_elim', { after: x }); await choose(page, d, 'AND', '(x₀ ∈ f⁻¹[B] ∧ f(x₀) = y₀)');
        const v = await unfold(page, { after: d }, 'x₀ ∈ f⁻¹[B]', log);
        const r = await rewrite(page, { after: v }, 'f(x₀) = y₀', 'את f(x₀) ב־y₀', 'f(x₀) ∈ B', log);
        await drag(page, 'exact', { after: r });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true });
        const u = await unfold(page, { after: a }, 'injective(f)', log);
        const i = await drag(page, 'subset_intro', { after: u }); log(await phrase(page, i));
        const v1 = await unfold(page, { after: i }, 'x₀ ∈ f⁻¹[f[A]]', log);
        const v2 = await unfold(page, { after: v1 }, 'f(x₀) ∈ f[A]', log);
        const x = await drag(page, 'exists_elim', { after: v2 }); await choose(page, x, 'EXISTS', '∃x (x ∈ A ∧ f(x) = f(x₀))');
        const d = await drag(page, 'and_elim', { after: x }); await choose(page, d, 'AND', '(x₁ ∈ A ∧ f(x₁) = f(x₀))');
        const e = await instantiate(page, { after: d }, '∀x (∀y (f(x) = f(y) → x = y))', ['x₁', 'x₀'], log);
        const f = await drag(page, 'forward', { after: e }); await choose(page, f, 'RULE', '(f(x₁) = f(x₀) → x₁ = x₀)'); await choose(page, f, 'PREMISE', 'f(x₁) = f(x₀)');
        const r = await rewrite(page, { after: f }, 'x₁ = x₀', 'את x₁ ב־x₀', 'x₁ ∈ A', log);
        await drag(page, 'exact', { after: r });
    },
    async (page, log) => {
        const n = await drag(page, 'not_intro', { goal: true }); log(await phrase(page, n));
        const u = await unfold(page, { after: n }, 'surjective(f)', log);
        const e = await instantiate(page, { after: u }, '∀y (∃x (f(x) = y))', ['{z | ¬z ∈ f(z)}'], log);
        const x = await drag(page, 'exists_elim', { after: e }); await choose(page, x, 'EXISTS', '∃x (f(x) = {z | ¬z ∈ f(z)})'); log(await phrase(page, x));
        const c1 = await drag(page, 'claim', { after: x }); await choose(page, c1, 'CLAIM', '¬x₀ ∈ f(x₀)'); log(await phrase(page, c1));
        const m = await drag(page, 'not_intro', { into: c1, input: 'PROOF' }); log(await phrase(page, m));
        const r1 = await rewrite(page, { after: m }, 'f(x₀) = {z | ¬z ∈ f(z)}', 'את f(x₀) ב־{z | ¬z ∈ f(z)}', 'x₀ ∈ f(x₀)', log);
        const v = await unfold(page, { after: r1 }, 'x₀ ∈ {z | ¬z ∈ f(z)}', log);
        const t1 = await drag(page, 'contradiction', { after: v }); await choose(page, t1, 'FACT', 'x₀ ∈ f(x₀)');
        const c2 = await drag(page, 'claim', { after: c1 }); await choose(page, c2, 'CLAIM', 'x₀ ∈ {z | ¬z ∈ f(z)}');
        const w = await unfold(page, { into: c2, input: 'PROOF' }, 'x₀ ∈ {z | ¬z ∈ f(z)}', log);
        await drag(page, 'exact', { after: w });
        const r2 = await rewrite(page, { after: c2 }, 'f(x₀) = {z | ¬z ∈ f(z)}', 'את {z | ¬z ∈ f(z)} ב־f(x₀)', 'x₀ ∈ {z | ¬z ∈ f(z)}', log);
        const t2 = await drag(page, 'contradiction', { after: r2 }); await choose(page, t2, 'FACT', 'x₀ ∈ f(x₀)');
    },
];

// The equality levels of unit 8, and the levels of unit 10, as their hints describe them.
const rewrite = async (page, where, equation, direction, target, log) => {
    const r = await drag(page, 'rewrite', where);
    await choose(page, r, 'EQUATION', equation);
    await choose(page, r, 'DIRECTION', direction);
    await choose(page, r, 'TARGET', target);
    log(await phrase(page, r));
    return r;
};
// Unfolds a definition, in all its parts, or in the part chosen by how the menu shows it.
const unfoldFunction = async (page, where, name, part) => {
    const u = await drag(page, 'unfold_function', where);
    await choose(page, u, 'FUNCTION', name);
    if (part) await choose(page, u, 'PART', part);
    return u;
};
const induction = async (page, log) => {
    const i = await drag(page, 'induction', { goal: true });
    await choose(page, i, 'VARIABLE', 'n');
    log(await phrase(page, i));
    return i;
};
const EQUALITY = [
    async (page) => { await drag(page, 'rfl', { goal: true }); },
    async (page, log) => {
        const r = await rewrite(page, { goal: true }, 'a = b', 'את a ב־b', '(a, c) ∈ R', log);
        await drag(page, 'exact', { after: r });
    },
    async (page, log) => {
        const r = await rewrite(page, { goal: true }, 'a = b', 'את a ב־b', 'המטרה', log);
        await drag(page, 'rfl', { after: r });
    },
    async (page, log) => {
        const r = await rewrite(page, { goal: true }, 'a = b', 'את a ב־b', 'המטרה', log);
        await drag(page, 'exact', { after: r });
    },
];
const UNIT10 = [
    async (page) => { await drag(page, 'rfl', { goal: true }); },
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
        await fromFacts(page, 'calc_hyps', { after: a }, ['n + 1 ≤ n'], log);
    },
    async (page, log) => {
        const i = await induction(page, log);
        await drag(page, 'calc', { into: i, input: 'BASE' });
        const u = await unfoldFunction(page, { into: i, input: 'STEP' }, 'החזקה');
        await fromFacts(page, 'calc_hyps', { after: u }, ['n + 1 ≤ 2 ^ n'], log);
    },
    async (page, log) => {
        const i = await induction(page, log);
        const b = await unfoldFunction(page, { into: i, input: 'BASE' }, 'sumTo');
        await drag(page, 'rfl', { after: b });
        const u = await unfoldFunction(page, { into: i, input: 'STEP' }, 'sumTo');
        await fromFacts(page, 'algebra_hyps', { after: u }, ['2 · sumTo(n) = n · (n + 1)'], log);
    },
    async (page, log) => {
        const i = await induction(page, log);
        const o = await drag(page, 'or_intro', { into: i, input: 'BASE' }); await choose(page, o, 'SIDE', '∃j (0 = 2 · j)');
        const w = await drag(page, 'exists_intro', { after: o }); await typeIn(page, w, 'TERM', '0'); log(await phrase(page, w));
        await drag(page, 'rfl', { after: w });
        const k = await drag(page, 'or_elim', { into: i, input: 'STEP' }); await choose(page, k, 'OR', '((∃j (n = 2 · j)) ∨ (∃j (n = 2 · j + 1)))'); log(await phrase(page, k));
        for (const [part, exists, side, witness, known] of [['LEFT', '∃j (n = 2 · j)', '∃j (n + 1 = 2 · j + 1)', 'j₀', 'n = 2 · j₀'], ['RIGHT', '∃j (n = 2 · j + 1)', '∃j (n + 1 = 2 · j)', 'j₀ + 1', 'n = 2 · j₀ + 1']]) {
            const x = await drag(page, 'exists_elim', { into: k, input: part }); await choose(page, x, 'EXISTS', exists); log(await phrase(page, x));
            const s = await drag(page, 'or_intro', { after: x }); await choose(page, s, 'SIDE', side);
            const v = await drag(page, 'exists_intro', { after: s });
            if (witness === 'j₀') await choose(page, v, 'TERM', witness); else await typeIn(page, v, 'TERM', witness);
            log(await phrase(page, v));
            await fromFacts(page, 'calc_hyps', { after: v }, [known], log);
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

// Each level of unit 11, as its hints describe it.
const inductionOn = async (page, variable, log) => {
    const i = await drag(page, 'induction', { goal: true });
    await choose(page, i, 'VARIABLE', variable);
    log(await phrase(page, i));
    return i;
};
// Unfolds the given functions (or [function, part]), one after the other, at the start of a part.
const unfoldAll = async (page, where, names) => {
    let last = null;
    for (const name of names) last = await unfoldFunction(page, last ? { after: last } : where, ...[name].flat());
    return last;
};
const UNIT11 = [
    async (page, log) => {
        const i = await inductionOn(page, 'l', log);
        await drag(page, 'rfl', { into: i, input: 'NIL' });
        const u = await unfoldAll(page, { into: i, input: 'CONS' }, ['++']);
        const r = await rewrite(page, { after: u }, 'l ++ [] = l', 'את l ++ [] ב־l', 'המטרה', log);
        await drag(page, 'rfl', { after: r });
    },
    async (page, log) => {
        const i = await inductionOn(page, 'l', log);
        await drag(page, 'calc', { after: await unfoldAll(page, { into: i, input: 'NIL' }, ['++', 'length']) });
        const u = await unfoldAll(page, { into: i, input: 'CONS' }, ['++', ['length', 'length(a :: (l ++ m))'], ['length', 'length(a :: l)']]);
        const r = await rewrite(page, { after: u }, 'length(l ++ m) = length(l) + length(m)', 'את length(l ++ m) ב־length(l) + length(m)', 'המטרה', log);
        await drag(page, 'calc', { after: r });
    },
    async (page, log) => {
        const i = await inductionOn(page, 'l', log);
        await drag(page, 'rfl', { into: i, input: 'NIL' });
        const u = await unfoldAll(page, { into: i, input: 'CONS' }, [['++', '(a :: l) ++ (m ++ k)'], ['++', '(a :: l) ++ m'], ['++', '(a :: (l ++ m)) ++ k']]);
        const r = await rewrite(page, { after: u }, 'l ++ (m ++ k) = (l ++ m) ++ k', 'את l ++ (m ++ k) ב־(l ++ m) ++ k', 'המטרה', log);
        await drag(page, 'rfl', { after: r });
    },
    async (page, log) => {
        const i = await inductionOn(page, 't', log);
        await drag(page, 'rfl', { into: i, input: 'LEAF' });
        const u = await unfoldAll(page, { into: i, input: 'NODE' }, ['leaves', 'nodes']);
        const r1 = await rewrite(page, { after: u }, 'leaves(l) = nodes(l) + 1', 'את leaves(l) ב־nodes(l) + 1', 'המטרה', log);
        const r2 = await rewrite(page, { after: r1 }, 'leaves(r) = nodes(r) + 1', 'את leaves(r) ב־nodes(r) + 1', 'המטרה', log);
        await drag(page, 'calc', { after: r2 });
    },
    async (page, log) => {
        const i = await inductionOn(page, 't', log);
        await drag(page, 'calc', { after: await unfoldAll(page, { into: i, input: 'LEAF' }, ['height', 'nodes']) });
        await fromFacts(page, 'calc_hyps', { after: await unfoldAll(page, { into: i, input: 'NODE' }, ['height', 'nodes']) }, ['height(l) ≤ nodes(l)', 'height(r) ≤ nodes(r)'], log);
    },
    async (page, log) => {
        const i = await inductionOn(page, 't', log);
        await drag(page, 'rfl', { into: i, input: 'LEAF' });
        const u = await unfoldAll(page, { into: i, input: 'NODE' }, [['mirror', 'mirror(node(l,r))'], ['mirror', 'mirror(node(mirror(r),mirror(l)))']]);
        const r1 = await rewrite(page, { after: u }, 'mirror(mirror(l)) = l', 'את mirror(mirror(l)) ב־l', 'המטרה', log);
        const r2 = await rewrite(page, { after: r1 }, 'mirror(mirror(r)) = r', 'את mirror(mirror(r)) ב־r', 'המטרה', log);
        await drag(page, 'rfl', { after: r2 });
    },
    // The step of a binary connective: unfold both, replace by both
    // hypotheses (shown as "את atoms(φ) ב־binaries(φ) + 1"), then the last move.
    ...[['opening', 'closing', ['CONJ'], (x) => `closing(${x})`, 'rfl'], ['atoms', 'binaries', ['CONJ'], (x) => `binaries(${x}) + 1`, 'calc']]
        .map(([first, second, binary, value, last]) => async (page, log) => {
        const i = await inductionOn(page, 'φ', log);
        await drag(page, 'rfl', { into: i, input: 'ATOM' });
        await drag(page, 'exact', { after: await unfoldAll(page, { into: i, input: 'NEG' }, [first, second]) });
        for (const input of binary) {
            let after = await unfoldAll(page, { into: i, input }, [first, second]);
            for (const x of ['φ', 'ψ']) after = await rewrite(page, { after }, `${first}(${x}) = ${value(x)}`, `את ${first}(${x}) ב־${value(x)}`, 'המטרה', log);
            await drag(page, last, { after });
        }
    }),
    async (page, log) => {
        const i = await inductionOn(page, 'φ', log);
        const unfolds = ['depth', 'binaries', 'negations'];
        await drag(page, 'calc', { after: await unfoldAll(page, { into: i, input: 'ATOM' }, unfolds) });
        const hypothesis = (x) => `depth(${x}) ≤ binaries(${x}) + negations(${x})`;
        for (const [input, facts] of [['NEG', [hypothesis('φ')]], ['CONJ', [hypothesis('φ'), hypothesis('ψ')]]]) {
            await fromFacts(page, 'calc_hyps', { after: await unfoldAll(page, { into: i, input }, unfolds) }, facts, log);
        }
    },
];

// Each level of unit 8 after equality (the relations), as its hints describe it.
const TRANS = (r) => `∀x (∀y (∀z (((x, y) ∈ ${r} ∧ (y, z) ∈ ${r}) → (x, z) ∈ ${r})))`;
// "לפי ה"לכל" … עבור העצם …", one object after another, each on the result of the last.
const instantiate = async (page, where, forall, terms, log) => {
    let last = null;
    for (const [statement, term] of [[forall, terms[0]], ...terms.slice(1).map((term) => [null, term])]) {
        const e = await drag(page, 'forall_elim', last ? { after: last } : where);
        let options = [];
        for (let tries = 0; tries < 6 && !options.some((text) => text.startsWith('∀')); tries += 1) {
            if (tries) await page.waitForTimeout(2000);
            options = await page.evaluate((id) => window.__easyleanWorkspace.getBlockById(id).getField('FORALL').getOptions(false)
                .map(([text]) => String(text).replace(/[⁦⁧⁩]/g, '')), e);
        }
        // After the first, the newest "for all" in hand (the last one offered before the typing item).
        await choose(page, e, 'FORALL', statement || options.filter((text) => text.startsWith('∀')).at(-1));
        await choose(page, e, 'TERM', term); log(await phrase(page, e));
        last = e;
    }
    return last;
};
const RELATIONS = [
    async (page, log) => {
        const q = await drag(page, 'set_eq', { goal: true }); log(await phrase(page, q));
        for (const part of ['FIRST', 'SECOND']) {
            const i = await drag(page, 'subset_intro', { into: q, input: part }); log(await phrase(page, i));
            const u1 = await unfold(page, { after: i }, '(x₀, y₀) ∈ (R⁻¹)⁻¹', log);
            const u2 = await unfold(page, { after: u1 }, '(y₀, x₀) ∈ R⁻¹', log);
            await drag(page, 'exact', { after: u2 });
        }
    },
    async (page, log) => {
        const i = await drag(page, 'subset_intro', { goal: true }); log(await phrase(page, i));
        const u1 = await unfold(page, { after: i }, '(x₀, y₀) ∈ (R ∘ S)⁻¹', log);
        const u2 = await unfold(page, { after: u1 }, '(y₀, x₀) ∈ (R ∘ S)', log);
        const x = await drag(page, 'exists_elim', { after: u2 }); await choose(page, x, 'EXISTS', '∃z ((y₀, z) ∈ S ∧ (z, x₀) ∈ R)'); log(await phrase(page, x));
        const d = await drag(page, 'and_elim', { after: x }); await choose(page, d, 'AND', '((y₀, z₀) ∈ S ∧ (z₀, x₀) ∈ R)');
        const u3 = await unfold(page, { after: d }, '(x₀, y₀) ∈ (S⁻¹ ∘ R⁻¹)', log);
        const w = await drag(page, 'exists_intro', { after: u3 }); await choose(page, w, 'TERM', 'z₀');
        const s = await drag(page, 'and_intro', { after: w }); log(await phrase(page, s));
        for (const [part, pair] of [['LEFT', '(x₀, z₀) ∈ R⁻¹'], ['RIGHT', '(z₀, y₀) ∈ S⁻¹']]) {
            const u = await unfold(page, { into: s, input: part }, pair, log);
            await drag(page, 'exact', { after: u });
        }
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const u = await unfold(page, { after: a }, 'reflexive(R)', log);
        const i = await drag(page, 'subset_intro', { after: u }); log(await phrase(page, i));
        const g = await unfold(page, { after: i }, '(x₀, y₀) ∈ (R ∘ R)', log);
        const w = await drag(page, 'exists_intro', { after: g }); await choose(page, w, 'TERM', 'y₀');
        const s = await drag(page, 'and_intro', { after: w });
        await drag(page, 'exact', { into: s, input: 'LEFT' });
        const e = await instantiate(page, { into: s, input: 'RIGHT' }, '∀x ((x, x) ∈ R)', ['y₀'], log);
        await drag(page, 'exact', { after: e });
    },
    async (page, log) => {
        const k = await drag(page, 'iff_intro', { goal: true }); log(await phrase(page, k));
        const a = await drag(page, 'assume', { into: k, input: 'FORWARD' });
        const u = await unfold(page, { after: a }, 'symmetric(R)', log);
        const i = await drag(page, 'subset_intro', { after: u }); log(await phrase(page, i));
        const v = await unfold(page, { after: i }, '(x₀, y₀) ∈ R⁻¹', log);
        const e = await instantiate(page, { after: v }, '∀x (∀y ((x, y) ∈ R → (y, x) ∈ R))', ['y₀', 'x₀'], log);
        const f = await drag(page, 'forward', { after: e }); await choose(page, f, 'RULE', '((y₀, x₀) ∈ R → (x₀, y₀) ∈ R)'); await choose(page, f, 'PREMISE', '(y₀, x₀) ∈ R');
        await drag(page, 'exact', { after: f });
        const b = await drag(page, 'assume', { into: k, input: 'BACKWARD' });
        const g = await unfold(page, { after: b }, 'symmetric(R)', log);
        const i1 = await drag(page, 'forall_intro', { after: g });
        const i2 = await drag(page, 'forall_intro', { after: i1 }); log(await phrase(page, i2));
        const a2 = await drag(page, 'assume', { after: i2 }); log(await phrase(page, a2));
        const c = await drag(page, 'claim', { after: a2 }); await choose(page, c, 'CLAIM', '(y₀, x₀) ∈ R⁻¹'); log(await phrase(page, c));
        const w = await unfold(page, { into: c, input: 'PROOF' }, '(y₀, x₀) ∈ R⁻¹', log);
        await drag(page, 'exact', { after: w });
        const m = await drag(page, 'subset_elim', { after: c }); await choose(page, m, 'SUBSET', 'R⁻¹ ⊆ R'); await choose(page, m, 'MEMBER', '(y₀, x₀) ∈ R⁻¹'); log(await phrase(page, m));
        await drag(page, 'exact', { after: m });
    },
    async (page, log) => {
        const k = await drag(page, 'iff_intro', { goal: true }); log(await phrase(page, k));
        const a = await drag(page, 'assume', { into: k, input: 'FORWARD' });
        const u = await unfold(page, { after: a }, 'transitive(R)', log);
        const i = await drag(page, 'subset_intro', { after: u }); log(await phrase(page, i));
        const v = await unfold(page, { after: i }, '(x₀, y₀) ∈ (R ∘ R)', log);
        const x = await drag(page, 'exists_elim', { after: v }); await choose(page, x, 'EXISTS', '∃z ((x₀, z) ∈ R ∧ (z, y₀) ∈ R)'); log(await phrase(page, x));
        const e = await instantiate(page, { after: x }, TRANS('R'), ['x₀', 'z₀', 'y₀'], log);
        const f = await drag(page, 'forward', { after: e }); await choose(page, f, 'RULE', '(((x₀, z₀) ∈ R ∧ (z₀, y₀) ∈ R) → (x₀, y₀) ∈ R)'); await choose(page, f, 'PREMISE', '((x₀, z₀) ∈ R ∧ (z₀, y₀) ∈ R)');
        await drag(page, 'exact', { after: f });
        const b = await drag(page, 'assume', { into: k, input: 'BACKWARD' });
        const g = await unfold(page, { after: b }, 'transitive(R)', log);
        let last = g;
        for (let n = 0; n < 3; n += 1) last = await drag(page, 'forall_intro', { after: last });
        const a2 = await drag(page, 'assume', { after: last }); log(await phrase(page, a2));
        const d = await drag(page, 'and_elim', { after: a2 }); await choose(page, d, 'AND', '((x₀, y₀) ∈ R ∧ (y₀, z₀) ∈ R)');
        const c = await drag(page, 'claim', { after: d }); await choose(page, c, 'CLAIM', '(x₀, z₀) ∈ (R ∘ R)'); log(await phrase(page, c));
        const w = await unfold(page, { into: c, input: 'PROOF' }, '(x₀, z₀) ∈ (R ∘ R)', log);
        const y = await drag(page, 'exists_intro', { after: w }); await choose(page, y, 'TERM', 'y₀');
        const s = await drag(page, 'and_intro', { after: y });
        await drag(page, 'exact', { into: s, input: 'LEFT' });
        await drag(page, 'exact', { into: s, input: 'RIGHT' });
        const m = await drag(page, 'subset_elim', { after: c }); await choose(page, m, 'SUBSET', 'R ∘ R ⊆ R'); await choose(page, m, 'MEMBER', '(x₀, z₀) ∈ (R ∘ R)');
        await drag(page, 'exact', { after: m });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const u1 = await unfold(page, { after: a }, 'antisymmetric(R)', log);
        const u2 = await unfold(page, { after: u1 }, 'antisymmetric(R ∩ S)', log);
        const i1 = await drag(page, 'forall_intro', { after: u2 });
        const i2 = await drag(page, 'forall_intro', { after: i1 });
        const a2 = await drag(page, 'assume', { after: i2 }); log(await phrase(page, a2));
        const d = await drag(page, 'and_elim', { after: a2 }); await choose(page, d, 'AND', '((x₀, y₀) ∈ (R ∩ S) ∧ (y₀, x₀) ∈ (R ∩ S))');
        let last = d;
        for (const [pair, and] of [['(x₀, y₀)', '((x₀, y₀) ∈ R ∧ (x₀, y₀) ∈ S)'], ['(y₀, x₀)', '((y₀, x₀) ∈ R ∧ (y₀, x₀) ∈ S)']]) {
            const v = await unfold(page, { after: last }, `${pair} ∈ (R ∩ S)`, log);
            last = await drag(page, 'and_elim', { after: v }); await choose(page, last, 'AND', and);
        }
        const e = await instantiate(page, { after: last }, '∀x (∀y (((x, y) ∈ R ∧ (y, x) ∈ R) → x = y))', ['x₀', 'y₀'], log);
        const r = await drag(page, 'apply_rule', { after: e }); await choose(page, r, 'RULE', '(((x₀, y₀) ∈ R ∧ (y₀, x₀) ∈ R) → x₀ = y₀)'); log(await phrase(page, r));
        const s = await drag(page, 'and_intro', { after: r });
        await drag(page, 'exact', { into: s, input: 'LEFT' });
        await drag(page, 'exact', { into: s, input: 'RIGHT' });
    },
    async (page, log) => {
        const u = await unfold(page, { goal: true }, 'antisymmetric(R)', log);
        const e = await instantiate(page, { after: u }, '∀x (∀y (((x, y) ∈ R ∧ (y, x) ∈ R) → x = y))', ['m', 'n'], log);
        const r = await drag(page, 'apply_rule', { after: e }); await choose(page, r, 'RULE', '(((m, n) ∈ R ∧ (n, m) ∈ R) → m = n)');
        const s = await drag(page, 'and_intro', { after: r }); log(await phrase(page, s));
        for (const [part, first, second] of [['LEFT', 'm', 'n'], ['RIGHT', 'n', 'm']]) {
            const f = await instantiate(page, { into: s, input: part }, `∀x ((${first}, x) ∈ R)`, [second], log);
            await drag(page, 'exact', { after: f });
        }
    },
    async (page, log) => {
        const t = await unfold(page, { goal: true }, 'transitive(R)', log);
        const q = await drag(page, 'set_eq', { after: t }); log(await phrase(page, q));
        for (const [part, from, to, path] of [['FIRST', 'a', 'b', ['b', 'a', 'x₀']], ['SECOND', 'b', 'a', ['a', 'b', 'x₀']]]) {
            const i = await drag(page, 'subset_intro', { into: q, input: part }); log(await phrase(page, i));
            const u1 = await unfold(page, { after: i }, `x₀ ∈ [${from}]_R`, log);
            const u2 = await unfold(page, { after: u1 }, `x₀ ∈ [${to}]_R`, log);
            const e = await instantiate(page, { after: u2 }, TRANS('R'), path, log);
            const r = await drag(page, 'apply_rule', { after: e }); await choose(page, r, 'RULE', `(((${path[0]}, ${path[1]}) ∈ R ∧ (${path[1]}, x₀) ∈ R) → (${path[0]}, x₀) ∈ R)`);
            const s = await drag(page, 'and_intro', { after: r });
            await drag(page, 'exact', { into: s, input: 'RIGHT' });
            if (part === 'SECOND') { await drag(page, 'exact', { into: s, input: 'LEFT' }); continue; }
            const v = await unfold(page, { into: s, input: 'LEFT' }, 'symmetric(R)', log);
            const f = await instantiate(page, { after: v }, '∀x (∀y ((x, y) ∈ R → (y, x) ∈ R))', ['a', 'b'], log);
            const g = await drag(page, 'forward', { after: f }); await choose(page, g, 'RULE', '((a, b) ∈ R → (b, a) ∈ R)'); await choose(page, g, 'PREMISE', '(a, b) ∈ R');
            await drag(page, 'exact', { after: g });
        }
    },
    async (page, log) => {
        const u1 = await unfold(page, { goal: true }, 'c ∈ [a]_R', log);
        const u2 = await unfold(page, { after: u1 }, 'c ∈ [b]_R', log);
        const t = await unfold(page, { after: u2 }, 'transitive(R)', log);
        const e = await instantiate(page, { after: t }, TRANS('R'), ['a', 'c', 'b'], log);
        const r = await drag(page, 'apply_rule', { after: e }); await choose(page, r, 'RULE', '(((a, c) ∈ R ∧ (c, b) ∈ R) → (a, b) ∈ R)');
        const s = await drag(page, 'and_intro', { after: r });
        await drag(page, 'exact', { into: s, input: 'LEFT' });
        const v = await unfold(page, { into: s, input: 'RIGHT' }, 'symmetric(R)', log);
        const f = await instantiate(page, { after: v }, '∀x (∀y ((x, y) ∈ R → (y, x) ∈ R))', ['b', 'c'], log);
        const g = await drag(page, 'forward', { after: f }); await choose(page, g, 'RULE', '((b, c) ∈ R → (c, b) ∈ R)'); await choose(page, g, 'PREMISE', '(b, c) ∈ R');
        await drag(page, 'exact', { after: g });
    },
    async (page, log) => {
        const t1 = await unfold(page, { goal: true }, 'transitive(R)', log);
        const t2 = await unfold(page, { after: t1 }, 'transitive(S)', log);
        const t3 = await unfold(page, { after: t2 }, 'transitive(R ∘ S)', log);
        let last = t3;
        for (let n = 0; n < 3; n += 1) last = await drag(page, 'forall_intro', { after: last });
        const a = await drag(page, 'assume', { after: last }); log(await phrase(page, a));
        last = await drag(page, 'and_elim', { after: a }); await choose(page, last, 'AND', '((x₀, y₀) ∈ (R ∘ S) ∧ (y₀, z₀) ∈ (R ∘ S))');
        for (const [pair, exists, and] of [['(x₀, y₀)', '∃z ((x₀, z) ∈ S ∧ (z, y₀) ∈ R)', '((x₀, z₁) ∈ S ∧ (z₁, y₀) ∈ R)'], ['(y₀, z₀)', '∃z ((y₀, z) ∈ S ∧ (z, z₀) ∈ R)', '((y₀, z₂) ∈ S ∧ (z₂, z₀) ∈ R)']]) {
            const u = await unfold(page, { after: last }, `${pair} ∈ (R ∘ S)`, log);
            const x = await drag(page, 'exists_elim', { after: u }); await choose(page, x, 'EXISTS', exists);
            last = await drag(page, 'and_elim', { after: x }); await choose(page, last, 'AND', and);
        }
        const c = await drag(page, 'claim', { after: last }); await choose(page, c, 'CLAIM', '(z₁, z₂) ∈ (S ∘ R)'); log(await phrase(page, c));
        const w = await unfold(page, { into: c, input: 'PROOF' }, '(z₁, z₂) ∈ (S ∘ R)', log);
        const y = await drag(page, 'exists_intro', { after: w }); await choose(page, y, 'TERM', 'y₀');
        const s = await drag(page, 'and_intro', { after: y });
        await drag(page, 'exact', { into: s, input: 'LEFT' });
        await drag(page, 'exact', { into: s, input: 'RIGHT' });
        const r = await rewrite(page, { after: c }, 'R ∘ S = S ∘ R', 'את S ∘ R ב־R ∘ S', '(z₁, z₂) ∈ (S ∘ R)', log);
        const u = await unfold(page, { after: r }, '(z₁, z₂) ∈ (R ∘ S)', log);
        const x = await drag(page, 'exists_elim', { after: u }); await choose(page, x, 'EXISTS', '∃z ((z₁, z) ∈ S ∧ (z, z₂) ∈ R)');
        const d = await drag(page, 'and_elim', { after: x }); await choose(page, d, 'AND', '((z₁, z₃) ∈ S ∧ (z₃, z₂) ∈ R)');
        const g = await unfold(page, { after: d }, '(x₀, z₀) ∈ (R ∘ S)', log);
        const v = await drag(page, 'exists_intro', { after: g }); await choose(page, v, 'TERM', 'z₃');
        const k = await drag(page, 'and_intro', { after: v }); log(await phrase(page, k));
        for (const [part, rel, path] of [['LEFT', 'S', ['x₀', 'z₁', 'z₃']], ['RIGHT', 'R', ['z₃', 'z₂', 'z₀']]]) {
            const e = await instantiate(page, { into: k, input: part }, TRANS(rel), path, log);
            const p = await drag(page, 'apply_rule', { after: e });
            await choose(page, p, 'RULE', `(((${path[0]}, ${path[1]}) ∈ ${rel} ∧ (${path[1]}, ${path[2]}) ∈ ${rel}) → (${path[0]}, ${path[2]}) ∈ ${rel})`);
            const j = await drag(page, 'and_intro', { after: p });
            await drag(page, 'exact', { into: j, input: 'LEFT' });
            await drag(page, 'exact', { into: j, input: 'RIGHT' });
        }
    },
];

// Unit 12 offers every move, in drawers: a walk for some of its levels, by
// level number, each in other drawers.
const UNIT12 = {
    1: async (page, log) => {
        const k = await drag(page, 'iff_intro', { goal: true }); log(await phrase(page, k));
        const a = await drag(page, 'assume', { into: k, input: 'FORWARD' });
        const b = await drag(page, 'by_contradiction', { after: a }); log(await phrase(page, b));
        const r1 = await replace(page, { after: b }, '¬(A ∨ B) ↔ (¬A ∧ ¬B)', 'את ¬((P → Q) ∨ (P → R)) ב־(¬(P → Q) ∧ ¬(P → R))', '¬((P → Q) ∨ (P → R))', log);
        const d1 = await drag(page, 'and_elim', { after: r1 }); await choose(page, d1, 'AND', '(¬(P → Q) ∧ ¬(P → R))');
        let last = d1;
        for (const [rule, side] of [['Q', '¬Q'], ['R', '¬R']]) {
            const r = await replace(page, { after: last }, '¬(A → B) ↔ (A ∧ ¬B)', `את ¬(P → ${rule}) ב־(P ∧ ${side})`, `¬(P → ${rule})`, log);
            last = await drag(page, 'and_elim', { after: r }); await choose(page, last, 'AND', `(P ∧ ${side})`);
        }
        const f = await drag(page, 'forward', { after: last }); await choose(page, f, 'RULE', '(P → (Q ∨ R))'); await choose(page, f, 'PREMISE', 'P'); log(await phrase(page, f));
        const c = await drag(page, 'or_elim', { after: f }); await choose(page, c, 'OR', '(Q ∨ R)');
        for (const [part, fact] of [['LEFT', 'Q'], ['RIGHT', 'R']]) {
            const t = await drag(page, 'contradiction', { into: c, input: part }); await choose(page, t, 'FACT', fact);
        }
        const a1 = await drag(page, 'assume', { into: k, input: 'BACKWARD' });
        const a2 = await drag(page, 'assume', { after: a1 }); log(await phrase(page, a2));
        const o = await drag(page, 'or_elim', { after: a2 }); await choose(page, o, 'OR', '((P → Q) ∨ (P → R))');
        for (const [part, rule] of [['LEFT', 'Q'], ['RIGHT', 'R']]) {
            const i = await drag(page, 'or_intro', { into: o, input: part }); await choose(page, i, 'SIDE', rule);
            const g = await drag(page, 'forward', { after: i }); await choose(page, g, 'RULE', `(P → ${rule})`); await choose(page, g, 'PREMISE', 'P');
            await drag(page, 'exact', { after: g });
        }
    },
    12: async (page, log) => {
        const k = await drag(page, 'iff_intro', { goal: true }); log(await phrase(page, k));
        const a = await drag(page, 'assume', { into: k, input: 'FORWARD' });
        const i = await drag(page, 'subset_intro', { after: a }); log(await phrase(page, i));
        const u = await unfold(page, { after: i }, 'x₀ ∈ ⋃F', log);
        const x = await drag(page, 'exists_elim', { after: u }); await choose(page, x, 'EXISTS', '∃S (S ∈ F ∧ x₀ ∈ S)');
        const d = await drag(page, 'and_elim', { after: x }); await choose(page, d, 'AND', '(S₀ ∈ F ∧ x₀ ∈ S₀)');
        const e1 = await drag(page, 'subset_elim', { after: d }); await choose(page, e1, 'SUBSET', 'F ⊆ 𝒫(A)'); await choose(page, e1, 'MEMBER', 'S₀ ∈ F');
        const u2 = await unfold(page, { after: e1 }, 'S₀ ∈ 𝒫(A)', log);
        const e2 = await drag(page, 'subset_elim', { after: u2 }); await choose(page, e2, 'SUBSET', 'S₀ ⊆ A'); await choose(page, e2, 'MEMBER', 'x₀ ∈ S₀');
        await drag(page, 'exact', { after: e2 });
        const b = await drag(page, 'assume', { into: k, input: 'BACKWARD' });
        const j = await drag(page, 'subset_intro', { after: b }); log(await phrase(page, j));
        const v = await unfold(page, { after: j }, 'X₀ ∈ 𝒫(A)', log);
        const j2 = await drag(page, 'subset_intro', { after: v }); log(await phrase(page, j2));
        const c = await drag(page, 'claim', { after: j2 }); await choose(page, c, 'CLAIM', 'x₀ ∈ ⋃F'); log(await phrase(page, c));
        const w = await unfold(page, { into: c, input: 'PROOF' }, 'x₀ ∈ ⋃F', log);
        const y = await drag(page, 'exists_intro', { after: w }); await choose(page, y, 'TERM', 'X₀');
        const s = await drag(page, 'and_intro', { after: y });
        await drag(page, 'exact', { into: s, input: 'LEFT' });
        await drag(page, 'exact', { into: s, input: 'RIGHT' });
        const m = await drag(page, 'subset_elim', { after: c }); await choose(page, m, 'SUBSET', '⋃F ⊆ A'); await choose(page, m, 'MEMBER', 'x₀ ∈ ⋃F');
        await drag(page, 'exact', { after: m });
    },
    16: async (page, log) => {
        const i = await drag(page, 'induction', { goal: true }); await choose(page, i, 'VARIABLE', 'n'); log(await phrase(page, i));
        await drag(page, 'calc', { into: i, input: 'BASE' });
        const e1 = await drag(page, 'forall_elim', { into: i, input: 'STEP' }); await choose(page, e1, 'FORALL', '∀m (∀k (m ≤ k ↔ f(m) ≤ f(k)))'); await typeIn(page, e1, 'TERM', 'n + 1');
        const e2 = await drag(page, 'forall_elim', { after: e1 }); await choose(page, e2, 'FORALL', '∀k (n + 1 ≤ k ↔ f(n + 1) ≤ f(k))'); await choose(page, e2, 'TERM', 'n'); log(await phrase(page, e2));
        await fromFacts(page, 'calc_hyps', { after: e2 }, ['n ≤ f(n)', '(n + 1 ≤ n ↔ f(n + 1) ≤ f(n))'], log);
    },
};

const UNITS = [
    { unit: 3, world: 'יחידה 3 - שלילה והוכחה בשלילה', walks: UNIT3 },
    { unit: 4, world: 'יחידה 4 - כמתים', walks: UNIT4 },
    { unit: 5, world: 'יחידה 5 - שקילויות לוגיות', walks: UNIT5 },
    { unit: 6, world: 'יחידה 6 - קבוצות', walks: UNIT6 },
    { unit: 7, world: 'יחידה 7 - קבוצות של קבוצות', walks: UNIT7 },
    { unit: 8, world: 'יחידה 8 - שוויון ויחסים', walks: [...EQUALITY, ...RELATIONS] },
    { unit: 9, world: 'יחידה 9 - פונקציות', walks: UNIT9 },
    { unit: 10, world: 'יחידה 10 - אינדוקציה', walks: UNIT10 },
    { unit: 11, world: 'יחידה 11 - אינדוקציה מבנית', walks: UNIT11 },
    { unit: 12, world: 'יחידה 12 - תרגילים מסכמים', walks: UNIT12 },
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
