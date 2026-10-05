'use strict';

const express = require('express');
const { HttpError } = require('../lib/http-error');
const { normalizeTranslation } = require('../lib/analysis');
const { asUntrustedBlock, isPlainObject } = require('../lib/sanitize');
const { optionalText, requireOneOf } = require('../lib/validate');
const { requireAi } = require('../middleware/require-ai');
const guard = require('../prompts/guard');
const { LANGUAGE_IDS, buildTranslatePrompt } = require('../prompts/translate');

const LABELS = { sopan: 'SOPAN (untuk orang tua)', santai: 'SANTAI (untuk sebaya)', humor: 'HUMOR (mencairkan suasana)' };

function createTranslateRouter({ gemini, config, limiters }) {
  const router = express.Router();

  router.post('/translate-replies', requireAi(gemini), limiters.ai, async (req, res) => {
    const { replies, language } = req.body ?? {};
    const target = requireOneOf(language, LANGUAGE_IDS, 'Bahasa daerah tidak didukung.');
    if (!isPlainObject(replies)) throw new HttpError(400, 'Data template balasan tidak valid.');

    const texts = Object.fromEntries(
      Object.keys(LABELS).map((key) => [
        key,
        optionalText(replies[key], { max: config.limits.reply, message: 'Template balasan terlalu panjang.' }) ?? '',
      ]),
    );
    if (Object.values(texts).every((text) => text === '')) {
      throw new HttpError(400, 'Data template balasan tidak valid.');
    }

    const lines = Object.entries(LABELS).map(([key, label]) => `- ${label}: "${texts[key]}"`);
    const raw = await gemini.generateJson({
      system: buildTranslatePrompt(target) + guard,
      parts: [`Terjemahkan ketiga template balasan WhatsApp berikut:\n${asUntrustedBlock('template_balasan', lines.join('\n'))}`],
    });

    res.json(normalizeTranslation(raw));
  });

  return router;
}

module.exports = { createTranslateRouter };
