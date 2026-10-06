'use strict';

const path = require('node:path');
const express = require('express');
const { errorHandler, notFoundHandler } = require('./middleware/errors');
const { createRateLimiters } = require('./middleware/rate-limit');
const { securityHeaders } = require('./middleware/security');
const { createUpload } = require('./middleware/upload');
const { createApiRouter } = require('./routes');
const { version } = require('../package.json');

const ONE_DAY_SECONDS = 86_400;
// PDF export library, served from our own origin so scripts never load from a third party.
const JSPDF_BUNDLE = require.resolve('jspdf/dist/jspdf.umd.min.js');
const JSPDF_DIR = path.dirname(JSPDF_BUNDLE);
const CACHEABLE_ASSET = /\.(css|js|svg|woff2?|ttf|png|jpe?g|webp|ico)$/i;
const ALWAYS_REVALIDATED = /\.(html|json|webmanifest)$/i;

/** Static assets are cached for a day in production; documents and manifests always revalidate. */
const staticOptions = (isProduction) =>
  isProduction
    ? {
        maxAge: `${ONE_DAY_SECONDS}s`,
        setHeaders: (res, filePath) => {
          if (CACHEABLE_ASSET.test(filePath)) {
            res.setHeader('Cache-Control', `public, max-age=${ONE_DAY_SECONDS}, must-revalidate`);
          } else if (ALWAYS_REVALIDATED.test(filePath)) {
            res.setHeader('Cache-Control', 'no-cache, must-revalidate');
          }
        },
      }
    : {};

const noStore = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
};

/**
 * Builds the Express application. It performs no I/O of its own (no listening, no
 * environment access), so tests can supply fakes for every dependency.
 *
 * @param {object} deps
 * @param {object} deps.config    from loadConfig()
 * @param {object} deps.gemini    from createGeminiService()
 * @param {object} deps.community from createCommunityStore()
 */
function createApp({ config, gemini, community }) {
  const app = express();
  const limiters = createRateLimiters(config.rateLimit);
  const upload = createUpload({ maxBytes: config.limits.uploadBytes });

  app.set('trust proxy', config.trustProxy);
  app.use(securityHeaders(config));
  app.use(express.static(config.publicDir, staticOptions(config.isProduction)));
  // These two handlers read files from disk, so they share the API's per-IP limiter.
  app.get('/vendor/jspdf.umd.min.js', limiters.api, (_req, res) =>
    // `root` keeps dot-directories in the install path from being treated as hidden files.
    res.sendFile(path.basename(JSPDF_BUNDLE), { root: JSPDF_DIR, maxAge: config.isProduction ? `${ONE_DAY_SECONDS}s` : 0 }),
  );

  app.use(
    '/api',
    noStore,
    limiters.api,
    express.json({ limit: config.limits.jsonBody }),
    createApiRouter({ gemini, community, config, limiters, upload, version }),
    notFoundHandler,
  );

  // Single-page app: only document navigations fall back to index.html.
  app.get('/{*path}', limiters.api, (req, res, next) => {
    if (path.extname(req.path) || !req.accepts('html')) return next();
    return res.sendFile(path.join(config.publicDir, 'index.html'));
  });

  app.use(notFoundHandler, errorHandler(config));
  return app;
}

module.exports = { createApp };
