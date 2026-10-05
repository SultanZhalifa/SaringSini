'use strict';

const helmet = require('helmet');

const PERMISSIONS_POLICY = 'camera=(), microphone=(self), geolocation=()';
const HSTS_SIX_MONTHS = 15_552_000;

/**
 * Security headers. The CSP allows only same-origin scripts and styles, with Google Fonts as
 * the sole third-party origin. The UI sets styles through CSS classes and the CSSOM
 * (`element.style.x = ...`), neither of which the CSP restricts, so inline `style` attributes
 * are refused as well.
 */
function securityHeaders({ isProduction }) {
  const policy = helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        styleSrcAttr: ["'none'"],
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
