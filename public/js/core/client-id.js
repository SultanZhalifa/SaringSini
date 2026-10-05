import { STORAGE_KEYS, storage } from './storage.js';

const createClientId = () =>
    Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('');

/** Anonymous per-browser id; the server only uses it to de-duplicate community upvotes. */
export const getClientId = () => {
    const stored = storage.get(STORAGE_KEYS.clientId);
    if (stored) return stored;

    const created = createClientId();
    storage.set(STORAGE_KEYS.clientId, created);
    return created; // with storage blocked the id lasts for this page view
};
