const { spawn, execFile } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');

// Checks Lean code with long-running Lean REPL processes
// (https://github.com/leanprover-community/repl, built by build-repl.sh),
// instead of a `lean` process per check: starting Lean and loading its
// library took most of each check's time, and every process took ~480 MB,
// so a few checks at once overflowed the server's memory.
//
// The code of a check starts with a header that many checks share (the
// preludes and the level's `variable` line, see frontend/src/game/
// gameLeanCode.js), then the theorems. Each REPL elaborates a header once
// and keeps the resulting environment; the theorems of each check then run
// in it, one after the other, and are kept too, for the next checks that
// start with the same theorems (see Worker.check). The answer is the text
// `lean <file>` prints for the whole code, with the line numbers of the
// whole code, so the endpoints answer as before.

const DEFAULTS = {
    size: 1, // REPL processes; each holds Lean's library in memory
    timeoutMs: 20000,
    // Environments each process keeps: those of headers, and of theorems
    // after them (see Worker.check); some 100 KB each.
    maxEnvs: 500,
    // Restarted now and then, in case its memory grows all the same.
    maxRequests: 2000,
    maxRssMb: 900,
    rssEvery: 10, // checks between readings of the memory a process uses
    // A check whose browser went away is given this long to finish before
    // its process is restarted (restarting costs the headers of the others).
    cancelGraceMs: 2000,
};

// The code as its header and its theorems, each with the number of lines
// before it. The theorems start right after the last blank line followed by
// a `theorem`; with several theorems (the states of all the moves, see
// moveStates.js) the later ones follow without a blank line, so the header
// is the same as for a check of one theorem. A `theorem` at the start of a
// line starts a new top-level command, so elaborating the parts one after
// the other, each in the environment the one before left, is the same as
// elaborating the whole code.
const splitCode = (code) => {
    let start = 0;
    for (const match of code.matchAll(/\n\n(?=theorem\s)/g)) start = match.index + 2;
    const header = code.slice(0, start);
    let line = header.split('\n').length - 1;
    const theorems = code.slice(start).split(/^(?=theorem\s)/m).map((text) => {
        const theorem = { text, lineOffset: line };
        line += text.split('\n').length - 1;
        return theorem;
    });
    return { header, theorems };
};

// A REPL message as `lean <file>` prints it. The REPL is patched (see
// repl.patch) to give that text (with the error's name, e.g.
// `error(lean.unknownIdentifier):`, which the frontend reads), positioned in
// the code it was given; here it is moved to its place in the whole code.
const formatMessage = ({ severity, pos, data, text }, fileName, lineOffset) => {
    // `lean` prints information (e.g. #check) without a position.
    if (text === undefined) text = severity === 'info' ? `${data}\n` : `<input>:${pos.line}:${pos.column}: ${severity}: ${data}\n`;
    const position = `<input>:${pos.line}:${pos.column}`;
    if (severity === 'info' || !text.startsWith(position)) return text;
    return `${fileName}:${pos.line + lineOffset}:${pos.column}${text.slice(position.length)}`;
};

// `lean` stops at the 101st error (its option maxErrors), which it reports as such.
const MAX_ERRORS = 100;

const countErrors = (messages) => messages.filter(({ severity }) => severity === 'error').length;

// A short key for some code following the code `previous` stands for.
const keyOf = (previous, text) => crypto.createHash('sha256').update(`${previous}\0${text}`).digest('base64');

// What `lean <file>` prints for the messages of the parts of the code
// ([{ messages, lineOffset }], in order), and whether there were errors.
const formatOutput = (parts, fileName) => {
    let stdout = '';
    let errors = 0;
    for (const { messages, lineOffset } of parts) {
        for (const message of messages) {
            if (message.severity === 'error') errors += 1;
            if (errors > MAX_ERRORS) {
                const { line, column } = message.pos;
                stdout += `${fileName}:${line + lineOffset}:${column}: error: maximum number of errors (${MAX_ERRORS}; from option \`maxErrors\`) reached, exiting\n`;
                return { stdout, failed: true };
            }
            stdout += formatMessage(message, fileName, lineOffset);
        }
    }
    return { stdout, failed: errors > 0 };
};

