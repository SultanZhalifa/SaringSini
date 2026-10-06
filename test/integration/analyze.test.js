'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MP4_BYTES,
  PNG_BYTES,
  analysisFixture,
  createFakeGemini,
  startTestServer,
} = require('../helpers/harness');

function analyzeForm({ message, checkType, file } = {}) {
  const form = new FormData();
  if (message !== undefined) form.append('message', message);
  if (checkType) form.append('checkType', checkType);
  if (file) form.append('screenshot', new Blob([file.bytes], { type: file.type }), file.name ?? 'upload.bin');
  return form;
}

const png = (type = 'image/png') => ({ bytes: PNG_BYTES, type });

async function setup(t, options) {
  const gemini = createFakeGemini();
  const server = await startTestServer({ gemini, ...options });
  t.after(() => server.close());
  return { server, gemini };
}

test('analyses a text message and returns a normalised result', async (t) => {
  const { server, gemini } = await setup(t);
  gemini.willReturn(analysisFixture());

  const response = await server.postForm('/api/analyze', analyzeForm({ message: 'Air kelapa menyembuhkan semua penyakit' }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), analysisFixture());

  const [call] = gemini.calls;
  assert.equal(call.method, 'generateJson');
  assert.match(call.system, /pemeriksa fakta/);
  assert.match(call.system, /CATATAN KEAMANAN/);
  assert.match(call.parts.at(-1), /<pesan_pengguna>\nAir kelapa menyembuhkan semua penyakit\n<\/pesan_pengguna>/);
});

test('JSON requests are accepted as well as multipart', async (t) => {
  const { server, gemini } = await setup(t);
  gemini.willReturn(analysisFixture());
  const response = await server.postJson('/api/analyze', { message: 'pesan lewat json' });
  assert.equal(response.status, 200);
});

test('model output is normalised before it reaches the client', async (t) => {
  const { server, gemini } = await setup(t);
  gemini.willReturn({
    hoaxPercentage: 9999,
    category: 'x'.repeat(500),
    statusBadge: '<script>alert(1)</script>',
    claims: Array.from({ length: 50 }, () => ({ claim: 'k', isFactual: 'ya', explanation: 'e' })),
    politeReplies: 'bukan objek',
    injected: 'bidang tak dikenal',
  });

  const body = await (await server.postForm('/api/analyze', analyzeForm({ message: 'uji normalisasi' }))).json();
  assert.equal(body.hoaxPercentage, 100);
  assert.equal(body.statusBadge, 'Hoaks Parah');
  assert.ok(body.category.length <= 60);
  assert.equal(body.claims.length, 8);
  assert.equal(body.claims[0].isFactual, false);
  assert.deepEqual(body.politeReplies, { sopan: '', santai: '', humor: '' });
  assert.equal('injected' in body, false);
});

test('analysed messages are published to the feed with personal data redacted', async (t) => {
  const { server, gemini } = await setup(t);
  gemini.willReturn(analysisFixture());

  await server.postForm('/api/analyze', analyzeForm({ message: 'Transfer ke 1234567890123 atau hubungi 0812-3456-7890' }));
  const [newest] = await (await server.get('/api/community')).json();

  assert.equal(newest.text, 'Transfer ke [disembunyikan] atau hubungi [disembunyikan]');
  assert.equal(newest.badge, 'Hoaks Parah');
  assert.equal(newest.badgeClass, 'danger');
  assert.equal(newest.upvotes, 0);
  assert.equal(newest.time, 'Baru saja');
});

test('markup in a message is stored as inert text and cannot become a stored-XSS payload', async (t) => {
  const { server, gemini } = await setup(t);
  gemini.willReturn(analysisFixture());

  const payload = '<img src=x onerror="window.__pwned=1">';
  await server.postForm('/api/analyze', analyzeForm({ message: payload }));
  const [newest] = await (await server.get('/api/community')).json();

  assert.equal(newest.text, payload, 'kept as literal text; clients must render it with textContent');
  assert.match((await server.get('/api/community')).headers.get('content-type'), /application\/json/);
});

test('publishing can be disabled by configuration', async (t) => {
  const { server, gemini } = await setup(t, { env: { COMMUNITY_AUTO_PUBLISH: 'false' } });
  gemini.willReturn(analysisFixture());

  await server.postForm('/api/analyze', analyzeForm({ message: 'tidak boleh dipublikasikan' }));
  assert.equal((await (await server.get('/api/community')).json()).length, 3);
});

test('link checks require an http(s) URL and publish only the host', async (t) => {
  const { server, gemini } = await setup(t);

  for (const message of ['javascript:alert(1)', 'bukan url', 'ftp://x.id/a']) {
    const response = await server.postForm('/api/analyze', analyzeForm({ message, checkType: 'url' }));
    assert.equal(response.status, 400, message);
  }

  gemini.willReturn(analysisFixture());
  const response = await server.postForm(
    '/api/analyze',
    analyzeForm({ message: 'https://promo-bpjs.example/klaim?token=rahasia', checkType: 'url' }),
  );
  assert.equal(response.status, 200);
  assert.match(gemini.calls[0].system, /phishing/);

  const [newest] = await (await server.get('/api/community')).json();
  assert.equal(newest.text, 'Tautan mencurigakan: promo-bpjs.example');
});

