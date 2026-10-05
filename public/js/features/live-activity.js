import { countUp } from '../core/count-up.js';

const MIN = 8;
const MAX = 47;
const COUNT_UP_MS = 700;
const FIRST_REVEAL_MS = 600;
const FIRST_DRIFT_MS = 6000;
const DRIFT_INTERVAL_MS = 4000;
const DRIFT_JITTER_MS = 5000;

/**
 * "Active now" badge. It is a demonstration: a random walk that looks organic, not real usage data.
 * Checking a claim or answering a quiz question bumps it up a little.
 */
export function initLiveActivity() {
    const element = document.getElementById('live-activity-count');
    let current = 12 + Math.floor(Math.random() * 18);

    const setCount = (value) => {
        current = Math.max(MIN, Math.min(MAX, value));
        countUp(element, current, COUNT_UP_MS, { from: Number.parseInt(element.textContent, 10) || 0 });
    };

    const drift = () => {
        const direction = Math.random() < 0.55 ? 1 : -1;
        setCount(current + direction * (Math.floor(Math.random() * 3) + 1));
        setTimeout(drift, DRIFT_INTERVAL_MS + Math.random() * DRIFT_JITTER_MS);
    };

    setTimeout(() => setCount(current), FIRST_REVEAL_MS);
    setTimeout(drift, FIRST_DRIFT_MS);

    document.addEventListener('click', (event) => {
        if (event.target.closest('#analyze-btn, .quiz-answer-btn')) setCount(current + Math.floor(Math.random() * 2) + 1);
    });
}
