// =========================================================
// DNA INTEGRATOR
// Watches analysis result DOM for changes, then renders
// Hoax DNA fingerprint into the dedicated section.
// =========================================================

(function initDNAIntegrator() {
    document.addEventListener('DOMContentLoaded', () => {
        const dnaSection = document.getElementById('hoax-dna-section');
        const dnaCanvas = document.getElementById('hoax-dna-canvas');
        const dnaDownloadBtn = document.getElementById('hoax-dna-download');
        const dnaWaLink = document.getElementById('hoax-dna-wa');
        const summaryEl = document.getElementById('res-summary');
        const gaugeText = document.getElementById('gauge-value-text');
        const categoryEl = document.getElementById('res-category');
        const claimsListEl = document.getElementById('res-claims-list');

        if (!dnaSection || !dnaCanvas || !window.HoaxDNA) return;

        let lastSignature = '';
        let currentAnalysis = null;

        // Observe summary changes - signals new analysis arrived
        const checkAndRender = () => {
            const summary = (summaryEl?.textContent || '').trim();
            const score = parseInt((gaugeText?.textContent || '0').replace(/\D/g, ''), 10) || 0;
            const category = (categoryEl?.textContent || '').trim();

            if (!summary || summary.length < 10) {
                dnaSection.style.display = 'none';
                return;
            }

            const claims = Array.from(claimsListEl?.querySelectorAll('.claim-text, .claim-name') || [])
                .map(el => el.textContent.trim())
                .filter(t => t.length > 0);

            const signature = `${summary}|${category}|${score}|${claims.join(',')}`;
            if (signature === lastSignature) return;
            lastSignature = signature;

            currentAnalysis = {
                summary,
                category,
                hoaxPercentage: score,
                claims: claims.map(c => ({ claim: c }))
            };

            window.HoaxDNA.renderInto(dnaCanvas, currentAnalysis);
            dnaSection.style.display = 'flex';

            // Update WhatsApp share link
            if (dnaWaLink) {
                const shareText = `Saya barusan cek hoaks di SaringSini dan dapat DNA Hoaks unik! Skor: ${score}/100, kategori: ${category}. Coba kamu juga: ${window.location.origin}`;
                dnaWaLink.href = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
            }
        };

        if (summaryEl) {
            const observer = new MutationObserver(checkAndRender);
            observer.observe(summaryEl, { childList: true, characterData: true, subtree: true });
        }

        // Also re-check on a slight interval as fallback (low cost)
        setInterval(checkAndRender, 800);

        if (dnaDownloadBtn) {
            dnaDownloadBtn.addEventListener('click', () => {
                if (currentAnalysis && window.HoaxDNA) {
                    window.HoaxDNA.downloadAsPNG(currentAnalysis);
                }
            });
        }
    });
})();
