'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  badgeClassForPercentage,
  normalizeAnalysis,
  normalizeEvaluation,
  normalizeTranslation,
} = require('../../src/lib/analysis');
const { analysisFixture } = require('../helpers/harness');

test('normalizeAnalysis passes through a well-formed response', () => {
  assert.deepEqual(normalizeAnalysis(analysisFixture()), analysisFixture());
});

test('normalizeAnalysis clamps the percentage and derives the badge when the model misbehaves', () => {
  assert.equal(normalizeAnalysis(analysisFixture({ hoaxPercentage: 250 })).hoaxPercentage, 100);
  assert.equal(normalizeAnalysis(analysisFixture({ hoaxPercentage: -5 })).hoaxPercentage, 0);
  assert.equal(normalizeAnalysis(analysisFixture({ hoaxPercentage: 'abc' })).hoaxPercentage, 0);
  assert.equal(normalizeAnalysis(analysisFixture({ hoaxPercentage: 12.6 })).hoaxPercentage, 13);

  assert.equal(normalizeAnalysis(analysisFixture({ hoaxPercentage: 10, statusBadge: '<b>x</b>' })).statusBadge, 'Aman');
  assert.equal(normalizeAnalysis(analysisFixture({ hoaxPercentage: 50, statusBadge: 1 })).statusBadge, 'Waspada');
  assert.equal(normalizeAnalysis(analysisFixture({ hoaxPercentage: 95, statusBadge: undefined })).statusBadge, 'Hoaks Parah');
});

test('normalizeAnalysis bounds list sizes, coerces types and strips emoji', () => {
  const claims = Array.from({ length: 20 }, (_, index) => ({ claim: `k${index} 😀`, isFactual: 'true', explanation: 5 }));
  const result = normalizeAnalysis(analysisFixture({ claims: [...claims, 'bukan objek', null] }));

  assert.equal(result.claims.length, 8);
  assert.equal(result.claims[0].claim, 'k0');
  assert.equal(result.claims[0].isFactual, false);
  assert.equal(result.claims[0].explanation, '');
});

test('normalizeAnalysis tolerates missing sections and falls back to defaults', () => {
  const result = normalizeAnalysis({});
  assert.deepEqual(result, {
    hoaxPercentage: 0,
    category: 'Umum',
    statusBadge: 'Aman',
    summary: '',
    claims: [],
    politeReplies: { sopan: '', santai: '', humor: '' },
  });
});

test('model output that is not an object is rejected as a bad gateway', () => {
  for (const normalize of [normalizeAnalysis, normalizeEvaluation, normalizeTranslation]) {
    for (const value of [null, 'teks', 42, [], undefined]) {
      assert.throws(() => normalize(value), (error) => error.status === 502);
    }
  }
});

test('normalizeEvaluation and normalizeTranslation coerce their payloads', () => {
  assert.deepEqual(
    normalizeEvaluation({ skorTotal: 140, kekuatan: ['a', '', 7, 'b', 'c', 'd'], perbaikan: 'bukan array', rekomendasi: 'ok 😀' }),
    { skorTotal: 100, kekuatan: ['a', 'b', 'c'], perbaikan: [], rekomendasi: 'ok' },
  );
  assert.deepEqual(normalizeTranslation({ politeReplies: { sopan: 's', santai: 7 } }), {
    politeReplies: { sopan: 's', santai: '', humor: '' },
  });
});

test('badgeClassForPercentage matches the badge thresholds', () => {
  assert.deepEqual([0, 29, 30, 69, 70, 100].map(badgeClassForPercentage), [
    'safe',
    'safe',
    'warning',
    'warning',
    'danger',
    'danger',
  ]);
});
