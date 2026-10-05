'use strict';

/**
 * Demonstration entries that populate an empty community feed. They are illustrative
 * only and do not represent real user reports. `ageMinutes` is relative to boot time.
 */
module.exports = Object.freeze([
  {
    id: 'cp1',
    author: 'Buster #4928',
    text: 'Undangan pernikahan digital berformat file APK yang dikirim melalui obrolan WhatsApp untuk mencuri data perbankan.',
    percentage: 98,
    badge: 'Hoaks Parah',
    badgeClass: 'danger',
    category: 'Scam/Penipuan',
    upvotes: 42,
    ageMinutes: 120,
  },
  {
    id: 'cp2',
    author: 'Buster #3004',
    text: 'Klaim air kelapa hijau dicampur garam dan jeruk nipis berkhasiat meluruhkan racun vaksin di tubuh secara instan.',
    percentage: 80,
    badge: 'Hoaks Parah',
    badgeClass: 'danger',
    category: 'Kesehatan',
    upvotes: 19,
    ageMinutes: 300,
  },
  {
    id: 'cp3',
    author: 'Buster #1209',
    text: 'Broadcast berantai mengenai potensi gempa megathrust magnitudo sembilan melanda Jakarta malam ini.',
    percentage: 55,
    badge: 'Waspada',
    badgeClass: 'warning',
    category: 'Keluarga',
    upvotes: 8,
    ageMinutes: 420,
  },
]);
