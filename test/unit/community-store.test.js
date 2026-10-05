'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const demoReports = require('../../src/data/demo-reports');
const { createCommunityStore } = require('../../src/services/community-store');
const { silentLog } = require('../helpers/harness');

const CLIENT = 'client_abcdef123456';
const OTHER_CLIENT = 'client_zyxwvu987654';

function setup({ maxReports = 5, maxVotersPerReport = 3, now = () => 1_700_000_000_000, stored } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'saringsini-store-'));
  const filePath = path.join(dir, 'community.json');
  if (stored !== undefined) fs.writeFileSync(filePath, typeof stored === 'string' ? stored : JSON.stringify(stored));

  const create = () =>
    createCommunityStore({ filePath, seed: demoReports, maxReports, maxVotersPerReport, now, log: silentLog });
  return { dir, filePath, create, store: create(), cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

const newReport = (text = 'Pesan baru') => ({ text, percentage: 90, badge: 'Hoaks Parah', category: 'Scam' });

test('starts from the demonstration seed with relative timestamps', (t) => {
  const { store, cleanup } = setup();
  t.after(cleanup);

  const feed = store.list();
  assert.deepEqual(feed.map((report) => report.id), ['cp1', 'cp2', 'cp3']);
  assert.deepEqual(feed.map((report) => report.time), ['2 jam lalu', '5 jam lalu', '7 jam lalu']);
});

test('the public projection never exposes voter data', (t) => {
  const { store, cleanup } = setup();
  t.after(cleanup);

  store.upvote('cp1', CLIENT);
  for (const report of store.list(CLIENT)) {
    assert.deepEqual(Object.keys(report).sort(), [
      'author', 'badge', 'badgeClass', 'category', 'id', 'percentage', 'text', 'time', 'upvoted', 'upvotes',
    ]);
  }
});

test('add publishes at the top, derives the badge class, and keeps only the newest reports', (t) => {
  const { store, cleanup } = setup({ maxReports: 4 });
  t.after(cleanup);

  const created = store.add(newReport('Laporan A'));
  assert.equal(created.badgeClass, 'danger');
  assert.equal(created.upvotes, 0);
  assert.equal(created.time, 'Baru saja');
  assert.match(created.author, /^Buster #\d{4}$/);

  store.add(newReport('Laporan B'));
  const feed = store.list();
  assert.equal(feed.length, 4);
  assert.deepEqual(feed.slice(0, 2).map((report) => report.text), ['Laporan B', 'Laporan A']);
  assert.equal(store.size, 4);
});

test('upvote counts once per client and reports who has voted', (t) => {
  const { store, cleanup } = setup();
  t.after(cleanup);

  const first = store.upvote('cp1', CLIENT);
  assert.equal(first.upvotes, 43);
  assert.equal(first.upvoted, true);

  assert.throws(() => store.upvote('cp1', CLIENT), { status: 409 });
  assert.equal(store.upvote('cp1', OTHER_CLIENT).upvotes, 44);

  assert.equal(store.list(CLIENT).find((report) => report.id === 'cp1').upvoted, true);
  assert.equal(store.list(CLIENT).find((report) => report.id === 'cp2').upvoted, false);
  assert.equal(store.list().find((report) => report.id === 'cp1').upvoted, false);
  assert.deepEqual(store.totals(), { totalChecks: 3, totalUpvotes: 44 + 19 + 8 });
});

test('upvote rejects unknown reports and stops at the per-report voter cap', (t) => {
  const { store, cleanup } = setup({ maxVotersPerReport: 2 });
  t.after(cleanup);

  assert.throws(() => store.upvote('missing', CLIENT), { status: 404 });
  store.upvote('cp2', 'client_voter000001');
  store.upvote('cp2', 'client_voter000002');
  assert.throws(() => store.upvote('cp2', 'client_voter000003'), { status: 429 });
});

test('persists atomically, stores only hashed voters, and restores on restart', (t) => {
  const { store, create, filePath, dir, cleanup } = setup();
  t.after(cleanup);

  store.add(newReport('Tersimpan'));
  store.upvote('cp1', CLIENT);
  store.flush();

  assert.deepEqual(fs.readdirSync(dir), ['community.json']);
  const raw = fs.readFileSync(filePath, 'utf-8');
  assert.ok(!raw.includes(CLIENT), 'raw client id must never reach disk');

  const restored = create();
  assert.equal(restored.list()[0].text, 'Tersimpan');
  assert.throws(() => restored.upvote('cp1', CLIENT), { status: 409 });
});

test('flush does nothing when there is nothing to save', (t) => {
  const { store, filePath, cleanup } = setup();
  t.after(cleanup);

  store.flush();
  assert.equal(fs.existsSync(filePath), false);
});

test('a corrupt data file falls back to the seed instead of crashing', (t) => {
  const { store, cleanup } = setup({ stored: '{not json' });
  t.after(cleanup);
  assert.equal(store.size, 3);
});

test('legacy data is sanitised and migrated when loaded', (t) => {
  const legacy = [
    {
      id: 'cp_server_1',
      author: '<b>Buster</b> #1',
      text: '<img src=x onerror=alert(1)> ok 😀',
      percentage: 150,
      badge: 'Hoaks Parah',
      badgeClass: 'javascript:alert(1)',
      category: 'Scam',
      upvotes: 'banyak',
      time: 'Baru saja',
      upvotedClients: [CLIENT, 42],
    },
    { id: '../etc/passwd', text: 'id berbahaya' },
    { id: 'tanpa_teks' },
    'bukan objek',
  ];
  const { store, cleanup } = setup({ stored: legacy });
  t.after(cleanup);

  const [report, ...rest] = store.list(CLIENT);
  assert.equal(rest.length, 0, 'invalid entries are dropped');
  assert.equal(report.text, '<img src=x onerror=alert(1)> ok');
  assert.equal(report.percentage, 100);
  assert.equal(report.badgeClass, 'danger');
  assert.equal(report.upvotes, 0);
  assert.equal(report.upvoted, true, 'legacy voters survive as hashes');
});
