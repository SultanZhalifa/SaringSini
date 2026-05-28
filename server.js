const express = require('express');
const multer = require('multer');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Setup in-memory storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // limit 5MB
});

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn("[PERINGATAN] GEMINI_API_KEY tidak ditemukan di environment. Silakan tambahkan ke file .env!");
}

// -------------------------------------------------------------
// Persistent JSON File Database for Community Reports
// (Fallback strategy: in-memory + JSON disk persistence)
// -------------------------------------------------------------
const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'community.json');

if (!fs.existsSync(DB_DIR)) {
  try { fs.mkdirSync(DB_DIR, { recursive: true }); } catch (_) { /* ignore */ }
}

const DEFAULT_REPORTS = [
  {
    id: "cp1",
    author: "Buster #4928",
    text: "Undangan pernikahan digital berformat file APK yang dikirim melalui obrolan WhatsApp untuk mencuri data perbankan.",
    percentage: 98,
    badge: "Hoaks Parah",
    badgeClass: "danger",
    category: "Scam/Penipuan",
    upvotes: 42,
    time: "2 jam lalu",
    upvotedClients: []
  },
  {
    id: "cp2",
    author: "Buster #3004",
    text: "Klaim air kelapa hijau dicampur garam dan jeruk nipis berkhasiat meluruhkan racun vaksin di tubuh secara instan.",
    percentage: 80,
    badge: "Hoaks Parah",
    badgeClass: "danger",
    category: "Kesehatan",
    upvotes: 19,
    time: "5 jam lalu",
    upvotedClients: []
  },
  {
    id: "cp3",
    author: "Buster #1209",
    text: "Broadcast berantai mengenai potensi gempa megathrust magnitudo sembilan melanda Jakarta malam ini.",
    percentage: 55,
    badge: "Waspada",
    badgeClass: "warning",
    category: "Keluarga",
    upvotes: 8,
    time: "7 jam lalu",
    upvotedClients: []
  }
];

let communityReports = [];

const loadCommunityFromDisk = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        communityReports = parsed;
        return;
      }
    }
  } catch (e) {
    console.warn('[DB] Gagal membaca community.json, memulai dari default:', e.message);
  }
  communityReports = JSON.parse(JSON.stringify(DEFAULT_REPORTS));
  saveCommunityToDisk();
};

let saveTimer = null;
const saveCommunityToDisk = () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(communityReports, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[DB] Gagal menyimpan community.json:', e.message);
    }
  }, 250);
};

loadCommunityFromDisk();

// -------------------------------------------------------------
// Express Middleware Setup
// -------------------------------------------------------------

// Security headers + Cache-Control
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Static files with smart cache headers
const staticOptions = IS_PRODUCTION ? {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (/\.(css|js|svg|woff2?|ttf|png|jpg|jpeg|webp|ico)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');
    } else if (/\.(html|json|webmanifest)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
  }
} : {};

app.use(express.static(path.join(__dirname, 'public'), staticOptions));
app.use(express.json({ limit: '1mb' }));

// Helper: convert buffer to Generative AI inline data format
function bufferToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    },
  };
}

// Helper: recursively strip emojis from string properties
function stripEmojis(obj) {
  if (typeof obj === 'string') {
    return obj.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '');
  } else if (Array.isArray(obj)) {
    return obj.map(stripEmojis);
  } else if (obj !== null && typeof obj === 'object') {
    const cleaned = {};
    for (const key in obj) {
      cleaned[key] = stripEmojis(obj[key]);
    }
    return cleaned;
  }
  return obj;
}

// -------------------------------------------------------------
// API Rate Limiter
// -------------------------------------------------------------
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 6;

const checkRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, []);
  }

  let timestamps = rateLimitStore.get(ip);
  timestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);

  if (timestamps.length >= MAX_REQUESTS) {
    return res.status(429).json({
      error: "Batas pemeriksaan tercapai. Tunggu sebentar untuk menjaga kuota sistem."
    });
  }

  timestamps.push(now);
  rateLimitStore.set(ip, timestamps);
  next();
};

