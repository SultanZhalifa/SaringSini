'use strict';

const { HttpError } = require('./http-error');
const { isPlainObject } = require('./sanitize');
const { requireArray, requireText } = require('./validate');

/**
 * Validates a client-supplied chat transcript and normalises roles to the two the
 * model understands. Anything that is not the user speaking is treated as the parent.
 *
 * @returns {{ role: 'user' | 'model', text: string }[]}
 */
function parseChatHistory(value, { min, max, maxText, message }) {
  return requireArray(value, { min, max, message }).map((item) => {
    if (!isPlainObject(item)) throw new HttpError(400, message);
    return {
      role: item.role === 'user' ? 'user' : 'model',
      text: requireText(item.text, { max: maxText, message: 'Pesan percakapan tidak valid.' }),
    };
  });
}

module.exports = { parseChatHistory };
