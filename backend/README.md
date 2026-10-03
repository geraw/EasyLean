# EasyLean backend

Checks proofs for [EasyLean](https://geraw.github.io/EasyLean/): the browser
sends the Lean code generated from the blocks, and this server runs Lean on it.

The public pilot runs on Google Cloud Run, from the `Dockerfile` here; deploy
with `ops/deploy-backend.sh` (see the main README).
