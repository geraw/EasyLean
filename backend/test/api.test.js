// Runs the real `lean` binary; skipped when Lean is not installed.
const test = require('node:test');
const assert = require('node:assert/strict');
const { execSync } = require('node:child_process');
const path = require('node:path');
const { app } = require('../server');

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
