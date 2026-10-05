import { showToast } from '../core/toast.js';

/** Dictation into the message box, through the browser's speech recognition (Indonesian). */
export function initVoiceInput() {
    const button = document.getElementById('voice-input-btn');
    const status = button.querySelector('.voice-status-text');
    const messageInput = document.getElementById('message-input');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        button.disabled = true;
        button.title = 'Browser tidak mendukung input suara';
        button.setAttribute('aria-disabled', 'true');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    let isRecording = false;

    const setRecording = (recording) => {
        isRecording = recording;
        button.classList.toggle('recording', recording);
        status.textContent = recording ? 'Stop' : 'Bicara';
        button.setAttribute('aria-label', recording ? 'Hentikan rekaman suara' : 'Rekam suara untuk pesan');
    };

    recognition.onstart = () => setRecording(true);
    recognition.onend = () => setRecording(false);

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) transcript += event.results[i][0].transcript;
        }
        if (!transcript) return;
        const current = messageInput.value.trim();
        messageInput.value = (current ? `${current} ` : '') + transcript.trim();
    };

    recognition.onerror = (event) => {
        console.warn('Voice recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            showToast('Izin mikrofon ditolak. Aktifkan di pengaturan browser.', 'warning');
        } else if (event.error === 'no-speech') {
            showToast('Tidak ada suara terdeteksi. Coba lagi.', 'warning');
        } else if (event.error !== 'aborted') {
            showToast('Input suara gagal. Coba ketik manual.', 'warning');
        }
    };

    button.addEventListener('click', () => {
        if (isRecording) {
            recognition.stop();
            return;
        }
        try {
            recognition.start();
            showToast('Mulai bicara dalam Bahasa Indonesia', 'safe');
        } catch (error) {
            console.warn('Cannot start recognition:', error);
        }
    });
}
