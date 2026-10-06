// =========================================================
// DNA INTEGRATOR
// Renders the Hoax DNA fingerprint whenever app.js announces a
// finished analysis (the `saringsini:analysis` event).
// =========================================================

(function initDNAIntegrator() {
    document.addEventListener('DOMContentLoaded', () => {
        const dnaSection = document.getElementById('hoax-dna-section');
        const dnaCanvas = document.getElementById('hoax-dna-canvas');
        const dnaDownloadBtn = document.getElementById('hoax-dna-download');
        const dnaWaLink = document.getElementById('hoax-dna-wa');

        if (!dnaSection || !dnaCanvas || !window.HoaxDNA) return;

        let currentAnalysis = null;

        document.addEventListener('saringsini:analysis', (event) => {
            currentAnalysis = event.detail;
            window.HoaxDNA.renderInto(dnaCanvas, currentAnalysis);
            dnaSection.style.display = 'flex';

            if (dnaWaLink) {
                const shareText = `Saya barusan cek hoaks di SaringSini dan dapat DNA Hoaks unik! Skor: ${currentAnalysis.hoaxPercentage}/100, kategori: ${currentAnalysis.category}. Coba kamu juga: ${window.location.origin}`;
                dnaWaLink.href = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
            }
        });

        if (dnaDownloadBtn) {
            dnaDownloadBtn.addEventListener('click', () => {
                if (currentAnalysis) window.HoaxDNA.downloadAsPNG(currentAnalysis);
            });
        }
    });
})();
