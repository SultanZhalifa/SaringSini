'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { CLIENT_ID, startTestServer } = require('../helpers/harness');

const upvote = (server, id, body) => server.postJson(`/api/community/${id}/upvote`, body);

test('the feed lists reports without any voter identifiers', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  await upvote(server, 'cp1', { clientId: CLIENT_ID });
  const raw = await (await server.get('/api/community')).text();

  assert.ok(!raw.includes(CLIENT_ID));
  assert.ok(!raw.includes('upvotedClients'));
  assert.ok(!raw.includes('voters'));
});

test('upvote increments once per client and the feed marks the viewer’s support', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const response = await upvote(server, 'cp1', { clientId: CLIENT_ID });
  assert.equal(response.status, 200);
  const report = await response.json();
  assert.equal(report.upvotes, 43);
  assert.equal(report.upvoted, true);

  const mine = await (await server.get('/api/community', { 'X-Client-Id': CLIENT_ID })).json();
  assert.equal(mine.find((item) => item.id === 'cp1').upvoted, true);
  assert.equal(mine.find((item) => item.id === 'cp2').upvoted, false);

  const anonymous = await (await server.get('/api/community')).json();
  assert.equal(anonymous.find((item) => item.id === 'cp1').upvoted, false);
  const malformedViewer = await (await server.get('/api/community', { 'X-Client-Id': '<bad>' })).json();
  assert.equal(malformedViewer.find((item) => item.id === 'cp1').upvoted, false);
});

test('supporting the same report twice is a conflict and does not inflate the count', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  await upvote(server, 'cp2', { clientId: CLIENT_ID });
  const again = await upvote(server, 'cp2', { clientId: CLIENT_ID });

  assert.equal(again.status, 409);
  assert.deepEqual(await again.json(), { error: 'Anda sudah memberikan dukungan untuk laporan ini.' });
  assert.equal(server.community.list().find((item) => item.id === 'cp2').upvotes, 20);
});

test('an upvote without a valid client id is rejected, so the dedupe cannot be bypassed', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  for (const body of [{}, { clientId: '' }, { clientId: 'pendek' }, { clientId: { $gt: '' } }, { clientId: ['a'.repeat(10)] }]) {
    const response = await upvote(server, 'cp1', body);
    assert.equal(response.status, 400, JSON.stringify(body));
  }
  const noBody = await fetch(`${server.baseUrl}/api/community/cp1/upvote`, { method: 'POST' });
  assert.equal(noBody.status, 400);
  assert.equal(server.community.list().find((item) => item.id === 'cp1').upvotes, 42);
});

test('upvoting an unknown report is a 404', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const response = await upvote(server, 'tidak-ada', { clientId: CLIENT_ID });
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Laporan tidak ditemukan.' });
});

test('upvotes are rate limited per IP', async (t) => {
  const server = await startTestServer({ env: { RATE_LIMIT_WRITE_PER_MINUTE: '2' } });
  t.after(() => server.close());

  const statuses = [];
  for (const id of ['cp1', 'cp2', 'cp3', 'cp1']) {
    statuses.push((await upvote(server, id, { clientId: CLIENT_ID })).status);
  }
  assert.deepEqual(statuses, [200, 200, 429, 429]);
});