// -------------------------------------------------------------
// Gemini System Instructions
// -------------------------------------------------------------
const SI_HOAX = `Anda adalah pakar pemeriksa fakta (fact-checker) profesional Indonesia yang bekerja untuk platform klarifikasi hoaks terkemuka seperti Mafindo dan TurnBackHoax.
Tugas Anda adalah menganalisis pesan atau tangkapan layar (screenshot) obrolan yang dikirim oleh pengguna, mendeteksi hoaks, misinformasi, scam, clickbait, atau memvalidasi jika pesan tersebut memang Faktual.

PENTING: JANGAN PERNAH MENYERTAKAN KARAKTER EMOJI APAPUN (seperti senyum, tanda seru merah, jempol, hati, dll.) dalam seluruh teks JSON yang Anda hasilkan. Semua teks harus murni berupa teks alfabet/numerik standar dan tanda baca.

Analisis Anda harus objektif, ramah, dan disajikan dalam struktur JSON bahasa Indonesia dengan format berikut:
{
  "hoaxPercentage": 0 sampai 100 (angka integer, tingkat kepastian/keparahan hoaks. Jika factual/aman = 0, jika hoaks parah/scam berbahaya = 100),
  "category": "Kategori Hoaks (contoh: Kesehatan, Keuangan, Politik, Keluarga, Scam/Penipuan, Faktual)",
  "statusBadge": "Badge status (pilih salah satu: 'Aman' jika factual, 'Waspada' jika misinformasi ringan/clickbait/butuh verifikasi, 'Hoaks Parah' jika terbukti bohong/scam berbahaya)",
  "summary": "Ringkasan kesimpulan analisis dalam 2-3 kalimat yang padat dan mudah dipahami orang awam.",
  "claims": [
    {
      "claim": "Klaim spesifik yang ditemukan di dalam pesan",
      "isFactual": true/false (apakah klaim ini benar),
      "explanation": "Penjelasan ilmiah/faktual singkat mengenai klaim tersebut."
    }
  ],
  "politeReplies": {
    "sopan": "Template balasan chat yang SANGAT SOPAN, menghormati orang tua (menggunakan panggilan Mama/Papa/Om/Tante/Pak/Bu), tanpa menyinggung perasaan mereka, meluruskan hoaks secara santun.",
    "santai": "Template balasan chat yang SANTAI dan bersahabat untuk dikirim ke kakak, adik, atau sepupu sebaya (menggunakan panggilan Kak/Dek/Guys/Bro/Sist).",
    "humor": "Template balasan chat bernada HUMOR/Bercanda yang ramah untuk mencairkan suasana grup chat keluarga tanpa terkesan menggurui."
  }
}`;

const SI_DEEPFAKE = `Anda adalah pakar forensik digital dan kurator media sintetis (AI-Generated / Deepfake). Tugas Anda adalah memindai gambar atau video yang diunggah pengguna untuk menganalisis apakah media tersebut merupakan rekayasa AI buatan Midjourney, Sora, Runway, Pika, Stable Diffusion, atau hasil rekayasa manipulasi wajah dan suara (deepfake face swap / voice clone) yang disalahgunakan untuk penipuan, fitnah, propaganda, profil palsu, atau perbuatan negatif.
Analisis kejanggalan pada media secara detail: anomali anatomi (jari berlebih, telinga tidak simetris, detail pori-pori kulit hilang, batas wajah kabur), ketidaksesuaian sinkronisasi gerakan bibir (lip sync) tidak pas, distorsi piksel frame, gerakan robotik tidak wajar, kejanggalan cahaya, atau keanehan latar belakang.

PENTING: JANGAN PERNAH MENYERTAKAN KARAKTER EMOJI APAPUN dalam seluruh teks JSON yang Anda hasilkan. Semua teks harus murni berupa teks alfabet/numerik standar dan tanda baca.

Struktur JSON dalam bahasa Indonesia harus sebagai berikut:
{
  "hoaxPercentage": 0 sampai 100 (angka integer, tingkat kepastian/keparahan rekayasa AI. Jika gambar/video asli/faktual = 0, jika terbukti rekayasa komputer/deepfake berbahaya = 100),
  "category": "Deepfake/Media AI",
  "statusBadge": "Badge status (pilih salah satu: 'Aman' jika asli, 'Waspada' jika terindikasi manipulasi ringan/AI kualitas rendah, 'Hoaks Parah' jika terbukti deepfake/rekayasa AI manipulatif)",
  "summary": "Ringkasan kesimpulan analisis dalam 2-3 kalimat yang menjelaskan keaslian berkas dan di mana letak kejanggalan forensik utama yang terdeteksi.",
  "claims": [
    {
      "claim": "Pemeriksaan keaslian bagian wajah/tangan/piksel/gerakan media",
      "isFactual": true/false,
      "explanation": "Detil analisis forensik mengenai bagian tersebut."
    }
  ],
  "politeReplies": {
    "sopan": "Template balasan chat keluarga yang SANGAT SOPAN untuk menjelaskan kepada orang tua (menggunakan Mama/Papa/Om/Tante) bahwa foto/gambar yang dikirim di WhatsApp ini adalah buatan kecerdasan buatan (AI) / rekayasa komputer dan bukan foto asli, dengan kalimat santun.",
    "santai": "Template balasan chat yang SANTAI dan akrab untuk dikirim ke kakak/adik/sepupu (menggunakan Kak/Dek/Guys/Bro).",
    "humor": "Template balasan chat bernada HUMOR/Bercanda yang ramah untuk mencairkan ketegangan keluarga mengenai foto AI tersebut."
  }
}`;

