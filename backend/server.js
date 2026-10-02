const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const os = require('os');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

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

const runLean = (leanCode, callback) => {
    const projectDir = path.join(__dirname, 'lean_project');
    const tempFile = path.join(projectDir, `Proof_${Date.now()}_${Math.random().toString(16).slice(2)}.lean`);

    fs.writeFile(tempFile, leanCode, (writeError) => {
        if (writeError) return callback(writeError);

        exec(`lean "${tempFile}"`, { cwd: projectDir }, (error, stdout, stderr) => {
            fs.unlink(tempFile, (unlinkError) => {
                if (unlinkError) console.error('Error deleting temp file:', unlinkError);
            });
            callback(null, { error, stdout, stderr });
        });
    });
};

app.post('/proof-state', (req, res) => {
    const { leanCode } = req.body;
    if (!leanCode) return res.status(400).json({ error: 'No Lean code provided' });

    runLean(leanCode, (writeError, result) => {
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

    if (!leanCode) {
        return res.status(400).json({ error: 'No Lean code provided' });
    }

    // Use a fixed file in the project directory so imports work
    const projectDir = path.join(__dirname, 'lean_project');
    const tempFile = path.join(projectDir, `Proof_${Date.now()}.lean`);

    fs.writeFile(tempFile, leanCode, (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return res.status(500).json({ error: 'Failed to write temporary file' });
        }

        // Execute lean command within the project context
        exec(`lean "${tempFile}"`, { cwd: projectDir }, (error, stdout, stderr) => {
            // Clean up the temporary file
            fs.unlink(tempFile, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
            });

            if (error) {
                // Lean returns non-zero exit code on verify failure (usually)
                // But sometimes it's just a proof error which is "success" in terms of running the tool, but failure in proof.
                // actually Lean 4 returns error on syntax/proof errors.
                return res.json({
                    output: stdout + stderr,
                    exitCode: error.code,
                    error: error.message
                });
            }

            res.json({ output: stdout, exitCode: 0 });
        });
    });
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`EasyLean backend running on port ${port}`);
    });
}

module.exports = { app, parseLeanProofState };
