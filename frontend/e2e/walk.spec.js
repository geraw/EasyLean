import { test, expect, showUnit } from './helpers';
import { unitSolutions } from './solutions';

// A student's walk through units 4-7, as their hints describe each level:
// blocks dragged from the toolbox with the mouse, and fields chosen only
// among the options their menu shows. (The solutions in solutions.spec.js
// are built directly, which does not catch a hint that cannot be followed.) SHOTS=<dir> saves a screenshot of each level; WHERE=1
// logs where each block attached.
const SHOTS = process.env.SHOTS;

// A block's text as shown, row by row.
const phrase = (page, id) => page.evaluate((id) => window.__easyleanWorkspace.getBlockById(id).inputList
    .map((input) => input.fieldRow.filter((f) => f.isVisible()).map((f) => f.getText()).join(' ')).join(' / ')
    .replace(/[\u2066\u2067\u2069\u200f]/g, ''), id);

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
            : where.after ? (block.nextConnection || block.getInput('BODY').connection) : block.getInput(where.input).connection;
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
    // After a move that opens a structure is inside it (see wrap in blocks/moves.js).
    else if (where.after) connection = ws.getBlockById(where.after).nextConnection || ws.getBlockById(where.after).getInput('BODY').connection;
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
            : where.after ? (ws.getBlockById(where.after).nextConnection || ws.getBlockById(where.after).getInput('BODY').connection)
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
            .getOptions(false).map(([text, value]) => [String(text).replace(/[\u2066\u2067\u2069\u200f]/g, ''), value]), [id, field]);
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
        const o = await drag(page, 'or_by_negation', { goal: true }); log(await phrase(page, o));
        await drag(page, 'exact', { after: o });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const o = await drag(page, 'or_by_negation', { after: a }); log(await phrase(page, o));
        const r = await drag(page, 'apply_rule', { after: o }); await choose(page, r, 'RULE', '(P → Q)'); log(await phrase(page, r));
        const b = await drag(page, 'by_contradiction', { after: r }); log(await phrase(page, b));
        const e = await drag(page, 'not_elim', { after: b }); await choose(page, e, 'NEGATION', '¬¬P'); log(await phrase(page, e));
        await drag(page, 'exact', { after: e });
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
const IMP_OR = '(A → B) ≡ (¬A ∨ B)';
const NOT_OR = '¬(A ∨ B) ≡ (¬A ∧ ¬B)';
const OR_AS_IMP = '(¬A → B) ≡ (A ∨ B)';
const NOT_NOT = '¬¬A ≡ A';
const UNIT6 = [
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
        const r = await replace(page, { goal: true }, '¬∃x (P(x)) ≡ ∀x (¬P(x))', 'את ¬∃x (P(x)) ב־∀x (¬P(x))', '¬∃x (P(x))', log);
        const f = await drag(page, 'forall_elim', { after: r }); await choose(page, f, 'FORALL', '∀x (¬P(x))'); await choose(page, f, 'TERM', 'a'); log(await phrase(page, f));
        await drag(page, 'exact', { after: f });
    },
    async (page, log) => {
        const r = await replace(page, { goal: true }, NOT_OR, 'את ¬(P ∨ Q) ב־(¬P ∧ ¬Q)', '¬(P ∨ Q)', log);
        const d = await drag(page, 'and_elim', { after: r }); await choose(page, d, 'AND', '(¬P ∧ ¬Q)'); log(await phrase(page, d));
        await drag(page, 'exact', { after: d });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const r = await replace(page, { after: a }, '(A → B) ≡ (¬B → ¬A)', 'את (P → Q) ב־(¬Q → ¬P)', 'המטרה', log);
        await drag(page, 'exact', { after: r });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const r1 = await replace(page, { after: a }, NOT_OR, 'את ¬(P ∨ ¬Q) ב־(¬P ∧ ¬¬Q)', '¬(P ∨ ¬Q)', log);
        const r2 = await replace(page, { after: r1 }, '¬¬A ≡ A', 'את ¬¬Q ב־Q', '(¬P ∧ ¬¬Q)', log);
        await drag(page, 'exact', { after: r2 });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const r1 = await replace(page, { after: a }, '¬∀x (P(x)) ≡ ∃x (¬P(x))', 'את ¬∀x (∃y (R(x,y))) ב־∃x (¬∃y (R(x,y)))', '¬∀x (∃y (R(x,y)))', log);
        const r2 = await replace(page, { after: r1 }, '¬∃x (P(x)) ≡ ∀x (¬P(x))', 'את ¬∃y (R(x,y)) ב־∀y (¬R(x,y))', '∃x (¬∃y (R(x,y)))', log); log(await state(page));
        await drag(page, 'exact', { after: r2 });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const r1 = await replace(page, { after: a }, '¬∀x (P(x)) ≡ ∃x (¬P(x))', 'את ¬∀x (P(x) → Q(x)) ב־∃x (¬(P(x) → Q(x)))', '¬∀x (P(x) → Q(x))', log);
        const r2 = await replace(page, { after: r1 }, '¬(A → B) ≡ (A ∧ ¬B)', 'את ¬(P(x) → Q(x)) ב־(P(x) ∧ ¬Q(x))', '∃x (¬(P(x) → Q(x)))', log); log(await state(page));
        await drag(page, 'exact', { after: r2 });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const r1 = await replace(page, { after: a }, '¬(A → B) ≡ (A ∧ ¬B)', 'את ¬((P ∧ Q) → (R ∨ ¬S)) ב־((P ∧ Q) ∧ ¬(R ∨ ¬S))', '¬((P ∧ Q) → (R ∨ ¬S))', log);
        const r2 = await replace(page, { after: r1 }, NOT_OR, 'את ¬(R ∨ ¬S) ב־(¬R ∧ ¬¬S)', '((P ∧ Q) ∧ ¬(R ∨ ¬S))', log);
        const r3 = await replace(page, { after: r2 }, NOT_NOT, 'את ¬¬S ב־S', '((P ∧ Q) ∧ (¬R ∧ ¬¬S))', log);
        await drag(page, 'exact', { after: r3 });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const r1 = await replace(page, { after: a }, '¬∀x (P(x)) ≡ ∃x (¬P(x))', 'את ¬∀x (∃y (R(x,y) ∧ Q(y))) ב־∃x (¬∃y (R(x,y) ∧ Q(y)))', '¬∀x (∃y (R(x,y) ∧ Q(y)))', log);
        const r2 = await replace(page, { after: r1 }, '¬∃x (P(x)) ≡ ∀x (¬P(x))', 'את ¬∃y (R(x,y) ∧ Q(y)) ב־∀y (¬(R(x,y) ∧ Q(y)))', '∃x (¬∃y (R(x,y) ∧ Q(y)))', log);
        const r3 = await replace(page, { after: r2 }, '¬(A ∧ B) ≡ (¬A ∨ ¬B)', 'את ¬(R(x,y) ∧ Q(y)) ב־(¬R(x,y) ∨ ¬Q(y))', '∃x (∀y (¬(R(x,y) ∧ Q(y))))', log);
        await drag(page, 'exact', { after: r3 });
    },
    async (page, log) => {
        const r = await replace(page, { goal: true }, OR_AS_IMP, 'את (P ∨ Q) ב־(¬P → Q)', 'המטרה', log);
        const a = await drag(page, 'assume', { after: r }); log(await phrase(page, a));
        const f1 = await drag(page, 'forward', { after: a }); await choose(page, f1, 'RULE', '(¬P → R)'); await choose(page, f1, 'PREMISE', '¬P'); log(await phrase(page, f1));
        const f2 = await drag(page, 'forward', { after: f1 }); await choose(page, f2, 'RULE', '(R → Q)'); await choose(page, f2, 'PREMISE', 'R'); log(await phrase(page, f2));
        await drag(page, 'exact', { after: f2 });
    },
    async (page, log) => {
        const r = await replace(page, { goal: true }, OR_AS_IMP, 'את (¬P ∨ Q) ב־(¬¬P → Q)', 'המטרה', log);
        const a = await drag(page, 'assume', { after: r }); log(await phrase(page, a));
        const d = await replace(page, { after: a }, NOT_NOT, 'את ¬¬P ב־P', '¬¬P', log);
        const f = await drag(page, 'forward', { after: d }); await choose(page, f, 'RULE', '(P → Q)'); await choose(page, f, 'PREMISE', 'P'); log(await phrase(page, f));
        await drag(page, 'exact', { after: f });
    },
    // The bonus, as the lecture proves "or" (its hints offer implication as "or" too).
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const r = await replace(page, { after: a }, OR_AS_IMP, 'את (¬P ∨ ¬Q) ב־(¬¬P → ¬Q)', 'המטרה', log);
        const a2 = await drag(page, 'assume', { after: r }); log(await phrase(page, a2));
        const d = await replace(page, { after: a2 }, NOT_NOT, 'את ¬¬P ב־P', '¬¬P', log);
        const n = await drag(page, 'not_intro', { after: d }); log(await phrase(page, n));
        const e = await drag(page, 'not_elim', { after: n }); await choose(page, e, 'NEGATION', '¬(P ∧ Q)'); log(await phrase(page, e));
        const s = await drag(page, 'and_intro', { after: e }); log(await phrase(page, s));
        await drag(page, 'exact', { into: s, input: 'LEFT' });
        await drag(page, 'exact', { into: s, input: 'RIGHT' });
    },
];

