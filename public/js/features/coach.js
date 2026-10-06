import { postJson } from '../core/api.js';
import { countUp } from '../core/count-up.js';
import { createElement } from '../core/dom.js';
import { vibrate } from '../core/motion.js';
import { showToast } from '../core/toast.js';
import { fireConfetti } from './confetti.js';
import { switchPanel } from './navigation.js';

const TOAST_MS = 3000;
const MIN_SCENARIO_LENGTH = 5;
const SCORE_COUNT_MS = 1300;
const SCORE_RING_CIRCUMFERENCE = 314.16;
const CONFETTI_MIN_SCORE = 80;
const CONFETTI_DELAY_MS = 600;
const CONFETTI_MS = 1500;
const TEXTAREA_MAX_HEIGHT_PX = 100;
const SCROLL_TO_COACH_DELAY_MS = 280;

// Mood of the parent, by how many replies the user has sent.
const MOODS = [
    { fromTurns: 6, label: 'Mendukung Klarifikasi' },
    { fromTurns: 4, label: 'Mempertimbangkan' },
    { fromTurns: 2, label: 'Mulai Mendengar' },
    { fromTurns: 0, label: 'Skeptis - Defensif' }
];

const PERSONAS = {
    mama: { name: 'Mama', initial: 'M', mood: 'Skeptis - Defensif' },
    papa: { name: 'Papa', initial: 'P', mood: 'Tegas - Ngeyel' },
    om: { name: 'Om Heri', initial: 'O', mood: 'Pamer pengetahuan' },
    tante: { name: 'Tante Rosa', initial: 'T', mood: 'Heboh - Dramatis' }
};

const byId = (id) => document.getElementById(id);

const message = (className, text) => createElement('div', `coach-msg ${className}`, text);

/**
 * "Bahasa Mama" mode: the user practises correcting a forwarded hoax in a multi-turn chat with
 * an AI playing a parent, then gets the conversation scored.
 */
