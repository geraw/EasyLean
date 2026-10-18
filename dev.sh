#!/bin/sh
# Runs EasyLean locally: the backend (Lean, port 3001) and the frontend dev
# server (http://localhost:5173/EasyLean/). Ctrl+C stops both.
#
# The frontend reloads on its own; the backend restarts when server.js (or a
# file it loads) changes. Only those are watched: the backend writes each
# proof to a temporary file in lean_project/, which must not restart it.
cd "$(dirname "$0")"

# The backend checks proofs with the Lean REPL, which this builds the first
# time (or brings up to date, in a moment); without it, the backend runs
# lean for each check, several times slower.
backend/build-repl.sh || echo "Could not build the Lean REPL: the backend will run lean for each check."

# Stop both servers when the script ends, however it ends.
trap 'trap - INT TERM EXIT; kill 0' INT TERM EXIT

(cd backend && node --watch server.js) &
(cd frontend && npm run dev) &
wait
