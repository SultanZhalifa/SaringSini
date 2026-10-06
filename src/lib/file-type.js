'use strict';

/**
 * Identifies uploads by their leading bytes. The client-declared MIME type is never
 * trusted: it is only used by browsers for convenience and is trivially forged.
 * Only the formats the Gemini API accepts inline are recognised.
 */

const startsWith = (buffer, bytes, offset = 0) =>
  buffer.length >= offset + bytes.length && bytes.every((byte, index) => buffer[offset + index] === byte);

const ascii = (buffer, start, end) => buffer.toString('latin1', start, end);

const HEIC_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1'];

function detectFtyp(buffer) {
  if (buffer.length < 12 || ascii(buffer, 4, 8) !== 'ftyp') return null;
  const brand = ascii(buffer, 8, 12);
  if (HEIC_BRANDS.includes(brand)) return 'image/heic';
  if (brand === 'qt  ') return 'video/quicktime';
  if (brand === 'avif' || brand === 'avis') return null;
  return 'video/mp4';
}

/** @returns {string|null} canonical MIME type, or null when the format is unsupported */
function detectMimeType(buffer) {
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (ascii(buffer, 0, 4) === 'RIFF' && ascii(buffer, 8, 12) === 'WEBP') return 'image/webp';
  if (startsWith(buffer, [0x1a, 0x45, 0xdf, 0xa3])) return 'video/webm';
  return detectFtyp(buffer);
}

const isImage = (mimeType) => mimeType.startsWith('image/');
const isVideo = (mimeType) => mimeType.startsWith('video/');

module.exports = { detectMimeType, isImage, isVideo };