// Each level of unit 7, as its hints describe it.
const H3 = '∀x ((P(x) → R(x)) ∧ (R(x) → Q(x)))';
const BOTH3 = '((P(x₀) → R(x₀)) ∧ (R(x₀) → Q(x₀)))';
// "יהי x שרירותי", then the given, its "and", in hand: the start of the three ways.
const threeWaysStart = async (page, log) => {
    const g = await drag(page, 'forall_intro', { goal: true }); log(await phrase(page, g));
    const e = await drag(page, 'forall_elim', { after: g }); await choose(page, e, 'FORALL', H3); await choose(page, e, 'TERM', 'x₀'); log(await phrase(page, e));
    const a = await drag(page, 'and_elim', { after: e }); await choose(page, a, 'AND', BOTH3); log(await phrase(page, a));
    return a;
};
const forward2 = async (page, after, rule, premise, log) => {
    const f = await drag(page, 'forward', { after }); await choose(page, f, 'RULE', rule); await choose(page, f, 'PREMISE', premise); log(await phrase(page, f));
    return f;
};
const UNIT7 = [
    async (page, log) => {
        const m = await drag(page, 'modus_tollens', { goal: true }); await choose(page, m, 'RULE', '(P → Q)'); await choose(page, m, 'NEGATION', '¬Q'); log(await phrase(page, m));
        await drag(page, 'exact', { after: m });
    },
    async (page, log) => {
        const c = await drag(page, 'contrapositive', { goal: true }); log(await phrase(page, c));
        const f1 = await forward2(page, c, '(¬R → ¬Q)', '¬R', log);
        const f2 = await forward2(page, f1, '(¬Q → ¬P)', '¬Q', log);
        await drag(page, 'exact', { after: f2 });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true });
        const g = await drag(page, 'forall_intro', { after: a });
        const b = await drag(page, 'assume', { after: g }); log(await phrase(page, b));
        const e = await drag(page, 'forall_elim', { after: b }); await choose(page, e, 'FORALL', '∀x (Locked(x))'); await choose(page, e, 'TERM', 'x₀'); log(await phrase(page, e));
        await drag(page, 'exact', { after: e });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true });
        const g = await drag(page, 'forall_intro', { after: a });
        const w = await drag(page, 'exists_intro', { after: g }); await choose(page, w, 'TERM', 'x₀'); log(await phrase(page, w));
        const e = await drag(page, 'forall_elim', { after: w }); await choose(page, e, 'FORALL', '∀x (Friend(x,x))'); await choose(page, e, 'TERM', 'x₀');
        await drag(page, 'exact', { after: e });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true });
        const x = await drag(page, 'exists_elim', { after: a }); await choose(page, x, 'EXISTS', '∃x (∀y (Knows(x,y)))'); log(await phrase(page, x));
        const g = await drag(page, 'forall_intro', { after: x });
        const w = await drag(page, 'exists_intro', { after: g }); await choose(page, w, 'TERM', 'x₀');
        const e = await drag(page, 'forall_elim', { after: w }); await choose(page, e, 'FORALL', '∀y (Knows(x₀,y))'); await choose(page, e, 'TERM', 'y₀');
        await drag(page, 'exact', { after: e });
    },
    async (page, log) => {
        const g = await drag(page, 'forall_intro', { goal: true });
        const a = await drag(page, 'assume', { after: g });
        const e = await drag(page, 'forall_elim', { after: a }); await choose(page, e, 'FORALL', '∀y (Trusts(x₀,y))'); await choose(page, e, 'TERM', 'x₀'); log(await phrase(page, e));
        await drag(page, 'exact', { after: e });
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const s = await drag(page, 'and_intro', { after: a }); log(await phrase(page, s));
        for (const input of ['LEFT', 'RIGHT']) {
            const g = await drag(page, 'forall_intro', { into: s, input }); log(await phrase(page, g));
            const e = await drag(page, 'forall_elim', { after: g }); await choose(page, e, 'FORALL', '∀x (P(x) ∧ Q(x))'); await choose(page, e, 'TERM', 'x₀');
            const d = await drag(page, 'and_elim', { after: e }); await choose(page, d, 'AND', '(P(x₀) ∧ Q(x₀))');
            await drag(page, 'exact', { after: d });
        }
    },
    // The way by contraposition (the hints offer all three).
    async (page, log) => {
        const a = await threeWaysStart(page, log);
        const c = await drag(page, 'contrapositive', { after: a }); log(await phrase(page, c));
        const m1 = await drag(page, 'modus_tollens', { after: c }); await choose(page, m1, 'RULE', '(R(x₀) → Q(x₀))'); await choose(page, m1, 'NEGATION', '¬Q(x₀)'); log(await phrase(page, m1));
        const m2 = await drag(page, 'modus_tollens', { after: m1 }); await choose(page, m2, 'RULE', '(P(x₀) → R(x₀))'); await choose(page, m2, 'NEGATION', '¬R(x₀)'); log(await phrase(page, m2));
        await drag(page, 'exact', { after: m2 });
    },
    async (page, log) => {
        const n = await drag(page, 'not_intro', { goal: true }); log(await phrase(page, n));
        const x = await drag(page, 'exists_elim', { after: n }); await choose(page, x, 'EXISTS', '∃b (∀y (Shaves(b,y) ↔ ¬Shaves(y,y)))'); log(await phrase(page, x));
        const e = await drag(page, 'forall_elim', { after: x }); await choose(page, e, 'FORALL', '∀y (Shaves(b₀,y) ↔ ¬Shaves(y,y))'); await choose(page, e, 'TERM', 'b₀'); log(await phrase(page, e));
        const i = await drag(page, 'iff_elim', { after: e }); await choose(page, i, 'IFF', '(Shaves(b₀,b₀) ↔ ¬Shaves(b₀,b₀))'); log(await phrase(page, i));
        const k = await drag(page, 'em_cases', { after: i }); await choose(page, k, 'STATEMENT', 'Shaves(b₀,b₀)'); log(await phrase(page, k));
        const f1 = await drag(page, 'forward', { into: k, input: 'LEFT' }); await choose(page, f1, 'RULE', '(Shaves(b₀,b₀) → ¬Shaves(b₀,b₀))'); await choose(page, f1, 'PREMISE', 'Shaves(b₀,b₀)');
        const c1 = await drag(page, 'contradiction', { after: f1 }); await choose(page, c1, 'FACT', 'Shaves(b₀,b₀)');
        const f2 = await drag(page, 'forward', { into: k, input: 'RIGHT' }); await choose(page, f2, 'RULE', '(¬Shaves(b₀,b₀) → Shaves(b₀,b₀))'); await choose(page, f2, 'PREMISE', '¬Shaves(b₀,b₀)');
        const c2 = await drag(page, 'contradiction', { after: f2 }); await choose(page, c2, 'FACT', 'Shaves(b₀,b₀)');
    },
    async (page, log) => {
        const g = await drag(page, 'forall_intro', { goal: true }); log(await phrase(page, g));
        const a = await drag(page, 'assume', { after: g }); log(await phrase(page, a));
        const s = await drag(page, 'and_intro', { after: a }); log(await phrase(page, s));
        for (const [input, given, rule] of [['LEFT', '∀x (Penguin(x) → Bird(x))', '(Penguin(x₀) → Bird(x₀))'], ['RIGHT', '∀x (Penguin(x) → Swims(x))', '(Penguin(x₀) → Swims(x₀))']]) {
            const e = await drag(page, 'forall_elim', { into: s, input }); await choose(page, e, 'FORALL', given); await choose(page, e, 'TERM', 'x₀');
            const f = await forward2(page, e, rule, 'Penguin(x₀)', log);
            await drag(page, 'exact', { after: f });
        }
    },
    async (page, log) => {
        const a = await drag(page, 'assume', { goal: true }); log(await phrase(page, a));
        const o = await drag(page, 'or_by_negation', { after: a }); log(await phrase(page, o));
        const r = await replace(page, { after: o }, '¬∀x (P(x)) ≡ ∃x (¬P(x))', 'את ¬∀x (Quiz(x)) ב־∃x (¬Quiz(x))', '¬∀x (Quiz(x))', log);
        const x = await drag(page, 'exists_elim', { after: r }); await choose(page, x, 'EXISTS', '∃x (¬Quiz(x))'); log(await phrase(page, x));
        const e = await drag(page, 'forall_elim', { after: x }); await choose(page, e, 'FORALL', '∀x (Quiz(x) ∨ Project(x))'); await choose(page, e, 'TERM', 'x₀');
        const k = await drag(page, 'or_elim', { after: e }); await choose(page, k, 'OR', '(Quiz(x₀) ∨ Project(x₀))'); log(await phrase(page, k));
        const f = await drag(page, 'exfalso', { into: k, input: 'LEFT' });
        const c = await drag(page, 'contradiction', { after: f }); await choose(page, c, 'FACT', 'Quiz(x₀)');
        const w = await drag(page, 'exists_intro', { into: k, input: 'RIGHT' }); await choose(page, w, 'TERM', 'x₀'); log(await phrase(page, w));
        await drag(page, 'exact', { after: w });
    },
    async (page, log) => {
        const g = await drag(page, 'forall_intro', { goal: true });
        const k = await drag(page, 'em_cases', { after: g }); await choose(page, k, 'STATEMENT', 'Rain(d₀)'); log(await phrase(page, k));
        for (const [input, given, rule, premise, side] of [
            ['LEFT', '∀d (Rain(d) → Bus(d))', '(Rain(d₀) → Bus(d₀))', 'Rain(d₀)', 'Bus(d₀)'],
            ['RIGHT', '∀d (¬Rain(d) → Bike(d))', '(¬Rain(d₀) → Bike(d₀))', '¬Rain(d₀)', 'Bike(d₀)']]) {
            const e = await drag(page, 'forall_elim', { into: k, input }); await choose(page, e, 'FORALL', given); await choose(page, e, 'TERM', 'd₀');
            const f = await forward2(page, e, rule, premise, log);
            const o = await drag(page, 'or_intro', { after: f }); await choose(page, o, 'SIDE', side);
            await drag(page, 'exact', { after: o });
        }
    },
];

