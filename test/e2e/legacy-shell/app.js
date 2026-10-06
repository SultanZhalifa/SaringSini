// Stand-in for the pre-module app.js: registers the service worker, then pulls in a script
// that the old worker only caches at runtime (it is not in its precache list).
navigator.serviceWorker.register('/sw.js');

const extra = document.createElement('script');
extra.src = '/js/legacy-extra.js';
document.head.append(extra);
