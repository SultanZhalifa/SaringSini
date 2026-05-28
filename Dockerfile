# =============================================================
# SaringSini v2.1 - Multi-stage Dockerfile untuk Google Cloud Run
# Optimized for smaller image, layer cache, security, dan healthcheck
# =============================================================

# ---------- Stage 1: Dependencies ----------
FROM node:20-alpine AS deps

WORKDIR /app

# Copy hanya manifest dulu untuk maksimalkan layer cache
COPY package.json package-lock.json* ./

# Install hanya dependensi produksi dengan deterministic install
RUN npm ci --omit=dev --no-audit --no-fund && \
    npm cache clean --force

# ---------- Stage 2: Runtime ----------
FROM node:20-alpine AS runtime

# Install curl for healthcheck (lightweight)
RUN apk add --no-cache curl tini && \
    addgroup -g 1001 -S nodejs && \
    adduser -S saringsini -u 1001 -G nodejs

WORKDIR /app

# Copy dependencies dari stage sebelumnya
COPY --from=deps --chown=saringsini:nodejs /app/node_modules ./node_modules

# Copy aplikasi files (dockerignore akan exclude data/docs/dll)
COPY --chown=saringsini:nodejs server.js package.json ./
COPY --chown=saringsini:nodejs public ./public

# Buat data dir dengan permission yang tepat
RUN mkdir -p /app/data && chown -R saringsini:nodejs /app/data

# Jalankan sebagai non-root user (security best practice)
USER saringsini

# Environment defaults
ENV NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS="--max-old-space-size=512"

EXPOSE 3000

# Healthcheck untuk container orchestrators (Cloud Run probe)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost:${PORT}/api/health || exit 1

# Tini sebagai PID 1 untuk proper signal handling (SIGTERM dari Cloud Run)
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
