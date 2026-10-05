/** An error response from the server; its message is safe to show to the user. */
export class ApiError extends Error {}

async function readJson(response, fallbackMessage) {
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new ApiError(body.error || fallbackMessage || `HTTP ${response.status}`);
    }
    return response.json();
}

/**
 * Thin wrappers over fetch that turn error responses into ApiError. Network failures are
 * left to propagate as the TypeError fetch throws, so callers can tell the two apart.
 */
export const getJson = async (url, { headers } = {}) => readJson(await fetch(url, { headers }));

export const postJson = async (url, payload, { fallbackMessage, signal } = {}) =>
    readJson(
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal
        }),
        fallbackMessage
    );

export const postForm = async (url, formData, { fallbackMessage } = {}) =>
    readJson(await fetch(url, { method: 'POST', body: formData }), fallbackMessage);
