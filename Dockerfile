# =============================================================
# SaringSini - multi-stage image, tuned for Google Cloud Run
# =============================================================

# ---------- Stage 1: production dependencies ----------
FROM node:26-alpine AS deps

WORKDIR /app

# Manifests first so this layer is cached until dependencies change.
COPY package.json package-lock.json ./

# jspdf's optional dependencies (canvg, html2canvas, ...) only serve features we do not use.
RUN npm ci --omit=dev --omit=optional --no-audit --no-fund && \
    npm cache clean --force

# ---------- Stage 2: runtime ----------
FROM node:26-alpine AS runtime

# tini reaps zombies and forwards SIGTERM, which the app handles to flush its data.
RUN apk add --no-cache tini

WORKDIR /app

# The base image already provides an unprivileged "node" user; never run as root.
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public

# Local JSON persistence; ephemeral on Cloud Run (see README: Deployment).
RUN mkdir -p /app/data && chown node:node /app/data

USER node

# TRUST_PROXY=1: Cloud Run puts exactly one proxy in front, and per-IP rate limits
# need the real client address from X-Forwarded-For.
ENV NODE_ENV=production \
    PORT=3000 \
    TRUST_PROXY=1

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["node", "-e", "fetch(`http://127.0.0.1:${process.env.PORT}/api/health`).then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server.js"]
