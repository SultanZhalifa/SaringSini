'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { HttpError } = require('../lib/http-error');

const QUOTA_STATUS = 429;

const toUpstreamError = (error) => {
  if (error instanceof HttpError) return error;
  if (error?.status === QUOTA_STATUS) {
    return new HttpError(503, 'Kuota layanan AI sedang penuh. Coba lagi sebentar.', { cause: error });
  }
  return new HttpError(502, 'Layanan AI sedang bermasalah. Coba lagi sebentar.', { cause: error });
};

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new HttpError(502, 'Layanan AI mengembalikan respons yang tidak valid. Coba lagi.', { cause: error });
  }
};

/**
 * Thin facade over the Gemini SDK. Routes depend on this interface only, so the SDK can
 * be replaced (or faked in tests) without touching request handling.
 *
 * @param {object} options
 * @param {string} options.apiKey   Empty string disables AI features.
 * @param {string} options.model
 * @param {number} options.timeoutMs
 * @param {object} [options.client] Pre-built SDK client (tests).
 */
function createGeminiService({ apiKey, model, timeoutMs, client }) {
  const sdk = client ?? (apiKey ? new GoogleGenerativeAI(apiKey) : null);

  const modelFor = (system, { json = false } = {}) =>
    sdk.getGenerativeModel(
      {
        model,
        systemInstruction: system,
        ...(json && { generationConfig: { responseMimeType: 'application/json' } }),
      },
      { timeout: timeoutMs },
    );

  const guarded = async (operation) => {
    try {
      return await operation();
    } catch (error) {
      throw toUpstreamError(error);
    }
  };

  return {
    enabled: sdk !== null,

    /** Generates a JSON document from `parts` (strings and/or inlineData parts). */
    generateJson: ({ system, parts }) =>
      guarded(async () => {
        const result = await modelFor(system, { json: true }).generateContent(parts);
        return parseJson(result.response.text());
      }),

    /** Generates free-form text from `parts`. */
    generateText: ({ system, parts }) =>
      guarded(async () => {
        const result = await modelFor(system).generateContent(parts);
        return result.response.text().trim();
      }),

    /** Continues a chat; `history` uses the SDK shape ({ role, parts: [{ text }] }). */
    chat: ({ system, history, message }) =>
      guarded(async () => {
        const session = modelFor(system).startChat({ history });
        const result = await session.sendMessage(message);
        return result.response.text().trim();
      }),
  };
}

module.exports = { createGeminiService };
