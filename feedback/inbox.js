#!/usr/bin/env node
// Shows the feedback in a folder (as server.js keeps it, one folder each) on
// one page, newest first: writes <folder>/index.html.
//   node inbox.js <folder>
// ops/feedback-inbox.sh downloads the feedback from the bucket and runs this.
const fs = require('fs');
const path = require('path');

const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ltr = (value) => `<span dir="ltr" class="formula">${escape(value)}</span>`;

const readAll = (dir) => fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(dir, entry.name, 'feedback.json')))
    .map((entry) => {
        try {
            return { folder: entry.name, ...JSON.parse(fs.readFileSync(path.join(dir, entry.name, 'feedback.json'), 'utf8')) };
        } catch (error) {
            return { folder: entry.name, id: entry.name, receivedAt: '', comment: `(לא הצלחנו לקרוא: ${error.message})`, contact: {}, context: {}, images: [] };
        }
    })
    .sort((a, b) => String(b.receivedAt).localeCompare(String(a.receivedAt)));

// One proof state (as GameWorkspace keeps it: goals, or an error, or complete).
const proofState = (state) => {
    if (!state) return '<em>אין</em>';
    if (state.complete) return 'ההוכחה הושלמה';
    const parts = [];
    if (state.prompt) parts.push(`<div class="note">✎ ${escape(state.prompt)}</div>`);
    if (state.error) parts.push(`<div class="error">⚠ ${escape(state.problem?.message || state.error)}</div>`);
    (state.goals || []).forEach((goal, index) => {
        const assumptions = (goal.assumptions || []).map((a) => `<li>${ltr(`${a.name} : ${a.prop}`)}</li>`).join('');
        parts.push(`<div class="goal">${state.goals.length > 1 ? `<b>חלק ${index + 1}</b>` : ''}<ul>${assumptions}</ul>${ltr(`⊢ ${goal.goal}`)}</div>`);
    });
    return parts.join('') || '<em>ריק</em>';
};

const truthTable = (rows) => {
    if (!rows?.length) return '';
    const columns = Object.keys(rows[0]);
    return `<table class="tt" dir="ltr"><tr>${columns.map((c) => `<th>${escape(c)}</th>`).join('')}</tr>${
        rows.map((row) => `<tr>${columns.map((c) => `<td>${escape(row[c])}</td>`).join('')}</tr>`).join('')}</table>`;
};

const details = (summary, body) => (body ? `<details><summary>${summary}</summary>${body}</details>` : '');
const pre = (value, dir = 'ltr') => (value ? `<pre dir="${dir}">${escape(value)}</pre>` : '');

