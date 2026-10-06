'use strict';

/** Serves the application under test (see app-under-test.js) for the Playwright run. */

const { createTestApp } = require('./app-under-test');

const { app, cleanup } = createTestApp();
const server = app.listen(Number(process.env.E2E_PORT), '127.0.0.1');

process.on('SIGTERM', () => {
  server.close(() => {
    cleanup();
    process.exit(0);
  });
});