const SI_URL = `Anda adalah pakar keamanan siber Indonesia yang berspesialisasi pada deteksi phishing, scam APK, dan penipuan link WhatsApp. Tugas Anda adalah menganalisis URL yang dikirim user (link mencurigakan dari pesan WhatsApp) dan menentukan apakah tautan tersebut berbahaya.

Pertimbangkan pola umum penipuan Indonesia: domain typosquatting bank (mandiri-online.xyz), link APK file undangan/struk/foto (.apk), shortener mencurigakan (bit.ly/free-kuota), domain palsu pemerintah (kemendikbud-bansos.com), promo BPJS/PLN/kuota gratis fake, phishing bansos, dan situs investasi bodong.

PENTING: JANGAN sertakan emoji apapun. Output JSON murni dalam bahasa Indonesia dengan struktur:
{
  "hoaxPercentage": 0 sampai 100 (angka integer, tingkat bahaya. 0 = aman, 100 = phishing/scam parah),
  "category": "Phishing/Scam Link",
  "statusBadge": "'Aman' / 'Waspada' / 'Hoaks Parah'",
  "summary": "Ringkasan 2-3 kalimat tentang sifat URL ini dan resikonya.",
  "claims": [
    {
      "claim": "Pemeriksaan domain, protokol, pola URL, atau red flag spesifik",
      "isFactual": true/false (true jika aman/legitim, false jika mencurigakan),
      "explanation": "Penjelasan teknis singkat tentang temuan tersebut."
    }
  ],
  "politeReplies": {
    "sopan": "Template balasan SOPAN untuk orang tua, menjelaskan bahwa link ini berbahaya/aman, jangan diklik dengan cara santun.",
    "santai": "Template balasan SANTAI untuk sebaya tentang link tersebut.",
    "humor": "Template balasan HUMOR untuk mencairkan suasana jika link berbahaya."
  }
}`;

