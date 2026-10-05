'use strict';

const express = require('express');
const { createAnalyzeRouter } = require('./analyze');
const { createCoachRouter } = require('./coach');
const { createCommunityRouter } = require('./community');
const { createHealthRouter } = require('./health');
const { createRetoneRouter } = require('./retone');
const { createTranslateRouter } = require('./translate');

/** Assembles every `/api` route from the shared dependencies. */
function createApiRouter(deps) {
  const router = express.Router();
  router.use(
    createHealthRouter(deps),
    createCommunityRouter(deps),
    createAnalyzeRouter(deps),
    createTranslateRouter(deps),
    createCoachRouter(deps),
    createRetoneRouter(deps),
  );
  return router;
}

module.exports = { createApiRouter };
