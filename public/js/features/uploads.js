import { showToast } from '../core/toast.js';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const stopEvent = (event) => {
    event.preventDefault();
    event.stopPropagation();
};

/**
 * A drop zone with a file input, a preview and a remove button.
 *
 * @param {object} options
 * @param {{zone: string, input: string, container: string, image: string, remove: string, video?: string}} options.ids
 *        element ids; `video` is only present when videos are accepted
 * @param {{type: string, size: string}} options.messages toast texts for refused files
 * @returns {{ readonly file: File | null }}
 */
export function createUploadSlot({ ids, messages }) {
    const zone = document.getElementById(ids.zone);
    const input = document.getElementById(ids.input);
    const container = document.getElementById(ids.container);
    const image = document.getElementById(ids.image);
    const removeButton = document.getElementById(ids.remove);
    const video = ids.video ? document.getElementById(ids.video) : null;

    let selected = null;
    let previewUrl = null;

    const releasePreviewUrl = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = null;
    };

    const preview = (file, isVideo) => {
        releasePreviewUrl();
        previewUrl = URL.createObjectURL(file);

        if (isVideo) {
            image.removeAttribute('src');
            image.classList.add('hidden');
            // codeql[js/xss-through-dom]: previewUrl is a blob: URL of the file the visitor picked; it cannot carry markup.
            video.src = previewUrl;
            video.classList.remove('hidden');
        } else {
            video?.removeAttribute('src');
            video?.classList.add('hidden');
            // codeql[js/xss-through-dom]: same blob: URL as above.
            image.src = previewUrl;
            image.classList.remove('hidden');
        }
        container.classList.remove('hidden');
    };

    const select = (file) => {
        const isImage = file.type.startsWith('image/');
        const isVideo = Boolean(video) && file.type.startsWith('video/');
        if (!isImage && !isVideo) {
            showToast(messages.type, 'warning');
            return;
        }
        if (file.size > MAX_UPLOAD_BYTES) {
            showToast(messages.size, 'warning');
            return;
        }

        selected = file;
        preview(file, isVideo);
    };

    const clear = () => {
        selected = null;
        input.value = '';
        releasePreviewUrl();
        image.removeAttribute('src');
        image.classList.add('hidden');
        if (video) {
            video.removeAttribute('src');
            video.classList.add('hidden');
        }
        container.classList.add('hidden');
    };

    zone.addEventListener('click', (event) => {
        if (event.target.closest(`#${ids.remove}`)) return;
        input.click();
    });
    input.addEventListener('change', () => {
        if (input.files.length > 0) select(input.files[0]);
    });
    ['dragenter', 'dragover'].forEach((name) => {
        zone.addEventListener(name, (event) => {
            stopEvent(event);
            zone.classList.add('dragover');
        });
    });
    ['dragleave', 'drop'].forEach((name) => {
        zone.addEventListener(name, (event) => {
            stopEvent(event);
            zone.classList.remove('dragover');
        });
    });
    zone.addEventListener('drop', (event) => {
        const [file] = event.dataTransfer.files;
        if (file) select(file);
    });
    removeButton.addEventListener('click', (event) => {
        event.stopPropagation();
        clear();
    });

    return {
        get file() {
            return selected;
        }
    };
}