class TimeoutError extends Error {}

// The resident memory of a process, in MB, or null where it cannot be read.
const residentMb = (pid) => new Promise((resolve) => {
    fs.readFile(`/proc/${pid}/statm`, 'utf8', (error, statm) => {
        if (!error) return resolve((Number(statm.split(' ')[1]) * 4096) / 2 ** 20);
        execFile('ps', ['-o', 'rss=', '-p', String(pid)], (psError, stdout) => resolve(psError ? null : Number(stdout.trim()) / 1024));
    });
});

// One REPL process. Requests and responses are JSON, each followed by a blank
// line; it answers them one at a time, in order.
class ReplProcess {
    constructor({ command, args = [], cwd, env }) {
        this.child = spawn(command, args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
        this.buffer = '';
        this.pending = null; // { resolve, reject, timer }
        this.exited = false;
        this.child.stdout.setEncoding('utf8');
        this.child.stdout.on('data', (chunk) => this.receive(chunk));
        this.child.stderr.on('data', (chunk) => console.error(`Lean REPL: ${chunk}`));
        this.child.stdin.on('error', () => {}); // reported by 'exit'
        this.child.on('error', (error) => this.fail(error));
        this.child.on('exit', (code, signal) => this.fail(new Error(`Lean REPL exited (${signal || code})`)));
        // An idle REPL does not keep Node running (a request in progress does,
        // through its time limit); it exits when its input closes.
        this.child.unref();
        [this.child.stdin, this.child.stdout, this.child.stderr].forEach((stream) => stream.unref?.());
    }

    receive(chunk) {
        this.buffer += chunk;
        let end;
        while ((end = this.buffer.indexOf('\n\n')) !== -1) {
            const text = this.buffer.slice(0, end);
            this.buffer = this.buffer.slice(end + 2);
            if (!text.trim()) continue;
            const pending = this.pending;
            this.pending = null;
            if (!pending) continue;
            clearTimeout(pending.timer);
            try {
                pending.resolve(JSON.parse(text));
            } catch (error) {
                pending.reject(error);
            }
        }
    }

    fail(error) {
        this.exited = true;
        const pending = this.pending;
        this.pending = null;
        if (pending) {
            clearTimeout(pending.timer);
            pending.reject(error);
        }
    }

    // Sends one request; rejects with a TimeoutError (and kills the process)
    // if there is no answer by `deadline`.
    send(request, deadline) {
        if (this.exited) return Promise.reject(new Error('Lean REPL is not running'));
        return new Promise((resolve, reject) => {
            this.pending = { resolve, reject, timer: null };
            this.setDeadline(deadline);
            this.child.stdin.write(`${JSON.stringify(request)}\n\n`);
        });
    }

    // Moves the deadline of the request in progress (earlier, when its browser went away).
    setDeadline(deadline) {
        const pending = this.pending;
        if (!pending) return;
        clearTimeout(pending.timer);
        pending.timer = setTimeout(() => {
            this.kill();
            if (this.pending === pending) {
                this.pending = null;
                pending.reject(new TimeoutError('Lean REPL timed out'));
            }
        }, Math.max(0, deadline - Date.now()));
    }

    kill() {
        this.exited = true;
        this.child.kill('SIGKILL');
    }
}

// A REPL process with the environments it has elaborated (see check),
// restarted when it times out, crashes, or has grown.
class Worker {
    constructor(options) {
        this.options = options;
        this.repl = null;
        this.ready = null; // resolves to the base environment (Lean's library loaded)
        this.envs = new Map(); // prefix key → { env, messages }, least recently used first
        this.requests = 0;
        this.job = null;
    }

