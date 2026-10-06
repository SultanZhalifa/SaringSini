import { postForm } from '../core/api.js';
import { publishAnalysis } from '../core/analysis.js';
import { showToast } from '../core/toast.js';
import { getInputMode } from './input-tabs.js';
import { hideResultLoading, renderAnalysisResults, showResultEmpty, showResultLoading } from './results.js';
import { createUploadSlot } from './uploads.js';

const SCROLL_TO_RESULT_DELAY_MS = 150;

const isUrl = (value) => {
    try {
        new URL(value);
        return true;
    } catch (_) {
        return false;
    }
};

function warn(message) {
    showToast(message, 'warning');
    return null;
}

export function initAnalyze() {
    const screenshot = createUploadSlot({
        ids: {
            zone: 'drop-zone',
            input: 'file-input',
            container: 'image-preview-container',
            image: 'image-preview',
            remove: 'remove-image'
        },
        messages: {
            type: 'Format berkas tidak didukung. Hanya gambar.',
            size: 'Ukuran gambar terlalu besar. Maksimal 5MB.'
        }
    });
    const deepfake = createUploadSlot({
        ids: {
            zone: 'drop-zone-deepfake',
            input: 'file-input-deepfake',
            container: 'image-preview-container-deepfake',
            image: 'image-preview-deepfake',
            video: 'video-preview-deepfake',
            remove: 'remove-image-deepfake'
        },
        messages: {
            type: 'Format berkas tidak didukung. Hanya gambar atau video.',
            size: 'Ukuran berkas terlalu besar. Maksimal 5MB.'
        }
    });

    const messageInput = document.getElementById('message-input');
    const urlInput = document.getElementById('url-input');
    const analyzeButton = document.getElementById('analyze-btn');
    const spinner = document.getElementById('btn-spinner');

    /** The request body for the current mode, or null (after telling the user what is missing). */
    function buildForm() {
        const text = messageInput.value.trim();
        const form = new FormData();

        switch (getInputMode()) {
            case 'text':
                if (!text) return warn('Mohon masukkan teks pesan atau berita terlebih dahulu');
                form.append('message', text);
                break;
            case 'image':
                if (!screenshot.file) return warn('Mohon pilih atau unggah tangkapan layar chat');
                form.append('screenshot', screenshot.file);
                if (text) form.append('message', text);
                break;
            case 'deepfake':
                if (!deepfake.file) return warn('Mohon pilih atau unggah foto atau video rekayasa AI');
                form.append('screenshot', deepfake.file);
                form.append('checkType', 'deepfake');
                if (text) form.append('message', text);
                break;
            case 'url': {
                const url = urlInput.value.trim();
                if (!url) return warn('Mohon tempel URL yang ingin diperiksa');
                if (!isUrl(url)) return warn('Format URL tidak valid. Pastikan diawali http:// atau https://');
                form.append('message', url);
                form.append('checkType', 'url');
                break;
            }
        }
        return form;
    }

    analyzeButton.addEventListener('click', async () => {
        const form = buildForm();
        if (!form) return;

        analyzeButton.disabled = true;
        spinner.classList.remove('hidden');
        showResultLoading();

        try {
            const analysis = await postForm('/api/analyze', form, {
                fallbackMessage: 'Terjadi kesalahan sistem saat menganalisis berita.'
            });
            renderAnalysisResults(analysis);
            publishAnalysis(analysis);

            setTimeout(() => {
                document.getElementById('result-view').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, SCROLL_TO_RESULT_DELAY_MS);
        } catch (error) {
            console.error(error);
            showToast(error.message || 'Koneksi gagal. Coba lagi sebentar.', 'danger');
            showResultEmpty();
        } finally {
            analyzeButton.disabled = false;
            spinner.classList.add('hidden');
            hideResultLoading();
        }
    });
}
