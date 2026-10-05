export const RISK_WARNING_FROM = 30;
export const RISK_DANGER_FROM = 70;

/**
 * Buckets the AI's 0-100 score. Matches the thresholds the server uses for badges.
 * @returns {'safe' | 'warning' | 'danger'}
 */
export function riskLevel(percent) {
    if (percent >= RISK_DANGER_FROM) return 'danger';
    if (percent >= RISK_WARNING_FROM) return 'warning';
    return 'safe';
}

/** Text colour of each risk level, shared by the result card and the downloadable card. */
export const RISK_COLORS = Object.freeze({
    safe: '#059669',
    warning: '#d97706',
    danger: '#dc2626'
});
