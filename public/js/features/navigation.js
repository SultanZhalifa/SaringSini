const PANELS = ['beranda', 'periksa', 'simulator', 'komunitas', 'edukasi'];
const QUICK_ACTIONS = ['periksa', 'simulator', 'komunitas', 'edukasi'];

/** Shows one of the five panels and syncs the bottom bar and the desktop sidebar. */
export function switchPanel(name) {
    document.querySelectorAll('.bottom-nav-btn, .sidebar-nav-btn').forEach((button) => {
        button.classList.toggle('active', button.dataset.tab === name);
    });
    document.querySelectorAll('.tab-panel').forEach((panel) => {
        panel.classList.toggle('active', panel.id === `panel-${name}`);
    });
    document.querySelector('.app-content').scrollTop = 0;
}

export function initNavigation() {
    document.querySelectorAll('.bottom-nav-btn, .sidebar-nav-btn').forEach((button) => {
        button.addEventListener('click', () => switchPanel(button.dataset.tab));
    });

    QUICK_ACTIONS.forEach((tab) => {
        document.getElementById(`action-go-${tab}`).addEventListener('click', () => switchPanel(tab));
    });

    // PWA shortcuts open a panel directly: /?tab=periksa
    const requested = new URLSearchParams(window.location.search).get('tab');
    if (PANELS.includes(requested)) switchPanel(requested);
}
