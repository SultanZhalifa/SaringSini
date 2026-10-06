'use strict';

/** An error whose status code and message are safe to show to API clients. */
class HttpError extends Error {
  constructor(status, message, options) {
    super(message, options);
    this.name = 'HttpError';
    this.status = status;
  }
}

module.exports = { HttpError };
