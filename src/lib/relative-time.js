'use strict';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Indonesian relative label ("5 menit lalu") for a past timestamp. */
function formatRelativeTime(timestamp, now = Date.now()) {
  const elapsed = Math.max(0, now - timestamp);
  if (elapsed < MINUTE) return 'Baru saja';
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)} menit lalu`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)} jam lalu`;
  return `${Math.floor(elapsed / DAY)} hari lalu`;
}

module.exports = { formatRelativeTime };