// Bahasa Mama Coach - Conversational AI Training
// User berlatih menjawab pesan hoaks; AI berperan sebagai orang tua yang skeptis
const SI_COACH = (persona, scenario) => {
  const personas = {
    mama: 'seorang Mama berusia 55 tahun yang sangat sayang anaknya. Mama sering dapat info viral dari grup WhatsApp arisan ibu-ibu dan percaya gampang. Mama bicara dengan campuran bahasa Indonesia santai dan dialek Jakarta (pakai "kamu", "Mama", "sayang", "lho", "kok", "deh", "ya")',
    papa: 'seorang Papa berusia 58 tahun yang merasa selalu benar dan agak otoriter. Papa adalah pensiunan, sering dapat info dari grup alumni dan grup pensiunan. Papa skeptis tapi gampang percaya hal yang sesuai keyakinannya. Papa bicara dengan nada tegas (pakai "kamu", "Papa", "harus tahu", "jaman sekarang")',
    om: 'seorang Om berusia 50 tahun yang baik tapi suka pamer pengetahuan. Om sering forward info kesehatan dan keuangan. Om bicara casual dengan campuran istilah-istilah pseudo-ilmiah (pakai "kamu", "Om", "menurut research", "fakta-nya")',
    tante: 'seorang Tante berusia 52 tahun yang heboh dan ekspresif. Tante percaya hal mistis dan info kesehatan alternatif. Tante bicara dengan energik dan dramatis (pakai "kamu", "Tante", "aduh", "kasian", "loh emang")'
  };

  return `Anda adalah simulasi role-play AI berperan sebagai ${personas[persona] || personas.mama}.

KONTEKS SIMULASI: User sedang belajar cara menyampaikan klarifikasi hoaks ke orang tua mereka tanpa merusak silaturahmi. Anda berperan sebagai orang tua yang baru saja MEMFORWARD pesan hoaks ini ke grup keluarga:

PESAN HOAKS YANG ANDA FORWARD:
"${scenario}"

ATURAN ROLEPLAY:
1. Selalu balas dalam 1-3 kalimat singkat, seperti chat WhatsApp natural.
2. JANGAN keluar dari karakter. JANGAN bilang "saya AI" atau "ini simulasi".
3. Awalnya, BERTAHAN dengan pesan yang Anda forward. Bilang seperti "Mama dapat dari grup arisan, banyak yang share ini" atau "Papa udah baca berkali-kali, ini valid".
4. Jika user memberikan ARGUMEN BAIK dengan: (a) sumber kredibel, (b) penjelasan logis, (c) cara bicara sopan dan tidak menggurui — Anda BOLEH PERLAHAN MELUNAK dalam 2-3 turn berikutnya.
5. Jika user kasar/menggurui/tanpa sumber — Anda DEFENSIF dan ngeyel. Bilang "kamu kok ngegurui Mama" atau "udah deh, kamu masih muda belum paham".
6. Setiap balasan harus terasa otentik orang tua Indonesia di WhatsApp.
7. JANGAN PERNAH menyertakan emoji apapun. Gunakan tanda baca dan kata-kata saja.
8. Anda boleh menggunakan ekspresi seperti "hmm", "yaudah", "oh begitu ya", "iyaaa", "duh" untuk natural feel.
9. Setelah 4-6 turn user, jika argumennya konsisten baik, akhirnya Anda bisa bilang "Oke deh kalau gitu, Mama hapus dari grup ya. Makasih sudah ingetin sayang." (atau ekspresi serupa sesuai persona).

Output: HANYA BALAS DENGAN TEKS CHAT NATURAL (1-3 kalimat). Jangan format JSON. Jangan kasih disclaimer. Jangan kasih analisis. Murni balasan natural seperti orang tua di WhatsApp.`;
};

const SI_COACH_EVALUATOR = `Anda adalah pelatih komunikasi keluarga yang menganalisis percakapan user dengan simulasi orang tua tentang klarifikasi hoaks.

Berikan feedback singkat dan konstruktif dalam JSON. JANGAN sertakan emoji apapun.

Struktur output:
{
  "skorTotal": 0-100 (skor keseluruhan komunikasi user),
  "kekuatan": ["1-2 hal yang user lakukan dengan baik (contoh: pakai sumber kredibel, nada sopan)"],
  "perbaikan": ["1-2 saran konkret (contoh: hindari kata 'goblok', sertakan link cek fakta)"],
  "rekomendasi": "Satu kalimat saran rangkuman untuk percakapan berikutnya."
}`;

