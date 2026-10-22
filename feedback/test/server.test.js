const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApp, localStore } = require('../server');
const { readAll, page } = require('../inbox');

// The smallest PNG: one transparent pixel.
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

let dir;
let server;
let baseUrl;

test.before(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'feedback-'));
    server = createApp({ store: localStore(dir) }).listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => {
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
});

const send = (body) => fetch(`${baseUrl}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
    body: JSON.stringify(body),
});

test('keeps the remarks, contact details, context and images, each feedback in its own folder', async () => {
    const response = await send({
        comment: 'הרמז בשלב 3 לא ברור',
        contact: { name: 'Dana', email: 'dana@example.com', phone: '050-0000000' },
        context: { where: 'יחידה 2, שלב 3/8', kind: 'proof', proof: 'נניח P.' },
        screenshot: PNG,
        images: [{ name: 'pasted.png', dataUrl: PNG }],
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    const { id } = await response.json();
    const kept = JSON.parse(fs.readFileSync(path.join(dir, id, 'feedback.json'), 'utf8'));
    assert.equal(kept.comment, 'הרמז בשלב 3 לא ברור');
    assert.deepEqual(kept.contact, { name: 'Dana', email: 'dana@example.com', phone: '050-0000000' });
    assert.equal(kept.context.proof, 'נניח P.');
    assert.equal(kept.screenshot, 'screenshot.png');
    assert.deepEqual(kept.images, [{ file: 'image-1.png', originalName: 'pasted.png' }]);
    assert.ok(fs.readFileSync(path.join(dir, id, 'image-1.png')).subarray(1, 4).equals(Buffer.from('PNG')));

    const html = page(readAll(dir));
    assert.match(html, /הרמז בשלב 3 לא ברור/);
    assert.match(html, /mailto:dana@example\.com/);
});

test('contact details are optional', async () => {
    const response = await send({ comment: 'כל הכבוד', context: {} });
    assert.equal(response.status, 200);
});

test('refuses empty feedback, and files that are not images', async () => {
    assert.equal((await send({ comment: '  ', context: {} })).status, 400);
    const html = `data:image/png;base64,${Buffer.from('<script>alert(1)</script>').toString('base64')}`;
    assert.equal((await send({ comment: 'x', images: [{ dataUrl: html }] })).status, 400);
    assert.equal((await send({ comment: 'x', images: [{ dataUrl: 'data:text/html;base64,PGI+' }] })).status, 400);
    assert.equal((await send({ comment: 'x', images: Array(7).fill({ dataUrl: PNG }) })).status, 400);
});

test('the inbox page escapes what students wrote', () => {
    const html = page([{ folder: 'f', id: 'f', receivedAt: '', comment: '<img src=x onerror=alert(1)>', contact: { name: '<b>' }, context: {}, images: [] }]);
    assert.doesNotMatch(html, /<img src=x/);
    assert.match(html, /&lt;img src=x/);
});
