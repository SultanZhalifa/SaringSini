'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../../src/app');
const { loadConfig } = require('../../src/config');
const demoReports = require('../../src/data/demo-reports');
const { createCommunityStore } = require('../../src/services/community-store');

const silentLog = { warn() {}, error() {}, log() {} };

/** Scripted stand-in for the Gemini service: records calls, replays queued results. */
function createFakeGemini({ enabled = true } = {}) {
  const calls = [];
  const queue = [];

  const record = (method) => async (args) => {
    calls.push({ method, ...args });
    const item = queue.shift();
    if (item instanceof Error) throw item;
    return typeof item === 'function' ? item(args) : item;
  };

  return {
    enabled,
    calls,
    willReturn: (...items) => queue.push(...items),
    generateJson: record('generateJson'),
    generateText: record('generateText'),
    chat: record('chat'),
  };
}

/**
 * Starts the real Express app on an ephemeral port with an isolated data directory.
 * Rate limits are generous unless a test overrides them through `env`.
 */
async function startTestServer({ env = {}, gemini = createFakeGemini(), now } = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'saringsini-test-'));
  const config = loadConfig({
    NODE_ENV: 'test',
    DATA_DIR: dataDir,
    RATE_LIMIT_AI_PER_MINUTE: '1000',
    RATE_LIMIT_WRITE_PER_MINUTE: '1000',
    RATE_LIMIT_API_PER_MINUTE: '10000',
    ...env,
  });
  const community = createCommunityStore({
    filePath: path.join(dataDir, 'community.json'),
    seed: demoReports,
    maxReports: config.community.maxReports,
    maxVotersPerReport: config.community.maxVotersPerReport,
    log: silentLog,
    ...(now && { now }),
  });

  const server = await new Promise((resolve) => {
    const listening = createApp({ config, gemini, community }).listen(0, '127.0.0.1', () => resolve(listening));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  return {
    baseUrl,
    gemini,
    community,
    config,
    dataDir,
    get: (route, headers) => fetch(baseUrl + route, { headers }),
    postJson: (route, body, headers) =>
      fetch(baseUrl + route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      }),
    postForm: (route, form) => fetch(baseUrl + route, { method: 'POST', body: form }),
    async close() {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
      fs.rmSync(dataDir, { recursive: true, force: true });
    },
  };
}

/** A valid model response for the hoax/deepfake/url analysis endpoints. */
const analysisFixture = (overrides = {}) => ({
  hoaxPercentage: 90,
  category: 'Scam/Penipuan',
  statusBadge: 'Hoaks Parah',
  summary: 'Ringkasan analisis.',
  claims: [{ claim: 'Klaim utama', isFactual: false, explanation: 'Penjelasan singkat.' }],
  politeReplies: { sopan: 'Balasan sopan', santai: 'Balasan santai', humor: 'Balasan humor' },
  ...overrides,
});

/** Smallest byte sequences that file-type detection recognises. */
const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const MP4_BYTES = Buffer.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]);

const CLIENT_ID = 'client_abcdef123456';

module.exports = { startTestServer, createFakeGemini, analysisFixture, PNG_BYTES, MP4_BYTES, CLIENT_ID, silentLog };
