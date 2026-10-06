import { createElement } from './dom.js';

/** Fallback for pages the Clipboard API refuses to serve (plain http outside localhost). */
function copyWithSelection(text) {
    const field = createElement('textarea');
    field.value = text;
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    try {
        return document.execCommand('copy');
    } catch (_) {
        return false;
    } finally {
        field.remove();
    }
}

/** Copies text to the clipboard. Resolves to whether it worked. */
export async function copyText(text) {
    if (!navigator.clipboard?.writeText) return copyWithSelection(text);
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy text:', error);
        return false;
    }
}