// Chooses a value only if the field's menu offers it (by its value: the
// statement as Lean writes it, as a solution gives it).
const chooseValue = async (page, id, field, value) => {
    const same = (a, b) => String(a).replace(/\s+/g, ' ') === String(b).replace(/\s+/g, ' ');
    let options = [];
    for (let tries = 0; tries < 6; tries += 1) {
        if (tries) await page.waitForTimeout(2000);
        options = await page.evaluate(([id, field]) => window.__easyleanWorkspace.getBlockById(id).getField(field)
            .getOptions(false).map(([, optionValue]) => optionValue), [id, field]);
        const option = options.find((optionValue) => same(optionValue, value));
        if (option !== undefined) {
            await page.evaluate(([id, field, chosen]) => window.__easyleanWorkspace.getBlockById(id).getField(field).setValue(chosen), [id, field, option]);
            await page.waitForTimeout(3500);
            return;
        }
    }
    // An object that is not a name, such as U \\ C, is typed by the student (the last item of the menu).
    if (field === 'TERM' && options.includes('__write_own__')) {
        await page.evaluate(([id, field, typed]) => window.__easyleanWorkspace.getBlockById(id).getField(field).setValue(typed), [id, field, value]);
        await page.waitForTimeout(3500);
        return;
    }
    throw new Error(`menu of ${field} offers ${options.join(' | ')}, not ${value}`);
};

