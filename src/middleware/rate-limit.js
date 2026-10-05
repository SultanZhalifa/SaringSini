'use strict';

const { rateLimit } = require('express-rate-limit');

const createLimiter = ({ windowMs, limit, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: message },
  });

/**
 * Per-IP limiters keyed on `req.ip`, so `trust proxy` must match the deployment (see
 * TRUST_PROXY). Counters are in-memory and therefore per instance.
 */
function createRateLimiters({ windowMs, aiPerWindow, writePerWindow, apiPerWindow }) {
  return {
    api: createLimiter({
      windowMs,
      limit: apiPerWindow,
      message: 'Terlalu banyak permintaan. Coba lagi sebentar.',
    }),
    ai: createLimiter({
      windowMs,
      limit: aiPerWindow,
      message: 'Batas pemeriksaan tercapai. Tunggu sebentar untuk menjaga kuota sistem.',
    }),
    write: createLimiter({
      windowMs,
      limit: writePerWindow,
      message: 'Terlalu banyak dukungan dikirim. Coba lagi sebentar.',
    }),
  };
}

module.exports = { createRateLimiters };
