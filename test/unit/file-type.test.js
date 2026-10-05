'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { detectMimeType, isImage, isVideo } = require('../../src/lib/file-type');

const ftyp = (brand) => Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from(`ftyp${brand}`, 'latin1'), Buffer.alloc(8)]);

test('detects supported formats from their leading bytes', () => {
  const cases = [
    [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]), 'image/png'],
    [Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0]), 'image/jpeg'],
    [Buffer.from('RIFF\u0000\u0000\u0000\u0000WEBPVP8 ', 'latin1'), 'image/webp'],
    [Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0]), 'video/webm'],
    [ftyp('isom'), 'video/mp4'],
    [ftyp('mp42'), 'video/mp4'],
    [ftyp('qt  '), 'video/quicktime'],
    [ftyp('heic'), 'image/heic'],
    [ftyp('mif1'), 'image/heic'],
  ];
  for (const [bytes, expected] of cases) assert.equal(detectMimeType(bytes), expected);
});

test('rejects everything else, including content merely labelled as an image', () => {
  const rejected = [
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
    Buffer.from('GIF89a......'),
    Buffer.from('<?php echo 1; ?>'),
    Buffer.from('MZ\u0090\u0000'),
    ftyp('avif'),
    Buffer.alloc(0),
    Buffer.from([0x89, 0x50]),
  ];
  for (const bytes of rejected) assert.equal(detectMimeType(bytes), null);
});

test('classifies detected types', () => {
  assert.ok(isImage('image/png') && !isVideo('image/png'));
  assert.ok(isVideo('video/mp4') && !isImage('video/mp4'));
});
