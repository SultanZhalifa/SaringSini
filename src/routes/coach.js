'use strict';

const express = require('express');
const { HttpError } = require('../lib/http-error');
const { normalizeEvaluation } = require('../lib/analysis');
const { parseChatHistory } = require('../lib/chat-history');
const { asUntrustedBlock, toPlainText } = require('../lib/sanitize');
const { requireOneOf, requireText } = require('../lib/validate');
const { requireAi } = require('../middleware/require-ai');
const { PERSONA_IDS, buildCoachPrompt } = require('../prompts/coach');
const evaluatorPrompt = require('../prompts/coach-evaluator');
const guard = require('../prompts/guard');

const MAX_REPLY_CHARS = 800;
const MIN_SCENARIO_CHARS = 5;
const MIN_EVALUATION_TURNS = 2;

function createCoachRouter({ gemini, config, limiters }) {
  const router = express.Router();
  const { chatTurns, chatText, scenario: maxScenario } = config.limits;

  // The user practises correcting a forwarded hoax; the model plays the sceptical parent.
  router.post('/coach', requireAi(gemini), limiters.ai, async (req, res) => {
    const body = req.body ?? {};
    const persona = requireOneOf(body.persona, PERSONA_IDS, 'Persona tidak valid.');
    const scenario = requireText(body.scenario, {
      min: MIN_SCENARIO_CHARS,
      max: maxScenario,
      message: 'Skenario hoaks tidak valid.',
    });
    const turns = parseChatHistory(body.history, {
      min: 1,
      max: chatTurns,
      maxText: chatText,
      message: 'Riwayat percakapan tidak valid.',
    });

    if (turns[0].role !== 'user') throw new HttpError(400, 'Riwayat percakapan harus diawali pesan user.');
    const last = turns.at(-1);
    if (last.role !== 'user') throw new HttpError(400, 'Pesan terakhir harus dari user.');

    const reply = await gemini.chat({
      system: buildCoachPrompt(persona, scenario),
      history: turns.slice(0, -1).map(({ role, text }) => ({ role, parts: [{ text }] })),
      message: last.text,
    });

    res.json({ reply: toPlainText(reply, MAX_REPLY_CHARS) });
  });

  router.post('/coach/evaluate', requireAi(gemini), limiters.ai, async (req, res) => {
    const turns = parseChatHistory(req.body?.history, {
      min: MIN_EVALUATION_TURNS,
      max: chatTurns,
      maxText: chatText,
      message: 'Riwayat percakapan terlalu pendek untuk dievaluasi.',
    });

    const transcript = turns.map(({ role, text }) => `${role === 'user' ? 'USER' : 'ORANG_TUA'}: ${text}`).join('\n');
    const raw = await gemini.generateJson({
      system: evaluatorPrompt + guard,
      parts: [`Analisis percakapan berikut dan berikan feedback komunikasi:\n\n${asUntrustedBlock('percakapan', transcript)}`],
    });

    res.json(normalizeEvaluation(raw));
  });

  return router;
}

module.exports = { createCoachRouter };
