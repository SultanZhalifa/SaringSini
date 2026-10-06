'use strict';

const express = require('express');
const { toPlainText } = require('../lib/sanitize');
const { requireText } = require('../lib/validate');
const { requireAi } = require('../middleware/require-ai');
const guard = require('../prompts/guard');
const { buildRetonePrompt, toneLabelFor } = require('../prompts/retone');

const DEFAULT_TONE = 50;
const MAX_REPLY_CHARS = 1000;

/** Slider value 0-100; anything non-numeric falls back to the neutral midpoint. */
const parseTone = (value) => {
  const tone = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(tone) ? Math.min(100, Math.max(0, tone)) : DEFAULT_TONE;
};

function createRetoneRouter({ gemini, config, limiters }) {
  const router = express.Router();
  const { reply: maxReply, scenario: maxScenario, recipient: maxRecipient } = config.limits;

  router.post('/retone', requireAi(gemini), limiters.ai, async (req, res) => {
    const body = req.body ?? {};
    const originalReply = requireText(body.originalReply, { max: maxReply, message: 'Balasan asli diperlukan.' });
    const toneLabel = toneLabelFor(parseTone(body.tone));

    // Context only: the client sends the whole message box, so over-long input is trimmed, not rejected.
    const system = buildRetonePrompt({
      toneLabel,
      recipient: toPlainText(body.recipient, maxRecipient),
      scenario: toPlainText(body.scenario, maxScenario),
    });

    const reply = await gemini.generateText({
      system: system + guard,
      parts: [`Tulis ulang balasan berikut dengan tone yang diminta:\n\n"${originalReply}"`],
    });

    res.json({ reply: toPlainText(reply, MAX_REPLY_CHARS), toneLabel });
  });

  return router;
}

module.exports = { createRetoneRouter };
