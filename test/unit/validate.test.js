'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { HttpError } = require('../../src/lib/http-error');
const {
  isClientId,
  optionalText,
  requireArray,
  requireClientId,
  requireHttpUrl,
  requireOneOf,
  requireText,
} = require('../../src/lib/validate');

const rejects400 = (fn, message) =>
  assert.throws(fn, (error) => error instanceof HttpError && error.status === 400 && (!message || error.message === message));

test('requireText trims and enforces bounds', () => {
  assert.equal(requireText('  halo ', { max: 10, message: 'x' }), 'halo');
  rejects400(() => requireText('   ', { max: 10, message: 'kosong' }), 'kosong');
  rejects400(() => requireText('a'.repeat(11), { max: 10, message: 'x' }));
  rejects400(() => requireText('abc', { min: 5, max: 10, message: 'x' }));
  for (const value of [undefined, null, 5, {}, []]) rejects400(() => requireText(value, { max: 10, message: 'x' }));
});

test('optionalText treats absent and blank input as undefined, but still validates content', () => {
  for (const value of [undefined, null, '', '   ']) assert.equal(optionalText(value, { max: 5, message: 'x' }), undefined);
  assert.equal(optionalText(' ok ', { max: 5, message: 'x' }), 'ok');
  rejects400(() => optionalText('terlalu panjang', { max: 5, message: 'x' }));
});

test('requireOneOf and requireArray reject values outside the allowed shape', () => {
  assert.equal(requireOneOf('a', ['a', 'b'], 'x'), 'a');
  rejects400(() => requireOneOf('c', ['a', 'b'], 'x'));
  assert.deepEqual(requireArray([1, 2], { min: 1, max: 3, message: 'x' }), [1, 2]);
  rejects400(() => requireArray([], { min: 1, max: 3, message: 'x' }));
  rejects400(() => requireArray([1, 2, 3, 4], { max: 3, message: 'x' }));
  rejects400(() => requireArray('abc', { max: 3, message: 'x' }));
});

test('client ids are 8-64 characters of word characters or hyphens', () => {
  for (const value of ['client_abcdef123456', 'a1b2c3d4-e5f6-7890', 'x'.repeat(64)]) assert.ok(isClientId(value));
  for (const value of ['short', 'x'.repeat(65), 'has space!', '<script>', undefined, 42]) assert.equal(isClientId(value), false);
  rejects400(() => requireClientId('nope'), 'Identitas klien tidak valid.');
});

test('requireHttpUrl accepts only absolute http(s) URLs', () => {
  const options = { max: 100, message: 'URL tidak valid' };
  assert.equal(requireHttpUrl(' https://contoh.id/a?b=1 ', options), 'https://contoh.id/a?b=1');
  for (const value of ['javascript:alert(1)', 'ftp://x.id', 'contoh.id/promo', 'data:text/html,hi', '']) {
    rejects400(() => requireHttpUrl(value, options), 'URL tidak valid');
  }
});
