import { STORAGE_KEYS, storage } from '../core/storage.js';
import { showToast } from '../core/toast.js';

const SHOW_DELAY_MS = 800;

const icon = (paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

const STEPS = [
    {
        title: 'Selamat Datang di SaringSini',
        description: 'Alat bantu literasi digital keluarga Indonesia yang memberikan indikasi awal berbantuan AI dan latihan komunikasi.',
        icon: icon('<path d="M20 12V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M2 13h20"/><path d="M2 17h20"/><path d="M6 21h12"/>')
    },
    {
        title: 'Periksa Pesan Mencurigakan',
        description: 'Tempel teks, unggah media, dikte suara, atau masukkan link untuk memperoleh indikasi awal dari Gemini. Hasil dapat salah dan perlu diverifikasi.',
        icon: icon('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>')
    },
    {
        title: 'Balasan Sopan Otomatis',
        description: 'Dapatkan 3 template balasan (Sopan/Santai/Humor) plus konversi ke Bahasa Jawa, Sunda, Minang, atau Batak. Kirim langsung via WhatsApp.',
        icon: icon('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>')
    },
    {
        title: 'Jelajahi Fitur Demonstrasi',
        description: 'Coba feed komunitas, kuis, leaderboard, dan peta dengan data simulasi. Angka yang ditampilkan bukan metrik penggunaan atau dampak nyata.',
        icon: icon('<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>')
    }
];

const byId = (id) => document.getElementById(id);

/** A four-step welcome tour, shown once to a first-time visitor. */
export function initOnboarding() {
    const overlay = byId('onboarding-overlay');
    const nextButton = byId('onboarding-next');
    let step = 0;

    const renderStep = () => {
        const { title, description, icon: illustration } = STEPS[step];
        byId('onboarding-title').textContent = title;
        byId('onboarding-description').textContent = description;
        byId('onboarding-illustration').innerHTML = illustration;
        byId('onboarding-dots').querySelectorAll('.onboarding-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === step);
        });
        nextButton.textContent = step === STEPS.length - 1 ? 'Mulai' : 'Lanjut';
    };

    const close = () => {
        overlay.hidden = true;
        storage.set(STORAGE_KEYS.onboarded, '1');
    };

    nextButton.addEventListener('click', () => {
        if (step < STEPS.length - 1) {
            step += 1;
            renderStep();
            return;
        }
        close();
        showToast('Selamat memeriksa hoaks. Tetap waspada keluarga Indonesia.', 'safe');
    });
    byId('onboarding-skip').addEventListener('click', close);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !overlay.hidden) close();
    });

    if (storage.get(STORAGE_KEYS.onboarded) !== '1') {
        setTimeout(() => {
            overlay.hidden = false;
            renderStep();
        }, SHOW_DELAY_MS);
    }
}
