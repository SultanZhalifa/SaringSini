'use strict';

/**
 * Runs the real application with a scripted Gemini double so browser tests are
 * deterministic and need no network or API key. The scripted analysis deliberately
 * contains markup, to prove the UI treats model output as text.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../../src/app');
const { loadConfig } = require('../../src/config');
const demoReports = require('../../src/data/demo-reports');
const { createCommunityStore } = require('../../src/services/community-store');
const { analysisFixture } = require('../helpers/harness');

const HOSTILE_CLAIM = '<img src=x onerror="window.__pwned=1">';

const gemini = {
  enabled: true,
  async generateJson({ system }) {
    if (system.includes('penerjemah')) {
      return { politeReplies: { sopan: 'Sopan Jawa', santai: 'Santai Jawa', humor: 'Humor Jawa' } };
    }
    if (system.includes('pelatih komunikasi')) {
      return { skorTotal: 85, kekuatan: ['Nada sopan'], perbaikan: ['Tambahkan sumber'], rekomendasi: 'Lanjutkan.' };
    }
    return analysisFixture({
      summary: 'Ringkasan <b>tebal</b> aman.',
      claims: [{ claim: HOSTILE_CLAIM, isFactual: false, explanation: '<script>window.__pwned=1</script>' }],
    });
  },
  generateText: async () => 'Balasan nada baru',
  chat: async () => 'Mama dapat dari grup arisan lho',
};

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'saringsini-e2e-'));
const config = loadConfig({
  NODE_ENV: 'test',
  DATA_DIR: dataDir,
  RATE_LIMIT_AI_PER_MINUTE: '1000',
  RATE_LIMIT_WRITE_PER_MINUTE: '1000',
  RATE_LIMIT_API_PER_MINUTE: '10000',
});
const community = createCommunityStore({
  filePath: path.join(dataDir, 'community.json'),
  seed: demoReports,
  maxReports: config.community.maxReports,
  maxVotersPerReport: config.community.maxVotersPerReport,
});

const server = createApp({ config, gemini, community }).listen(Number(process.env.E2E_PORT), '127.0.0.1');

process.on('SIGTERM', () => {
  server.close(() => {
    fs.rmSync(dataDir, { recursive: true, force: true });
    process.exit(0);
  });
});