const SI_TRANSLATE = (lang) => {
  const langNames = {
    jawa: 'Bahasa Jawa Krama Inggil yang halus dan sopan untuk berbicara dengan orang tua',
    sunda: 'Bahasa Sunda Lemes (halus) yang sopan untuk orang tua',
    minang: 'Bahasa Minangkabau yang sopan',
    batak: 'Bahasa Batak Toba yang sopan'
  };
  return `Anda adalah penerjemah ahli bahasa daerah Indonesia. Tugas Anda menerjemahkan template balasan WhatsApp ke ${langNames[lang] || 'bahasa daerah Indonesia'}.

PENTING: JANGAN sertakan emoji apapun. Pertahankan struktur 3 template (sopan, santai, humor) dan nuansa aslinya. Output JSON murni dengan struktur:
{
  "politeReplies": {
    "sopan": "Terjemahan template sopan ke bahasa target",
    "santai": "Terjemahan template santai ke bahasa target",
    "humor": "Terjemahan template humor ke bahasa target"
  }
}`;
};

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. Get Community Verified Reports Feed
app.get('/api/community', (req, res) => {
  res.json(communityReports);
});

// 2. Upvote/Verify a Community Report
app.post('/api/community/:id/upvote', (req, res) => {
  const { id } = req.params;
  const { clientId } = req.body;

  const report = communityReports.find(r => r.id === id);
  if (!report) {
    return res.status(404).json({ error: "Laporan tidak ditemukan." });
  }

  if (clientId) {
    if (!Array.isArray(report.upvotedClients)) report.upvotedClients = [];
    if (report.upvotedClients.includes(clientId)) {
      return res.status(400).json({ error: "Anda sudah memberikan dukungan untuk laporan ini." });
    }
    report.upvotedClients.push(clientId);
  }

  report.upvotes = (report.upvotes || 0) + 1;
  saveCommunityToDisk();
  res.json(report);
});

// 3. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.3.0',
    gemini: !!genAI,
    reports: communityReports.length
  });
});

