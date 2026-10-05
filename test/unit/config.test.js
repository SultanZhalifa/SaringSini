'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig } = require('../../src/config');

test('defaults are safe for local development', () => {
  const config = loadConfig({});
  assert.equal(config.isProduction, false);
  assert.equal(config.port, 3000);
  assert.equal(config.trustProxy, false);
  assert.equal(config.gemini.apiKey, '');
  assert.equal(config.community.autoPublish, true);
  assert.equal(config.rateLimit.aiPerWindow, 6);
});

test('numeric and boolean settings fall back when invalid', () => {
  const config = loadConfig({ PORT: 'abc', RATE_LIMIT_AI_PER_MINUTE: '-3', COMMUNITY_AUTO_PUBLISH: 'false' });
  assert.equal(config.port, 3000);
  assert.equal(config.rateLimit.aiPerWindow, 6);
  assert.equal(config.community.autoPublish, false);
});

test('TRUST_PROXY accepts hop counts and subnet lists but refuses a blanket "true"', () => {
  assert.equal(loadConfig({ TRUST_PROXY: '1' }).trustProxy, 1);
  assert.equal(loadConfig({ TRUST_PROXY: 'false' }).trustProxy, false);
  assert.equal(loadConfig({ TRUST_PROXY: 'loopback, 10.0.0.0/8' }).trustProxy, 'loopback, 10.0.0.0/8');
  assert.throws(() => loadConfig({ TRUST_PROXY: 'true' }), /unsafe/);
});

test('the configuration object is immutable', () => {
  const config = loadConfig({});
  assert.throws(() => {
    config.port = 1;
  }, TypeError);
});