export function initCoach() {
    const setup = byId('coach-setup');
    const chat = byId('coach-chat-wrap');
    const evaluation = byId('coach-eval-wrap');
    const messages = byId('coach-messages');
    const scenarioInput = byId('coach-scenario-input');
    const input = byId('coach-input');
    const sendButton = byId('coach-send-btn');
    const endButton = byId('coach-end-btn');
    const mood = byId('coach-active-mood');
    const personaButtons = document.querySelectorAll('.coach-persona-btn');

    const endButtonLabel = endButton.innerHTML;
    const session = { persona: 'mama', scenario: '', history: [], sending: false, evaluating: false };

    const userTurns = () => session.history.filter((turn) => turn.role === 'user').length;

    const scrollToEnd = () => {
        requestAnimationFrame(() => {
            messages.scrollTop = messages.scrollHeight;
        });
    };

    const backToSetup = () => {
        chat.classList.add('hidden');
        evaluation.classList.add('hidden');
        setup.classList.remove('hidden');
        messages.replaceChildren();
        session.history = [];
    };

    function showForwardedHoax() {
        const label = createElement('div', 'coach-forward-label', `${PERSONAS[session.persona].name} mem-forward:`);
        const forwarded = message('parent');
        forwarded.append(label, createElement('div', '', session.scenario));
        messages.replaceChildren(forwarded);
        scrollToEnd();
    }

    function startSession() {
        const scenario = scenarioInput.value.trim();
        if (scenario.length < MIN_SCENARIO_LENGTH) {
            scenarioInput.focus();
            showToast('Mohon isi atau pilih skenario hoaks terlebih dahulu.', 'warning', TOAST_MS);
            return;
        }
        session.scenario = scenario;
        session.history = [];

        const persona = PERSONAS[session.persona];
        const avatar = byId('coach-active-avatar');
        avatar.textContent = persona.initial;
        avatar.className = 'coach-chat-avatar';
        byId('coach-active-name').textContent = persona.name;
        mood.textContent = persona.mood;

        setup.classList.add('hidden');
        evaluation.classList.add('hidden');
        chat.classList.remove('hidden');
        showForwardedHoax();
        vibrate([8]);
    }

    function showTypingIndicator() {
        const indicator = message('typing');
        indicator.append(createElement('span'), createElement('span'), createElement('span'));
        messages.append(indicator);
        scrollToEnd();
        return indicator;
    }

    async function sendMessage() {
        const text = input.value.trim();
        if (!text || session.sending) return;

        session.sending = true;
        sendButton.disabled = true;

        messages.append(message('user', text));
        input.value = '';
        input.style.height = 'auto';
        session.history.push({ role: 'user', text });
        vibrate([5]);
        const typing = showTypingIndicator();

        try {
            const { reply } = await postJson('/api/coach', {
                persona: session.persona,
                scenario: session.scenario,
                history: session.history
            });
            typing.remove();
            messages.append(message('parent', reply));
            session.history.push({ role: 'model', text: reply });
            mood.textContent = MOODS.find((candidate) => userTurns() >= candidate.fromTurns).label;
            vibrate([3, 30, 3]);
        } catch (error) {
            typing.remove();
            messages.append(message('parent error', `Gagal memuat balasan. ${error.message || ''}`.trim()));
        } finally {
            scrollToEnd();
            session.sending = false;
            sendButton.disabled = false;
            input.focus();
        }
    }

    const listItems = (items, fallback) =>
        (items.length > 0 ? items : [fallback]).map((text) => createElement('li', '', text));

    function showEvaluation(result) {
        const score = Math.max(0, Math.min(100, Number(result.skorTotal) || 0));
        chat.classList.add('hidden');
        evaluation.classList.remove('hidden');

        countUp(byId('coach-eval-score-num'), score, SCORE_COUNT_MS);
        const offset = SCORE_RING_CIRCUMFERENCE - (score / 100) * SCORE_RING_CIRCUMFERENCE;
        setTimeout(() => {
            byId('coach-eval-score-arc').style.strokeDashoffset = String(offset);
        }, 100);

        byId('coach-eval-strengths').replaceChildren(
            ...listItems(result.kekuatan || [], 'Belum ada poin kekuatan yang menonjol di sesi ini.')
        );
        byId('coach-eval-improvements').replaceChildren(
            ...listItems(result.perbaikan || [], 'Komunikasi sudah sangat baik, pertahankan.')
        );
        byId('coach-eval-rec').textContent = result.rekomendasi || 'Lanjutkan latihan dengan skenario lain untuk variasi.';

        if (score >= CONFETTI_MIN_SCORE) setTimeout(() => fireConfetti(CONFETTI_MS), CONFETTI_DELAY_MS);
    }

    async function evaluate() {
        if (userTurns() < 1) {
            showToast('Kirim minimal satu balasan dulu untuk dievaluasi.', 'warning', TOAST_MS);
            return;
        }
        if (session.evaluating) return;

        session.evaluating = true;
        endButton.disabled = true;
        endButton.textContent = 'Menganalisis...';
        try {
            showEvaluation(await postJson('/api/coach/evaluate', { history: session.history }));
        } catch (error) {
            showToast(`Gagal mengevaluasi: ${error.message || 'unknown'}`, 'danger', TOAST_MS);
        } finally {
            session.evaluating = false;
            endButton.disabled = false;
            endButton.innerHTML = endButtonLabel;
        }
    }

    // The promo card on the home screen jumps straight to this section of the simulator.
    byId('hero-promo-coach').addEventListener('click', () => {
        switchPanel('simulator');
        requestAnimationFrame(() => {
            setTimeout(() => {
                byId('coach-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, SCROLL_TO_COACH_DELAY_MS);
        });
    });

    personaButtons.forEach((button) => {
        button.addEventListener('click', () => {
            personaButtons.forEach((other) => {
                other.classList.toggle('active', other === button);
                other.setAttribute('aria-checked', String(other === button));
            });
            session.persona = button.dataset.persona;
        });
    });

    document.querySelectorAll('.coach-scenario-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            scenarioInput.value = chip.dataset.scenario;
            scenarioInput.focus();
        });
    });

    byId('coach-start-btn').addEventListener('click', startSession);
    byId('coach-back-btn').addEventListener('click', backToSetup);
    byId('coach-restart-btn').addEventListener('click', () => {
        backToSetup();
        scenarioInput.value = '';
    });
    endButton.addEventListener('click', evaluate);
    sendButton.addEventListener('click', sendMessage);

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = `${Math.min(input.scrollHeight, TEXTAREA_MAX_HEIGHT_PX)}px`;
    });
}
