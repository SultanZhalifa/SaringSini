'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { HttpError } = require('../../src/lib/http-error');
const { createGeminiService } = require('../../src/services/gemini');

/** SDK double that records how the model was configured and replays one outcome. */
function fakeSdk(outcome) {
  const seen = { modelParams: null, requestOptions: null, parts: null, history: null, message: null };
  const respond = async () => {
    if (outcome instanceof Error) throw outcome;
    return { response: { text: () => outcome } };
  };
  const client = {
    getGenerativeModel(modelParams, requestOptions) {
      Object.assign(seen, { modelParams, requestOptions });
      return {
        generateContent: async (parts) => {
          seen.parts = parts;
          return respond();
        },
        startChat: ({ history }) => ({
          sendMessage: async (message) => {
            Object.assign(seen, { history, message });
            return respond();
          },
        }),
      };
    },
  };
  return { client, seen };
}

const create = (outcome) => {
  const { client, seen } = fakeSdk(outcome);
  return { seen, service: createGeminiService({ apiKey: 'k', model: 'model-x', timeoutMs: 1234, client }) };
};

test('is disabled without an API key or client', () => {
  assert.equal(createGeminiService({ apiKey: '', model: 'm', timeoutMs: 1 }).enabled, false);
  assert.equal(create('{}').service.enabled, true);
});

test('generateJson requests JSON output, applies the timeout, and parses the reply', async () => {
  const { service, seen } = create('{"ok":true}');
  const result = await service.generateJson({ system: 'SISTEM', parts: ['halo'] });

  assert.deepEqual(result, { ok: true });
  assert.equal(seen.modelParams.model, 'model-x');
  assert.equal(seen.modelParams.systemInstruction, 'SISTEM');
  assert.equal(seen.modelParams.generationConfig.responseMimeType, 'application/json');
  assert.equal(seen.requestOptions.timeout, 1234);
  assert.deepEqual(seen.parts, ['halo']);
});

test('generateText and chat return trimmed text without forcing JSON', async () => {
  const text = create('  balasan  ');
  assert.equal(await text.service.generateText({ system: 's', parts: ['p'] }), 'balasan');
  assert.equal(text.seen.modelParams.generationConfig, undefined);

  const chat = create(' oke ');
  const history = [{ role: 'user', parts: [{ text: 'a' }] }];
  assert.equal(await chat.service.chat({ system: 's', history, message: 'b' }), 'oke');
  assert.deepEqual(chat.seen.history, history);
  assert.equal(chat.seen.message, 'b');
});

test('a reply that is not JSON becomes a 502', async () => {
  const { service } = create('bukan json');
  await assert.rejects(service.generateJson({ system: 's', parts: [] }), { status: 502 });
});

test('upstream failures are mapped without leaking provider details to clients', async () => {
  const failure = Object.assign(new Error('sensitive provider detail'), { status: 500 });
  await assert.rejects(create(failure).service.generateJson({ system: 's', parts: [] }), (error) => {
    assert.equal(error.status, 502);
    assert.ok(!error.message.includes('sensitive'));
    assert.equal(error.cause, failure, 'the original error is kept for server-side logging');
    return true;
  });

  const quota = Object.assign(new Error('quota'), { status: 429 });
  await assert.rejects(create(quota).service.chat({ system: 's', history: [], message: 'm' }), { status: 503 });
});

test('errors that are already HttpErrors pass through unchanged', async () => {
  const original = new HttpError(418, 'teko');
  await assert.rejects(create(original).service.generateText({ system: 's', parts: [] }), (error) => error === original);
});
