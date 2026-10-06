const VARIANTS = new Set(['safe', 'warning', 'danger']);
const DEFAULT_DURATION_MS = 2800;

let hideTimer = null;

const getToast = () => document.getElementById('toast');

/** Shows a short message at the bottom of the screen. */
export function showToast(message, variant, durationMs = DEFAULT_DURATION_MS) {
    const toast = getToast();
    toast.textContent = message;
    toast.classList.remove('show', 'toast-safe', 'toast-warning', 'toast-danger');
    if (VARIANTS.has(variant)) toast.classList.add(`toast-${variant}`);
    toast.classList.add('show');

    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => toast.classList.remove('show'), durationMs);
}

export function initToast() {
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') getToast().classList.remove('show');
    });
}
