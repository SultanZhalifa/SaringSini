'use strict';

const helmet = require('helmet');

const PERMISSIONS_POLICY = 'camera=(), microphone=(self), geolocation=()';
const HSTS_SIX_MONTHS = 15_552_000;

/**
 * Security headers. The CSP allows only same-origin scripts; Google Fonts is the sole
 * third-party origin. Inline style attributes are still used by the UI, so they are
 * allowed for attributes only (style-src-attr), never for <style> blocks or scripts.
 */
function securityHeaders({ isProduction }) {
  const policy = helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        styleSrcAttr: ["'unsafe-inline'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        mediaSrc: ["'self'", 'blob:'],
        connectSrc: ["'self'"],
        workerSrc: ["'self'"],
        manifestSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        ...(isProduction && { upgradeInsecureRequests: [] }),
      },
    },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    strictTransportSecurity: isProduction ? { maxAge: HSTS_SIX_MONTHS, includeSubDomains: true } : false,
    crossOriginEmbedderPolicy: false,
  });

  return (req, res, next) => {
    res.setHeader('Permissions-Policy', PERMISSIONS_POLICY);
    policy(req, res, next);
  };
}

module.exports = { securityHeaders };
