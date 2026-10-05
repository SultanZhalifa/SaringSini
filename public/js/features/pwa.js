import { STORAGE_KEYS, storage } from '../core/storage.js';
import { showToast } from '../core/toast.js';

const BANNER_DELAY_MS = 4000;
const DISMISSAL_MS = 7 * 24 * 60 * 60 * 1000;

const wasDismissedRecently = () => {
    const dismissedAt = Number.parseInt(storage.get(STORAGE_KEYS.pwaDismissedAt), 10);
    return dismissedAt > 0 && Date.now() - dismissedAt < DISMISSAL_MS;
};

function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((error) => {
            console.warn('Service Worker registration failed:', error);
        });
    });
}

/** Offers "install as an app" through our own banner instead of the browser's default prompt. */
function initInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredPrompt = event;
        if (!wasDismissedRecently()) setTimeout(() => { banner.hidden = false; }, BANNER_DELAY_MS);
    });

    document.getElementById('pwa-install-accept').addEventListener('click', async () => {
        banner.hidden = true;
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        try {
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') showToast('SaringSini berhasil dipasang', 'safe');
        } catch (_) { /* the prompt was dismissed or is no longer available */ }
        deferredPrompt = null;
    });

    document.getElementById('pwa-install-dismiss').addEventListener('click', () => {
        banner.hidden = true;
        storage.set(STORAGE_KEYS.pwaDismissedAt, String(Date.now()));
    });

    window.addEventListener('appinstalled', () => {
        banner.hidden = true;
        deferredPrompt = null;
    });
}

export function initPwa() {
    registerServiceWorker();
    initInstallBanner();
}