// Lesson 2: a walk that follows a level's (first) solution, dragging each
// move with the mouse to its place and choosing its fields from their menus.
const followSolution = async (page, steps, where, log) => {
    let place = where;
    for (const [type, fields = {}, parts = {}] of steps) {
        const id = await drag(page, type, place);
        for (const [field, value] of Object.entries(fields)) await chooseValue(page, id, field, value);
        log(await phrase(page, id));
        for (const [input, partSteps] of Object.entries(parts)) await followSolution(page, partSteps, { into: id, input }, log);
        place = { after: id };
    }
};
const walksOf = (unit) => unitSolutions(unit).levels.map((solutions) => (page, log) => followSolution(page, solutions[0].steps, { goal: true }, log));

const UNITS = [
    { unit: 4, world: 'יחידה 4 - שלילה והוכחה בשלילה', walks: UNIT4 },
    { unit: 5, world: 'יחידה 5 - כמתים', walks: UNIT5 },
    { unit: 6, world: 'יחידה 6 - שקילויות לוגיות', walks: UNIT6 },
    { unit: 7, world: 'יחידה 7 - מבני הוכחה', walks: UNIT7 },
    ...[8, 9, 10, 11].map((unit) => ({ unit, world: unitSolutions(unit).world, walks: walksOf(unit) })),
];

// The walks of a unit: a list, for every level, or by level number, for some.
for (const { unit, world, walks } of UNITS) {
    const byIndex = Array.isArray(walks) ? walks.map((walk, index) => [index, walk]) : Object.entries(walks).map(([number, walk]) => [Number(number) - 1, walk]);
    byIndex.forEach(([index, walk]) => {
        test(`student walk, unit ${unit} level ${index + 1}`, async ({ page }) => {
            test.setTimeout(900000);
            await page.setViewportSize({ width: 1500, height: 1000 });
            await page.goto('');
            await showUnit(page, world);
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
