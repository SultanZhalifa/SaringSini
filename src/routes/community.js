'use strict';

const express = require('express');
const { isClientId, requireClientId } = require('../lib/validate');

function createCommunityRouter({ community, limiters }) {
  const router = express.Router();

  // The viewer id only marks which reports the caller already supported; a missing or
  // malformed header simply yields an anonymous view.
  router.get('/community', (req, res) => {
    const viewer = req.get('X-Client-Id');
    res.json(community.list(isClientId(viewer) ? viewer : undefined));
  });

  router.post('/community/:id/upvote', limiters.write, (req, res) => {
    const clientId = requireClientId(req.body?.clientId);
    res.json(community.upvote(req.params.id, clientId));
  });

  return router;
}

module.exports = { createCommunityRouter };
