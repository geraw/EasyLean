# EasyLean backend with Lean (deployed to Google Cloud Run).

# Builds the Lean REPL (see build-repl.sh) with the toolchain the Lean project
# pins, then removes from the toolchain what checking proofs does not need.
FROM node:22-bookworm-slim AS lean

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates git \
    && rm -rf /var/lib/apt/lists/*

ENV ELAN_HOME=/opt/elan \
    PATH=/opt/elan/bin:$PATH
WORKDIR /build
COPY lean_project/lean-toolchain lean_project/lean-toolchain
RUN curl -sSfL https://elan.lean-lang.org/elan-init.sh \
        | sh -s -- -y --no-modify-path --default-toolchain "$(cat lean_project/lean-toolchain)" \
    && lean --version

COPY build-repl.sh repl.patch ./
RUN ./build-repl.sh

# The proofs import only Init (Lean's core library), which `lean` and the
# REPL load from lib/lean (each module needs its .olean, .olean.private,
# .olean.server and .ir files); `lean` also needs its shared libraries. The
# rest is for building programs: the C compiler (clang, LLVM), static
# libraries, the Lean, Lake and Std libraries (the REPL is built against
# them, but has them compiled in), cadical (for bv_decide, which needs Std),
# headers and sources; and Init's .ilean files are for the editor. The
# toolchain stays at its path, where the REPL was built.
RUN T="$(lean --print-prefix)" \
    && rm -rf "$T/include" "$T/src" "$T/share" "$T/lib/clang" \
    && rm -f "$T/bin/clang" "$T/bin/ld.lld" "$T/bin/llvm-ar" "$T/bin/leanc" "$T/bin/leanmake" "$T/bin/cadical" "$T/bin/lake" \
    && rm -f "$T"/lib/libLLVM* "$T"/lib/libclang* "$T"/lib/*.a "$T"/lib/*.o "$T"/lib/*.json \
    && cd "$T/lib/lean" \
    && rm -rf Lean Lake LakeMain Std Leanc Lean.* Lake.* LakeMain.* Std.* Leanc.* *.a libLake_shared.* \
    && find Init -name '*.ilean' -delete && rm -f Init.ilean \
    && du -sh "$T"

FROM node:22-bookworm-slim

RUN mkdir -p /home/node/app && chown node:node /home/node/app

# Lean and the REPL belong to root: code run by Lean cannot alter them.
COPY --from=lean /opt/elan/toolchains /opt/elan/toolchains
COPY --from=lean /build/lean_repl/.lake/build/bin/repl /opt/lean-repl/repl
RUN ln -s /opt/elan/toolchains/* /opt/lean
# LEAN_SYSROOT: where the REPL finds Lean's library. The REPL keeps its memory
# bounded (see leanRepl.js), and is restarted above this many MB, within the
# instance's 1 GiB.
ENV PATH=/opt/lean/bin:$PATH \
    LEAN_SYSROOT=/opt/lean \
    LEAN_REPL=/opt/lean-repl/repl \
    LEAN_REPL_MAX_RSS_MB=700

# The server runs as the image's `node` user, and the app files belong to it
# (the server writes a proof to a temporary file in lean_project/ when it
# runs `lean` itself). The app directory is created above as root and handed
# over: not every builder creates WORKDIR for the current user.
USER node
ENV HOME=/home/node
WORKDIR /home/node/app

# Fails the build if the trimmed toolchain or the REPL lack something they load.
RUN printf 'theorem t (p : Prop) (h : p) : p := by\n  exact h\n' > /tmp/check.lean \
    && lean /tmp/check.lean \
    && ! ldd /opt/lean/bin/lean /opt/lean-repl/repl | grep 'not found' \
    && printf '{"cmd": "theorem t (p : Prop) (h : p) : p := by\\n  exact h"}\n\n' | /opt/lean-repl/repl | grep -q '"env": 0' \
    && rm /tmp/check.lean

COPY --chown=node package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --chown=node . .

# Only lean_project/ needs to be writable (temporary proof files). The rest
# of the app is root-owned, so code run by Lean cannot alter the server.
USER root
RUN chown -R root:root /home/node/app \
    && chmod -R go-w /home/node/app \
    && chown node:node /home/node/app/lean_project
USER node

# Cloud Run sets PORT itself; this is the default elsewhere.
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
