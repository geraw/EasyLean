// The endpoints' tests (api.test.js) again, checking each proof with its own
// `lean` process, as the server does when the Lean REPL is not built.
process.env.LEAN_REPL = 'off';
require('./api.test');
