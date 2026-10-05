import { EVENTS, on } from '../core/events.js';
import { whatsappUrl } from '../core/whatsapp.js';
import { generateDnaSvg } from '../lib/dna-art.js';

const PNG_SCALE = 3;
const SVG_WIDTH = 280;
const SVG_HEIGHT = 320;
const REVOKE_DELAY_MS = 1000;

/** Rasterises the fingerprint and offers it as a download. */
function downloadAsPng(analysis) {
    const svgUrl = URL.createObjectURL(new Blob([generateDnaSvg(analysis)], { type: 'image/svg+xml;charset=utf-8' }));

    const image = new Image();
    image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = SVG_WIDTH * PNG_SCALE;
        canvas.height = SVG_HEIGHT * PNG_SCALE;
        const context = canvas.getContext('2d');
        context.scale(PNG_SCALE, PNG_SCALE);
        context.drawImage(image, 0, 0);
        URL.revokeObjectURL(svgUrl);

        canvas.toBlob((blob) => {
            if (!blob) return;
            const pngUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = `saringsini-dna-${Date.now()}.png`;
            document.body.append(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(pngUrl), REVOKE_DELAY_MS);
        }, 'image/png');
    };
    image.src = svgUrl;
}

/** Shows the "Hoax DNA" fingerprint card under each finished check. */
export function initHoaxDna() {
    const section = document.getElementById('hoax-dna-section');
    const canvas = document.getElementById('hoax-dna-canvas');
    const shareLink = document.getElementById('hoax-dna-wa');
    let current = null;

    on(EVENTS.ANALYSIS, (analysis) => {
        current = analysis;
        canvas.innerHTML = generateDnaSvg(analysis);
        section.classList.remove('hidden');
        shareLink.href = whatsappUrl(
            `Saya barusan cek hoaks di SaringSini dan dapat DNA Hoaks unik! Skor: ${analysis.hoaxPercentage}/100, kategori: ${analysis.category}. Coba kamu juga: ${window.location.origin}`
        );
    });

    document.getElementById('hoax-dna-download').addEventListener('click', () => {
        if (current) downloadAsPng(current);
    });
}
