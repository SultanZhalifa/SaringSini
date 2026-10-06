import { riskLevel } from '../core/risk.js';
import { STORAGE_KEYS, storage } from '../core/storage.js';

export const FAMILY = {
    mama: { name: 'Mama', color: '#B8392E' },
    papa: { name: 'Papa', color: '#5C8374' },
    tante: { name: 'Tante Rosa', color: '#7A4A8E' },
    om: { name: 'Om Heri', color: '#D97706' }
};

// Canned replies (the simulator never calls the AI).
const REPLIES = {
    ping: { who: 'papa', text: 'Nak, dibiasakan kalau memulai obrolan dengan orang tua mengucapkan salam ya, jangan cuma huruf P saja, kurang sopan.' },
    rude: { who: 'mama', text: 'Astagfirullah nak, bahasanya yang sopan ya di grup keluarga. Ada Om dan Tante juga di sini.' },
    salam: { who: 'mama', text: 'Waalaikumsalam warahmatullah. Ada kabar atau info penting apa nak hari ini? Semoga kita sekeluarga selalu sehat ya.' },
    greeting: { who: 'tante', text: 'Halo juga keponakanku yang baik. Ada informasi menarik atau kabar apa hari ini?' },
    debunked: [
        { who: 'mama', text: 'Ya ampun nak, Mama baru saja mau membagikan info ini ke grup arisan warga RT dan teman sekolah Mama. Untung kamu cepat memberikan klarifikasi ini. Terima kasih banyak ya sayang, nanti sepulang kerja Mama buatkan makanan kesukaanmu.' },
        { who: 'papa', text: 'Oh begitu ya nak, untung Papa membaca penjelasan bijakmu dulu di grup ini. Memang sekarang banyak sekali disinformasi menyebar secara sembarangan di internet. Papa bantu teruskan penjelasan ini ke teman-teman di kantor.' },
        { who: 'om', text: 'Waduh, ternyata ini tidak benar ya. Om mendapatkan pesan ini dari teman kantor yang katanya langsung dari dinas terkait. Tapi ya sudahlah kalau sistem AI kamu sudah memastikan ini salah. Terima kasih infonya keponakanku.' }
    ],
    verified: [
        { who: 'papa', text: 'Info yang sangat baik nak. Penjelasannya terstruktur dan berdasarkan fakta ilmiah. Langsung Papa sebarkan ke grup angkatan alumni sekolah biar semua tahu. Terima kasih banyak.' },
        { who: 'mama', text: 'Terima kasih banyak ya anakku sayang untuk info penting ini. Jaga kondisi tubuhmu baik-baik di sana, jangan lupa istirahat teratur dan kurangi minum es.' }
    ],
    uncertain: [
        { who: 'tante', text: 'Terima kasih banyak nak atas bantuannya meluruskan informasi ini. Memang kita harus menyaring dulu setiap berita sebelum ikut membagikannya ke orang lain ya.' },
        { who: 'mama', text: 'Ternyata beritanya kurang akurat ya nak. Terima kasih ya sudah membantu membedah kebenarannya. Sangat membantu Mama memahami isi beritanya.' }
    ],
    generic: [
        { who: 'mama', text: 'Iya nak, terima kasih. Jangan lupa nanti pas pulang mampir belikan kebutuhan bumbu dapur dulu ya, Mama mau memasak makan malam.' },
        { who: 'papa', text: 'Info yang bagus sekali nak. Terima kasih banyak.' },
        { who: 'tante', text: 'Semoga kita sekeluarga selalu diberikan kesehatan, kelancaran rezeki, dan perlindungan dari segala mara bahaya.' }
    ]
};

const REPLY_TO_ANALYSIS_MIN_LENGTH = 25;
const DEBUNKED_FROM = 60;

const randomItem = (items) => items[Math.floor(Math.random() * items.length)];

/** Cycles through the generic replies so the same one is not repeated back to back. */
function nextGenericReply() {
    const previous = Number.parseInt(storage.get(STORAGE_KEYS.lastGenericReply), 10) || 0;
    const index = (previous + 1) % REPLIES.generic.length;
    storage.set(STORAGE_KEYS.lastGenericReply, String(index));
    return REPLIES.generic[index];
}

/**
 * Who answers, and what, to a message typed in the simulator. A message long enough to be a
 * forwarded claim is answered according to how the latest check rated it.
 *
 * @param {string} userText
 * @param {object | null} analysis the latest result, if any
 * @returns {{who: keyof FAMILY, text: string}}
 */
export function pickFamilyReply(userText, analysis) {
    const text = userText.toLowerCase().trim();

    if (text === 'p' || text === 'ping') return REPLIES.ping;
    if (['woi', 'woy', 'oi', 'oy'].includes(text)) return REPLIES.rude;
    if (text.includes('assalamualaikum') || text.includes("assalamu'alaikum")) return REPLIES.salam;
    if (['halo', 'hallo', 'hai', 'hi'].includes(text)) return REPLIES.greeting;

    if (analysis && userText.length > REPLY_TO_ANALYSIS_MIN_LENGTH) {
        const percent = analysis.hoaxPercentage || 0;
        if (percent >= DEBUNKED_FROM) return randomItem(REPLIES.debunked);
        if (riskLevel(percent) === 'safe') return randomItem(REPLIES.verified);
        return randomItem(REPLIES.uncertain);
    }
    return nextGenericReply();
}
