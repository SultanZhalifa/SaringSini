'use strict';

const { redactPii, toPlainText, truncate } = require('./sanitize');

const FEED_SNIPPET_MAX = 110;
const SCREENSHOT_FALLBACK = 'Analisis tangkapan layar chat.';

/** Only the host of a checked link is published; paths and queries may carry tokens. */
const describeLink = (url) => `Tautan mencurigakan: ${new URL(url).hostname}`;

/**
 * Builds the short public text shown in the community feed for a finished analysis.
 * The user's message is treated as private input: it is flattened to plain text, has
 * personal identifiers redacted, and is truncated.
 */
function toFeedSnippet({ mode, message, analysis }) {
  const source =
    mode === 'url' ? describeLink(message) : message || analysis.claims[0]?.claim || SCREENSHOT_FALLBACK;
  return truncate(redactPii(toPlainText(source, 400)), FEED_SNIPPET_MAX);
}

module.exports = { toFeedSnippet };
