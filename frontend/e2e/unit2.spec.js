import { test, expect, openWorld, buildProof, clearProof, selectMove, proofStatePanel, settledProofState } from './helpers';

const UNIT2 = 'יחידה 2 - וגם, או, אם ורק אם';

const exact = (term) => ['tactic_exact', { TERM: term }];
const assume = (name) => ['tactic_intro', { HYPOTHESIS: name }];
const andElim = (h, left, right) => ['logic_and_elim', { HYPOTHESIS: h, LEFT_NAME: left, RIGHT_NAME: right }];
const andIntro = (left, right) => ['logic_and_intro', {}, { LEFT: left, RIGHT: right }];
const orCases = (h, left, leftSteps, right, rightSteps) =>
    ['logic_or_elim', { HYPOTHESIS: h, LEFT_NAME: left, RIGHT_NAME: right }, { LEFT: leftSteps, RIGHT: rightSteps }];
const applyRule = (rule) => ['tactic_apply_rule', { RULE: rule }];
const swapAnd = [assume('h'), andElim('h', 'h1', 'h2'), andIntro([exact('h2')], [exact('h1')])];

// A solution for each level, in the order of the unit.
const SOLUTIONS = [
    [andElim('h', 'h1', 'h2'), exact('h2')],
    [andIntro([exact('h1')], [exact('h2')])],
    swapAnd,
    [['logic_or_intro_right'], exact('h')],
    [orCases('h', 'h1', [applyRule('hpr'), exact('h1')], 'h2', [applyRule('hqr'), exact('h2')])],
    [assume('h'), orCases('h', 'h1', [['logic_or_intro_right'], exact('h1')], 'h2', [['logic_or_intro_left'], exact('h2')])],
    [['logic_iff_elim', { HYPOTHESIS: 'h', FORWARD_NAME: 'h1', BACKWARD_NAME: 'h2' }], applyRule('h2'), exact('hq')],
    [['logic_iff_intro', {}, { FORWARD: swapAnd, BACKWARD: swapAnd }]],
    [assume('h'), andElim('h', 'h1', 'h2'), orCases('h2',
        'hq', [['logic_or_intro_left'], andIntro([exact('h1')], [exact('hq')])],
        'hr', [['logic_or_intro_right'], andIntro([exact('h1')], [exact('hr')])])],
];

const goToLevel = async (page, index) => {
    await page.getByRole('combobox').selectOption(String(index));
    await expect(page.getByRole('heading', { name: new RegExp(`שלב ${index + 1}/9`) })).toBeVisible();
};

test.beforeEach(async ({ page }) => {
    await openWorld(page, UNIT2);
});

SOLUTIONS.forEach((solution, index) => {
    test(`level ${index + 1} is solved by its solution`, async ({ page }) => {
        await goToLevel(page, index);
        await clearProof(page);
        await buildProof(page, solution);
        await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
        await expect(page.getByRole('button', { name: index < SOLUTIONS.length - 1 ? 'לשלב הבא' : 'שלבים נוספים בקרוב...' })).toBeVisible();
    });
});

test('inside a part of the proof, the proof state shows only that part', async ({ page }) => {
    await goToLevel(page, 1);
    const [split, left, right] = await buildProof(page, SOLUTIONS[1]);

    let panel = await selectMove(page, right);
    await page.getByLabel('לפני המהלך').check();
    await expect(panel).toContainText('h2 : Q');
    await expect(panel).not.toContainText('ההוכחה מתפצלת');
    await expect(panel.getByText('Q', { exact: true })).toBeVisible();
    await page.getByLabel('אחרי המהלך').check();
    await expect(panel).toContainText('החלק הזה של ההוכחה הושלם');

    panel = await selectMove(page, split);
    await page.getByLabel('אחרי המהלך').check();
    await expect(panel).toContainText('ההוכחה מתפצלת, ונשאר להוכיח 2 חלקים');
    await expect(panel).toContainText('צד שמאל');
    await expect(panel).toContainText('צד ימין');
    expect(left).toBeTruthy();
});

test('a rule used on the wrong connective is explained', async ({ page }) => {
    await goToLevel(page, 3);
    await buildProof(page, [andIntro([exact('h')], [exact('h')])]);
    await expect(proofStatePanel(page).getByRole('alert'))
        .toContainText('המטרה היא (Q ∨ P), והיא לא טענת "וגם", ולכן אין לה שני צדדים להוכיח לחוד.');
});

test('level 6 starts with a side chosen too early, which gets stuck', async ({ page }) => {
    await goToLevel(page, 5);
    const sideId = await page.evaluate(() => window.__easyleanWorkspace.getAllBlocks(false)
        .find((b) => b.type === 'logic_or_intro_left').id);
    const panel = await selectMove(page, sideId);
    await page.getByLabel('אחרי המהלך').check();
    await expect(panel).toContainText('h : P ∨ Q');
    await expect(panel.getByRole('alert')).toHaveCount(0);
    await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
    await expect(page.getByRole('button', { name: 'לשלב הבא' })).toHaveCount(0);
});

test('unit 1 leads to unit 2', async ({ page }) => {
    await openWorld(page, 'יחידה 1 - מהנחה למסקנה');
    await page.getByRole('combobox').selectOption('3');
    await buildProof(page, [assume('h1'), assume('h2'), assume('h3'), applyRule('h2'), applyRule('h1'), exact('h3')]);
    await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
    await page.getByRole('button', { name: 'ליחידה 2' }).click();
    await expect(page.getByRole('heading', { name: /יחידה 2 - וגם, או, אם ורק אם — שלב 1\/9/ })).toBeVisible();
    await settledProofState(page);
});

test('splitting into cases shows both cases, each with its own assumption', async ({ page }) => {
    await goToLevel(page, 4);
    const [cases, , firstCaseExact] = await buildProof(page, SOLUTIONS[4]);

    let panel = await selectMove(page, cases);
    await page.getByLabel('אחרי המהלך').check();
    await expect(panel.getByRole('alert')).toHaveCount(0);
    await expect(panel).toContainText('ההוכחה מתפצלת, ונשאר להוכיח 2 חלקים');
    await expect(panel).toContainText('מקרה ראשון');
    await expect(panel).toContainText('h1 : P');
    await expect(panel).toContainText('h2 : Q');

    panel = await selectMove(page, firstCaseExact);
    await page.getByLabel('לפני המהלך').check();
    await expect(panel.getByRole('alert')).toHaveCount(0);
    await expect(panel).toContainText('h1 : P');
    await expect(panel).not.toContainText('h2 : Q');
});
