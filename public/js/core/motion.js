export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Short haptic tick on devices that support it, unless the user asked for less motion. */
export function vibrate(pattern) {
    if (!navigator.vibrate || prefersReducedMotion()) return;
    try {
        navigator.vibrate(pattern);
    } catch (_) { /* some browsers refuse without a user gesture */ }
}
