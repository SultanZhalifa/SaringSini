// SaringSini Service Worker
// Caching strategy: stale-while-revalidate for shell, network-first for API

// Bump when cached assets change shape so clients drop their old caches.
const VERSION = 'saringsini-v2.3.2';
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

// Everything the page needs to start, so the app works offline after the first visit.
// A test keeps this list in step with the files in public/.
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/index.css',
  '/css/coach.css',
  '/css/hoax-dna.css',
  '/css/polish.css',
  '/css/tone-slider.css',
  '/js/main.js',
  '/js/core/analysis.js',
  '/js/core/api.js',
  '/js/core/client-id.js',
  '/js/core/clipboard.js',
  '/js/core/count-up.js',
  '/js/core/dom.js',
  '/js/core/error-boundary.js',
  '/js/core/events.js',
  '/js/core/motion.js',
  '/js/core/risk.js',
  '/js/core/storage.js',
  '/js/core/toast.js',
  '/js/core/whatsapp.js',
  '/js/lib/dna-art.js',
  '/js/features/analytics.js',
  '/js/features/analyze.js',
  '/js/features/coach.js',
  '/js/features/community.js',
  '/js/features/confetti.js',
  '/js/features/education.js',
  '/js/features/hero-stats.js',
  '/js/features/hoax-dna.js',
  '/js/features/hoax-map.js',
  '/js/features/infographic.js',
  '/js/features/input-tabs.js',
  '/js/features/live-activity.js',
  '/js/features/navigation.js',
  '/js/features/onboarding.js',
  '/js/features/pdf-report.js',
  '/js/features/pwa.js',
  '/js/features/quiz-data.js',
  '/js/features/quiz.js',
  '/js/features/replies.js',
  '/js/features/results.js',
  '/js/features/simulator-replies.js',
  '/js/features/simulator.js',
  '/js/features/tone-slider.js',
  '/js/features/uploads.js',
  '/js/features/voice-input.js',
  '/icons/favicon.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[SW] Install cache failed:', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Skip cross-origin
  if (url.origin !== self.location.origin) return;

  // API: network-first with timeout fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Shell assets: stale-while-revalidate
  if (SHELL_ASSETS.some((a) => url.pathname === a) || /\.(css|js|svg|woff2?|png|jpg|webp)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // HTML navigation: network-first with offline fallback
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    );
    return;
  }
});

async function networkFirst(req) {
  try {
    const fresh = await fetch(req);
    if (fresh && fresh.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(req, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch (_) {
    const cached = await caches.match(req);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline. Coba lagi saat ada koneksi.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function staleWhileRevalidate(req) {
  const cached = await caches.match(req);
  const fetchPromise = fetch(req).then((res) => {
    if (res && res.ok) {
      caches.open(SHELL_CACHE).then((cache) => cache.put(req, res.clone())).catch(() => {});
    }
    return res;
  }).catch(() => cached);
  return cached || fetchPromise;
}
