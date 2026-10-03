---
title: EasyLean Backend
emoji: 🎓
colorFrom: purple
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# EasyLean backend

Checks proofs for [EasyLean](https://geraw.github.io/EasyLean/): the browser
sends the Lean code generated from the blocks, and this server runs Lean on it.

This folder is deployed as a Hugging Face Space (Docker); the header above is
the Space's configuration. The source lives in
[geraw/EasyLean](https://github.com/geraw/EasyLean), under `backend/`.
