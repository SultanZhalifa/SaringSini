import { getAnalysis } from '../core/analysis.js';
import { createElement, formatClock } from '../core/dom.js';
import { showToast } from '../core/toast.js';
import { readReplyText } from './results.js';
import { FAMILY, pickFamilyReply } from './simulator-replies.js';

const TYPING_STEP_MS = 1000;
const READ_TICKS_ICON = '<svg class="chat-read-ticks" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path><path d="M16 6l-6.85 7.15L8.5 12.5"></path></svg>';

const byId = (id) => document.getElementById(id);

/** Puts text in the simulator's input, ready to be sent. */
export const prefillSimulatorMessage = (text) => {
    byId('chat-simulator-input').value = text;
};

export function initSimulator() {
    const chatBox = byId('chat-box');
    const input = byId('chat-simulator-input');
    const sendButton = byId('chat-send-btn');

    // The conversation starts as the markup in index.html; reset restores exactly that.
    const initialMessages = Array.from(chatBox.children, (node) => node.cloneNode(true));

    const stampFirstMessage = () => {
        byId('sim-time-1').textContent = formatClock(new Date());
    };

    const scrollToEnd = () => {
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    function appendMessage(sender, content, type, senderColor) {
        const bubble = createElement('div', `chat-bubble ${type}`);
        const message = createElement('p', 'message-content', content);
        const time = createElement('span', 'message-time', formatClock(new Date()));

        if (type === 'received') {
            const name = createElement('div', 'sender-name', sender);
            name.style.color = senderColor;
            bubble.append(name, message, time);
        } else {
            const meta = createElement('div', 'chat-sent-meta');
            meta.append(time);
            meta.insertAdjacentHTML('beforeend', READ_TICKS_ICON);
            bubble.append(message, meta);
        }

        chatBox.append(bubble);
        scrollToEnd();
    }

    function showTypingIndicator(senderName) {
        const dots = createElement('span', 'chat-typing-dots');
        dots.append(createElement('span'), createElement('span'), createElement('span'));

        const indicator = createElement('div', 'chat-typing-indicator');
        indicator.dataset.typingFor = senderName;
        indicator.append(createElement('span', '', `${senderName} sedang mengetik`), dots);

        chatBox.append(indicator);
        scrollToEnd();
        return indicator;
    }

    /** Mama starts typing, Papa seems to take over, then the canned reply arrives. */
    function simulateFamilyResponse(userText) {
        const indicator = showTypingIndicator(FAMILY.mama.name);

        setTimeout(() => {
            indicator.querySelector('span').textContent = `${FAMILY.papa.name} sedang mengetik`;

            setTimeout(() => {
                indicator.remove();
                const { who, text } = pickFamilyReply(userText, getAnalysis());
                appendMessage(FAMILY[who].name, text, 'received', FAMILY[who].color);
            }, TYPING_STEP_MS);
        }, TYPING_STEP_MS);
    }

    sendButton.addEventListener('click', () => {
        const text = input.value.trim();
        if (!text) return;

        appendMessage('Anda', text, 'sent');
        input.value = '';
        simulateFamilyResponse(text);
    });

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') sendButton.click();
    });

    byId('reset-chat-btn').addEventListener('click', () => {
        chatBox.replaceChildren(...initialMessages.map((node) => node.cloneNode(true)));
        stampFirstMessage();
        input.value = '';
        showToast('Percakapan disetel ulang', 'safe');
    });

    document.querySelectorAll('.chat-quick-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            input.value = chip.dataset.chip;
            input.focus();
        });
    });

    byId('chat-paste-from-periksa').addEventListener('click', () => {
        const reply = readReplyText('sopan-text');
        if (!reply) {
            showToast('Belum ada balasan sopan. Periksa hoaks dulu.', 'warning');
            return;
        }
        input.value = reply;
        input.focus();
        showToast('Balasan sopan tertempel. Tekan kirim.', 'safe');
    });

    stampFirstMessage();
}
