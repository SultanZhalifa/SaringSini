'use strict';

const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const MEGABYTE = 1024 * 1024;

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toBool = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

/**
 * TRUST_PROXY accepts a hop count ("1" on Cloud Run), "false"/empty (off), or a
 * subnet list understood by Express ("loopback, 10.0.0.0/8"). A blanket "true"
 * is deliberately unsupported: it would let any client spoof X-Forwarded-For.
 */
const parseTrustProxy = (value) => {
  if (value === undefined || value === '' || value === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  if (value === 'true') {
    throw new Error('TRUST_PROXY=true is unsafe; use a hop count (e.g. 1) or a subnet list.');
  }
  return value;
};

/** Builds an immutable configuration object from the environment. */
function loadConfig(env = process.env) {
  return Object.freeze({
    isProduction: env.NODE_ENV === 'production',
    port: toPositiveInt(env.PORT, 3000),
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
    rootDir: ROOT_DIR,
    publicDir: path.join(ROOT_DIR, 'public'),
    dataDir: path.resolve(env.DATA_DIR || path.join(ROOT_DIR, 'data')),
    gemini: Object.freeze({
      apiKey: env.GEMINI_API_KEY || '',
      model: env.GEMINI_MODEL || 'gemini-3.5-flash',
      timeoutMs: toPositiveInt(env.GEMINI_TIMEOUT_MS, 30_000),
    }),
    community: Object.freeze({
      autoPublish: toBool(env.COMMUNITY_AUTO_PUBLISH, true),
      maxReports: 30,
      maxVotersPerReport: 5000,
    }),
    rateLimit: Object.freeze({
      windowMs: 60_000,
      aiPerWindow: toPositiveInt(env.RATE_LIMIT_AI_PER_MINUTE, 6),
      writePerWindow: toPositiveInt(env.RATE_LIMIT_WRITE_PER_MINUTE, 20),
      apiPerWindow: toPositiveInt(env.RATE_LIMIT_API_PER_MINUTE, 120),
    }),
    limits: Object.freeze({
      jsonBody: '64kb',
      uploadBytes: 5 * MEGABYTE,
      message: 4000,
      url: 2048,
      scenario: 500,
      reply: 1500,
      recipient: 80,
      chatText: 500,
      chatTurns: 20,
    }),
  });
}

module.exports = { loadConfig };
