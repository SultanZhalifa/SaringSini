'use strict';

const express = require('express');

// Synthetic figures for the demo home screen; not real usage or impact metrics.
const DEMO_FAMILIES_BASELINE = 9842;
const DEMO_FAMILIES_PER_CHECK = 1.7;
const DEMO_FAMILIES_TARGET = 15000;

function createHealthRouter({ community, gemini, version }) {
  const router = express.Router();

  router.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version,
      gemini: gemini.enabled,
      reports: community.size,
    });
  });

  router.get('/stats', (_req, res) => {
    const { totalChecks, totalUpvotes } = community.totals();
    res.json({
      totalChecks,
      totalUpvotes,
      familiesSaved: DEMO_FAMILIES_BASELINE + Math.floor(totalChecks * DEMO_FAMILIES_PER_CHECK),
      target: DEMO_FAMILIES_TARGET,
    });
  });

  return router;
}

module.exports = { createHealthRouter };
