'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// The browser modules are plain ES modules that only touch the DOM inside their init functions,
// so their pure logic can be tested here without a browser.
const load = (file) => import(pathToFileURL(path.join(__dirname, '../../public/js', file)));

test('risk levels follow the 30 and 70 thresholds', async () => {
  const { riskLevel } = await load('core/risk.js');
  assert.equal(riskLevel(0), 'safe');
  assert.equal(riskLevel(29), 'safe');
  assert.equal(riskLevel(30), 'warning');
  assert.equal(riskLevel(69), 'warning');
  assert.equal(riskLevel(70), 'danger');
  assert.equal(riskLevel(100), 'danger');
});

test('the simulator answers fixed phrases in character', async () => {
  const { pickFamilyReply } = await load('features/simulator-replies.js');
  const who = (text) => pickFamilyReply(text, null).who;

  assert.equal(who('p'), 'papa');
  assert.equal(who('  PING '), 'papa');
  assert.equal(who('woi'), 'mama');
  assert.equal(who('Assalamualaikum warahmatullah'), 'mama');
  assert.equal(who('hai'), 'tante');
});

test('a long message is answered according to how the latest check rated it', async (t) => {
  const { pickFamilyReply } = await load('features/simulator-replies.js');
  const message = 'Ini pesan yang cukup panjang untuk dianggap sebagai klaim yang diteruskan';

  // Every score of a band, taken at its edges, drawing every reply the band can give.
  const repliesFor = (...scores) => {
    const texts = new Set();
    for (const hoaxPercentage of scores) {
      for (const draw of [0, 0.5, 0.999]) {
        t.mock.method(Math, 'random', () => draw);
        texts.add(pickFamilyReply(message, { hoaxPercentage }).text);
      }
    }
    return texts;
  };

  const verified = repliesFor(0, 29);
  const uncertain = repliesFor(30, 59);
  const debunked = repliesFor(60, 100);

  assert.deepEqual([verified.size, uncertain.size, debunked.size], [2, 2, 3]);
  const everything = new Set([...verified, ...uncertain, ...debunked]);
  assert.equal(everything.size, 7, 'the three bands share no reply');
});

test('a short message after a check gets a generic reply, not an assessment', async () => {
  const { pickFamilyReply } = await load('features/simulator-replies.js');
  const analysis = { hoaxPercentage: 90 };
  assert.deepEqual(Object.keys(pickFamilyReply('oke siap', analysis)), ['who', 'text']);
  assert.match(pickFamilyReply('oke siap', analysis).text, /Iya nak|Info yang bagus|Semoga kita/);
});

test('the daily insight summarises the feed by fixed rules', async () => {
  const { generateInsight } = await load('features/analytics.js');

  assert.match(generateInsight(0, 'Belum ada', 0, 0), /Belum ada data laporan/);

  const scam = generateInsight(20, 'Scam', 55, 72);
  assert.match(scam, /Kategori Scam mendominasi dengan 55%/);
  assert.match(scam, /sangat tinggi \(72%\)/);
  assert.match(scam, /link APK/);

  const health = generateInsight(20, 'Kesehatan', 20, 45);
  assert.match(health, /paling sering muncul/);
  assert.match(health, /sedang/);
  assert.match(health, /Kemenkes/);

  assert.match(generateInsight(20, 'Keluarga', 20, 10), /rendah.*Hoaks keluarga/);
  assert.match(generateInsight(20, 'Politik', 20, 10), /Selalu verifikasi sumber/);
});

test('demo reports are placed on the map deterministically, weighted by population', async () => {
  const { assignRegion } = await load('features/hoax-map.js');
  const regions = ['Sumatera', 'Jawa', 'Kalimantan', 'Sulawesi', 'Bali-NTB-NTT', 'Maluku', 'Papua'];

  assert.equal(assignRegion({ id: 'abc' }), assignRegion({ id: 'abc' }));
  assert.equal(assignRegion({ text: 'no id' }), assignRegion({ text: 'no id' }));

  const counts = Object.fromEntries(regions.map((region) => [region, 0]));
  for (let i = 0; i < 1600; i++) counts[assignRegion({ id: `report-${i}` })] += 1;

  assert.ok(Object.values(counts).every((count) => count > 0), 'every region receives reports');
  assert.ok(counts.Jawa > 2 * counts.Papua, 'Java is weighted above Papua');
});

test('the Hoax DNA is stable per analysis and never contains analysis text', async () => {
  const { generateDnaSvg } = await load('lib/dna-art.js');
  const analysis = { summary: 'Ringkasan', category: 'Kesehatan', claims: [{ claim: 'A' }], hoaxPercentage: 80 };

  assert.equal(generateDnaSvg(analysis), generateDnaSvg({ ...analysis }));
  assert.notEqual(generateDnaSvg(analysis), generateDnaSvg({ ...analysis, summary: 'Ringkasan lain' }));

  const hostile = generateDnaSvg({
    summary: '<script>alert(1)</script>',
    category: '"><img src=x onerror=alert(1)>',
    claims: [{ claim: '</svg><script>alert(2)</script>' }],
    hoaxPercentage: 'bukan angka'
  });
  assert.doesNotMatch(hostile, /<script|onerror|<img/i);
  assert.match(hostile, /Skor 0\/100/);

  assert.match(generateDnaSvg({ hoaxPercentage: 250 }), /Skor 100\/100/);
});

test('the Hoax DNA is coloured by risk', async () => {
  const { generateDnaSvg } = await load('lib/dna-art.js');
  const palette = (hoaxPercentage) => {
    const svg = generateDnaSvg({ summary: 'x', hoaxPercentage });
    return ['#5C8374', '#D97706', '#C84B31'].filter((color) => svg.includes(color));
  };

  assert.deepEqual(palette(10), ['#5C8374']);
  assert.deepEqual(palette(50), ['#D97706']);
  assert.deepEqual(palette(90), ['#C84B31']);
});

test('every quiz question has a verdict and an explanation', async () => {
  const { QUIZ_QUESTIONS } = await load('features/quiz-data.js');

  assert.equal(QUIZ_QUESTIONS.length, 10);
  for (const question of QUIZ_QUESTIONS) {
    assert.ok(question.text.length > 0);
    assert.ok(['hoax', 'fact'].includes(question.answer));
    assert.ok(question.explanation.length > 0);
  }
});
