import { countUp } from '../core/count-up.js';
import { createElement } from '../core/dom.js';
import { EVENTS, on } from '../core/events.js';

const COUNT_UP_MS = 1100;
const BAR_ANIMATION_DELAY_MS = 150;
const BARS_SHOWN = 5;
const BAR_FILL_CLASSES = ['fill-danger', 'fill-warning', '', 'fill-success', 'fill-success'];
// The "families reached" figure is a demonstration number: a seeded base plus growth from the demo feed.
const DEMO_FAMILIES_BASE = 9842;

const byId = (id) => document.getElementById(id);

/**
 * A sentence summarising the demo feed, built by fixed rules (there is no extra AI call).
 * @param {number} reportCount
 * @param {string} topCategory
 * @param {number} topPercent share of the top category, 0-100
 * @param {number} averageDanger 0-100
 */
export function generateInsight(reportCount, topCategory, topPercent, averageDanger) {
    if (reportCount === 0) {
        return 'Belum ada data laporan. Lakukan pemeriksaan pertama Anda di tab Periksa untuk membuka analitik.';
    }
    const danger = averageDanger >= 60 ? 'sangat tinggi' : averageDanger >= 40 ? 'sedang' : 'rendah';
    const trend = topPercent >= 40 ? 'mendominasi' : 'paling sering muncul';

    const category = topCategory.toLowerCase();
    let advisory = 'Selalu verifikasi sumber sebelum membagikan informasi.';
    if (category.includes('scam') || category.includes('penipuan')) {
        advisory = 'Waspadai pesan WhatsApp berisi link APK atau permintaan transfer dana.';
    } else if (category.includes('kesehatan')) {
        advisory = 'Cek setiap klaim kesehatan via portal Kemenkes sebelum disebarkan.';
    } else if (category.includes('keluarga')) {
        advisory = 'Hoaks keluarga sering memicu kepanikan. Cross-check dengan media resmi.';
    }
    return `Kategori ${topCategory} ${trend} dengan ${topPercent}% dari total laporan. Tingkat bahaya rata-rata ${danger} (${averageDanger}%). ${advisory}`;
}

/** Report counts per top-level category (the part before "/"), most frequent first. */
function countCategories(reports) {
    const counts = new Map();
    reports.forEach((report) => {
        const category = (report.category || 'Lainnya').split('/')[0].trim();
        counts.set(category, (counts.get(category) || 0) + 1);
    });
    return [...counts].sort((a, b) => b[1] - a[1]);
}

function renderBars(categories) {
    const maxCount = Math.max(...categories.map(([, count]) => count), 1);
    const fills = [];

    const rows = categories.slice(0, BARS_SHOWN).map(([category, count], index) => {
        const fill = createElement('div', 'chart-bar-fill');
        if (BAR_FILL_CLASSES[index]) fill.classList.add(BAR_FILL_CLASSES[index]);
        fill.style.width = '0%';
        fills.push({ fill, width: `${Math.round((count / maxCount) * 100)}%` });

        const track = createElement('div', 'chart-bar-track');
        track.append(fill);
        const row = createElement('div', 'chart-bar-row');
        row.append(createElement('span', 'chart-bar-label', category), track, createElement('span', 'chart-bar-count', String(count)));
        return row;
    });
    byId('chart-category-bars').replaceChildren(...rows);

    // Next tick, so the bars grow from zero through the CSS transition.
    setTimeout(() => fills.forEach(({ fill, width }) => { fill.style.width = width; }), BAR_ANIMATION_DELAY_MS);
}

function renderAnalytics(reports) {
    const nonSafe = reports.filter((report) => report.badgeClass !== 'safe').length;
    const totalUpvotes = reports.reduce((sum, report) => sum + (report.upvotes || 0), 0);
    const averageDanger = reports.length > 0
        ? Math.round(reports.reduce((sum, report) => sum + (report.percentage || 0), 0) / reports.length)
        : 0;

    const categories = countCategories(reports);
    const [topCategory, topCount] = categories[0] || ['Belum ada', 0];
    const topPercent = reports.length > 0 ? Math.round((topCount / reports.length) * 100) : 0;

    countUp(byId('stat-total-hoax'), nonSafe, COUNT_UP_MS);
    countUp(byId('stat-families'), DEMO_FAMILIES_BASE + Math.floor(totalUpvotes * 1.7) + reports.length * 3, COUNT_UP_MS);
    countUp(byId('stat-avg-danger'), averageDanger, COUNT_UP_MS, { format: (value) => `${value}%` });
    byId('stat-top-category').textContent = topCategory;
    byId('stat-top-category-pct').textContent = `${topPercent}% dari total laporan`;

    renderBars(categories);
    byId('ai-daily-insight').textContent = generateInsight(reports.length, topCategory, topPercent, averageDanger);
}

export function initAnalytics() {
    on(EVENTS.COMMUNITY, renderAnalytics);
}
