import { postJson } from '../core/api.js';
import { copyText } from '../core/clipboard.js';
import { vibrate } from '../core/motion.js';
import { showToast } from '../core/toast.js';
import { whatsappUrl } from '../core/whatsapp.js';
import { readReplyText } from './results.js';

const DEBOUNCE_MS = 600;
const RECIPIENT = 'orang tua di grup WhatsApp keluarga';
const COPY_PLACEHOLDER = 'Geser slider';
const TONE_LABELS = [
    { max: 19, label: 'Sangat Formal (Surat Resmi)' },
    { max: 39, label: 'Sopan Tradisional' },
    { max: 59, label: 'Sopan Hangat' },
    { max: 79, label: 'Akrab Santai' },
    { max: 100, label: 'Bercanda Ringan' }
];

const byId = (id) => document.getElementById(id);

/** "Sopan Hangat, dengan nada lembut ..." -> "Sopan Hangat" (at most six words, up to the first comma). */
const shortenToneLabel = (label) => label.split(',')[0].split(/\s+/).slice(0, 6).join(' ');

/** Re-writes the polite reply at the chosen formality, through the AI, a moment after the slider stops. */
export function initToneSlider() {
    const slider = byId('tone-slider');
    const currentLabel = byId('tone-slider-current');
    const resultCard = byId('tone-result-card');
    const resultText = byId('tone-result-text');
    const resultLabel = byId('tone-result-label');
    const shareLink = byId('tone-result-wa');

    let debounceTimer = null;
    let inFlight = null;

    const updateLabel = (value) => {
        const { label } = TONE_LABELS.find((tone) => value <= tone.max) ?? TONE_LABELS.at(-1);
        currentLabel.textContent = `Tone: ${label}`;
        slider.setAttribute('aria-valuenow', String(value));
    };

    async function regenerate(tone) {
        const originalReply = readReplyText('sopan-text');
        if (!originalReply) return; // no check has been made yet

        inFlight?.abort();
        inFlight = new AbortController();

        resultCard.classList.remove('hidden');
        resultText.classList.add('loading');
        resultText.textContent = 'Gemini sedang menyesuaikan tone...';

        try {
            const data = await postJson(
                '/api/retone',
                { originalReply, tone, scenario: byId('message-input').value.trim(), recipient: RECIPIENT },
                { signal: inFlight.signal }
            );
            resultText.classList.remove('loading');
            resultText.textContent = data.reply;
            resultLabel.textContent = data.toneLabel ? shortenToneLabel(data.toneLabel) : 'Hasil Tone';
            shareLink.href = whatsappUrl(data.reply);
        } catch (error) {
            if (error.name === 'AbortError') return; // superseded by a newer request
            resultText.classList.remove('loading');
            resultText.textContent = 'Gagal memuat balasan baru. Coba lagi.';
        }
    }

    slider.addEventListener('input', () => {
        const value = Number.parseInt(slider.value, 10);
        updateLabel(value);
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => regenerate(value), DEBOUNCE_MS);
    });

    byId('tone-result-copy').addEventListener('click', async () => {
        const text = resultText.textContent || '';
        if (!text || text.includes(COPY_PLACEHOLDER)) return;

        if (await copyText(text)) {
            showToast('Balasan tone tersalin. Tempel di WhatsApp keluarga.', 'safe');
            vibrate([5]);
        } else {
            showToast('Tidak dapat menyalin otomatis. Tekan dan tahan teks untuk salin manual.', 'warning');
        }
    });

    updateLabel(Number.parseInt(slider.value, 10));
}
