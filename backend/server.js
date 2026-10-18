const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const { exec, execFileSync } = require('child_process');
const path = require('path');
const { LeanRepl } = require('./leanRepl');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
// The states of all the moves of a long proof (see frontend/src/game/
// moveStates.js) can pass body-parser's default limit of 100 KB.
app.use(bodyParser.json({ limit: '1mb' }));

const parseLeanProofState = (output) => {
    const markerIndex = output.indexOf('unsolved goals');
    if (markerIndex === -1) return null;

    const lines = output.slice(markerIndex + 'unsolved goals'.length)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    const goalIndex = lines.findIndex((line) => line.startsWith('⊢'));
    if (goalIndex === -1) return null;

    const assumptions = lines.slice(0, goalIndex)
        .map((line) => {
            const separator = line.indexOf(':');
            if (separator === -1) return null;
            return {
                name: line.slice(0, separator).trim(),
                prop: line.slice(separator + 1).trim(),
            };
        })
        .filter(Boolean);

    return {
        assumptions,
        goal: lines[goalIndex].slice(1).trim(),
        complete: false,
    };
};

const LEAN_TIMEOUT_MS = 20000;

// The pilot server is public, and some Lean code runs programs on it: `#eval`
// runs arbitrary code (including shell commands), and so do other commands
// (`#guard`, `run_cmd`, ...), `native_decide` and `decide +native` (which
// compile the claim and run it), code that Lean runs in place of a definition
// (`implemented_by`, `extern`, `unsafe`) or when it loads it (`initialize`),
// and macros or new syntax that build any of these out of pieces. Reading
// files (`include_str`) and importing are refused too: the proofs only need
// Lean's core, which the REPL loads once. Proofs built from blocks use none
// of these; the tactic macros of the preludes are allowed, in the one form
// they take (text to text, nothing computed).
const FORBIDDEN = [
    /#[A-Za-z]/,
    /\brun_\w+/,
    /\bnative/,
    /reduce(Bool|Nat)/i, // Lean.ofReduceBool, which native_decide builds
    /extern\b/, // also test_extern
    /\b(unsafe\w*|implemented_by|init|initialize|builtin_initialize|include_str|macro_rules|syntax|elab|elab_rules|declare_syntax_cat)\b/,
    /^\s*(import|prelude|module)\b/m,
];
const PRELUDE_MACRO = /^macro "\w+" : tactic => `\(tactic\|[^$\n]*\)$/gm;
const isForbidden = (leanCode) => FORBIDDEN.some((pattern) => pattern.test(leanCode))
    || (leanCode.match(/\bmacro\b/g) || []).length !== (leanCode.match(PRELUDE_MACRO) || []).length;

// Shared checks for both endpoints; returns an error response, or null.
const rejectRequest = (leanCode) => {
    if (!leanCode || typeof leanCode !== 'string') return { status: 400, error: 'No Lean code provided' };
    if (isForbidden(leanCode)) return { status: 400, error: 'Forbidden command in Lean code' };
    return null;
};

const projectDir = path.join(__dirname, 'lean_project');

// Checks the code with its own `lean` process. Calls back like exec, or not
// at all if `signal` aborts first (the process is then killed).
const runLeanFile = (leanCode, signal, callback) => {
    const tempFile = path.join(projectDir, `Proof_${Date.now()}_${Math.random().toString(16).slice(2)}.lean`);

    fs.writeFile(tempFile, leanCode, (writeError) => {
        if (writeError) return callback(writeError);

        // A time limit, so that one stuck check cannot hold the server.
        exec(`lean "${tempFile}"`, { cwd: projectDir, timeout: LEAN_TIMEOUT_MS, signal }, (error, stdout, stderr) => {
            fs.unlink(tempFile, (unlinkError) => {
                if (unlinkError) console.error('Error deleting temp file:', unlinkError);
            });
            if (signal?.aborted) return;
            callback(null, { error, stdout, stderr });
        });
    });
};

// Lean in long-running REPL processes (see leanRepl.js), which answer in a
// fraction of the time, or null to check each proof with its own `lean`
// process. LEAN_REPL is the REPL to use, or "off"; by default it is the one
// build-repl.sh builds, if it was built.
const createLeanRepl = () => {
    const setting = process.env.LEAN_REPL;
    if (setting === 'off') return null;
    const command = setting || path.join(__dirname, 'lean_repl', '.lake', 'build', 'bin', 'repl');
    if (!fs.existsSync(command)) {
        if (setting) console.error(`LEAN_REPL: ${command} not found; checking each proof with lean`);
        return null;
    }
    // The REPL finds Lean's library through LEAN_SYSROOT: that of the toolchain
    // the project pins (elan picks it in lean_project/), which the REPL was built with.
    let sysroot = process.env.LEAN_SYSROOT;
    if (!sysroot) {
        try {
            sysroot = execFileSync('lean', ['--print-prefix'], { cwd: projectDir, encoding: 'utf8' }).trim();
        } catch {
            console.error('lean --print-prefix failed; checking each proof with lean');
            return null;
        }
    }
    const number = (name) => (process.env[name] ? Number(process.env[name]) : undefined);
    const options = {
        size: number('LEAN_REPL_POOL'),
        maxEnvs: number('LEAN_REPL_ENVS'),
        maxRequests: number('LEAN_REPL_MAX_REQUESTS'),
        maxRssMb: number('LEAN_REPL_MAX_RSS_MB'),
    };
    Object.keys(options).forEach((key) => options[key] === undefined && delete options[key]);
    return new LeanRepl({
        command,
        cwd: projectDir,
        env: { ...process.env, LEAN_SYSROOT: sysroot },
        fileName: path.join(projectDir, 'Proof.lean'),
        fallback: runLeanFile,
        timeoutMs: LEAN_TIMEOUT_MS,
        ...options,
    });
};
const leanRepl = createLeanRepl();

// Checks the code, calling back like exec running `lean <file>`. When the
// browser goes away (a newer edit superseded the request), the check is
// dropped if it is still waiting, or cut short, and there is no call back.
const runLean = (leanCode, res, callback) => {
    const controller = new AbortController();
    res.on('close', () => {
        if (!res.writableFinished) controller.abort();
    });
    // As a file, Lean would read unpaired surrogates as U+FFFD.
    const code = leanCode.toWellFormed ? leanCode.toWellFormed() : leanCode;
    if (leanRepl) leanRepl.run(code, controller.signal, callback);
    else runLeanFile(code, controller.signal, callback);
};

app.post('/proof-state', (req, res) => {
    const { leanCode } = req.body;
    const rejection = rejectRequest(leanCode);
    if (rejection) return res.status(rejection.status).json({ error: rejection.error });

    runLean(leanCode, res, (writeError, result) => {
        if (writeError) return res.status(500).json({ error: 'Failed to write temporary file' });

        const output = result.stdout + result.stderr;
        const state = parseLeanProofState(output);
        const hasHardError = output.split(/\r?\n/)
            .some((line) => line.includes('error:')
                && !line.includes('unsolved goals')
                && !line.includes("don't know how to synthesize placeholder"));
        if (state && !hasHardError) return res.json({ ...state, output });
        if (!result.error) return res.json({ assumptions: [], goal: null, complete: true, output });
        return res.json({ assumptions: [], goal: null, complete: false, error: 'יש שגיאה במהלך ההוכחה', output });
    });
});

app.post('/verify', (req, res) => {
    const { leanCode } = req.body;
    const rejection = rejectRequest(leanCode);
    if (rejection) return res.status(rejection.status).json({ error: rejection.error });

    // runLeanFile gives each request its own file; a shared name let concurrent
    // checks overwrite each other's proofs.
    runLean(leanCode, res, (writeError, result) => {
        if (writeError) {
            console.error('Error writing file:', writeError);
            return res.status(500).json({ error: 'Failed to write temporary file' });
        }
        // Lean exits non-zero when the proof has errors.
        if (result.error) {
            return res.json({
                output: result.stdout + result.stderr,
                exitCode: result.error.code,
                error: result.error.message,
            });
        }
        res.json({ output: result.stdout, exitCode: 0 });
    });
});

if (require.main === module) {
    // Listen once the REPL has loaded Lean's library (or failed to): Cloud Run
    // gives a starting instance its full CPU, while an idle one, between
    // requests, gets almost none, so loading it later made the first check
    // after a cold start wait for it.
    const listen = () => app.listen(port, () => {
        console.log(`EasyLean backend running on port ${port}, ${leanRepl ? 'with the Lean REPL' : 'running lean for each check'}`);
    });
    if (leanRepl) leanRepl.start().catch(() => {}).finally(listen);
    else listen();
}

module.exports = { app, parseLeanProofState, isForbidden, leanRepl, runLeanFile };
