/** localStorage keys used by the app. */
export const STORAGE_KEYS = Object.freeze({
    clientId: 'saringsini_client_id',
    onboarded: 'saringsini_onboarded',
    pwaDismissedAt: 'saringsini_pwa_dismissed_at',
    lastGenericReply: 'saringsini_last_gen_idx',
});

/** localStorage that never throws: access can be blocked (private mode, disabled storage). */
export const storage = {
    get(key) {
        try {
            return localStorage.getItem(key);
        } catch (_) {
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (_) { /* storage unavailable: the value simply is not remembered */ }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (_) { /* storage unavailable */ }
    }
};
