/** Application events, so features can react to each other without importing one another. */
export const EVENTS = Object.freeze({
    /** A check finished. `detail` is the analysis. */
    ANALYSIS: 'saringsini:analysis',
    /** The community feed was (re)loaded. `detail` is the array of reports. */
    COMMUNITY: 'saringsini:community'
});

export const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));

export const on = (name, handler) => document.addEventListener(name, (event) => handler(event.detail));
