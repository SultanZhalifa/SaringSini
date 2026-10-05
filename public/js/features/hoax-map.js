import { EVENTS, on } from '../core/events.js';

const POPULATION_WEIGHT = { Jawa: 5, Sumatera: 3, Sulawesi: 2, Kalimantan: 2, 'Bali-NTB-NTT': 2, Papua: 1, Maluku: 1 };
const INTENSITY_CLASSES = ['intensity-low', 'intensity-mid', 'intensity-high', 'intensity-critical'];
const HIGH_FROM = 3;
const CRITICAL_FROM = 5;

// Each region appears once per unit of weight, so a plain index into the list is a weighted pick.
const WEIGHTED_REGIONS = Object.entries(POPULATION_WEIGHT).flatMap(([region, weight]) => Array(weight).fill(region));

const hashCode = (text) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
};

/**
 * The demo reports carry no location, so each is placed in a region deterministically
 * from its id (weighted by population). The map is an illustration, not real geography.
 */
export const assignRegion = (report) => WEIGHTED_REGIONS[hashCode(report.id || report.text || '') % WEIGHTED_REGIONS.length];

const intensityClass = (count) => {
    if (count >= CRITICAL_FROM) return 'intensity-critical';
    if (count >= HIGH_FROM) return 'intensity-high';
    return count >= 1 ? 'intensity-mid' : 'intensity-low';
};

const regionElements = () => document.querySelectorAll('.map-region');

const regionLabel = (region) => region.replaceAll('-', ' ');

function renderHoaxMap(reports) {
    const counts = new Map();
    reports.forEach((report) => {
        const region = assignRegion(report);
        counts.set(region, (counts.get(region) || 0) + 1);
    });

    regionElements().forEach((element) => {
        const count = counts.get(element.dataset.region) || 0;
        element.dataset.count = String(count);
        element.classList.remove(...INTENSITY_CLASSES);
        element.classList.add(intensityClass(count));
    });
}

function selectRegion(element) {
    regionElements().forEach((other) => other.classList.toggle('active-region', other === element));

    const count = Number.parseInt(element.dataset.count, 10) || 0;
    const panel = document.getElementById('map-detail-panel');
    panel.querySelector('.map-detail-region').textContent = element.dataset.region.replaceAll('-', ' / ');
    panel.querySelector('.map-detail-count').textContent = count === 0
        ? 'Belum ada entri demo yang dialokasikan ke wilayah ini.'
        : `${count} entri demo dialokasikan secara sintetis ke wilayah ini.`;
}

export function initHoaxMap() {
    regionElements().forEach((element) => {
        element.setAttribute('tabindex', '0');
        element.setAttribute('role', 'button');
        element.setAttribute('aria-label', `Wilayah ${regionLabel(element.dataset.region)}`);
        element.addEventListener('click', () => selectRegion(element));
        element.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            selectRegion(element);
        });
    });

    renderHoaxMap([]);
    on(EVENTS.COMMUNITY, renderHoaxMap);
}
