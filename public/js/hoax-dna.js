// =========================================================
// HOAX DNA VISUALIZATION
// Generative SVG fingerprint dari hasil analisis hoaks.
// Hash konten + score AI -> grid pattern + color stops unik.
// Bisa di-download dan di-share sebagai social proof.
// =========================================================

(function initHoaxDNA() {
    // Simple djb2 hash for stable but varied seeds
    const hashString = (str) => {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
        }
        return Math.abs(hash);
    };

    // Mulberry32 PRNG seeded by hash for reproducibility
    const mulberry32 = (seed) => {
        return function () {
            let t = (seed = (seed + 0x6D2B79F5) | 0);
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    };

    /**
     * Generate Hoax DNA SVG from analysis data
     * @param {Object} analysis - Result from /api/analyze
     * @returns {string} SVG markup
     */
    const generateDNA = (analysis) => {
        if (!analysis) return '';
        const content = `${analysis.summary || ''}|${analysis.category || ''}|${(analysis.claims || []).map(c => c.claim).join(',')}`;
        const seed = hashString(content);
        const rand = mulberry32(seed);
        const score = Math.max(0, Math.min(100, Number(analysis.hoaxPercentage) || 0));

        // Color stops based on score: green->amber->red
        let primaryColor, secondaryColor, accentColor;
        if (score < 30) {
            primaryColor = '#5C8374';
            secondaryColor = '#6B8E4E';
            accentColor = '#8FB39E';
        } else if (score < 70) {
            primaryColor = '#D97706';
            secondaryColor = '#E8A87C';
            accentColor = '#F4A52A';
        } else {
            primaryColor = '#C84B31';
            secondaryColor = '#B8392E';
            accentColor = '#E15446';
        }

        const size = 280;
        const gridSize = 12;
        const cellSize = size / gridSize;
        let cells = '';

        // Generate symmetric grid pattern (mirror horizontal for organic feel)
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize / 2; x++) {
                if (rand() < 0.55) {
                    const opacity = 0.4 + rand() * 0.6;
                    const colorChoice = rand();
                    const color = colorChoice < 0.6 ? primaryColor : colorChoice < 0.85 ? secondaryColor : accentColor;
                    const radius = 1 + rand() * 3;
                    const cx = x * cellSize + cellSize / 2;
                    const cxMirror = (gridSize - 1 - x) * cellSize + cellSize / 2;
                    const cy = y * cellSize + cellSize / 2;
                    cells += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${radius.toFixed(1)}" fill="${color}" opacity="${opacity.toFixed(2)}"/>`;
                    if (Math.abs(cx - cxMirror) > 0.1) {
                        cells += `<circle cx="${cxMirror.toFixed(1)}" cy="${cy.toFixed(1)}" r="${radius.toFixed(1)}" fill="${color}" opacity="${opacity.toFixed(2)}"/>`;
                    }
                }
            }
        }

        // Add "helix" curves overlay for DNA feel
        const numHelix = 3;
        let helix = '';
        for (let i = 0; i < numHelix; i++) {
            const offset = i * (size / numHelix);
            const path = buildHelixPath(size, offset, rand);
            helix += `<path d="${path}" fill="none" stroke="${primaryColor}" stroke-width="1.5" opacity="0.35"/>`;
        }

        // Hash fingerprint string at bottom
        const fingerprint = seed.toString(16).toUpperCase().slice(0, 8).padStart(8, '0');

        return `
<svg viewBox="0 0 ${size} ${size + 40}" xmlns="http://www.w3.org/2000/svg" class="hoax-dna-svg" role="img" aria-label="DNA hoaks unik">
    <defs>
        <linearGradient id="dnaBg-${seed}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#FFFBF3"/>
            <stop offset="1" stop-color="#F5EDDF"/>
        </linearGradient>
        <filter id="dnaGlow-${seed}">
            <feGaussianBlur stdDeviation="0.6"/>
        </filter>
    </defs>
    <rect x="0" y="0" width="${size}" height="${size}" fill="url(#dnaBg-${seed})" rx="14"/>
    <g filter="url(#dnaGlow-${seed})">
        ${helix}
        ${cells}
    </g>
    <text x="${size / 2}" y="${size + 22}" text-anchor="middle"
        font-family="Plus Jakarta Sans, sans-serif" font-size="11" font-weight="700"
        fill="#7A6A5A" letter-spacing="1.5">DNA #${fingerprint} - Skor ${score}/100</text>
</svg>`.trim();
    };

    const buildHelixPath = (size, offset, rand) => {
        let d = `M 0 ${offset}`;
        const steps = 14;
        const amplitude = 14 + rand() * 8;
        for (let i = 1; i <= steps; i++) {
            const x = (size / steps) * i;
            const y = offset + Math.sin((i / steps) * Math.PI * 4 + offset * 0.05) * amplitude;
            const cpx = (size / steps) * (i - 0.5);
            const cpy = offset + Math.sin(((i - 0.5) / steps) * Math.PI * 4 + offset * 0.05) * amplitude * 1.3;
            d += ` Q ${cpx.toFixed(1)} ${cpy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
        return d;
    };

    /**
     * Render Hoax DNA into a container element
     */
    const renderInto = (container, analysis) => {
        if (!container || !analysis) return;
        container.innerHTML = generateDNA(analysis);
    };

    /**
     * Download DNA as PNG
     */
    const downloadAsPNG = (analysis) => {
        const svgMarkup = generateDNA(analysis);
        const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = 3;
            canvas.width = 280 * scale;
            canvas.height = 320 * scale;
            const ctx = canvas.getContext('2d');
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
                if (!blob) return;
                const dlUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = dlUrl;
                a.download = `saringsini-dna-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(dlUrl), 1000);
            }, 'image/png');
            URL.revokeObjectURL(url);
        };
        img.src = url;
    };

    // Expose globally so app.js (or any other module) can call after analysis
    window.HoaxDNA = { generateDNA, renderInto, downloadAsPNG };
})();
