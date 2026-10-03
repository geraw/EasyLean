import { test, expect, openWorld, buildProof, clearProof, selectMove, proofStatePanel, settledProofState } from './helpers';
// Explanations isolate their formulas for right-to-left display.
import { isolateFormulas } from '../src/game/bidi';

const UNIT4 = 'יחידה 4 - כמתים';

const goToLevel = async (page, index) => {
    await page.getByRole('combobox').selectOption(String(index));
    await expect(page.getByRole('heading', { name: new RegExp(`שלב ${index + 1}/10`) })).toBeVisible();
};

test.beforeEach(async ({ page }) => {
    await openWorld(page, UNIT4);
});

test('formulas are shown in the course notation, without the declarations', async ({ page }) => {
    await goToLevel(page, 1);
    const panel = await settledProofState(page);
    await expect(panel).toContainText('h : ∀x (P(x) → Q(x))');
    await expect(panel).toContainText('hp : P(a)');
    await expect(panel).toContainText('a : α');
    await expect(panel).not.toContainText('Prop');
    await expect(panel).not.toContainText('Type');
});

test('an arbitrary object becomes an object of the proof state', async ({ page }) => {
    await goToLevel(page, 2);
    const [, arbitrary] = await buildProof(page, [['tactic_intro', { HYPOTHESIS: 'h' }], ['logic_forall_intro', { VARIABLE: 'x' }]]);
    const panel = await selectMove(page, arbitrary);
    await page.getByLabel('אחרי המהלך').check();
    await expect(panel).toContainText('x : α');
    await expect(panel).toContainText('P(x)');
});

test('assuming a condition when the goal is a "for all" is explained', async ({ page }) => {
    await goToLevel(page, 2);
    await buildProof(page, [['tactic_intro', { HYPOTHESIS: 'h' }], ['tactic_intro', { HYPOTHESIS: 'x' }]]);
    await expect(proofStatePanel(page).getByRole('alert'))
        .toContainText(isolateFormulas('המטרה היא ∀x P(x), טענת "לכל" ולא גרירה, ולכן אין תנאי להניח.'));
});

test('taking an arbitrary object when the goal is an implication is explained', async ({ page }) => {
    await goToLevel(page, 2);
    await buildProof(page, [['logic_forall_intro', { VARIABLE: 'x' }]]);
    await expect(proofStatePanel(page).getByRole('alert')).toContainText('וזו גרירה ולא טענת "לכל"');
});

test('level 6 starts with a witness chosen before the object exists', async ({ page }) => {
    await goToLevel(page, 5);
    await expect(proofStatePanel(page).getByRole('alert')).toContainText('אין הנחה או עצם בשם x');
    await clearProof(page);
    await buildProof(page, [
        ['tactic_intro', { HYPOTHESIS: 'h' }],
        ['logic_exists_elim', { HYPOTHESIS: 'h', VARIABLE: 'x', NAME: 'hx' }],
        ['logic_exists_intro', { TERM: 'x' }],
        ['logic_and_elim', { HYPOTHESIS: 'hx', LEFT_NAME: 'hp', RIGHT_NAME: 'hq' }],
        ['tactic_exact', { TERM: 'hq' }],
    ]);
    await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
    await expect(page.getByRole('button', { name: 'לשלב הבא' })).toBeVisible();
});

test('unit 3 leads to unit 4', async ({ page }) => {
    await openWorld(page, 'יחידה 3 - שלילה והוכחה בשלילה');
    await page.getByRole('combobox').selectOption('9');
    await buildProof(page, [
        ['tactic_intro', { HYPOTHESIS: 'h' }], ['logic_not_intro', { HYPOTHESIS: 'hnp' }], ['logic_not_elim', { NEGATION: 'h' }],
        ['tactic_intro', { HYPOTHESIS: 'hp' }], ['logic_false_implies', { FORMULA: 'Q', HYPOTHESIS: 'hf' }],
        ['tactic_apply_rule', { RULE: 'hf' }], ['logic_contradiction', { NEGATION: 'hnp', HYPOTHESIS: 'hp' }],
    ]);
    await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
    await page.getByRole('button', { name: 'ליחידה 4' }).click();
    await expect(page.getByRole('heading', { name: /יחידה 4 - כמתים — שלב 1\/10/ })).toBeVisible();
});
