'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { toFeedSnippet } = require('../../src/lib/feed-snippet');

const analysis = { claims: [{ claim: 'Klaim pertama dari AI' }] };

test('publishes a flattened, redacted and truncated version of the message', () => {
  const message = `Telepon 0812 3456 7890\n\n${'panjang '.repeat(30)}`;
  const snippet = toFeedSnippet({ mode: 'text', message, analysis });

  assert.ok(snippet.startsWith('Telepon [disembunyikan] panjang'));
  assert.ok(snippet.length <= 110);
  assert.ok(snippet.endsWith('...'));
});

test('markup in the message is kept as inert text, not interpreted', () => {
  const snippet = toFeedSnippet({ mode: 'text', message: '<img src=x onerror=alert(1)>', analysis });
  assert.equal(snippet, '<img src=x onerror=alert(1)>');
});

test('for link checks only the host is published, never the path or query', () => {
  const snippet = toFeedSnippet({
    mode: 'url',
    message: 'https://bank-palsu.example/login?token=rahasia&email=a@b.co',
    analysis,
  });
  assert.equal(snippet, 'Tautan mencurigakan: bank-palsu.example');
});

test('falls back to the first claim, then to a generic label', () => {
  assert.equal(toFeedSnippet({ mode: 'text', message: undefined, analysis }), 'Klaim pertama dari AI');
  assert.equal(
    toFeedSnippet({ mode: 'text', message: undefined, analysis: { claims: [] } }),
    'Analisis tangkapan layar chat.',
  );
});
