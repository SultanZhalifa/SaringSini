import { riskLevel } from '../core/risk.js';

const SIZE = 280;
const GRID = 12;
const CELL = SIZE / GRID;
const HELIX_COUNT = 3;
const HELIX_STEPS = 14;

// Brand palette per risk level: [primary, secondary, accent].
const PALETTES = {
    safe: ['#5C8374', '#6B8E4E', '#8FB39E'],
    warning: ['#D97706', '#E8A87C', '#F4A52A'],
    danger: ['#C84B31', '#B8392E', '#E15446']
};

// djb2: stable, well spread seeds from text.
const hashString = (text) => {
    let hash = 5381;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
};

// Mulberry32: a small PRNG, so the same seed always draws the same picture.
const mulberry32 = (seed) => () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

function helixPath(offset, random) {
    const amplitude = 14 + random() * 8;
    const wave = (progress) => Math.sin(progress * Math.PI * 4 + offset * 0.05) * amplitude;

    let path = `M 0 ${offset}`;
    for (let i = 1; i <= HELIX_STEPS; i++) {
        const x = (SIZE / HELIX_STEPS) * i;
        const controlX = (SIZE / HELIX_STEPS) * (i - 0.5);
        const y = offset + wave(i / HELIX_STEPS);
        const controlY = offset + wave((i - 0.5) / HELIX_STEPS) * 1.3;
        path += ` Q ${controlX.toFixed(1)} ${controlY.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return path;
}

/**
 * A "DNA" fingerprint of an analysis: a mirrored dot grid and helix curves, seeded by the
 * analysis text and coloured by its risk. The markup holds only numbers and fixed colours,
 * never text from the analysis, so it is safe to insert as HTML.
 *
 * @param {object} analysis a result from /api/analyze
 * @returns {string} SVG markup
 */
export function generateDnaSvg(analysis) {
    const claims = (analysis.claims || []).map((claim) => claim.claim).join(',');
    const seed = hashString(`${analysis.summary || ''}|${analysis.category || ''}|${claims}`);
    const random = mulberry32(seed);
    const score = Math.max(0, Math.min(100, Number(analysis.hoaxPercentage) || 0));
    const [primary, secondary, accent] = PALETTES[riskLevel(score)];

    let dots = '';
    for (let row = 0; row < GRID; row++) {
        for (let column = 0; column < GRID / 2; column++) {
            if (random() >= 0.55) continue;

            const opacity = (0.4 + random() * 0.6).toFixed(2);
            const pick = random();
            const color = pick < 0.6 ? primary : pick < 0.85 ? secondary : accent;
            const radius = (1 + random() * 3).toFixed(1);
            const cx = column * CELL + CELL / 2;
            const mirroredCx = (GRID - 1 - column) * CELL + CELL / 2;
            const cy = (row * CELL + CELL / 2).toFixed(1);

            dots += `<circle cx="${cx.toFixed(1)}" cy="${cy}" r="${radius}" fill="${color}" opacity="${opacity}"/>`;
            if (Math.abs(cx - mirroredCx) > 0.1) {
                dots += `<circle cx="${mirroredCx.toFixed(1)}" cy="${cy}" r="${radius}" fill="${color}" opacity="${opacity}"/>`;
            }
        }
    }

    let helix = '';
    for (let i = 0; i < HELIX_COUNT; i++) {
        helix += `<path d="${helixPath(i * (SIZE / HELIX_COUNT), random)}" fill="none" stroke="${primary}" stroke-width="1.5" opacity="0.35"/>`;
    }

    const fingerprint = seed.toString(16).toUpperCase().slice(0, 8).padStart(8, '0');

    return `
<svg viewBox="0 0 ${SIZE} ${SIZE + 40}" xmlns="http://www.w3.org/2000/svg" class="hoax-dna-svg" role="img" aria-label="DNA hoaks unik">
    <defs>
        <linearGradient id="dnaBg-${seed}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#FFFBF3"/>
            <stop offset="1" stop-color="#F5EDDF"/>
        </linearGradient>
        <filter id="dnaGlow-${seed}">
            <feGaussianBlur stdDeviation="0.6"/>
        </filter>
    </defs>
    <rect x="0" y="0" width="${SIZE}" height="${SIZE}" fill="url(#dnaBg-${seed})" rx="14"/>
    <g filter="url(#dnaGlow-${seed})">
        ${helix}
        ${dots}
    </g>
    <text x="${SIZE / 2}" y="${SIZE + 22}" text-anchor="middle"
        font-family="Plus Jakarta Sans, sans-serif" font-size="11" font-weight="700"
        fill="#7A6A5A" letter-spacing="1.5">DNA #${fingerprint} - Skor ${score}/100</text>
</svg>`.trim();
}
