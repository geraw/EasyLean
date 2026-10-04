import { test, expect, openWorld, buildProof, clearProof, selectMove, proofStatePanel, settledProofState } from './helpers';
// Explanations isolate their formulas for right-to-left display.
import { isolateFormulas } from '../src/game/bidi';

const UNIT6 = 'יחידה 6 - שוויון ואינדוקציה';

const goToLevel = async (page, index) => {
    await page.getByRole('combobox').selectOption(String(index));
    await expect(page.getByRole('heading', { name: new RegExp(`שלב ${index + 1}/11`) })).toBeVisible();
};

test.beforeEach(async ({ page }) => {
    await openWorld(page, UNIT6);
});

test('numbers are listed by name, and equations in course notation', async ({ page }) => {
    await goToLevel(page, 1);
    const panel = await settledProofState(page);
    await expect(panel).toContainText('מספרים: x, y');
    await expect(panel).toContainText('h : y = x + 7');
    await expect(panel).toContainText('2 · y = 2 · (x + 7)');
});

test('level 3 starts with a substitution in the wrong direction', async ({ page }) => {
    await goToLevel(page, 2);
    await expect(proofStatePanel(page).getByRole('alert'))
        .toContainText(isolateFormulas('ב־P(b) לא מופיע a, ולכן אין מה להחליף. אולי צריך להחליף בכיוון השני'));
});

test('induction splits into a base case and a step with the induction hypothesis', async ({ page }) => {
    await goToLevel(page, 4);
    const [induction] = await buildProof(page, [['logic_induction', { VARIABLE: 'n', STEP_VARIABLE: 'k', HYPOTHESIS: 'ih' }, { BASE: [], STEP: [] }]]);
    const panel = await selectMove(page, induction);
    await page.getByLabel('אחרי המהלך').check();
    await expect(panel).toContainText('בסיס');
    await expect(panel).toContainText('צעד');
    await expect(panel).toContainText('ih : double(k) = k + k');
    await expect(panel).toContainText('double(k + 1) = k + 1 + (k + 1)');
});

test('"equal by definition" on 0 + n = n is explained', async ({ page }) => {
    await goToLevel(page, 5);
    await buildProof(page, [['logic_rfl']]);
    await expect(proofStatePanel(page).getByRole('alert')).toContainText('לא שווים לפי ההגדרות בלבד');
});

test('calculation does not unfold a definition, and says so', async ({ page }) => {
    await goToLevel(page, 4);
    await buildProof(page, [['logic_induction', { VARIABLE: 'n', STEP_VARIABLE: 'k', HYPOTHESIS: 'ih' }, { BASE: [['logic_calc']], STEP: [] }]]);
    await expect(proofStatePanel(page).getByRole('alert')).toContainText('החשבון לבדו לא מספיק');
});

test('unit 5 leads to unit 6', async ({ page }) => {
    await openWorld(page, 'יחידה 5 - קבוצות');
    await page.getByRole('combobox').selectOption('16');
    await buildProof(page, [['logic_set_eq', {}, {
        FIRST: [['logic_subset_intro', { VARIABLE: 'x0', NAME: 'hx' }], ['logic_unfold_compl', { TARGET: 'HYPOTHESIS', HYPOTHESIS: 'hx' }],
            ['logic_by_contradiction', { HYPOTHESIS: 'hn' }], ['logic_not_elim', { NEGATION: 'hx' }], ['logic_unfold_compl', { TARGET: 'GOAL' }], ['tactic_exact', { TERM: 'hn' }]],
        SECOND: [['logic_subset_intro', { VARIABLE: 'x0', NAME: 'hx' }], ['logic_unfold_compl', { TARGET: 'GOAL' }], ['logic_not_intro', { HYPOTHESIS: 'hc' }],
            ['logic_unfold_compl', { TARGET: 'HYPOTHESIS', HYPOTHESIS: 'hc' }], ['logic_contradiction', { NEGATION: 'hc', HYPOTHESIS: 'hx' }]],
    }]]);
    await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
    await page.getByRole('button', { name: 'ליחידה 6' }).click();
    await expect(page.getByRole('heading', { name: /יחידה 6 - שוויון ואינדוקציה — שלב 1\/11/ })).toBeVisible();
});
