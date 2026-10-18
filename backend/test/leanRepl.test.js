const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { LeanRepl, splitCode, formatOutput } = require('../leanRepl');

test('the code is split into its header and its theorems, with their lines', () => {
    const code = 'def a := 1\n\nvariable {P : Prop}\n\ntheorem t1 : True := by\n  trivial\ntheorem t2 : True := by\n  trivial\n';
    const { header, theorems } = splitCode(code);
    assert.equal(header, 'def a := 1\n\nvariable {P : Prop}\n\n');
    assert.deepEqual(theorems, [
        { text: 'theorem t1 : True := by\n  trivial\n', lineOffset: 4 },
        { text: 'theorem t2 : True := by\n  trivial\n', lineOffset: 6 },
    ]);
    assert.equal(header + theorems.map(({ text }) => text).join(''), code);
});

test('code without a header is all theorems', () => {
    assert.deepEqual(splitCode('theorem t : True := trivial\n'), { header: '', theorems: [{ text: 'theorem t : True := trivial\n', lineOffset: 0 }] });
});

const message = (severity, line, column, data, name) => ({
    severity,
    pos: { line, column },
    data,
    text: severity === 'info' ? `${data}\n` : `<input>:${line}:${column}: ${severity}${name ? `(${name})` : ''}: ${data}\n`,
});

test('messages are printed as lean prints them, on their lines in the whole code', () => {
    const { stdout, failed } = formatOutput([
        { messages: [message('warning', 2, 0, 'declaration uses \'sorry\'')], lineOffset: 0 },
        { messages: [message('error', 3, 8, 'Unknown identifier `x`', 'lean.unknownIdentifier'), message('info', 4, 0, 'P : Prop')], lineOffset: 10 },
    ], 'Proof.lean');
    assert.equal(stdout, "Proof.lean:2:0: warning: declaration uses 'sorry'\nProof.lean:13:8: error(lean.unknownIdentifier): Unknown identifier `x`\nP : Prop\n");
    assert.equal(failed, true);
    assert.equal(formatOutput([{ messages: [message('warning', 1, 0, 'w')], lineOffset: 0 }], 'Proof.lean').failed, false);
});

test('like lean, the output stops at the 101st error', () => {
    const errors = Array.from({ length: 120 }, (_, i) => message('error', i + 1, 0, 'bad', 'lean.unknownIdentifier'));
    const lines = formatOutput([{ messages: errors, lineOffset: 0 }], 'Proof.lean').stdout.trim().split('\n');
    assert.equal(lines.length, 101);
    assert.equal(lines[100], 'Proof.lean:101:0: error: maximum number of errors (100; from option `maxErrors`) reached, exiting');
});

// A pool of the fake REPL (see fakeRepl.js), logging the commands it gets.
const fakePool = (options = {}) => {
    const log = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'easylean-repl-')), 'log');
    const fallbacks = [];
    const pool = new LeanRepl({
        command: process.execPath,
        args: [path.join(__dirname, 'fakeRepl.js')],
        env: { ...process.env, FAKE_REPL: '1', FAKE_REPL_LOG: log, ...options.env },
        fileName: 'Proof.lean',
        fallback: (code, signal, callback) => {
            fallbacks.push(code);
            callback(null, { error: null, stdout: 'fallback', stderr: '' });
        },
        timeoutMs: 1000,
        ...options.pool,
    });
    const run = (code, signal) => new Promise((resolve) => pool.run(code, signal, (error, result) => resolve(result)));
    const commands = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').map((line) => JSON.parse(line)) : []);
    return { pool, run, commands, fallbacks };
};

const HEADER = 'variable {P : Prop}\n\n';

test('a header is elaborated once, and each theorem in the environment before it', async (t) => {
    const { pool, run, commands } = fakePool();
    t.after(() => pool.stop());
    const first = await run(`${HEADER}theorem a : P := ERROR\ntheorem b : P := h\n`);
    assert.equal(first.stdout, 'Proof.lean:3:2: error: bad\n');
    assert.equal(first.error.code, 1);
    const second = await run(`${HEADER}theorem c : P := h\n`);
    assert.equal(second.error, null);
    assert.deepEqual(commands(), ['', HEADER, 'theorem a : P := ERROR\n', 'theorem b : P := h\n', 'theorem c : P := h\n']);
});

