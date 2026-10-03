import { test, expect, openWorld, buildProof, clearProof, selectMove, proofStatePanel } from './helpers';
// Explanations isolate their formulas for right-to-left display.
import { isolateFormulas } from '../src/game/bidi';

const UNIT3 = 'יחידה 3 - שלילה והוכחה בשלילה';

const exact = (term) => ['tactic_exact', { TERM: term }];
const assume = (name) => ['tactic_intro', { HYPOTHESIS: name }];
const applyRule = (rule) => ['tactic_apply_rule', { RULE: rule }];
const contradiction = (negation, hypothesis) => ['logic_contradiction', { NEGATION: negation, HYPOTHESIS: hypothesis }];
const notIntro = (name) => ['logic_not_intro', { HYPOTHESIS: name }];
const notElim = (negation) => ['logic_not_elim', { NEGATION: negation }];
const byCases = (formula, left, leftSteps, right, rightSteps) =>
    ['logic_by_cases', { FORMULA: formula, LEFT_NAME: left, RIGHT_NAME: right }, { LEFT: leftSteps, RIGHT: rightSteps }];
const andIntro = (left, right) => ['logic_and_intro', {}, { LEFT: left, RIGHT: right }];
const falseImplies = (formula, name) => ['logic_false_implies', { FORMULA: formula, HYPOTHESIS: name }];

// A solution for each level, in the order of the unit.
const SOLUTIONS = [
    [contradiction('hn', 'hp')],
    [['logic_non_contradiction', { FORMULA: 'P', HYPOTHESIS: 'hc' }], applyRule('hc'), andIntro([exact('hp')], [exact('hn')])],
    [falseImplies('Q', 'hf'), applyRule('hf'), contradiction('hn', 'hp')],
    [notIntro('hn'), contradiction('hn', 'hp')],
    [notIntro('hp'), notElim('hnq'), applyRule('h'), exact('hp')],
    [assume('h'), andIntro(
        [notIntro('hp'), notElim('h'), ['logic_or_intro_left'], exact('hp')],
        [notIntro('hq'), notElim('h'), ['logic_or_intro_right'], exact('hq')])],
    [assume('h'), ['logic_by_contradiction', { HYPOTHESIS: 'hn' }], contradiction('h', 'hn')],
    [byCases('P', 'h1', [applyRule('hpq'), exact('h1')], 'h2', [applyRule('hnpq'), exact('h2')])],
    [assume('h'), byCases('P',
        'h1', [['logic_or_intro_right'], notIntro('hq'), notElim('h'), andIntro([exact('h1')], [exact('hq')])],
        'h2', [['logic_or_intro_left'], exact('h2')])],
    [assume('h'), notIntro('hnp'), notElim('h'), assume('hp'), falseImplies('Q', 'hf'), applyRule('hf'), contradiction('hnp', 'hp')],
];

const goToLevel = async (page, index) => {
    await page.getByRole('combobox').selectOption(String(index));
    await expect(page.getByRole('heading', { name: new RegExp(`שלב ${index + 1}/10`) })).toBeVisible();
};

test.beforeEach(async ({ page }) => {
    await openWorld(page, UNIT3);
});

SOLUTIONS.forEach((solution, index) => {
    test(`level ${index + 1} is solved by its solution`, async ({ page }) => {
        await goToLevel(page, index);
        await clearProof(page);
        await buildProof(page, solution);
        await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
        await expect(page.getByRole('button', { name: index < SOLUTIONS.length - 1 ? 'לשלב הבא' : 'ליחידה 4' })).toBeVisible();
    });
});

test('a contradiction is shown as ⊥ in the proof state', async ({ page }) => {
    await goToLevel(page, 3);
    const [assumeNegation] = await buildProof(page, [notIntro('hn')]);
    const panel = await selectMove(page, assumeNegation);
    await page.getByLabel('אחרי המהלך').check();
    await expect(panel).toContainText('hn : ¬P');
    await expect(panel).toContainText('סתירה (⊥)');
});

test('reaching a contradiction on a goal that is not ⊥ is explained', async ({ page }) => {
    await goToLevel(page, 2);
    await buildProof(page, [contradiction('hn', 'hp')]);
    await expect(proofStatePanel(page).getByRole('alert'))
        .toContainText('המטרה היא Q, ולא סתירה. כדי להשתמש בסתירה כאן, קודם השתמשו בגרירה "סתירה גוררת Q"');
});

test('proving a goal that is not a negation by assuming what it negates is explained', async ({ page }) => {
    await goToLevel(page, 6);
    await buildProof(page, [assume('h'), notIntro('hn')]);
    await expect(proofStatePanel(page).getByRole('alert'))
        .toContainText('המטרה היא P, והיא לא שלילה');
});

test('checking both possibilities gives one case with P and one with ¬P', async ({ page }) => {
    await goToLevel(page, 7);
    const [cases] = await buildProof(page, [byCases('P', 'h1', [], 'h2', [])]);
    const panel = await selectMove(page, cases);
    await page.getByLabel('אחרי המהלך').check();
    await expect(panel).toContainText('ההוכחה מתפצלת, ונשאר להוכיח 2 חלקים');
    await expect(panel).toContainText('h1 : P');
    await expect(panel).toContainText('h2 : ¬P');
});

test('"a contradiction implies Q" is an assumption, used like any implication', async ({ page }) => {
    await goToLevel(page, 2);
    const [fact, rule] = await buildProof(page, [falseImplies('Q', 'hf'), applyRule('hf')]);
    let panel = await selectMove(page, fact);
    await page.getByLabel('אחרי המהלך').check();
    await expect(panel).toContainText('hf : (⊥ → Q)');
    panel = await selectMove(page, rule);
    await page.getByLabel('אחרי המהלך').check();
    await expect(panel).toContainText('סתירה (⊥)');
});

test('the principle of non-contradiction, used forward', async ({ page }) => {
    await goToLevel(page, 1);
    const [principle] = await buildProof(page, [
        ['logic_non_contradiction', { FORMULA: 'P', HYPOTHESIS: 'hc' }],
        ['logic_and_combine', { LEFT: 'hp', RIGHT: 'hn', NAME: 'hpn' }],
        ['logic_modus_ponens', { RULE: 'hc', PREMISE: 'hpn', NAME: 'hb' }],
        exact('hb'),
    ]);
    const panel = await selectMove(page, principle);
    await page.getByLabel('אחרי המהלך').check();
    await expect(panel).toContainText('hc : ((P ∧ ¬P) → ⊥)');
    await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
    await expect(page.getByRole('button', { name: 'לשלב הבא' })).toBeVisible();
});

// Regression: proving a negation again when the goal is already ⊥ used to
// "succeed" with three goals about an unknown statement.
test('proving a negation when the goal is already a contradiction is explained', async ({ page }) => {
    await goToLevel(page, 9);
    await buildProof(page, [assume('h'), notIntro('hnp'), notIntro('h2')]);
    const panel = proofStatePanel(page);
    await expect(panel.getByRole('alert')).toContainText(isolateFormulas('המטרה היא כבר סתירה (⊥), ולא שלילה'));
    await expect(panel).not.toContainText('ההוכחה מתפצלת');
});
