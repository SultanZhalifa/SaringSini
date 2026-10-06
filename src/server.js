'use strict';

const path = require('node:path');
const { createApp } = require('./app');
const { loadConfig } = require('./config');
const demoReports = require('./data/demo-reports');
const { createCommunityStore } = require('./services/community-store');
const { createGeminiService } = require('./services/gemini');
const { version } = require('../package.json');

// Cloud Run sends SIGTERM and allows 10 seconds before killing the container.
const SHUTDOWN_TIMEOUT_MS = 8000;

/** Stops accepting connections and persists pending data before exiting. */
function installShutdownHandlers(server, community) {
  let closing = false;

  const shutdown = (signal) => {
    if (closing) return;
    closing = true;
    console.log(`[SERVER] ${signal} diterima, menutup server...`);

    setTimeout(() => {
      community.flush();
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();

    server.close(() => {
      community.flush();
      process.exit(0);
    });
    server.closeIdleConnections();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

function main() {
  const config = loadConfig();
  const gemini = createGeminiService(config.gemini);
  const community = createCommunityStore({
    filePath: path.join(config.dataDir, 'community.json'),
    seed: demoReports,
    maxReports: config.community.maxReports,
    maxVotersPerReport: config.community.maxVotersPerReport,
  });

  if (!gemini.enabled) {
    console.warn('[PERINGATAN] GEMINI_API_KEY tidak ditemukan di environment. Silakan tambahkan ke file .env!');
  }

  const server = createApp({ config, gemini, community }).listen(config.port, () => {
    console.log('==================================================');
    console.log(`[SERVER] SaringSini v${version} berjalan di http://localhost:${config.port}`);
    console.log(`[MODE] ${config.isProduction ? 'Production' : 'Development'}`);
    console.log(`[DB] ${community.size} laporan komunitas dimuat`);
    console.log(`[AI] Gemini: ${gemini.enabled ? 'Terhubung' : 'BELUM DIKONFIGURASI'}`);
    console.log('==================================================');
  });

  installShutdownHandlers(server, community);
}

main();
