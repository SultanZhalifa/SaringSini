'use strict';

const multer = require('multer');

const MAX_FIELDS = 8;
const MAX_FIELD_BYTES = 32 * 1024;
const MAX_PARTS = 10;

/** In-memory multipart parser: one file, a handful of small text fields. */
function createUpload({ maxBytes }) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1, fields: MAX_FIELDS, fieldSize: MAX_FIELD_BYTES, parts: MAX_PARTS },
  });
}

module.exports = { createUpload };
