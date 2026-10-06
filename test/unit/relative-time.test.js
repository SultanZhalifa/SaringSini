'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { formatRelativeTime } = require('../../src/lib/relative-time');

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const NOW = 1_000_000_000_000;

test('formats elapsed time in Indonesian', () => {
  const label = (elapsed) => formatRelativeTime(NOW - elapsed, NOW);
  assert.equal(label(0), 'Baru saja');
  assert.equal(label(59_999), 'Baru saja');
  assert.equal(label(MINUTE), '1 menit lalu');
  assert.equal(label(59 * MINUTE), '59 menit lalu');
  assert.equal(label(2 * HOUR), '2 jam lalu');
  assert.equal(label(47 * HOUR), '1 hari lalu');
  assert.equal(label(72 * HOUR), '3 hari lalu');
});

test('a timestamp in the future is treated as just now', () => {
  assert.equal(formatRelativeTime(NOW + HOUR, NOW), 'Baru saja');
});