test('screenshots are identified by content and sent to the model with the detected type', async (t) => {
  const { server, gemini } = await setup(t);
  gemini.willReturn(analysisFixture());

  const response = await server.postForm(
    '/api/analyze',
    analyzeForm({ message: 'konteks tambahan', file: png('application/octet-stream') }),
  );
  assert.equal(response.status, 200);

  const [inline, instruction] = gemini.calls[0].parts;
  assert.equal(inline.inlineData.mimeType, 'image/png');
  assert.equal(inline.inlineData.data, PNG_BYTES.toString('base64'));
  assert.match(instruction, /Teks pesan tambahan:\n<pesan_pengguna>/);
});

test('files that only claim to be images are refused', async (t) => {
  const { server, gemini } = await setup(t);

  const disguised = [
    { bytes: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'), type: 'image/png', name: 'a.png' },
    { bytes: Buffer.from('<?php system($_GET[1]); ?>'), type: 'image/jpeg', name: 'b.jpg' },
    { bytes: Buffer.from('GIF89a'), type: 'image/gif', name: 'c.gif' },
  ];
  for (const file of disguised) {
    const response = await server.postForm('/api/analyze', analyzeForm({ file }));
    assert.equal(response.status, 415, file.name);
  }
  assert.equal(gemini.calls.length, 0, 'nothing reaches the model');
});

test('video is accepted only for deepfake checks', async (t) => {
  const { server, gemini } = await setup(t);
  const video = { bytes: MP4_BYTES, type: 'video/mp4', name: 'klip.mp4' };

  assert.equal((await server.postForm('/api/analyze', analyzeForm({ file: video }))).status, 415);

  gemini.willReturn(analysisFixture({ category: 'Deepfake/Media AI' }));
  const response = await server.postForm('/api/analyze', analyzeForm({ file: video, checkType: 'deepfake' }));
  assert.equal(response.status, 200);
  assert.equal(gemini.calls[0].parts[0].inlineData.mimeType, 'video/mp4');
  assert.match(gemini.calls[0].system, /forensik digital/);
});

test('deepfake checks need a file', async (t) => {
  const { server } = await setup(t);
  const response = await server.postForm('/api/analyze', analyzeForm({ message: 'hanya teks', checkType: 'deepfake' }));
  assert.equal(response.status, 400);
});

test('oversized uploads are rejected with 413', async (t) => {
  const { server } = await setup(t);
  const tooBig = { bytes: Buffer.concat([PNG_BYTES, Buffer.alloc(5 * 1024 * 1024)]), type: 'image/png' };

  const response = await server.postForm('/api/analyze', analyzeForm({ file: tooBig }));
  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), { error: 'Ukuran berkas terlalu besar. Maksimal 5MB.' });
});

test('invalid requests are rejected before any model call', async (t) => {
  const { server, gemini } = await setup(t);

  const cases = [
    [analyzeForm({}), 'tanpa input'],
    [analyzeForm({ message: '   ' }), 'pesan kosong'],
    [analyzeForm({ message: 'x'.repeat(4001) }), 'pesan terlalu panjang'],
    [analyzeForm({ message: 'ok', checkType: 'rahasia' }), 'jenis tidak dikenal'],
    [analyzeForm({ message: 'ok', checkType: '__proto__' }), 'jenis berbahaya'],
  ];
  for (const [form, label] of cases) {
    assert.equal((await server.postForm('/api/analyze', form)).status, 400, label);
  }
  assert.equal(gemini.calls.length, 0);
});

test('requests fail fast with 503 when AI is not configured', async (t) => {
  const server = await startTestServer({ gemini: createFakeGemini({ enabled: false }) });
  t.after(() => server.close());

  const response = await server.postForm('/api/analyze', analyzeForm({ message: 'halo dunia' }));
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /belum dikonfigurasi/);
});

test('a model reply that is not an object is reported as 502', async (t) => {
  const { server, gemini } = await setup(t);
  gemini.willReturn('bukan objek');
  const response = await server.postForm('/api/analyze', analyzeForm({ message: 'uji respons rusak' }));
  assert.equal(response.status, 502);
});

test('unexpected failures are hidden in production and detailed otherwise', async (t) => {
  const production = await startTestServer({ env: { NODE_ENV: 'production' }, gemini: createFakeGemini() });
  t.after(() => production.close());
  production.gemini.willReturn(new Error('kunci rahasia bocor'));

  const hidden = await production.postForm('/api/analyze', analyzeForm({ message: 'uji produksi' }));
  assert.equal(hidden.status, 500);
  assert.deepEqual(await hidden.json(), { error: 'Terjadi kesalahan pada server.' });

  const development = await startTestServer({ gemini: createFakeGemini() });
  t.after(() => development.close());
  development.gemini.willReturn(new Error('detail debug'));

  const detailed = await development.postForm('/api/analyze', analyzeForm({ message: 'uji dev' }));
  assert.equal(detailed.status, 500);
  assert.equal((await detailed.json()).details, 'detail debug');
});

test('AI endpoints are rate limited per IP and throttled requests never reach the model', async (t) => {
  const { server, gemini } = await setup(t, { env: { RATE_LIMIT_AI_PER_MINUTE: '3' } });
  gemini.willReturn(analysisFixture(), analysisFixture(), analysisFixture());

  const statuses = [];
  for (let attempt = 0; attempt < 5; attempt += 1) {
    statuses.push((await server.postForm('/api/analyze', analyzeForm({ message: `pesan ke-${attempt}` }))).status);
  }
  assert.deepEqual(statuses, [200, 200, 200, 429, 429]);
  assert.equal(gemini.calls.length, 3, 'throttled requests never reach the model');

  const limited = await server.postForm('/api/analyze', analyzeForm({ message: 'lagi' }));
  assert.deepEqual(await limited.json(), {
    error: 'Batas pemeriksaan tercapai. Tunggu sebentar untuk menjaga kuota sistem.',
  });
});
