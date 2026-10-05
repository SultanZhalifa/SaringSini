import { prefersReducedMotion } from './motion.js';

const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const defaultFormat = (value) => value.toLocaleString('id-ID');

/**
 * Animates an element's number from `from` to `target`. With reduced motion the target is shown at once.
 *
 * @param {HTMLElement} element
 * @param {number} target
 * @param {number} durationMs
 * @param {{from?: number, format?: (value: number) => string}} [options]
 */
export function countUp(element, target, durationMs, { from = 0, format = defaultFormat } = {}) {
    if (!Number.isFinite(target)) return;
    if (prefersReducedMotion()) {
        element.textContent = format(target);
        return;
    }

    const startedAt = performance.now();
    const step = (now) => {
        const progress = Math.min(1, (now - startedAt) / durationMs);
        element.textContent = format(Math.floor(from + (target - from) * easeOutCubic(progress)));
        if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}
