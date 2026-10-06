'use strict';

/**
 * Boots the real entrypoint (src/server.js) as a child process and checks the public
 * endpoints. No GEMINI_API_KEY is needed: the server starts with AI features disabled.
 */

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');

const STARTUP_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 250;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let server;
let baseUrl;
let dataDir;

const freePort = () =>
  new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });

async function fetchJson(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  assert.equal(response.status, 200, `${pathname} mengembalikan HTTP ${response.status}`);
  return response.json();
}

async function waitUntilHealthy(child) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`server berhenti dengan kode ${child.exitCode}`);
    try {
      if ((await fetch(`${baseUrl}/api/health`)).ok) return;
    } catch {
      // not listening yet
    }
    await wait(POLL_INTERVAL_MS);
  }
  throw new Error('Timeout menunggu server siap');
}

before(async () => {
  const port = await freePort();
  baseUrl = `http://127.0.0.1:${port}`;
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'saringsini-smoke-'));

  server = spawn(process.execPath, [path.join(__dirname, '..', 'src', 'server.js')], {
    env: { ...process.env, PORT: String(port), NODE_ENV: 'production', DATA_DIR: dataDir, GEMINI_API_KEY: '' },
    stdio: 'ignore',
  });
  await waitUntilHealthy(server);
});

after(async () => {
  server.kill('SIGTERM');
  await new Promise((resolve) => server.once('exit', resolve));
  fs.rmSync(dataDir, { recursive: true, force: true });
});

test('the server boots and reports healthy', async () => {
  const health = await fetchJson('/api/health');
  assert.equal(health.status, 'healthy');
  assert.ok(health.version);
});

test('/api/stats returns the expected public numeric fields', async () => {
  const stats = await fetchJson('/api/stats');
  for (const field of ['totalChecks', 'totalUpvotes', 'familiesSaved', 'target']) {
    assert.equal(typeof stats[field], 'number', `field "${field}" harus berupa angka`);
  }
});

test('SIGTERM persists pending data before exit', async () => {
  const feed = await (await fetch(`${baseUrl}/api/community`)).json();
  const upvote = await fetch(`${baseUrl}/api/community/${feed[0].id}/upvote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: 'client_smoke_test_01' }),
  });
  assert.equal(upvote.status, 200);

  server.kill('SIGTERM');
  await new Promise((resolve) => server.once('exit', resolve));

  const saved = JSON.parse(fs.readFileSync(path.join(dataDir, 'community.json'), 'utf-8'));
  assert.equal(saved[0].upvotes, feed[0].upvotes + 1);
});
