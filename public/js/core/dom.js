/**
 * Untrusted text (community posts, AI output, user input) must only reach the DOM through
 * textContent. This helper is the single place elements are created from it.
 */
export const createElement = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
};

/** "09:05" for a Date, as shown on chat bubbles. */
export const formatClock = (date) =>
    `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
