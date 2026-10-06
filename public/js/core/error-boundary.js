import { showToast } from './toast.js';

const FRIENDLY_ERROR_MS = 3500;

/**
 * Catches uncaught errors and unhandled promise rejections so the UI never dies silently:
 * the user gets a friendly toast and the details go to the console.
 */
export function installErrorBoundary() {
    window.addEventListener('error', (event) => {
        // Cross-origin script errors carry no information.
        if (/Script error/i.test(event.message || '')) return;
        console.error('[SaringSini] Uncaught error:', event.error || event.message);
        showToast('Terjadi kesalahan kecil. Coba muat ulang halaman.', 'danger', FRIENDLY_ERROR_MS);
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('[SaringSini] Unhandled promise rejection:', event.reason);
        showToast('Permintaan gagal di latar belakang. Coba lagi.', 'danger', FRIENDLY_ERROR_MS);
    });
}
