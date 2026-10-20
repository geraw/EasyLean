import { test, expect, buildProof, clearProof } from './helpers';
import { UNITS } from './solutions';

// Every solution of every level is accepted, and the moves read like a
// written proof, with assumptions chosen by their statement.

const openLevel = async (page, worldName, levelIndex = 0) => {
    await page.goto('');
    await page.getByRole('button', { name: worldName }).click();
    await page.waitForSelector('svg.blocklySvg g.game_goal');
    await page.getByRole('combobox').selectOption(String(levelIndex));
};

const UNIT2 = UNITS[1].world;

// A move's text and the options of one of its fields, as students read them.
const moveText = (page, blockId) => page.evaluate((id) => {
    const block = window.__easyleanWorkspace.getBlockById(id);
    return [0, 1, 2, 3, 4, 5].map((index) => block.getFieldValue(`PHRASE${index}`)).filter(Boolean).join(' ').replace(/[\u2066\u2067\u2069]/g, '');
}, blockId);
const fieldOptions = (page, blockId, field) => page.evaluate(([id, name]) => window.__easyleanWorkspace.getBlockById(id).getField(name)
    .getOptions(false).map(([label]) => label.replace(/[\u2066\u2067\u2069]/g, '')), [blockId, field]);

for (const { unit, world, levels } of UNITS) {
    levels.forEach((solutions, index) => {
        solutions.forEach(({ label, steps }, variant) => {
            test(`unit ${unit}, level ${index + 1}: ${label} (${variant + 1}/${solutions.length})`, async ({ page }) => {
                await openLevel(page, world, index);
                await clearProof(page);
                await buildProof(page, steps);
                await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
                // A long proof first brings the states of its moves up to date, in a few rounds.
                await expect(page.getByText('הצלחה!').first()).toBeVisible({ timeout: 20000 });
            });
        });
    });
}

test('the planned error, closing too early, is explained by statements', async ({ page }) => {
    await openLevel(page, UNIT2, 1);
    const state = page.getByRole('region', { name: 'מצב ההוכחה' });
    await expect(state.getByRole('alert')).toContainText('אין בידינו הנחה שאומרת Q');
});

test('assuming the condition does not prove a negation, which has its own move', async ({ page }) => {
    await openLevel(page, UNITS[4].world, 7);
    await clearProof(page);
    await buildProof(page, [['assume'], ['forall_intro'], ['assume']]);
    await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
    await expect(page.getByText('היא שלילה, ולא גרירה').first()).toBeVisible();
});

test('a negation is not used as an implication, since it has its own moves', async ({ page }) => {
    await openLevel(page, UNITS[3].world, 2);
    await clearProof(page);
    await buildProof(page, [['not_intro'], ['forward', { RULE: 'P → Q', PREMISE: 'P' }], ['forward', { RULE: '¬Q', PREMISE: 'Q' }]]);
    await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
    await expect(page.getByText('היא שלילה, ולא גרירה. כדי להגיע לסתירה משלילה').first()).toBeVisible();
});

test('after a long introduction, the button to the next level can be reached', async ({ page }) => {
    await page.setViewportSize({ width: 1900, height: 700 });
    await openLevel(page, UNIT2, 0);
    await clearProof(page);
    await buildProof(page, UNITS[1].levels[0][0].steps);
    await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
    const next = page.getByRole('button', { name: 'לשלב הבא' });
    await next.scrollIntoViewIfNeeded();
    await expect(next).toBeInViewport();
    await next.click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(`שלב 2/${UNITS[1].levels.length}`);
});

test('a move offers the assumptions in hand before it, and reads like a written proof', async ({ page }) => {
    await openLevel(page, UNIT2, 4);
    const [first, second, third, forward] = await buildProof(page, [['assume'], ['assume'], ['assume'], ['forward']]);
    await expect.poll(() => moveText(page, first)).toBe('כדי להוכיח את הגרירה, נניח (P → Q) ונוכיח ((Q → R) → (P → R))');
    await expect.poll(() => moveText(page, second)).toBe('כדי להוכיח את הגרירה, נניח (Q → R) ונוכיח (P → R)');
    await expect.poll(() => moveText(page, third)).toBe('כדי להוכיח את הגרירה, נניח P ונוכיח R');
    await expect.poll(() => fieldOptions(page, forward, 'RULE')).toEqual(['?', '(P → Q)', '(Q → R)', 'P', '✎ כתיבה ידנית...']);
    await page.evaluate((id) => window.__easyleanWorkspace.getBlockById(id).setFieldValue('P → Q', 'RULE'), forward);
    await expect.poll(() => moveText(page, forward)).toBe('נובע Q');
    const state = page.getByRole('region', { name: 'מצב ההוכחה' });
    await expect(state).toContainText('(P → Q)');
    // Assumptions are listed by statement only, never as "name : statement".
    await expect(state).not.toContainText(' : ');
});

test('a statement can be typed in instead of chosen', async ({ page }) => {
    await openLevel(page, UNIT2, 1);
    const [backward] = await buildProof(page, [['apply_rule']]);
    // Choosing the menu's last item opens Blockly's prompt.
    await page.evaluate((id) => window.__easyleanWorkspace.getBlockById(id).getField('RULE').setValue('__write_own__'), backward);
    await page.locator('dialog.blocklyDialog input').fill('P -> Q');
    await page.locator('dialog.blocklyDialog').getByRole('button', { name: 'OK' }).click();
    await expect.poll(() => page.evaluate((id) => window.__easyleanWorkspace.getBlockById(id).getFieldValue('RULE'), backward)).toBe('P → Q');
    await expect.poll(() => moveText(page, backward)).toBe('כדי להוכיח Q די להוכיח P');
});

const UNIT3 = UNITS[2].world;

test('a move that splits the proof heads each part by the proof state', async ({ page }) => {
    await openLevel(page, UNIT3, 1);
    const [andIntro] = await buildProof(page, [['and_intro']]);
    const heading = (part) => page.evaluate(([id, prefix]) => {
        const block = window.__easyleanWorkspace.getBlockById(id);
        return [0, 1, 2, 3, 4, 5].map((index) => block.getFieldValue(`${prefix}${index}`)).filter(Boolean).join(' ').replace(/[\u2066\u2067\u2069]/g, '');
    }, [andIntro, `${part}_TEXT`]);
    await expect.poll(() => moveText(page, andIntro)).toBe('כדי להוכיח (P ∧ Q) נוכיח כל צד לחוד');
    await expect.poll(() => heading('LEFT')).toBe('נוכיח P');
    await expect.poll(() => heading('RIGHT')).toBe('נוכיח Q');
});

test('the side of an "or" is chosen by what it says', async ({ page }) => {
    await openLevel(page, UNIT3, 3);
    const [orIntro] = await buildProof(page, [['or_intro']]);
    await expect.poll(() => fieldOptions(page, orIntro, 'SIDE')).toEqual(['?', 'Q', 'P']);
    await expect.poll(() => moveText(page, orIntro)).toBe('כדי להוכיח (Q ∨ P) די להוכיח');
});
