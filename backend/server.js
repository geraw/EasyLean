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

app.post('/verify', (req, res) => {
    const { leanCode } = req.body;

    if (!leanCode) {
        return res.status(400).json({ error: 'No Lean code provided' });
    }

    const tempDir = os.tmpdir();
    // Use a random filename to avoid collisions
    const tempFile = path.join(tempDir, `proof_${Date.now()}_${Math.random().toString(36).substring(7)}.lean`);

    fs.writeFile(tempFile, leanCode, (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return res.status(500).json({ error: 'Failed to write temporary file' });
        }

        // Execute lean command
        exec(`lean "${tempFile}"`, (error, stdout, stderr) => {
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

app.listen(port, () => {
    console.log(`EasyLean backend running on port ${port}`);
});
