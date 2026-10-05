import { ApiError, getJson, postJson } from '../core/api.js';
import { getClientId } from '../core/client-id.js';
import { createElement } from '../core/dom.js';
import { EVENTS, emit, on } from '../core/events.js';
import { showToast } from '../core/toast.js';
import { fireConfetti } from './confetti.js';

const REFRESH_AFTER_ANALYSIS_MS = 600;
const UPVOTE_CONFETTI_MS = 1200;
const BADGE_CLASSES = new Set(['safe', 'warning', 'danger']);
const UPVOTE_ICON = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>';

/** The feed lists posts written by other visitors: every field of them is untrusted text. */
export function initCommunity() {
    const container = document.getElementById('community-feed-container');
    const tabs = document.querySelectorAll('.comm-tab');

    let reports = [];
    let categoryFilter = 'all';
    let searchQuery = '';

    const matchesFilters = (item) => {
        if (categoryFilter !== 'all') {
            const filter = categoryFilter.toLowerCase();
            const inCategory = (item.category || '').toLowerCase().includes(filter);
            const inBadge = (item.badge || '').toLowerCase().includes(filter);
            if (!inCategory && !inBadge) return false;
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (item.text || '').toLowerCase().includes(query) || (item.author || '').toLowerCase().includes(query);
        }
        return true;
    };

    function buildItem(post) {
        const badge = createElement('span', 'community-badge', `${post.percentage}% ${post.badge}`);
        if (BADGE_CLASSES.has(post.badgeClass)) badge.classList.add(post.badgeClass);
        const header = createElement('div', 'community-item-header');
        header.append(createElement('span', 'community-author', post.author), badge);

        const upvote = createElement('button', 'community-upvote-btn');
        upvote.type = 'button';
        upvote.disabled = post.upvoted;
        upvote.classList.toggle('upvoted', post.upvoted);
        upvote.innerHTML = UPVOTE_ICON;
        upvote.append(createElement('span', '', `${post.upvotes} ${post.upvoted ? 'Sudah Didukung' : 'Dukung Klarifikasi'}`));
        upvote.addEventListener('click', (event) => {
            event.stopPropagation();
            upvotePost(post.id);
        });

        const actions = createElement('div', 'community-actions');
        actions.append(createElement('span', 'community-date', post.time), upvote);

        const item = createElement('div', 'community-item');
        item.append(header, createElement('p', 'community-text', post.text), actions);
        return item;
    }

    function renderFeed() {
        const visible = reports.filter(matchesFilters);
        container.replaceChildren(
            ...(visible.length > 0
                ? visible.map(buildItem)
                : [createElement('div', 'community-empty', 'Tidak ada laporan hoaks yang cocok.')])
        );
    }

    async function loadFeed() {
        try {
            reports = await getJson('/api/community', { headers: { 'X-Client-Id': getClientId() } });
        } catch (error) {
            console.error('Failed to load community feed from server:', error);
            return;
        }
        renderFeed();
        emit(EVENTS.COMMUNITY, reports);
    }

    async function upvotePost(id) {
        try {
            await postJson(
                `/api/community/${encodeURIComponent(id)}/upvote`,
                { clientId: getClientId() },
                { fallbackMessage: 'Gagal memberikan upvote.' }
            );
        } catch (error) {
            if (error instanceof ApiError) {
                showToast(error.message, 'warning');
            } else {
                console.error('Upvote request failed:', error);
                showToast('Koneksi gagal. Coba lagi.', 'danger');
            }
            return;
        }

        showToast('Dukungan verifikasi berhasil ditambahkan', 'safe');
        fireConfetti(UPVOTE_CONFETTI_MS);
        loadFeed();
    }

    document.getElementById('community-search').addEventListener('input', (event) => {
        searchQuery = event.target.value.trim();
        renderFeed();
    });

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabs.forEach((other) => other.classList.toggle('active', other === tab));
            categoryFilter = tab.dataset.cat;
            renderFeed();
        });
    });

    // A finished check adds a report on the server: pick it up.
    on(EVENTS.ANALYSIS, () => setTimeout(loadFeed, REFRESH_AFTER_ANALYSIS_MS));

    loadFeed();
}