    start() {
        if (this.ready) return this.ready;
        this.repl = new ReplProcess(this.options);
        this.envs = new Map();
        this.requests = 0;
        // An empty command loads Lean's library (Init); the headers build on it,
        // so it is loaded once per process, not once per header.
        const ready = this.repl.send({ cmd: '' }, Date.now() + this.options.timeoutMs)
            .then((response) => {
                if (response.env === undefined) throw new Error(response.message);
                return response.env;
            })
            .catch((error) => {
                throw Object.assign(new Error(`Lean REPL failed to start: ${error.message}`), { duringStart: true });
            });
        this.ready = ready;
        ready.catch(() => {
            if (this.ready === ready) this.stop();
        });
        return ready;
    }

    stop() {
        this.repl?.kill();
        this.repl = null;
        this.ready = null;
        this.envs = new Map();
    }

    // The environment and messages after the part of the code `key` stands
    // for, if this process has it.
    cached(key) {
        const entry = this.envs.get(key);
        if (entry) {
            this.envs.delete(key);
            this.envs.set(key, entry);
        }
        return entry;
    }

    // Elaborates `cmd` in environment `env`, and keeps the result as `key`.
    // The REPL keeps every environment it is not told to replace (see
    // repl.patch), so when there are maxEnvs, the new one takes the place of
    // the least recently used.
    async elaborate(key, cmd, env, deadline) {
        let replaceEnv;
        if (this.envs.size >= this.options.maxEnvs) {
            const [oldest, entry] = this.envs.entries().next().value;
            this.envs.delete(oldest);
            replaceEnv = entry.env;
        }
        const response = await this.repl.send({ cmd, env, replaceEnv, skipSorries: true }, deadline);
        if (response.env === undefined) throw new Error(`Lean REPL: ${response.message}`);
        const entry = { env: response.env, messages: response.messages || [] };
        this.envs.set(key, entry);
        return entry;
    }

    // Lean's messages for the code, as [{ messages, lineOffset }], one for
    // the header and one for each theorem; null if the check was cancelled.
    //
    // The header is elaborated once, then each theorem in the environment the
    // one before it left. Each step is kept, under a key standing for the
    // code up to it: the next check of the same level starts from the longest
    // part it shares with checks before it, which, as students add moves at
    // the end, is most of the states of the moves (see moveStates.js).
    async check({ header, headerKey, theorems }, job) {
        job.deadline = Date.now() + this.options.timeoutMs;
        const base = await this.start();
        let entry = this.cached(headerKey) || await this.elaborate(headerKey, header, base, job.deadline);
        const parts = [{ messages: entry.messages, lineOffset: 0 }];
        let errors = countErrors(entry.messages);
        let key = headerKey;
        // One theorem at a time: `lean` stops at its error limit (the states
        // of many moves after a broken one can reach it), and so can this
        // check, or when its browser goes away.
        for (const { text, lineOffset } of theorems) {
            if (errors > MAX_ERRORS || job.cancelled) break;
            key = keyOf(key, text);
            entry = this.cached(key) || await this.elaborate(key, text, entry.env, job.deadline);
            parts.push({ messages: entry.messages, lineOffset });
            errors += countErrors(entry.messages);
        }
        return job.cancelled ? null : parts;
    }

    // Restarts the process if it has served enough checks or grown too much.
    async recycleIfNeeded() {
        this.requests += 1;
        if (!this.repl) return;
        let rss = null;
        if (this.requests >= this.options.maxRequests) rss = Infinity;
        else if (this.requests % this.options.rssEvery === 0) rss = await residentMb(this.repl.child.pid);
        if (rss !== null && rss > this.options.maxRssMb) {
            this.stop();
            this.start().catch(() => {});
        }
    }
}

// Checks Lean code with `size` REPL processes, one check at a time each, the
// others waiting in line. `fallback(code, signal, callback)` checks code
// with `lean <file>`, for when the REPL fails in a way the code did not cause.
class LeanRepl {
    constructor({ command, args, cwd, env, fileName, fallback, ...options }) {
        this.options = { ...DEFAULTS, ...options };
        this.fileName = fileName;
        this.fallback = fallback;
        this.queue = [];
        this.failedStarts = 0;
        this.workers = Array.from({ length: this.options.size }, () => new Worker({ command, args, cwd, env, ...this.options }));
    }

