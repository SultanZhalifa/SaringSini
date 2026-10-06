const MODES = ['text', 'image', 'deepfake', 'url'];

let activeMode = 'text';

/** Which kind of check the user is preparing: 'text' | 'image' | 'deepfake' | 'url'. */
export const getInputMode = () => activeMode;

function setInputMode(mode) {
    activeMode = mode;
    MODES.forEach((name) => {
        const isActive = name === mode;
        const tab = document.getElementById(`tab-${name}`);
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
        document.getElementById(`group-${name}`).classList.toggle('hidden', !isActive);
    });
}

export function initInputTabs() {
    MODES.forEach((mode) => {
        document.getElementById(`tab-${mode}`).addEventListener('click', () => setInputMode(mode));
    });
}
