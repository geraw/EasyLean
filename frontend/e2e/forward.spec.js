import { test, expect, openWorld, buildProof } from './helpers';

// Levels whose text suggests the forward step: each is solved forward.
const mp = (rule, premise, name) => ['logic_modus_ponens', { RULE: rule, PREMISE: premise, NAME: name }];
const exact = (term) => ['tactic_exact', { TERM: term }];
const LEVELS = [
    { unit: 'יחידה 1 - מהנחה למסקנה', index: 4, proof: [
        ['tactic_intro', { HYPOTHESIS: 'h1' }], ['tactic_intro', { HYPOTHESIS: 'h2' }], ['tactic_intro', { HYPOTHESIS: 'h3' }],
        mp('h1', 'h3', 'hq'), mp('h2', 'hq', 'hr'), exact('hr')] },
    { unit: 'יחידה 2 - וגם, או, אם ורק אם', index: 4, proof: [
        ['logic_or_elim', { HYPOTHESIS: 'h', LEFT_NAME: 'h1', RIGHT_NAME: 'h2' }, {
            LEFT: [mp('hpr', 'h1', 'hr'), exact('hr')], RIGHT: [mp('hqr', 'h2', 'hr'), exact('hr')] }]] },
    { unit: 'יחידה 2 - וגם, או, אם ורק אם', index: 6, proof: [
        ['logic_iff_elim', { HYPOTHESIS: 'h', FORWARD_NAME: 'h1', BACKWARD_NAME: 'h2' }], mp('h2', 'hq', 'hp'), exact('hp')] },
    { unit: 'יחידה 3 - שלילה והוכחה בשלילה', index: 6, proof: [
        ['logic_by_cases', { FORMULA: 'P', LEFT_NAME: 'h1', RIGHT_NAME: 'h2' }, {
            LEFT: [mp('hpq', 'h1', 'hq'), exact('hq')], RIGHT: [mp('hnpq', 'h2', 'hq'), exact('hq')] }]] },
    // ¬P is P → ⊥: forward from hn and hp to ⊥, and from ⊥ → Q and ⊥ to Q.
    { unit: 'יחידה 3 - שלילה והוכחה בשלילה', index: 1, proof: [
        mp('hn', 'hp', 'hb'), ['logic_false_implies', { FORMULA: 'Q', HYPOTHESIS: 'hf' }], mp('hf', 'hb', 'hq'), exact('hq')] },
    // ¬P is P → ⊥: the forward step from a negation and the statement it negates gives ⊥.
    { unit: 'יחידה 3 - שלילה והוכחה בשלילה', index: 2, proof: [
        ['logic_not_intro', { HYPOTHESIS: 'hn' }], mp('hn', 'hp', 'hb'), exact('hb')] },
];

LEVELS.forEach(({ unit, index, proof }) => {
    test(`${unit.split(' - ')[0]}, level ${index + 1} is solved forward`, async ({ page }) => {
        await openWorld(page, unit);
        await page.getByRole('combobox').selectOption(String(index));
        await buildProof(page, proof);
        await page.getByRole('button', { name: 'בדוק הוכחה' }).click();
        await expect(page.getByRole('button', { name: /לשלב הבא|ליחידה/ })).toBeVisible();
    });
});