const card = (feedback) => {
    const { context = {}, contact = {} } = feedback;
    const link = (file) => `${encodeURIComponent(feedback.folder)}/${encodeURIComponent(file)}`;
    const when = feedback.receivedAt ? new Date(feedback.receivedAt).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' }) : '';
    const contactLines = [
        contact.name && escape(contact.name),
        contact.email && `<a href="mailto:${escape(contact.email)}">${escape(contact.email)}</a>`,
        contact.phone && `<a href="tel:${escape(contact.phone)}" dir="ltr">${escape(contact.phone)}</a>`,
    ].filter(Boolean);
    const pictures = [
        ...(feedback.images || []).map((image) => image.file),
        ...(feedback.screenshot ? [feedback.screenshot] : []),
    ].map((file) => `<a href="${link(file)}" target="_blank"><img src="${link(file)}" alt="${escape(file)}" title="${escape(file)}"></a>`).join('');

    const state = context.kind === 'proof'
        ? `${context.proof ? `<h4>ההוכחה</h4>${pre(context.proof, 'rtl')}` : ''}
           ${context.looseBlocks?.length ? `<h4>בלוקים שלא מחוברים להוכחה</h4>${pre(context.looseBlocks.join('\n\n'), 'rtl')}` : ''}
           ${context.selectedMove ? `<h4>המהלך שנבחר (מוצג המצב ${context.proofView === 'after' ? 'אחריו' : 'לפניו'})</h4>${pre(context.selectedMove, 'rtl')}` : ''}
           <h4>מצב ההוכחה${context.proofState?.after ? ' לפני המהלך' : ''}</h4>${proofState(context.proofState?.before)}
           ${context.proofState?.after ? `<h4>אחרי המהלך</h4>${proofState(context.proofState.after)}` : ''}
           ${context.message ? `<h4>ההודעה אחרי "בדוק הוכחה" (${escape(context.status)})</h4>${pre(context.message, 'rtl')}` : ''}`
        : context.kind === 'truthTable'
            ? `<h4>הטבלה</h4>${truthTable(context.table)}
               <h4>התשובות</h4>${pre(JSON.stringify(context.answers))}
               ${context.result ? `<h4>הבדיקה האחרונה</h4>${pre(context.result.ok ? 'נכונה' : context.result.message)}` : ''}`
            : '';

    return `<article>
  <header>
    <div class="where">${escape(context.where || 'מקום לא ידוע')}${context.level?.title ? ` — ${escape(context.level.title)}` : ''}</div>
    <div class="meta">${escape(when)} · ${escape(context.site || '')}${context.hintsShown ? ` · נפתחו ${context.hintsShown} רמזים` : ''}</div>
  </header>
  <div class="contact">${contactLines.length ? contactLines.join(' · ') : '<em>בלי פרטי קשר</em>'}</div>
  <div class="comment">${feedback.comment ? escape(feedback.comment) : '<em>בלי הערות</em>'}</div>
  ${pictures ? `<div class="pictures">${pictures}</div>` : ''}
  ${details('מצב העבודה', state)}
  ${details('קוד Lean', pre(context.leanCode))}
  ${details('הבלוקים (XML, לטעינת ההוכחה מחדש)', pre(context.blocksXml))}
  ${details('כל מה שנשלח', pre(JSON.stringify({ ...feedback, folder: undefined }, null, 2)))}
</article>`;
};

const page = (all) => `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>משוב EasyLean</title>
<style>
  body { font-family: system-ui, sans-serif; background: #f0f2f5; color: #222; margin: 0; padding: 16px; }
  h1 { margin: 0 0 16px; }
  article { background: white; border-radius: 10px; padding: 16px 20px; margin: 0 auto 16px; max-width: 980px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  .where { font-weight: bold; font-size: 18px; }
  .meta { color: #666; font-size: 13px; }
  .contact { margin: 8px 0; }
  .comment { white-space: pre-wrap; background: #f7f7fb; border-radius: 6px; padding: 10px; margin: 8px 0; font-size: 16px; }
  .pictures { display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0; }
  .pictures img { height: 140px; border: 1px solid #ccc; border-radius: 4px; }
  details { margin-top: 6px; }
  summary { cursor: pointer; color: #1a4f9c; }
  pre { background: #f5f5f5; padding: 8px; border-radius: 4px; white-space: pre-wrap; font-size: 13px; }
  pre[dir=ltr] { text-align: left; } pre[dir=rtl] { font-size: 15px; }
  .formula, pre { font-family: 'STIX Two Math', 'Cambria Math', monospace; }
  .goal ul { margin: 4px 0; } .error { color: #b3261e; } .note { color: #8a6d00; }
  table.tt { border-collapse: collapse; } table.tt td, table.tt th { border: 1px solid #b7cbea; padding: 4px 10px; text-align: center; }
</style>
</head>
<body>
<h1>משוב EasyLean (${all.length})</h1>
${all.map(card).join('\n') || '<p>עדיין אין משוב.</p>'}
</body>
</html>
`;

if (require.main === module) {
    const dir = process.argv[2];
    if (!dir) {
        console.error('usage: node inbox.js <folder>');
        process.exit(1);
    }
    fs.mkdirSync(dir, { recursive: true });
    const all = readAll(dir);
    fs.writeFileSync(path.join(dir, 'index.html'), page(all));
    console.log(`${all.length} feedback: ${path.join(dir, 'index.html')}`);
}

module.exports = { readAll, page };
