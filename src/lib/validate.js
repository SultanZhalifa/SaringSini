'use strict';

const { HttpError } = require('./http-error');

const badRequest = (message) => new HttpError(400, message);

/** Returns a trimmed string of `min`..`max` characters, or throws a 400 with `message`. */
function requireText(value, { min = 1, max, message }) {
  if (typeof value !== 'string') throw badRequest(message);
  const text = value.trim();
  if (text.length < min || text.length > max) throw badRequest(message);
  return text;
}

/** Like requireText, but absent or blank input yields `undefined`. */
function optionalText(value, options) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return requireText(value, options);
}

function requireOneOf(value, allowed, message) {
  if (!allowed.includes(value)) throw badRequest(message);
  return value;
}

function requireArray(value, { min = 0, max, message }) {
  if (!Array.isArray(value) || value.length < min || value.length > max) throw badRequest(message);
  return value;
}

const CLIENT_ID_PATTERN = /^[\w-]{8,64}$/;

const isClientId = (value) => typeof value === 'string' && CLIENT_ID_PATTERN.test(value);

function requireClientId(value) {
  if (!isClientId(value)) throw badRequest('Identitas klien tidak valid.');
  return value;
}

/** Accepts only absolute http(s) URLs; the server never fetches them. */
function requireHttpUrl(value, { max, message }) {
  const text = requireText(value, { max, message });
  let parsed;
  try {
    parsed = new URL(text);
  } catch {
    throw badRequest(message);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw badRequest(message);
  return text;
}

module.exports = {
  requireText,
  optionalText,
  requireOneOf,
  requireArray,
  requireClientId,
  requireHttpUrl,
  isClientId,
};
