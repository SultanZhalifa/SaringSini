# SaringSini v2.3 — Asisten Filter Hoaks dan Coaching Komunikasi Anti-Hoaks Keluarga

[![Competition](https://img.shields.io/badge/Competition-JuaraVibeCoding_2026-brightgreen?style=for-the-badge&logo=google-gemini&logoColor=white)](#)
[![Tech Stack](https://img.shields.io/badge/Stack-Node.js_|_Express_|_Gemini_3.5_Flash-blue?style=for-the-badge&logo=node.js&logoColor=white)](#)
[![Platform](https://img.shields.io/badge/Platform-Android_|_iOS_|_Desktop_|_PWA-orange?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](#)

Selamat datang di repositori resmi **SaringSini v2.3** — platform Single Page Application (SPA) mobile-first bertenaga **Gemini 3.5 Flash** yang dikembangkan untuk ajang **#JuaraVibeCoding 2026**.

Aplikasi ini memecahkan masalah sosial nyata masyarakat Indonesia: **penyebaran hoaks di grup WhatsApp keluarga tanpa merusak silaturahmi**. Versi 2.3 menghadirkan **tiga fitur WOW Factor**: **Bahasa Mama Mode** (coaching komunikasi via AI role-play orang tua), **AI Tone Adjuster Slider** (regenerate balasan realtime), dan **Hoax DNA Visualization** (sidik jari generatif unik per analisis) — di atas fondasi palet **Warm Earth** yang nyaman di mata, PWA installable, dan multimodal AI engine (teks/screenshot/deepfake/URL).

---

## Highlights v2.3 (Triple-Threat Vibe Features)

### Tiga Fitur WOW Factor (Uniqueness Play)

**1. Bahasa Mama Mode** — Coaching Komunikasi Anti-Hoaks
- 4 persona AI orang tua (Mama, Papa, Om Heri, Tante Rosa) dengan karakter unik
- Multi-turn chat realistis: AI defensif di awal, melunak jika argumen user sopan + bersumber + logis
- Mood indicator live: Skeptis → Mulai Mendengar → Mempertimbangkan → Mendukung
- AI Evaluator: skor komunikasi 0-100 + kekuatan + saran perbaikan + rekomendasi
- Endpoint: `POST /api/coach`, `POST /api/coach/evaluate`

**2. AI Tone Adjuster Slider** — Regenerate Balasan Realtime
- Slider 0-100: Formal Surat Resmi ↔ Bercanda Ringan
- 5 tingkat tone, realtime regenerate via Gemini
- Debounced 600ms + AbortController untuk efisiensi
- Endpoint: `POST /api/retone`

**3. Hoax DNA Visualization** — Generative Art Fingerprint
- Sidik jari SVG unik per analisis (Mulberry32 PRNG + djb2 hash)
- Mirror symmetric pattern + helix curves overlay
- Color mapping per skor (sage/amber/terracotta)
- Download as 3x scaled PNG + WhatsApp share

### Highlights Lainnya

- **Palet Warm Earth** — cream `#FDF8F0`, terracotta `#C84B31`, sage green `#5C8374`, warm brown text. Hangat, premium, eye-friendly.
- **Simulator Chat WhatsApp-Style** — natural chat window (bukan phone mockup awkward), warm gradient header, day divider, typing indicator inline, quick suggestion chips, family roster (Mama, Papa, Om, Tante).
- **Hoax Trend Analytics Dashboard** — stat cards live, bar chart distribusi kategori, AI daily insight auto-generated.
- **Live Hoax Map Indonesia** — interactive SVG dengan 7 wilayah, heatmap intensity, critical pulse animation.
- **Quiz Edukasi Literasi Digital** — 10 pertanyaan real hoax Indonesia, progress bar, share score via WhatsApp.
- **Family Onboarding Tour** — 4-step interactive guide untuk first-time users.
- **Voice Input (Web Speech API)** — orang tua bisa dikte pesan ke field "Periksa AI" dalam Bahasa Indonesia (`id-ID`).
- **WhatsApp Deep Link Share** — tombol hijau WA di setiap kartu balasan; buka chat WA dengan template sopan sudah terisi.
- **URL Phishing Checker** — tab baru untuk menganalisis link mencurigakan (APK fake, scam BPJS, typosquat bank, dll).
- **Bahasa Daerah Templates** — konversi balasan ke Bahasa Jawa Krama, Sunda Halus, Minang, dan Batak.
- **PDF Report Export** — laporan PDF branded (terracotta header, gauge score, claims, tiga template balasan, footer) via jsPDF lazy-loaded.
- **PWA Installable** — manifest, service worker (stale-while-revalidate + network-first untuk API), banner install in-app, offline fallback.
- **Accessibility WCAG 2.1 AA** — skip link, ARIA roles/labels, keyboard navigation, focus rings, `prefers-reduced-motion`, contrast ratio AA.
- **Persistent JSON Database** — community board sekarang tahan restart server (`data/community.json`).

---

## Fitur Utama (5-Tab Mobile Dashboard Shell)

### 1. Beranda — Home Dashboard dan Pelacak Solidaritas
- Statistik streak harian dan poin pengguna dengan animasi count-up.
- Banner waspada phising WhatsApp dinamis.
- 4 Quick Action cards (warna terracotta, olive, peach, sage).
- Progress bar solidaritas warga nasional (9.842 dari 15.000 keluarga).
- Banner edukasi hukum (UU ITE Pasal 28 ayat 1).

### 2. Periksa AI — Gemini 3.5 Flash Multimodal Engine + Voice/URL
**Empat tab input baru:**
- **Teks** — paste pesan + tombol mic untuk voice input (Web Speech API).
- **Screenshot** — drag-drop atau pilih file screenshot chat WhatsApp.
- **Deepfake AI** — deteksi gambar/video buatan AI atau deepfake wajah.
- **Cek Link** — analisis URL phishing, scam APK, typosquat bank.

**Hasil analisis:**
- Speedometer gauge animated (terracotta → amber → brick red).
- Status badge dinamis dengan glowing pulse (Aman/Waspada/Hoaks Parah).
- Pusat Mitigasi Risiko (CekRekening.id, PatroliSiber.id, AduanKonten.id, TurnBackHoax.id).
- Daftar klaim faktual vs hoaks.
- 3 template balasan sopan (Sopan/Santai/Humor) + konversi 4 bahasa daerah.
- Tombol Salin + tombol WhatsApp share langsung.
- Ekspor PNG infografis + ekspor PDF laporan resmi.

### 3. Simulator Chat WhatsApp (Sandbox)
- iPhone 14 Pro mockup pixel-perfect dengan dynamic island, status bar, home indicator.
- Auto-redirect dari tab "Periksa" saat klik tombol Salin.
- Anggota keluarga simulasi (Mama, Papa, Om Heri, Tante Rosa) memberikan respon kontekstual berdasarkan hasil analisis.

### 4. Papan Komunitas (Persistent JSON Feed)
- Database `data/community.json` (tahan restart server).
- Filter pencarian teks + kategori (Kesehatan, Scam, Keluarga).
- Tombol "Bantu Sebar Fakta" (Upvote) dengan proteksi UUID klien.
- Auto-injection setiap pemeriksaan baru ke feed.

### 5. Edukasi dan Peringkat
- Papan Peringkat Pahlawan Fakta nasional.
- Hub literasi digital (accordion) berisi tips identifikasi hoaks.
- Trending Hoaxes card.

---

## Color Palette (Warm Earth)

```css
--bg-light:      #FDF8F0  /* cream */
--bg-secondary:  #F5EDDF  /* warmer cream */
--card-bg:       #FFFBF3  /* ivory */
--primary:       #C84B31  /* terracotta */
--primary-dark:  #A23C24
--secondary:     #5C8374  /* sage green */
--accent:        #E8A87C  /* peach */
--text-primary:  #3D2817  /* warm brown */
--text-muted:    #7A6A5A
--border:        #E8DCC4  /* soft sand */
--success:       #6B8E4E  /* olive */
--warning:       #D97706  /* amber */
--danger:        #B8392E  /* brick red */
```

---

## Tech Stack dan Pengamanan API

| Layer | Teknologi | Fungsi |
|---|---|---|
| Backend | Node.js 18+ Express.js 4.19+ | Penyajian file statis, gateway API, SPA fallback routing |
| AI Engine | Google Gemini 3.5 Flash | Analisis hoaks multimodal (teks, gambar, video, URL) |
| Translate | Google Gemini 3.5 Flash | Konversi template balasan ke bahasa daerah |
| Voice | Web Speech API (browser-native) | Voice-to-text Bahasa Indonesia (`id-ID`) |
| PDF | jsPDF 2.5.1 (CDN, lazy-loaded) | Generator laporan PDF branded |
| Security | Rate Limiter 6 req/min, CSP headers, XSS protection | Proteksi quota dan keamanan |
| Persistence | JSON file (`data/community.json`) | Database tahan restart untuk feed komunitas |
| Frontend | HTML5, CSS3 (warm palette), Vanilla JS ES6+ | SPA premium responsive |
| PWA | Service Worker + Web App Manifest | Installable, offline-capable, app shortcuts |
| Deployment | Docker + Google Cloud Run | Container portable, auto-scaling |

### Security Headers (production-grade)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(self), geolocation=()`
- `X-XSS-Protection: 1; mode=block`
- `Cache-Control: public, max-age=86400` untuk assets statis
- Rate limit 6 request/menit per IP untuk endpoint AI

---

## API Endpoints

| Endpoint | Method | Deskripsi |
|---|---|---|
| `/api/health` | GET | Health check (status, version, gemini connection, report count) |
| `/api/community` | GET | List laporan komunitas (persistent JSON) |
| `/api/community/:id/upvote` | POST | Upvote dengan proteksi UUID klien |
| `/api/analyze` | POST | Analisis multimodal (text/image/url) + rate limit |
| `/api/translate-replies` | POST | Konversi balasan ke bahasa daerah |
| `/api/coach` | POST | **[v2.3]** Bahasa Mama Mode - multi-turn role-play AI orang tua |
| `/api/coach/evaluate` | POST | **[v2.3]** Evaluasi komunikasi user setelah sesi coaching |
| `/api/retone` | POST | **[v2.3]** AI Tone Slider - regenerate balasan dengan tingkat formalitas baru |
| `/api/stats` | GET | Statistik publik (totalChecks, familiesSaved, dll) |

---

## Cara Menjalankan Secara Lokal

### Prasyarat
- Node.js 18+
- Google AI Studio API Key — dapatkan gratis di [aistudio.google.com](https://aistudio.google.com/)

### Langkah-langkah
1. Klon atau buka folder proyek ini.
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Salin konfigurasi environment:
   ```bash
   copy .env.example .env
   ```
4. Buka `.env` dan masukkan API Key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
5. Jalankan server:
   ```bash
   npm run dev
   ```
6. Buka browser di **http://localhost:3000**.

### Production Mode
```bash
npm run start:prod
```
Akan mengaktifkan: cache-control headers, error message production-safe, dan optimasi lain.

---

## Deployment ke Google Cloud Run

```bash
gcloud run deploy saringsini --source . --platform managed --allow-unauthenticated --region asia-southeast2 --set-env-vars GEMINI_API_KEY=YOUR_KEY,NODE_ENV=production
```

Dockerfile sudah disediakan dengan multi-stage build dan optimasi production.

---

## PWA Installation

Pengguna mobile (Android Chrome / iOS Safari) akan melihat banner install di atas setelah 4 detik penggunaan. Klik **Pasang** untuk menambahkan ke home screen — aplikasi akan berjalan standalone tanpa browser bar dan support offline.

**App Shortcuts** (long-press icon di home screen):
- Periksa Hoaks (langsung ke tab Periksa)
- Papan Komunitas (langsung ke tab Komunitas)

---

## Accessibility Checklist (WCAG 2.1 AA)

- ✅ Skip-to-content link (visible saat focus)
- ✅ ARIA roles (`role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-live="polite"`)
- ✅ ARIA labels untuk semua tombol icon-only
- ✅ Keyboard navigation (Tab, Enter, Esc)
- ✅ Focus rings visible (2px terracotta outline)
- ✅ `prefers-reduced-motion: reduce` disable semua animation
- ✅ `prefers-color-scheme: dark` fallback otomatis ke dark theme
- ✅ Color contrast ≥ 4.5:1 untuk semua text (warm palette diuji)
- ✅ Touch target minimum 44×44px
- ✅ Semantic HTML (`<nav>`, `<main>`, `<header>`, `<section>`)

---

## Pemenuhan Kriteria Penilaian

| Kriteria | Bobot | Implementasi |
|---|---|---|
| **Problem** | 30% | Menyelesaikan masalah nyata penyebaran hoaks di grup WhatsApp keluarga Indonesia yang memecah belah kerukunan. Hyper-local: 4 bahasa daerah, referensi UU ITE, mitigasi via portal nasional. |
| **Solution** | 40% | Aplikasi fungsional penuh bertenaga Gemini 3.5 Flash multimodal (text + image + URL + voice). PWA installable, persistent JSON database, 10+ fitur differentiator. Production-ready dengan rate limit, security headers, error boundary global, dan accessibility WCAG 2.1 AA. |
| **Uniqueness** | 30% | Warm Earth palette (berbeda dari kompetitor). Voice input untuk orang tua. WhatsApp deep link. Bahasa daerah templates (Jawa/Sunda/Minang/Batak). URL phishing checker. PDF export branded. iPhone 14 Pro mockup. Pahlawan Fakta gamification. |

---

## Struktur Project (v2.3 - Modular)

```
JUARAVIBECODING/
├── public/
│   ├── index.html               (SPA shell + 5 tab panels + WOW features)
│   ├── index.css                (warm palette + core components, ~4860 lines)
│   ├── app.js                   (core interactive logic, voice, PWA, ~2330 lines)
│   ├── css/                     (v2.3 modular stylesheets)
│   │   ├── coach.css            (Bahasa Mama Mode styling)
│   │   ├── tone-slider.css      (AI Tone Slider styling)
│   │   ├── hoax-dna.css         (Hoax DNA Viz styling)
│   │   └── polish.css           (UX polish layer: focus rings, transitions, etc)
│   ├── js/                      (v2.3 feature modules)
│   │   ├── coach.js             (Bahasa Mama conversational logic)
│   │   ├── tone-slider.js       (Tone regenerate w/ debounce + abort)
│   │   ├── hoax-dna.js          (Generative SVG fingerprint engine)
│   │   └── dna-integrator.js    (DNA auto-render from analysis result)
│   ├── sw.js                    (service worker - stale-while-revalidate)
│   ├── manifest.webmanifest     (PWA manifest with shortcuts)
│   └── icons/
│       ├── favicon.svg
│       ├── icon-192.svg
│       └── icon-512.svg
├── data/
│   └── community.json           (persistent community reports DB)
├── docs/
│   └── screenshots/             (submission screenshots)
├── server.js                    (Express + Gemini integration + 9 endpoints)
├── package.json
├── Dockerfile                   (multi-stage + tini + non-root)
├── .env.example
├── .gitignore
├── .dockerignore
├── CHANGELOG.md
└── README.md
```

---

*Dibuat untuk mendukung kesuksesan Sultan di ajang #JuaraVibeCoding 2026.*
