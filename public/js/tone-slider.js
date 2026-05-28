// =========================================================
// AI TONE SLIDER - Realtime balasan tone adjustment
// Debounced regenerate via Gemini /api/retone
// =========================================================

(function initToneSlider() {
    const TONE_LABELS = [
        { max: 19, label: 'Sangat Formal (Surat Resmi)' },
        { max: 39, label: 'Sopan Tradisional' },
        { max: 59, label: 'Sopan Hangat' },
        { max: 79, label: 'Akrab Santai' },
        { max: 100, label: 'Bercanda Ringan' }
    ];

    let debounceTimer = null;
    let inFlightController = null;

    document.addEventListener('DOMContentLoaded', () => {
        const slider = document.getElementById('tone-slider');
        const currentLabel = document.getElementById('tone-slider-current');
        const resultCard = document.getElementById('tone-result-card');
        const resultText = document.getElementById('tone-result-text');
        const resultLabel = document.getElementById('tone-result-label');
        const copyBtn = document.getElementById('tone-result-copy');
        const waLink = document.getElementById('tone-result-wa');

        if (!slider || !currentLabel) return;

        const updateLabel = (val) => {
            const tl = TONE_LABELS.find(t => val <= t.max) || TONE_LABELS[2];
            currentLabel.textContent = `Tone: ${tl.label}`;
            slider.setAttribute('aria-valuenow', String(val));
        };

        slider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            updateLabel(val);
            scheduleRegenerate(val);
        });

        // Initial label
        updateLabel(parseInt(slider.value, 10));

        function scheduleRegenerate(toneVal) {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => regenerateTone(toneVal), 600);
        }

        async function regenerateTone(toneVal) {
            const sopanText = document.getElementById('sopan-text');
            if (!sopanText || !sopanText.textContent || sopanText.textContent.includes('Memuat')) {
                // No analysis result yet; show hint
                return;
            }

            const originalReply = sopanText.textContent.trim();

            // Cancel previous in-flight request
            if (inFlightController) {
                try { inFlightController.abort(); } catch (_) { /* ignore */ }
            }
            inFlightController = new AbortController();

            // Get scenario from current message input or fallback
            const msgInput = document.getElementById('message-input');
            const scenario = msgInput ? msgInput.value.trim() : '';

            resultCard.classList.remove('hidden');
            resultText.classList.add('loading');
            resultText.textContent = 'Gemini sedang menyesuaikan tone...';

            try {
                const res = await fetch('/api/retone', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        originalReply,
                        tone: toneVal,
                        scenario,
                        recipient: 'orang tua di grup WhatsApp keluarga'
                    }),
                    signal: inFlightController.signal
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || `HTTP ${res.status}`);
                }
                const data = await res.json();
                resultText.classList.remove('loading');
                resultText.textContent = data.reply;
                resultLabel.textContent = data.toneLabel ? shortenToneLabel(data.toneLabel) : 'Hasil Tone';

                // Update WhatsApp deep link
                if (waLink) {
                    waLink.href = `https://wa.me/?text=${encodeURIComponent(data.reply)}`;
                }
            } catch (error) {
                if (error.name === 'AbortError') return;
                resultText.classList.remove('loading');
                resultText.textContent = 'Gagal memuat balasan baru. Coba lagi.';
            }
        }

        function shortenToneLabel(full) {
            const upToComma = full.split(',')[0];
            const first6Words = upToComma.split(/\s+/).slice(0, 6).join(' ');
            return first6Words;
        }

        // Copy handler
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                const text = resultText.textContent || '';
                if (!text || text.includes('Geser slider')) return;
                try {
                    await navigator.clipboard.writeText(text);
                    showToast('Balasan tone tersalin. Tempel di WhatsApp keluarga.', 'safe');
                    triggerHaptic([5]);
                } catch (_) {
                    showToast('Tidak dapat menyalin otomatis. Tekan dan tahan teks untuk salin manual.', 'warning');
                }
            });
        }

        function triggerHaptic(pattern) {
            if (navigator.vibrate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                try { navigator.vibrate(pattern); } catch (_) { /* ignore */ }
            }
        }

        function showToast(msg, variant = 'safe') {
            const toast = document.getElementById('toast');
            if (!toast) return;
            toast.textContent = msg;
            toast.classList.remove('toast-safe', 'toast-warning', 'toast-danger');
            toast.classList.add(`toast-${variant}`, 'show');
            setTimeout(() => toast.classList.remove('show'), 2800);
        }
    });
})();
