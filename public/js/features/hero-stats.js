import { countUp } from '../core/count-up.js';

const COUNT_UP_STREAK_MS = 900;
const COUNT_UP_POINTS_MS = 1300;

/** The home-screen numbers count up from zero to the demo values in the markup. */
export function initHeroStats() {
    const countUpFromMarkup = (selector, durationMs) => {
        const element = document.querySelector(selector);
        countUp(element, Number.parseInt(element.textContent.replace(/\D/g, ''), 10), durationMs);
    };

    countUpFromMarkup('.streak-stat .hero-stat-val', COUNT_UP_STREAK_MS);
    countUpFromMarkup('.points-stat .hero-stat-val', COUNT_UP_POINTS_MS);
}
