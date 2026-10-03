# EasyLean backend with Lean, for a Hugging Face Space (Docker SDK).
FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Spaces run the container as uid 1000, which is the image's `node` user, so
# Lean is installed in its home and the app files belong to it (the server
# writes each proof to a temporary file in lean_project/).
USER node
ENV HOME=/home/node \
    PATH=/home/node/.elan/bin:$PATH
WORKDIR /home/node/app

# The toolchain pinned by the Lean project (the largest layer, so first).
COPY --chown=node lean_project/lean-toolchain lean_project/lean-toolchain
RUN curl -sSfL https://elan.lean-lang.org/elan-init.sh \
        | sh -s -- -y --no-modify-path --default-toolchain "$(cat lean_project/lean-toolchain)" \
    && lean --version

COPY --chown=node package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --chown=node . .

# The port Spaces expect (app_port in README.md).
ENV PORT=7860
EXPOSE 7860
CMD ["node", "server.js"]
