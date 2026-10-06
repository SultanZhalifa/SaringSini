'use strict';

const { HttpError } = require('../lib/http-error');

/** Fails fast with 503 when no Gemini API key is configured. */
const requireAi = (gemini) => (_req, _res, next) =>
  gemini.enabled ? next() : next(new HttpError(503, 'Layanan AI belum dikonfigurasi di server. Silakan hubungi admin.'));

module.exports = { requireAi };
