'use strict';

const express = require('express');
const { HttpError } = require('../lib/http-error');
const { normalizeAnalysis } = require('../lib/analysis');
const { detectMimeType, isImage, isVideo } = require('../lib/file-type');
const { toFeedSnippet } = require('../lib/feed-snippet');
const { asUntrustedBlock } = require('../lib/sanitize');
const { optionalText, requireHttpUrl, requireOneOf } = require('../lib/validate');
const { requireAi } = require('../middleware/require-ai');
const deepfakePrompt = require('../prompts/deepfake');
const guard = require('../prompts/guard');
const hoaxPrompt = require('../prompts/hoax');
const urlPrompt = require('../prompts/url');

const MODES = {
  text: {
    system: hoaxPrompt,
    instruction: 'Analisis pesan atau gambar chat berikut untuk mendeteksi kebenaran atau hoaks:',
  },
  deepfake: {
    system: deepfakePrompt,
    instruction:
      'Lakukan analisis forensik digital pada gambar berikut untuk mendeteksi apakah ini gambar buatan AI atau manipulasi deepfake wajah:',
  },
  url: {
    system: urlPrompt,
    instruction: 'Analisis URL berikut untuk deteksi phishing atau scam:',
  },
};

const MIN_FEED_SNIPPET_LENGTH = 6;

/** Validates the request and returns what the analysis needs. */
function parseRequest(body, file, limits) {
  const mode = requireOneOf(body.checkType ?? 'text', Object.keys(MODES), 'Jenis pemeriksaan tidak valid.');

  const message =
    mode === 'url'
      ? requireHttpUrl(body.message, { max: limits.url, message: 'Mohon masukkan URL yang valid, diawali http:// atau https://.' })
      : optionalText(body.message, { max: limits.message, message: `Pesan terlalu panjang. Maksimal ${limits.message} karakter.` });

  if (mode === 'deepfake' && !file) {
    throw new HttpError(400, 'Mohon unggah foto atau video yang ingin diperiksa.');
  }
  if (!message && !file) {
    throw new HttpError(400, 'Mohon masukkan teks pesan, URL, atau unggah tangkapan layar.');
  }
  return { mode, message };
}

/** Identifies the upload by content (never by its declared type) and wraps it for Gemini. */
function toInlineData(file, { allowVideo }) {
  const mimeType = detectMimeType(file.buffer);
  if (!mimeType || !(isImage(mimeType) || (allowVideo && isVideo(mimeType)))) {
    throw new HttpError(
      415,
      allowVideo
        ? 'Format berkas tidak didukung. Gunakan gambar (PNG, JPEG, WebP, HEIC) atau video (MP4, MOV, WebM).'
        : 'Format berkas tidak didukung. Gunakan gambar PNG, JPEG, WebP, atau HEIC.',
    );
  }
  return { inlineData: { data: file.buffer.toString('base64'), mimeType } };
}

function buildParts({ mode, message, file }) {
  const parts = [];
  if (file) parts.push(toInlineData(file, { allowVideo: mode === 'deepfake' }));

  const label = file && message ? '\nTeks pesan tambahan:\n' : '\n';
  parts.push(MODES[mode].instruction + (message ? label + asUntrustedBlock('pesan_pengguna', message) : ''));
  return parts;
}

function createAnalyzeRouter({ gemini, community, config, limiters, upload }) {
  const router = express.Router();

  router.post(
    '/analyze',
    requireAi(gemini),
    limiters.ai,
    upload.single('screenshot'),
    async (req, res) => {
      const { mode, message } = parseRequest(req.body ?? {}, req.file, config.limits);
      const parts = buildParts({ mode, message, file: req.file });

      const raw = await gemini.generateJson({ system: MODES[mode].system + guard, parts });
      const analysis = normalizeAnalysis(raw);

      if (config.community.autoPublish) {
        const text = toFeedSnippet({ mode, message, analysis });
        if (text.length >= MIN_FEED_SNIPPET_LENGTH) {
          community.add({
            text,
            percentage: analysis.hoaxPercentage,
            badge: analysis.statusBadge,
            category: analysis.category,
          });
        }
      }

      res.json(analysis);
    },
  );

  return router;
}

module.exports = { createAnalyzeRouter };
