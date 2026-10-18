#!/bin/sh
# Builds the Lean REPL (https://github.com/leanprover-community/repl) that
# server.js checks proofs with, in lean_repl/ (see leanRepl.js). Without it
# the server runs `lean` for each check, which is several times slower.
#
# The REPL is built with the toolchain lean_project/ pins, from the REPL's
# release for that Lean version, with repl.patch: it reports each message
# as `lean` prints it, and lets the server replace environments it no longer
# needs (so that the REPL's memory stays bounded) and skip what it does not
# use (sorries and info trees).
# When lean-toolchain changes, REPL_COMMIT must change with it: the REPL's
# commit tagged with the new Lean version.
set -e
cd "$(dirname "$0")"
REPL_COMMIT=a9a6f5bac483d65d08f6226e0ed653f03c479fb7 # tag v4.26.0

if [ ! -d lean_repl/.git ]; then
    git clone --quiet https://github.com/leanprover-community/repl lean_repl
fi
cd lean_repl
git cat-file -e "$REPL_COMMIT^{commit}" 2>/dev/null || git fetch --quiet origin
git checkout --quiet --force "$REPL_COMMIT"
git apply ../repl.patch
if [ "$(cat lean-toolchain)" != "$(cat ../lean_project/lean-toolchain)" ]; then
    echo "The REPL at $REPL_COMMIT is for $(cat lean-toolchain), not $(cat ../lean_project/lean-toolchain): update REPL_COMMIT in build-repl.sh" >&2
    exit 1
fi
lake build repl
