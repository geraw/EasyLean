# EasyLean backend with Lean (deployed to Google Cloud Run).
FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /home/node/app && chown node:node /home/node/app

# The server runs as the image's `node` user, so Lean is installed in its
# home and the app files belong to it (the server writes each proof to a
# temporary file in lean_project/). The app directory is created above as
# root and handed over: not every builder creates WORKDIR for the current user.
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

# Cloud Run sets PORT itself; this is the default elsewhere.
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
