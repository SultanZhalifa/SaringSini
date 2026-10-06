'use strict';

const { HttpError } = require('./http-error');
const { isPlainObject, toPlainText } = require('./sanitize');

const BADGES = Object.freeze({ SAFE: 'Aman', WARNING: 'Waspada', DANGER: 'Hoaks Parah' });
const SAFE_BELOW = 30;
const WARNING_BELOW = 70;

const invalidModelOutput = () => new HttpError(502, 'Layanan AI mengembalikan respons yang tidak valid. Coba lagi.');

const clampInt = (value, min, max) => {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : min;
};

const toList = (value, limit) => (Array.isArray(value) ? value.slice(0, limit) : []);

const badgeForPercentage = (percentage) => {
  if (percentage < SAFE_BELOW) return BADGES.SAFE;
  if (percentage < WARNING_BELOW) return BADGES.WARNING;
  return BADGES.DANGER;
};

/** CSS modifier used by the community feed for a given risk percentage. */
const badgeClassForPercentage = (percentage) => {
  if (percentage < SAFE_BELOW) return 'safe';
  if (percentage < WARNING_BELOW) return 'warning';
  return 'danger';
};

const normalizeReplies = (value) => {
  const replies = isPlainObject(value) ? value : {};
  return {
    sopan: toPlainText(replies.sopan, 1000),
    santai: toPlainText(replies.santai, 1000),
    humor: toPlainText(replies.humor, 1000),
  };
};

/**
 * Model output is untrusted: it can be malformed or steered by prompt injection. Every
 * field is coerced to a bounded plain-text value of the expected type before it is
 * stored, shown, or sent to clients.
 */
function normalizeAnalysis(raw) {
  if (!isPlainObject(raw)) throw invalidModelOutput();

  const hoaxPercentage = clampInt(raw.hoaxPercentage, 0, 100);
  const statusBadge = Object.values(BADGES).includes(raw.statusBadge)
    ? raw.statusBadge
    : badgeForPercentage(hoaxPercentage);

  return {
    hoaxPercentage,
    category: toPlainText(raw.category, 60) || 'Umum',
    statusBadge,
    summary: toPlainText(raw.summary, 1200),
    claims: toList(raw.claims, 8)
      .filter(isPlainObject)
      .map((claim) => ({
        claim: toPlainText(claim.claim, 400),
        isFactual: claim.isFactual === true,
        explanation: toPlainText(claim.explanation, 800),
      })),
    politeReplies: normalizeReplies(raw.politeReplies),
  };
}

function normalizeEvaluation(raw) {
  if (!isPlainObject(raw)) throw invalidModelOutput();

  const toTexts = (value) =>
    (Array.isArray(value) ? value : [])
      .map((item) => toPlainText(item, 300))
      .filter(Boolean)
      .slice(0, 3);
  return {
    skorTotal: clampInt(raw.skorTotal, 0, 100),
    kekuatan: toTexts(raw.kekuatan),
    perbaikan: toTexts(raw.perbaikan),
    rekomendasi: toPlainText(raw.rekomendasi, 400),
  };
}

function normalizeTranslation(raw) {
  if (!isPlainObject(raw)) throw invalidModelOutput();
  return { politeReplies: normalizeReplies(raw.politeReplies) };
}

module.exports = {
  normalizeAnalysis,
  normalizeEvaluation,
  normalizeTranslation,
  badgeClassForPercentage,
};
