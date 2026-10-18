// Runs the real `lean` binary; skipped when Lean is not installed.
const test = require('node:test');
const assert = require('node:assert/strict');
const { execSync } = require('node:child_process');
const path = require('node:path');
const { app, isForbidden } = require('../server');

// Checked from the Lean project so elan resolves its pinned toolchain.
const hasLean = (() => {
    try {
        execSync('lean --version', { stdio: 'ignore', cwd: path.join(__dirname, '..', 'lean_project') });
        return true;
    } catch {
        return false;
    }
})();

test('lean is available in CI', { skip: !process.env.CI && 'only enforced in CI' }, () => {
    assert.ok(hasLean, 'lean must be installed so the tests below do not get skipped');
});

const theorem = (proof) => `variable {P Q : Prop}\n\ntheorem t (h1 : P → Q) : P → Q := by\n${proof}`;

let server;
let baseUrl;

test.before(async () => {
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

const post = async (path, body) => {
    const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
};

test('both endpoints reject a request without Lean code', async () => {
    for (const path of ['/verify', '/proof-state']) {
        const { status, body } = await post(path, {});
        assert.equal(status, 400, path);
        assert.equal(body.error, 'No Lean code provided', path);
    }
});

test('both endpoints reject code with #eval, which could run commands on the server', async () => {
    for (const path of ['/verify', '/proof-state']) {
        const { status, body } = await post(path, { leanCode: theorem('  intro h\n  exact h1 h\n#eval IO.println "hi"\n') });
        assert.equal(status, 400, path);
        assert.equal(body.error, 'Forbidden command in Lean code', path);
    }
});

// Other ways to run programs on the server, or to read its files.
const FORBIDDEN_CODE = [
    '#eval! IO.println "hi"',
    '#guard true',
    'run_cmd pure ()',
    'example : 1 = 1 := by native_decide',
    'example : 1 = 1 := by decide +native',
    'theorem x : Lean.reduceBool true = true := Lean.ofReduceBool _ _ rfl',
    'unsafe def f : Nat := 1',
    '@[implemented_by f] def g : Nat := 1',
    '@[extern "system"] opaque sys : Nat',
    'initialize pure ()',
    'def s := include_str "/etc/passwd"',
    'import Lean',
    'syntax "x" : command',
    'macro_rules | `(x) => `(y)',
    'macro "e" : command => `(#eval 1)',
    'macro "e" : tactic => `(tactic| $(Lean.mkIdent `x))',
    '@[macro Lean.Parser.Term.app] def m : Lean.Macro := fun _ => Lean.Macro.throwUnsupported',
    'elab "x" : term => pure (Lean.mkConst `True)',
];

test('both endpoints reject code that could run programs or read files on the server', async () => {
    for (const code of FORBIDDEN_CODE) {
        const { status, body } = await post('/verify', { leanCode: theorem('  intro h\n  exact h1 h\n') + code });
        assert.equal(status, 400, code);
        assert.equal(body.error, 'Forbidden command in Lean code', code);
    }
});

test('the preludes\' tactic macros are allowed', () => {
    const macros = 'macro "easylean_goal_only" : tactic => `(tactic| repeat (rename_i easylean_h; clear easylean_h))\n'
        + 'macro "easylean_assume" : tactic => `(tactic| ((first | fail_if_success show ¬ _ | fail "easylean: the goal is a negation"); refine easylean_imp_intro (fun _ => ?_)))\n';
    assert.equal(isForbidden(macros + theorem('  intro h\n  exact h1 h\n')), false);
});

test('/verify reports errors as lean does, with their lines and names', { skip: !hasLean && 'lean not installed' }, async () => {
    const { body } = await post('/verify', { leanCode: theorem('  intro h\n  exact nonsense\n') });
    assert.equal(body.exitCode, 1);
    assert.match(body.output, /^\/.*\.lean:5:8: error\(lean\.unknownIdentifier\): Unknown identifier `nonsense`\n$/);
    const sorry = await post('/verify', { leanCode: theorem('  sorry\n') });
    assert.equal(sorry.body.exitCode, 0);
    assert.match(sorry.body.output, /^\/.*\.lean:3:8: warning: declaration uses 'sorry'\n$/);
});

test('/verify accepts a correct proof', { skip: !hasLean && 'lean not installed' }, async () => {
    const { body } = await post('/verify', { leanCode: theorem('  intro h\n  exact h1 h\n') });
    assert.equal(body.exitCode, 0, body.output);
});

test('/verify rejects a wrong proof', { skip: !hasLean && 'lean not installed' }, async () => {
    const { body } = await post('/verify', { leanCode: theorem('  intro h\n  exact h\n') });
    assert.notEqual(body.exitCode, 0);
    assert.match(body.output, /type mismatch|error/);
});

test('/proof-state reports the state after a partial proof', { skip: !hasLean && 'lean not installed' }, async () => {
    const { body } = await post('/proof-state', { leanCode: theorem('  intro h\n  exact ?_\n') });
    assert.equal(body.complete, false);
    assert.equal(body.goal, 'Q');
    assert.deepEqual(body.assumptions.map((a) => a.name), ['P Q', 'h1', 'h']);
});

test('/proof-state reports a finished proof as complete', { skip: !hasLean && 'lean not installed' }, async () => {
    const { body } = await post('/proof-state', { leanCode: theorem('  intro h\n  exact h1 h\n') });
    assert.equal(body.complete, true);
    assert.equal(body.error, undefined);
});

test('/proof-state reports a broken move as an error', { skip: !hasLean && 'lean not installed' }, async () => {
    const { body } = await post('/proof-state', { leanCode: theorem('  intro h\n  exact nonsense\n') });
    assert.equal(body.complete, false);
    assert.equal(body.error, 'יש שגיאה במהלך ההוכחה');
});

// Regression: /verify used one file name per millisecond, so simultaneous
// checks could read each other's proofs.
test('/verify keeps simultaneous checks apart', { skip: !hasLean && 'lean not installed' }, async () => {
    const good = theorem('  intro h\n  exact h1 h\n');
    const bad = theorem('  intro h\n  exact h\n');
    const results = await Promise.all(Array.from({ length: 6 }, (_, i) => post('/verify', { leanCode: i % 2 ? bad : good })));
    assert.deepEqual(results.map(({ body }) => body.exitCode === 0), [true, false, true, false, true, false]);
});
