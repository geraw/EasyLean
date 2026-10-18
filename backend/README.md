# EasyLean backend

Checks proofs for [EasyLean](https://geraw.github.io/EasyLean/): the browser
sends the Lean code generated from the blocks, and this server runs Lean on it:
in a long-running Lean REPL (`leanRepl.js`; build it with `./build-repl.sh`),
or, without it, with a `lean` process for each check.

Settings (environment variables): `LEAN_REPL` (the REPL binary, or `off`),
`LEAN_SYSROOT` (the Lean toolchain the REPL loads; by default the one
`lean_project/` pins), `LEAN_REPL_POOL` (REPL processes, default 1),
`LEAN_REPL_ENVS` (environments each keeps, of headers and of theorems after
them, default 500), and
`LEAN_REPL_MAX_REQUESTS` / `LEAN_REPL_MAX_RSS_MB` (when a REPL is restarted).

The public pilot runs on Google Cloud Run, from the `Dockerfile` here; deploy
with `ops/deploy-backend.sh` (see the main README).
