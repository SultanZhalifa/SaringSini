import { getAnalysis, replaceReplies } from '../core/analysis.js';
import { postJson } from '../core/api.js';
import { copyText } from '../core/clipboard.js';
import { EVENTS, on } from '../core/events.js';
import { showToast } from '../core/toast.js';
import { shareOnWhatsApp } from '../core/whatsapp.js';
import { switchPanel } from './navigation.js';
import { readReplyText, setReplyTexts } from './results.js';
import { prefillSimulatorMessage } from './simulator.js';

const OPEN_SIMULATOR_DELAY_MS = 550;
const SHARE_INTRO = 'Halo, ini info verifikasi dari SaringSini:\n\n';
const LANGUAGE_LABELS = {
    jawa: 'Jawa Krama',
    sunda: 'Sunda Halus',
    minang: 'Minang',
    batak: 'Batak'
};

/** Clicking a reply card copies it and carries it over to the simulator for a dry run. */
function initCopyToSimulator() {
    document.querySelectorAll('.copyable').forEach((card) => {
        card.addEventListener('click', async (event) => {
            if (event.target.closest('.wa-share-btn')) return;
            const text = readReplyText(card.dataset.target);
            if (!text) return;

            const copied = await copyText(text);
            if (copied) showToast('Balasan disalin & dipindah ke Simulator', 'safe');
            else showToast('Tidak bisa salin otomatis. Tetap dipindah ke Simulator.', 'warning');

            prefillSimulatorMessage(text);
            setTimeout(() => switchPanel('simulator'), OPEN_SIMULATOR_DELAY_MS);
        });
    });
}

function initWhatsAppShare() {
    document.querySelectorAll('.wa-share-btn').forEach((button) => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const text = readReplyText(button.dataset.target);
            if (!text) {
                showToast('Hasilkan template balasan dulu.', 'warning');
                return;
            }
            shareOnWhatsApp(SHARE_INTRO + text);
        });
    });
}

/** Rewrites the three replies into a regional language. */
function initLanguageConversion() {
    const selector = document.getElementById('lang-selector');
    const button = document.getElementById('regen-lang-btn');

    const refreshButton = () => {
        const analysis = getAnalysis();
        button.disabled = !(analysis && analysis.politeReplies && selector.value && selector.value !== 'indonesia');
    };

    selector.addEventListener('change', refreshButton);
    on(EVENTS.ANALYSIS, refreshButton);

    button.addEventListener('click', async () => {
        const analysis = getAnalysis();
        const language = selector.value;
        if (!analysis || language === 'indonesia') return;

        button.classList.add('loading');
        button.disabled = true;
        try {
            const { politeReplies } = await postJson(
                '/api/translate-replies',
                { replies: analysis.politeReplies, language },
                { fallbackMessage: 'Gagal mengonversi bahasa.' }
            );
            if (politeReplies) {
                setReplyTexts(politeReplies);
                replaceReplies(politeReplies);
                showToast(`Balasan dikonversi ke Bahasa ${LANGUAGE_LABELS[language] || language}`, 'safe');
            }
        } catch (error) {
            console.error('Translate error:', error);
            showToast(error.message || 'Konversi bahasa gagal.', 'danger');
        } finally {
            button.classList.remove('loading');
            refreshButton();
        }
    });
}

export function initReplies() {
    initCopyToSimulator();
    initWhatsAppShare();
    initLanguageConversion();
}
