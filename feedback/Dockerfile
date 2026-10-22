# The feedback service (deployed to Google Cloud Run by ops/deploy-feedback.sh).
FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js ./
USER node
CMD ["node", "server.js"]
