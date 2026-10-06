'use strict';

const multer = require('multer');
const { HttpError } = require('../lib/http-error');

const MULTER_ERRORS = {
  LIMIT_FILE_SIZE: [413, 'Ukuran berkas terlalu besar. Maksimal 5MB.'],
  LIMIT_UNEXPECTED_FILE: [400, 'Berkas yang diunggah tidak sesuai.'],
};

const BODY_PARSER_ERRORS = {
  'entity.too.large': [413, 'Permintaan terlalu besar.'],
  'entity.parse.failed': [400, 'Format JSON tidak valid.'],
};

/** Normalises anything thrown by a handler or middleware into an HttpError. */
function toHttpError(error) {
  if (error instanceof HttpError) return error;

  const [status, message] =
    (error instanceof multer.MulterError && (MULTER_ERRORS[error.code] ?? [400, 'Unggahan tidak valid.'])) ||
    BODY_PARSER_ERRORS[error.type] ||
    [];
  if (status) return new HttpError(status, message, { cause: error });

  return new HttpError(500, 'Terjadi kesalahan pada server.', { cause: error });
}

const notFoundHandler = (_req, _res, next) => next(new HttpError(404, 'Endpoint tidak ditemukan.'));

/** Final error middleware: always JSON, never a stack trace in production. */
function errorHandler({ isProduction, log = console }) {
  return (error, _req, res, next) => {
    if (res.headersSent) return next(error);

    const httpError = toHttpError(error);
    if (httpError.status >= 500) log.error('[ERROR]', httpError.cause ?? httpError);

    const body = { error: httpError.message };
    if (!isProduction && httpError.status >= 500) body.details = (httpError.cause ?? httpError).message;
    return res.status(httpError.status).json(body);
  };
}

module.exports = { notFoundHandler, errorHandler };
