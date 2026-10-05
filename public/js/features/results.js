import { createElement } from '../core/dom.js';
import { RISK_COLORS, riskLevel } from '../core/risk.js';

export const TEMPLATE_PLACEHOLDER = 'Memuat template...';

const GAUGE_DASH_LENGTH = 125.6;
const GAUGE_COUNT_MS = 1000;
const MIN_GAUGE_STEP_MS = 10;
const MITIGATION_FROM_PERCENT = 40;

const FACTUAL_ICON = '<svg viewBox="0 0 24 24" class="claim-status-icon text-emerald" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
const HOAX_ICON = '<svg viewBox="0 0 24 24" class="claim-status-icon text-red" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
const EXTERNAL_LINK_ICON = '<svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';

const RISK_PRESENTATION = {
    safe: { glow: 'glow-safe-pulse', title: 'Indikasi Risiko Rendah' },
    warning: { glow: 'glow-warning-pulse', title: 'Indikasi Perlu Verifikasi' },
    danger: { glow: 'glow-danger-pulse', title: 'Indikasi Risiko Tinggi' }
};
const GLOW_CLASSES = Object.values(RISK_PRESENTATION).map((risk) => risk.glow);

const SCAM_LINKS = [
    { title: 'Verifikasi Nomor Rekening', url: 'https://cekrekening.id/', sub: 'cekrekening.id (Kementerian Kominfo)', tone: 'red-action' },
    { title: 'Lapor Patroli Siber POLRI', url: 'https://patrolisiber.id/', sub: 'Aduan Tindak Pidana Penipuan Siber', tone: 'red-action' }
];
const HEALTH_LINKS = [
    { title: 'Cari Info Sehat Kemenkes', url: 'https://kemkes.go.id/', sub: 'Portal Resmi Kementerian Kesehatan', tone: 'emerald-action' }
];
const GENERAL_LINKS = [
    { title: 'Laporkan Hoaks Kominfo', url: 'https://aduankonten.id/', sub: 'aduankonten.id (Klarifikasi Konten Negatif)', tone: 'emerald-action' },
    { title: 'Cek di TurnBackHoax.id', url: 'https://turnbackhoax.id/', sub: 'Portal Pemeriksa Fakta Mafindo', tone: 'emerald-action' }
];

const byId = (id) => document.getElementById(id);

/** Text of a reply card, or '' while it is empty or still shows the placeholder. */
export function readReplyText(id) {
    const text = (byId(id).textContent || '').trim();
    return text === TEMPLATE_PLACEHOLDER ? '' : text;
}

export function setReplyTexts({ sopan, santai, humor }) {
    byId('sopan-text').textContent = sopan;
    byId('santai-text').textContent = santai;
    byId('humor-text').textContent = humor;
}

export function showResultLoading() {
    byId('result-empty').classList.add('hidden');
    byId('result-content').classList.add('hidden');
    byId('result-loading').classList.remove('hidden');
}

export function hideResultLoading() {
    byId('result-loading').classList.add('hidden');
}

export function showResultEmpty() {
    byId('result-empty').classList.remove('hidden');
    byId('result-content').classList.add('hidden');
}

let gaugeTimer = null;

/** Sweeps the speedometer arc and counts the percentage up to its final value. */
function animateGauge(percent) {
    clearInterval(gaugeTimer);
    byId('gauge-fill-arc').style.strokeDashoffset = GAUGE_DASH_LENGTH - (percent / 100) * GAUGE_DASH_LENGTH;

    const valueText = byId('gauge-value-text');
    if (percent === 0) {
        valueText.textContent = '0%';
        return;
    }

    let count = 0;
    gaugeTimer = setInterval(() => {
        count += 1;
        valueText.textContent = `${count}%`;
        if (count >= percent) clearInterval(gaugeTimer);
    }, Math.max(Math.floor(GAUGE_COUNT_MS / percent), MIN_GAUGE_STEP_MS));
}

function renderStatus(data, percent) {
    const level = riskLevel(percent);
    const { glow, title } = RISK_PRESENTATION[level];

    const view = byId('result-view');
    view.classList.remove(...GLOW_CLASSES);
    view.classList.add(glow);

    byId('res-badge').textContent = `Indikasi AI: ${data.statusBadge || 'Perlu verifikasi'}`;
    byId('res-badge').className = `status-badge ${level}`;
    byId('res-status-title').textContent = title;
    byId('res-status-title').style.color = RISK_COLORS[level];
    byId('res-category').textContent = data.category || 'Berita';
    byId('res-summary').textContent = data.summary || 'Hasil analisis selesai.';
}

function mitigationsFor(category) {
    const name = category.toLowerCase();
    if (name.includes('scam') || name.includes('penipuan') || name.includes('keuangan')) {
        return [...SCAM_LINKS, ...GENERAL_LINKS];
    }
    if (name.includes('kesehatan') || name.includes('medis')) return [...HEALTH_LINKS, ...GENERAL_LINKS];
    return GENERAL_LINKS;
}

function buildMitigationLink({ title, url, sub, tone }) {
    const label = createElement('div', 'mitigation-text');
    label.append(createElement('span', 'mitigation-title', title), createElement('span', 'mitigation-sub', sub));

    const link = createElement('a', `mitigation-btn ${tone}`);
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.append(label);
    link.insertAdjacentHTML('beforeend', EXTERNAL_LINK_ICON);
    return link;
}

function renderMitigations(data, percent) {
    const box = byId('res-mitigation-box');
    if (percent < MITIGATION_FROM_PERCENT) {
        byId('res-mitigation-actions').replaceChildren();
        box.classList.add('hidden');
        return;
    }
    box.classList.remove('hidden');
    byId('res-mitigation-actions').replaceChildren(...mitigationsFor(data.category || '').map(buildMitigationLink));
}

/** The tag in front of a claim; also used in the PDF report. */
export const claimStatusLabel = (isFactual) => `[${isFactual ? 'Indikasi faktual' : 'Perlu verifikasi'}]`;

function buildClaimCard({ claim, isFactual, explanation }) {
    const icon = createElement('div', 'claim-status-icon');
    icon.innerHTML = isFactual ? FACTUAL_ICON : HOAX_ICON;

    const status = createElement('span', 'claim-title', claimStatusLabel(isFactual));
    status.style.color = isFactual ? 'var(--emerald)' : 'var(--red)';
    const text = createElement('span', 'claim-title', claim);
    text.style.color = 'var(--text-primary)';
    const body = createElement('div', 'claim-body');
    body.append(status, ' ', text);

    const header = createElement('div', 'claim-header-row');
    header.append(icon, body);

    const card = createElement('div', 'claim-card');
    card.append(header, createElement('p', 'claim-explanation', explanation));
    return card;
}

function renderClaims(claims) {
    byId('res-claims-list').replaceChildren(
        ...(claims && claims.length > 0
            ? claims.map(buildClaimCard)
            : [createElement('p', 'claim-explanation', 'Tidak ditemukan klaim spesifik.')])
    );
}

/** Fills the result card from an analysis. Every string in it comes from the AI: text only. */
export function renderAnalysisResults(data) {
    const percent = data.hoaxPercentage || 0;

    byId('result-content').classList.remove('hidden');
    animateGauge(percent);
    renderStatus(data, percent);
    renderMitigations(data, percent);
    renderClaims(data.claims);
    setReplyTexts(data.politeReplies);
}