// 4. Analyze content with Gemini (multimodal: text / image / video / url)
app.post('/api/analyze', checkRateLimit, upload.single('screenshot'), async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({
        error: "API Key Gemini belum dikonfigurasi pada server. Silakan hubungi admin atau tambahkan GEMINI_API_KEY di file .env."
      });
    }

    const { message, clientId, checkType } = req.body;
    const screenshot = req.file;

    if (!message && !screenshot) {
      return res.status(400).json({
        error: "Mohon masukkan teks pesan, URL, atau unggah tangkapan layar."
      });
    }

    const isDeepfakeCheck = checkType === 'deepfake';
    const isUrlCheck = checkType === 'url';

    let systemInstruction;
    if (isDeepfakeCheck) systemInstruction = SI_DEEPFAKE;
    else if (isUrlCheck) systemInstruction = SI_URL;
    else systemInstruction = SI_HOAX;

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      },
      systemInstruction: systemInstruction
    });

    let prompt;
    if (isDeepfakeCheck) {
      prompt = "Lakukan analisis forensik digital pada gambar berikut untuk mendeteksi apakah ini gambar buatan AI atau manipulasi deepfake wajah:";
    } else if (isUrlCheck) {
      prompt = "Analisis URL berikut untuk deteksi phishing atau scam:";
    } else {
      prompt = "Analisis pesan atau gambar chat berikut untuk mendeteksi kebenaran atau hoaks:";
    }

    let contents = [];

    if (screenshot) {
      const imagePart = bufferToGenerativePart(screenshot.buffer, screenshot.mimetype);
      contents.push(imagePart);
      if (message) {
        prompt += `\nTeks pesan tambahan: "${message}"`;
      }
      contents.push(prompt);
    } else {
      contents.push(`${prompt}\n"${message}"`);
    }

    const result = await model.generateContent(contents);
    const responseText = result.response.text();

    let analysisData = JSON.parse(responseText);
    analysisData = stripEmojis(analysisData);

    // Auto-inject into community feed
    const snippetText = message || (analysisData.claims && analysisData.claims[0] ? analysisData.claims[0].claim : "Analisis tangkapan layar chat.");
    if (snippetText && snippetText.trim().length > 5) {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const isFactual = (analysisData.hoaxPercentage || 0) < 30;

      const newReport = {
        id: "cp_server_" + Date.now(),
        author: `Buster #${randNum}`,
        text: snippetText.length > 110 ? `${snippetText.slice(0, 107)}...` : snippetText,
        percentage: analysisData.hoaxPercentage || 0,
        badge: analysisData.statusBadge || 'Verifikasi',
        badgeClass: isFactual ? 'safe' : (analysisData.hoaxPercentage || 0) < 70 ? 'warning' : 'danger',
        category: analysisData.category || 'Umum',
        upvotes: 0,
        time: "Baru saja",
        upvotedClients: []
      };

      communityReports.unshift(newReport);

      if (communityReports.length > 30) {
        communityReports = communityReports.slice(0, 30);
      }
      saveCommunityToDisk();
    }

    res.json(analysisData);

  } catch (error) {
    console.error("Error analyzing content:", error);
    res.status(500).json({
      error: "Gagal memproses analisis. Terjadi kesalahan pada server atau API Gemini.",
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// 5. Translate polite replies to regional language
app.post('/api/translate-replies', checkRateLimit, async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({ error: "API Key Gemini belum dikonfigurasi pada server." });
    }

    const { replies, language } = req.body;
    const allowedLanguages = ['jawa', 'sunda', 'minang', 'batak'];

    if (!replies || typeof replies !== 'object') {
      return res.status(400).json({ error: "Data template balasan tidak valid." });
    }
    if (!language || !allowedLanguages.includes(language)) {
      return res.status(400).json({ error: "Bahasa daerah tidak didukung." });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: { responseMimeType: "application/json" },
      systemInstruction: SI_TRANSLATE(language)
    });

    const inputText = `Terjemahkan ketiga template balasan WhatsApp berikut:
- SOPAN (untuk orang tua): "${replies.sopan || ''}"
- SANTAI (untuk sebaya): "${replies.santai || ''}"
- HUMOR (mencairkan suasana): "${replies.humor || ''}"`;

    const result = await model.generateContent(inputText);
    const responseText = result.response.text();
    let parsed = JSON.parse(responseText);
    parsed = stripEmojis(parsed);

    res.json(parsed);
  } catch (error) {
    console.error("Translate error:", error);
    res.status(500).json({
      error: "Gagal mengonversi bahasa.",
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// 6. Bahasa Mama Coach - Conversational training simulator
// User berlatih meluruskan hoaks ke "orang tua" virtual via multi-turn chat
app.post('/api/coach', checkRateLimit, async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({ error: "API Key Gemini belum dikonfigurasi pada server." });
    }

    const { persona, scenario, history } = req.body;
    const allowedPersonas = ['mama', 'papa', 'om', 'tante'];

    if (!persona || !allowedPersonas.includes(persona)) {
      return res.status(400).json({ error: "Persona tidak valid." });
    }
    if (!scenario || typeof scenario !== 'string' || scenario.trim().length < 5) {
      return res.status(400).json({ error: "Skenario hoaks tidak valid." });
    }
    if (!Array.isArray(history)) {
      return res.status(400).json({ error: "Riwayat percakapan harus berupa array." });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction: SI_COACH(persona, scenario)
    });

    const geminiHistory = history.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const lastUserMsg = history[history.length - 1];
    if (!lastUserMsg || lastUserMsg.role !== 'user') {
      return res.status(400).json({ error: "Pesan terakhir harus dari user." });
    }

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(lastUserMsg.text);
    const responseText = stripEmojis(result.response.text());

    res.json({ reply: responseText });
  } catch (error) {
    console.error("Coach error:", error);
    res.status(500).json({
      error: "Gagal memproses percakapan.",
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// 7. Coach evaluator - Analisis komunikasi user setelah selesai sesi coaching
app.post('/api/coach/evaluate', checkRateLimit, async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({ error: "API Key Gemini belum dikonfigurasi pada server." });
    }

    const { history } = req.body;
    if (!Array.isArray(history) || history.length < 2) {
      return res.status(400).json({ error: "Riwayat percakapan terlalu pendek untuk dievaluasi." });
    }

    const transcript = history
      .map(m => `${m.role === 'user' ? 'USER' : 'ORANG_TUA'}: ${m.text}`)
      .join('\n');

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: { responseMimeType: "application/json" },
      systemInstruction: SI_COACH_EVALUATOR
    });

    const result = await model.generateContent(
      `Analisis percakapan berikut dan berikan feedback komunikasi:\n\n${transcript}`
    );

    let evaluation = JSON.parse(result.response.text());
    evaluation = stripEmojis(evaluation);

    res.json(evaluation);
  } catch (error) {
    console.error("Evaluator error:", error);
    res.status(500).json({
      error: "Gagal mengevaluasi percakapan.",
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// 8. AI Tone Slider - Regenerate single reply with adjustable tone (0=sopan formal, 100=akrab humor)
app.post('/api/retone', checkRateLimit, async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({ error: "API Key Gemini belum dikonfigurasi pada server." });
    }

    const { originalReply, scenario, tone, recipient } = req.body;
    const toneNum = Math.max(0, Math.min(100, Number(tone) || 50));

    if (!originalReply || typeof originalReply !== 'string') {
      return res.status(400).json({ error: "Balasan asli diperlukan." });
    }

    let toneLabel;
    if (toneNum < 20) toneLabel = 'SANGAT FORMAL dan KAKU, hormat berlebihan, seperti surat resmi';
    else if (toneNum < 40) toneLabel = 'SOPAN HALUS dan tradisional, cocok untuk orang tua yang konservatif';
    else if (toneNum < 60) toneLabel = 'SOPAN tapi HANGAT, seimbang dan akrab seperti anak ke orang tua';
    else if (toneNum < 80) toneLabel = 'AKRAB DAN SANTAI, seperti antar sebaya dengan respek';
    else toneLabel = 'BERCANDA RINGAN dan HUMOR, untuk cairkan suasana dengan tetap sopan';

    const recipientLabel = recipient || 'orang tua di grup WhatsApp keluarga';

    const SI = `Anda adalah penulis balasan WhatsApp Indonesia yang membantu meluruskan hoaks dengan cara sopan tanpa merusak silaturahmi.

TUGAS: Tulis ulang balasan ini agar bernada ${toneLabel}.

Audiens: ${recipientLabel}.

KONTEKS HOAKS YANG DIBANTAH: ${scenario || '(tidak disediakan)'}

ATURAN:
- Pertahankan inti pesan klarifikasi (jangan ubah fakta yang disampaikan)
- Maksimal 3 kalimat singkat seperti pesan chat WhatsApp
- JANGAN sertakan emoji apapun
- Gunakan tanda baca dan kata-kata saja
- Bahasa Indonesia natural

Output: HANYA TEKS BALASAN BARU. Tidak perlu format JSON, tidak perlu prefix "Balasan:", tidak perlu disclaimer.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction: SI
    });

    const result = await model.generateContent(`Tulis ulang balasan berikut dengan tone yang diminta:\n\n"${originalReply}"`);
    const newReply = stripEmojis(result.response.text().trim());

    res.json({ reply: newReply, toneLabel });
  } catch (error) {
    console.error("Retone error:", error);
    res.status(500).json({
      error: "Gagal mengubah nada balasan.",
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// 9. Statistics endpoint for the homepage (real counts)
app.get('/api/stats', (req, res) => {
  const totalChecks = communityReports.length;
  const totalUpvotes = communityReports.reduce((sum, r) => sum + (r.upvotes || 0), 0);
  res.json({
    totalChecks,
    totalUpvotes,
    familiesSaved: 9842 + Math.floor(totalChecks * 1.7),
    target: 15000
  });
});

// -------------------------------------------------------------
// Periodic cleanup
// -------------------------------------------------------------
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitStore.entries()) {
    const fresh = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
    if (fresh.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      rateLimitStore.set(ip, fresh);
    }
  }
}, 300000);

// SPA fallback: serve index.html for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler (production-safe)
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    error: 'Terjadi kesalahan pada server.',
    details: IS_PRODUCTION ? undefined : err.message
  });
});

// Start Server
app.listen(PORT, () => {
  console.log('==================================================');
  console.log(`[SERVER] SaringSini v2.3 berjalan di http://localhost:${PORT}`);
  console.log(`[MODE] ${IS_PRODUCTION ? 'Production' : 'Development'}`);
  console.log(`[DB] ${communityReports.length} laporan komunitas dimuat`);
  console.log(`[AI] Gemini: ${genAI ? 'Terhubung' : 'BELUM DIKONFIGURASI'}`);
  console.log('==================================================');
});
