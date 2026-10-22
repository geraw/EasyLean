// The feedback service: keeps what students send with the site's feedback
// button (frontend/src/feedback/), each in its own folder: feedback.json (the
// remarks, the contact details they chose to give, and where they were in the
// course and the state of their work), screenshot.jpg, and the images they
// attached. inbox.js shows them all on one page.
//
// It is apart from the backend, which runs Lean code from the public and so
// has no permissions and no way out to the internet. This one runs no code it
// receives: it checks what it gets and writes it, to a Cloud Storage bucket
// when FEEDBACK_BUCKET is set (on Cloud Run, see ops/deploy-feedback.sh),
// otherwise to a local folder (FEEDBACK_DIR, by default ./inbox).
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const MAX_COMMENT = 20000;
const MAX_CONTACT = 200;
const MAX_CONTEXT_BYTES = 2 * 1024 * 1024;
const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
// Feedback from one address in an hour: enough for a student with a lot to
// say, little for a script.
const MAX_PER_HOUR = 30;

const ORIGINS = (process.env.FEEDBACK_ORIGINS || 'https://geraw.github.io,http://localhost:5173,http://127.0.0.1:5173')
    .split(',').map((origin) => origin.trim()).filter(Boolean);

// The image types the form sends, by their first bytes, so that nothing
// else is kept under an image's name.
const IMAGE_TYPES = {
    'image/png': { ext: 'png', magic: (b) => b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) },
    'image/jpeg': { ext: 'jpg', magic: (b) => b[0] === 0xff && b[1] === 0xd8 },
    'image/gif': { ext: 'gif', magic: (b) => b.subarray(0, 4).toString('latin1') === 'GIF8' },
    'image/webp': { ext: 'webp', magic: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
};

// { type, ext, buffer } of an image sent as a data URL; throws if it is not one.
const decodeImage = (dataUrl) => {
    const match = typeof dataUrl === 'string' && dataUrl.match(/^data:(image\/[a-z]+);base64,([A-Za-z0-9+/]+=*)$/);
    const kind = match && IMAGE_TYPES[match[1]];
    if (!kind) throw new Error('not an image');
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > MAX_IMAGE_BYTES) throw new Error('image too large');
    if (!kind.magic(buffer)) throw new Error('not an image');
    return { type: match[1], ext: kind.ext, buffer };
};

const text = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');

// The feedback as it is kept, and its files; throws with a reason if the request is not feedback.
const readFeedback = (body) => {
    if (!body || typeof body !== 'object') throw new Error('no feedback');
    const comment = text(body.comment, MAX_COMMENT).trim();
    const contact = Object.fromEntries(['name', 'email', 'phone'].map((key) => [key, text(body.contact?.[key], MAX_CONTACT).trim()]));
    const context = body.context && typeof body.context === 'object' ? body.context : {};
    if (Buffer.byteLength(JSON.stringify(context)) > MAX_CONTEXT_BYTES) throw new Error('context too large');
    const images = Array.isArray(body.images) ? body.images : [];
    if (images.length > MAX_IMAGES) throw new Error('too many images');
    if (!comment && images.length === 0) throw new Error('empty feedback');

    const files = [];
    let screenshot = null;
    if (body.screenshot) {
        const image = decodeImage(body.screenshot);
        screenshot = `screenshot.${image.ext}`;
        files.push({ name: screenshot, ...image });
    }
    const attached = images.map((image, index) => {
        const decoded = decodeImage(image?.dataUrl);
        const name = `image-${index + 1}.${decoded.ext}`;
        files.push({ name, ...decoded });
        return { file: name, originalName: text(image?.name, MAX_CONTACT) };
    });
    return { comment, contact, context, screenshot, images: attached, files };
};

// Writes a file of one feedback: name is "<id>/<file>".
const localStore = (dir) => async (name, buffer) => {
    const file = path.join(dir, name);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, buffer);
};

// On Cloud Run, the service account's token comes from the metadata server;
// it only lets the service create objects in the bucket, not read them.
let token = null;
const accessToken = async () => {
    if (token && token.expires > Date.now()) return token.value;
    const response = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
        headers: { 'Metadata-Flavor': 'Google' },
    });
    if (!response.ok) throw new Error(`metadata server: ${response.status}`);
    const { access_token: value, expires_in: seconds } = await response.json();
    token = { value, expires: Date.now() + (seconds - 60) * 1000 };
    return value;
};
const bucketStore = (bucket) => async (name, buffer, type) => {
    const url = `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket)}/o?uploadType=media&name=${encodeURIComponent(name)}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': type },
        body: buffer,
    });
    if (!response.ok) throw new Error(`storage: ${response.status} ${await response.text()}`);
};

const createApp = ({ store, now = () => new Date() }) => {
    const app = express();
    app.set('trust proxy', true);
    app.use(cors({ origin: ORIGINS }));
    app.use(express.json({ limit: '25mb' }));

    const recent = new Map();
    const tooMany = (ip) => {
        const hourAgo = now().getTime() - 3600 * 1000;
        const times = (recent.get(ip) || []).filter((time) => time > hourAgo);
        times.push(now().getTime());
        recent.set(ip, times);
        return times.length > MAX_PER_HOUR;
    };

    app.get('/', (req, res) => res.send('EasyLean feedback'));

    app.post('/feedback', async (req, res) => {
        if (tooMany(req.ip)) return res.status(429).json({ error: 'Too many requests' });
        let feedback;
        try {
            feedback = readFeedback(req.body);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
        const receivedAt = now();
        const id = `${receivedAt.toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(3).toString('hex')}`;
        const { files, ...kept } = feedback;
        try {
            // The images first: feedback.json, which the inbox looks for, last.
            for (const file of files) await store(`${id}/${file.name}`, file.buffer, file.type);
            const json = JSON.stringify({ id, receivedAt: receivedAt.toISOString(), ...kept }, null, 2);
            await store(`${id}/feedback.json`, Buffer.from(json), 'application/json');
        } catch (error) {
            console.error(`feedback ${id} not saved:`, error);
            return res.status(500).json({ error: 'Could not save the feedback' });
        }
        // No contact details or remarks in the log.
        console.log(`feedback ${id}: ${feedback.context.where || 'unknown place'}, ${files.length} files`);
        res.json({ id });
    });

    return app;
};

if (require.main === module) {
    const bucket = process.env.FEEDBACK_BUCKET;
    const dir = process.env.FEEDBACK_DIR || path.join(__dirname, 'inbox');
    const port = process.env.PORT || 3002;
    createApp({ store: bucket ? bucketStore(bucket) : localStore(dir) }).listen(port, () => {
        console.log(`EasyLean feedback on port ${port}, keeping feedback in ${bucket ? `gs://${bucket}` : dir}`);
    });
}

module.exports = { createApp, localStore, readFeedback, decodeImage };