test('the theorems a check shares with an earlier one are not elaborated again', async (t) => {
    const { pool, run, commands } = fakePool();
    t.after(() => pool.stop());
    await run(`${HEADER}theorem a : P := ERROR\ntheorem b : P := h\n`);
    const again = await run(`${HEADER}theorem a : P := ERROR\ntheorem c : P := h\n`);
    assert.equal(again.stdout, 'Proof.lean:3:2: error: bad\n');
    // b's environment followed a's, so c can start from it only if it follows a too.
    await run(`${HEADER}theorem c : P := h\n`);
    assert.deepEqual(commands(), ['', HEADER, 'theorem a : P := ERROR\n', 'theorem b : P := h\n', 'theorem c : P := h\n', 'theorem c : P := h\n']);
});

test('the environments kept are the most recently used ones', async (t) => {
    const { pool, run, commands } = fakePool({ pool: { maxEnvs: 2 } });
    t.after(() => pool.stop());
    await run(`${HEADER}theorem a : P := h\n`);
    await run('variable {Q : Prop}\n\ntheorem b : Q := h\n');
    await run(`${HEADER}theorem a : P := h\n`);
    assert.equal(commands().filter((command) => command === HEADER).length, 2);
});

test('a check whose browser went away is dropped while it waits', async (t) => {
    const { pool, run, commands } = fakePool();
    t.after(() => pool.stop());
    const slow = run(`${HEADER}theorem a : P := SLOW\n`);
    const controller = new AbortController();
    let called = false;
    pool.run(`${HEADER}theorem dropped : P := h\n`, controller.signal, () => { called = true; });
    controller.abort();
    await slow;
    await run(`${HEADER}theorem after : P := h\n`);
    assert.equal(called, false);
    assert.ok(!commands().includes('theorem dropped : P := h\n'));
});

test('a running check whose browser went away stops before its next theorem', async (t) => {
    const { pool, commands } = fakePool();
    t.after(() => pool.stop());
    const controller = new AbortController();
    pool.run(`${HEADER}theorem a : P := SLOW\ntheorem b : P := h\n`, controller.signal, () => assert.fail('no answer is needed'));
    await new Promise((resolve) => setTimeout(resolve, 100));
    controller.abort();
    await new Promise((resolve) => setTimeout(resolve, 400));
    assert.ok(commands().includes('theorem a : P := SLOW\n'));
    assert.ok(!commands().includes('theorem b : P := h\n'));
});

test('a check that takes too long times out like lean, and the REPL is restarted', async (t) => {
    const { pool, run } = fakePool();
    t.after(() => pool.stop());
    const stuck = await run(`${HEADER}theorem a : P := STUCK\n`);
    assert.equal(stuck.error.killed, true);
    assert.equal(stuck.error.code, null);
    const next = await run(`${HEADER}theorem b : P := h\n`);
    assert.equal(next.error, null);
});

test('when the REPL crashes, the check is made with lean instead', async (t) => {
    const { pool, run, fallbacks } = fakePool();
    t.after(() => pool.stop());
    const crashed = await run(`${HEADER}theorem a : P := CRASH\n`);
    assert.equal(crashed.stdout, 'fallback');
    assert.equal(fallbacks.length, 1);
    assert.equal((await run(`${HEADER}theorem b : P := h\n`)).error, null);
});

test('a REPL that cannot start is given up on, for lean', async (t) => {
    const { pool, run, fallbacks } = fakePool({ env: { FAKE_REPL_FAIL: '1' } });
    t.after(() => pool.stop());
    for (let i = 0; i < 4; i += 1) assert.equal((await run(`${HEADER}theorem a${i} : P := h\n`)).stdout, 'fallback');
    assert.equal(fallbacks.length, 4);
    assert.equal(pool.disabled, true);
});

test('the REPL is restarted after maxRequests checks, with its headers', async (t) => {
    const { pool, run, commands } = fakePool({ pool: { maxRequests: 2 } });
    t.after(() => pool.stop());
    for (let i = 0; i < 3; i += 1) await run(`${HEADER}theorem a${i} : P := h\n`);
    assert.equal(commands().filter((command) => command === HEADER).length, 2);
});
