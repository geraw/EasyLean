// A stand-in for the Lean REPL, for testing leanRepl.js without Lean: it
// speaks the REPL's protocol (JSON requests and answers, each followed by a
// blank line), logs each request's command to FAKE_REPL_LOG, and acts on
// words in it: SLOW answers after 300 ms, STUCK never answers, CRASH exits,
// ERROR reports an error on the command's first line. FAKE_REPL_FAIL makes
// it exit before answering anything.
const fs = require('fs');

// `node --test` runs every file in test/; this one only runs as the REPL.
if (!process.env.FAKE_REPL) process.exit(0);
if (process.env.FAKE_REPL_FAIL) process.exit(1);

let environments = 0;
let buffer = '';
const answer = (response) => process.stdout.write(`${JSON.stringify(response, null, 1)}\n\n`);

const handle = (request) => {
    if (process.env.FAKE_REPL_LOG) fs.appendFileSync(process.env.FAKE_REPL_LOG, `${JSON.stringify(request.cmd)}\n`);
    if (request.cmd.includes('CRASH')) process.exit(2);
    if (request.cmd.includes('STUCK')) return;
    const env = request.replaceEnv ?? environments++;
    const messages = request.cmd.includes('ERROR')
        ? [{ severity: 'error', pos: { line: 1, column: 2 }, endPos: null, data: 'bad', text: '<input>:1:2: error: bad\n' }]
        : [];
    const send = () => answer({ env, ...(messages.length ? { messages } : {}) });
    if (request.cmd.includes('SLOW')) setTimeout(send, 300);
    else send();
};

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
    buffer += chunk;
    let end;
    while ((end = buffer.indexOf('\n\n')) !== -1) {
        const text = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (text.trim()) handle(JSON.parse(text));
    }
});
process.stdin.on('end', () => process.exit(0));
