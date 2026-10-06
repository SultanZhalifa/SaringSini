'use strict';

// Pictographs plus the invisible joiners/selectors that glue emoji sequences together.
const EMOJI_PATTERN = /\p{Extended_Pictographic}|\u{FE0F}|\u{200D}|\u{20E3}|[\u{E000}-\u{F8FF}]/gu;
const CONTROL_PATTERN = /[\p{Cc}\p{Cf}]/gu;
const EMAIL_PATTERN = /[\w.%+-]+@[\w-]+(?:\.[\w-]+)+/g;
// 10+ digits, optionally split by spaces/hyphens/parentheses: phone numbers, NIK, bank accounts.
// Dots are excluded on purpose so amounts such as "1.000.000.000" survive.
const LONG_NUMBER_PATTERN = /\+?\d(?:[\s()-]?\d){9,}/g;
const REDACTED = '[disembunyikan]';

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/** Removes emoji from AI output while keeping typographic punctuation intact. */
const stripEmojis = (text) => String(text).replace(EMOJI_PATTERN, '');

const collapseWhitespace = (text) => text.replace(/\s+/g, ' ').trim();

const truncate = (text, max) => (text.length > max ? `${text.slice(0, max - 3)}...` : text);

/** Coerces untrusted input to a bounded, single-line plain-text string. */
const toPlainText = (value, max) => {
  if (typeof value !== 'string') return '';
  return truncate(collapseWhitespace(stripEmojis(value).replace(CONTROL_PATTERN, ' ')), max);
};

/** Best-effort removal of personal identifiers before text is shown publicly. */
const redactPii = (text) => text.replace(EMAIL_PATTERN, REDACTED).replace(LONG_NUMBER_PATTERN, REDACTED);

/**
 * Wraps untrusted text so a model can tell data from instructions. Angle brackets are
 * removed so the text cannot close the tag early.
 */
const asUntrustedBlock = (tag, text) =>
  `<${tag}>\n${String(text).replace(/[<>]/g, '')}\n</${tag}>`;

module.exports = {
  isPlainObject,
  stripEmojis,
  toPlainText,
  redactPii,
  truncate,
  collapseWhitespace,
  asUntrustedBlock,
};
