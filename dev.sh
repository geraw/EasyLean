#!/bin/sh
# Runs EasyLean locally: the backend (Lean, port 3001) and the frontend dev
# server (http://localhost:5173/EasyLean/). Ctrl+C stops both.
#
# The frontend reloads on its own; the backend restarts when server.js (or a
# file it loads) changes. Only those are watched: the backend writes each
# proof to a temporary file in lean_project/, which must not restart it.
cd "$(dirname "$0")"

# Stop both servers when the script ends, however it ends.
trap 'trap - INT TERM EXIT; kill 0' INT TERM EXIT

(cd backend && node --watch server.js) &
(cd frontend && npm run dev) &
wait
