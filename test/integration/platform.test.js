'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeGemini, startTestServer } = require('../helpers/harness');

test('health reports version, AI availability and report count', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const response = await server.get('/api/health');
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, 'healthy');
  assert.equal(body.version, require('../../package.json').version);
  assert.equal(body.gemini, true);
  assert.equal(body.reports, 3);
  assert.ok(!Number.isNaN(Date.parse(body.timestamp)));
});

test('health reflects a missing Gemini key', async (t) => {
  const server = await startTestServer({ gemini: createFakeGemini({ enabled: false }) });
  t.after(() => server.close());
  assert.equal((await (await server.get('/api/health')).json()).gemini, false);
});

test('stats expose demonstration totals derived from the feed', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const stats = await (await server.get('/api/stats')).json();
  assert.deepEqual(stats, { totalChecks: 3, totalUpvotes: 69, familiesSaved: 9847, target: 15000 });
});

test('unknown API routes return JSON 404, never the SPA shell', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const response = await server.get('/api/does-not-exist', { Accept: 'text/html' });
  assert.equal(response.status, 404);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.deepEqual(await response.json(), { error: 'Endpoint tidak ditemukan.' });
});

test('document navigations get the SPA shell; missing assets are real 404s', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const page = await server.get('/komunitas', { Accept: 'text/html' });
  assert.equal(page.status, 200);
  assert.match(await page.text(), /<title>/);

  assert.equal((await server.get('/missing.png', { Accept: 'image/png' })).status, 404);
  assert.equal((await server.get('/some/script.js', { Accept: '*/*' })).status, 404);
});

test('responses carry a strict CSP and hardening headers, and do not advertise Express', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const { headers } = await server.get('/');
  const csp = headers.get('content-security-policy');

  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self'(;|$)/, 'no inline or third-party scripts');
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.doesNotMatch(csp, /script-src[^;]*unsafe-inline/);
  assert.doesNotMatch(csp, /upgrade-insecure-requests/, 'only enabled in production');

  assert.equal(headers.get('x-content-type-options'), 'nosniff');
  assert.equal(headers.get('x-frame-options'), 'DENY');
  assert.equal(headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  assert.equal(headers.get('permissions-policy'), 'camera=(), microphone=(self), geolocation=()');
  assert.equal(headers.get('x-xss-protection'), '0');
  assert.equal(headers.get('x-powered-by'), null);
  assert.equal(headers.get('strict-transport-security'), null);
});

test('production adds HSTS and upgrade-insecure-requests', async (t) => {
  const server = await startTestServer({ env: { NODE_ENV: 'production' } });
  t.after(() => server.close());

  const { headers } = await server.get('/');
  assert.match(headers.get('strict-transport-security'), /max-age=\d+; includeSubDomains/);
  assert.match(headers.get('content-security-policy'), /upgrade-insecure-requests/);
});

test('API responses are never cached', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());
  assert.equal((await server.get('/api/community')).headers.get('cache-control'), 'no-store');
});

test('malformed and oversized JSON bodies get clean 4xx JSON errors', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const malformed = await fetch(`${server.baseUrl}/api/community/cp1/upvote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"clientId":',
  });
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), { error: 'Format JSON tidak valid.' });

  const oversized = await server.postJson('/api/community/cp1/upvote', { clientId: 'x'.repeat(200_000) });
  assert.equal(oversized.status, 413);
  assert.deepEqual(await oversized.json(), { error: 'Permintaan terlalu besar.' });
});

test('the global API limiter throttles abusive clients with JSON and standard headers', async (t) => {
  const server = await startTestServer({ env: { RATE_LIMIT_API_PER_MINUTE: '3' } });
  t.after(() => server.close());

  const statuses = [];
  for (let attempt = 0; attempt < 5; attempt += 1) statuses.push((await server.get('/api/health')).status);
  assert.deepEqual(statuses, [200, 200, 200, 429, 429]);

  const limited = await server.get('/api/health');
  assert.deepEqual(await limited.json(), { error: 'Terlalu banyak permintaan. Coba lagi sebentar.' });
  assert.ok(limited.headers.get('ratelimit') || limited.headers.get('ratelimit-policy'));
});

test('the PDF library is served from our own origin', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const response = await server.get('/vendor/jspdf.umd.min.js');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /javascript/);
  assert.match(await response.text(), /jsPDF/);
});

test('routes that read files from disk are rate limited too', async (t) => {
  const server = await startTestServer({ env: { RATE_LIMIT_API_PER_MINUTE: '3' } });
  t.after(() => server.close());

  const statuses = async (route, headers) => {
    const result = [];
    for (let attempt = 0; attempt < 4; attempt += 1) result.push((await server.get(route, headers)).status);
    return result;
  };
  assert.deepEqual(await statuses('/vendor/jspdf.umd.min.js'), [200, 200, 200, 429]);

  const second = await startTestServer({ env: { RATE_LIMIT_API_PER_MINUTE: '3' } });
  t.after(() => second.close());
  const navigations = [];
  for (let attempt = 0; attempt < 4; attempt += 1) {
    navigations.push((await second.get('/komunitas', { Accept: 'text/html' })).status);
  }
  assert.deepEqual(navigations, [200, 200, 200, 429]);
});
