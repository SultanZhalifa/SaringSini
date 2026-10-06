import { EVENTS, emit } from './events.js';

let latest = null;

/** The result of the most recent check, or null before the first one. */
export const getAnalysis = () => latest;

/** Records a finished check and tells the features that react to it. */
export function publishAnalysis(analysis) {
    latest = analysis;
    emit(EVENTS.ANALYSIS, analysis);
}

/** Swaps the reply templates of the current result (after a regional-language conversion). */
export function replaceReplies(politeReplies) {
    latest.politeReplies = politeReplies;
}