    // Starts the processes now, so that the first check does not wait for Lean to load.
    start() {
        this.workers.forEach((worker) => worker.start().catch((error) => console.error(error.message)));
    }

    stop() {
        this.workers.forEach((worker) => worker.stop());
    }

    // Calls back with (null, { error, stdout, stderr }) like child_process.exec
    // running `lean <file>`, or does not call back if `signal` aborts first.
    run(code, signal, callback) {
        if (this.disabled) return this.fallback(code, signal, callback);
        if (signal?.aborted) return;
        const parts = splitCode(code);
        parts.headerKey = keyOf('', parts.header);
        const job = { code, parts, signal, callback, cancelled: false, deadline: null, worker: null };
        signal?.addEventListener('abort', () => this.cancel(job), { once: true });
        this.queue.push(job);
        this.pump();
    }

    cancel(job) {
        job.cancelled = true;
        const index = this.queue.indexOf(job);
        if (index !== -1) {
            this.queue.splice(index, 1);
            return;
        }
        // Running: it stops before its next theorem (see Worker.check). The
        // REPL cannot stop in the middle of one, so that gets a little longer
        // to finish, and then the REPL is restarted.
        const repl = job.worker?.job === job && job.worker.repl;
        if (repl && job.deadline) {
            job.deadline = Math.min(job.deadline, Date.now() + this.options.cancelGraceMs);
            repl.setDeadline(job.deadline);
        }
    }

    // Gives waiting checks to idle processes, preferring one that already has the header.
    pump() {
        for (;;) {
            const idle = this.workers.filter((worker) => !worker.job);
            if (idle.length === 0 || this.queue.length === 0) return;
            const job = this.queue.shift();
            const worker = idle.find((candidate) => candidate.envs.has(job.parts.headerKey)) || idle[0];
            this.execute(worker, job);
        }
    }

    async execute(worker, job) {
        worker.job = job;
        job.worker = worker;
        let result;
        try {
            const parts = await worker.check(job.parts, job);
            this.failedStarts = 0;
            if (parts) {
                const { stdout, failed } = formatOutput(parts, this.fileName);
                // What exec gives when `lean` exits with errors.
                const error = failed ? Object.assign(new Error(`Command failed: lean "${this.fileName}"\n`), { code: 1, killed: false, signal: null }) : null;
                result = { error, stdout, stderr: '' };
            }
        } catch (error) {
            worker.stop();
            if (error.duringStart) this.failedStarts += 1;
            else worker.start().catch(() => {});
            if (error instanceof TimeoutError) {
                // What exec gives when it kills `lean` at its time limit.
                result = { error: Object.assign(new Error(`Command failed: lean "${this.fileName}"\n`), { code: null, killed: true, signal: 'SIGTERM' }), stdout: '', stderr: '' };
            } else if (!job.cancelled) {
                console.error(`${error.message}; checking with lean instead`);
                result = 'fallback';
            }
        }
        worker.job = null;
        if (!job.cancelled) {
            if (result === 'fallback') this.fallback(job.code, job.signal, job.callback);
            else if (result) job.callback(null, result);
        }
        await worker.recycleIfNeeded();
        // A REPL that cannot start again and again (e.g. one built for another
        // Lean) is given up on.
        if (this.failedStarts >= 3 && !this.disabled) {
            this.disabled = true;
            console.error('Lean REPL keeps failing; checking every proof with lean from now on');
        }
        if (this.disabled) {
            this.stop();
            this.queue.splice(0).forEach((waiting) => this.fallback(waiting.code, waiting.signal, waiting.callback));
            return;
        }
        this.pump();
    }
}

module.exports = { LeanRepl, splitCode, formatOutput };
