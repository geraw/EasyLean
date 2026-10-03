import { test, expect, openWorld, buildProof, clearProof, selectMove, proofStatePanel, settledProofState } from './helpers';
// Explanations isolate their formulas for right-to-left display.
import { isolateFormulas } from '../src/game/bidi';

const UNIT5 = 'יחידה 5 - קבוצות';

const goToLevel = async (page, index) => {
    await page.getByRole('combobox').selectOption(String(index));
    await expect(page.getByRole('heading', { name: new RegExp(`שלב ${index + 1}/17`) })).toBeVisible();
};

test.beforeEach(async ({ page }) => {
    await openWorld(page, UNIT5);
});

test('sets and objects are listed by name, assumptions in set notation', async ({ page }) => {
    const panel = await settledProofState(page);
    await expect(panel).toContainText('קבוצות: A, B');
    await expect(panel).toContainText('עצמים: x0');
    await expect(panel).toContainText('h : A ⊆ B');
    await expect(panel).toContainText('hx : x0 ∈ A');
    await expect(panel).not.toContainText('Set');
});

test('level 3 starts with an inclusion used before there is an element', async ({ page }) => {
    await goToLevel(page, 2);
    await expect(proofStatePanel(page).getByRole('alert')).toContainText('אין הנחה או עצם בשם hx');
});

test('unfolding the goal needs no name, and turns the intersection into "and"', async ({ page }) => {
    await goToLevel(page, 4);
    const [, unfoldGoal] = await buildProof(page, [
        ['logic_subset_intro', { VARIABLE: 'x0', NAME: 'hx' }],
        ['logic_unfold_inter', { TARGET: 'GOAL' }],
    ]);
    const panel = await selectMove(page, unfoldGoal);
    await page.getByLabel('אחרי המהלך').check();
    await expect(panel.getByRole('status')).toHaveCount(0);
    await expect(panel).toContainText('(x0 ∈ B ∧ x0 ∈ C)');
});

test('unfolding an operation that is not there is explained', async ({ page }) => {
    await goToLevel(page, 3);
    await buildProof(page, [
        ['logic_subset_intro', { VARIABLE: 'x0', NAME: 'hx' }],
        ['logic_unfold_inter', { TARGET: 'GOAL' }],
    ]);
    await expect(proofStatePanel(page).getByRole('alert')).toContainText(isolateFormulas('ב־x0 ∈ A אין שייכות לחיתוך'));
});

test('proving set equality splits into the two inclusions', async ({ page }) => {
    await goToLevel(page, 6);
    const [equality] = await buildProof(page, [['logic_set_eq', {}, { FIRST: [], SECOND: [] }]]);
    const panel = await selectMove(page, equality);
    await page.getByLabel('אחרי המהלך').check();
    await expect(panel).toContainText('הכלה ראשונה (⊆)');
    await expect(panel).toContainText('הכלה שנייה (⊇)');
    await expect(panel).toContainText('A ∩ B ⊆ B ∩ A');
});

test('unit 4 leads to unit 5', async ({ page }) => {
    await openWorld(page, 'יחידה 4 - כמתים');
    await page.getByRole('combobox').selectOption('9');
    await clearProof(page);
    await buildProof(page, [
        ['tactic_intro', { HYPOTHESIS: 'h' }], ['logic_by_contradiction', { HYPOTHESIS: 'hn' }], ['logic_not_elim', { NEGATION: 'h' }],
        ['logic_forall_intro', { VARIABLE: 'x0' }], ['logic_by_contradiction', { HYPOTHESIS: 'hnp' }], ['logic_not_elim', { NEGATION: 'hn' }],
        ['logic_exists_intro', { TERM: 'x0' }], ['tactic_exact', { TERM: 'hnp' }],
    ]);
    await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
    await page.getByRole('button', { name: 'ליחידה 5' }).click();
    await expect(page.getByRole('heading', { name: /יחידה 5 - קבוצות — שלב 1\/17/ })).toBeVisible();
});
