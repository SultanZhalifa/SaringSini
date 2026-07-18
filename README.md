# SaringSini v2.3 — Asisten Filter Hoaks dan Coaching Komunikasi Anti-Hoaks Keluarga

[![CI](https://github.com/SultanZhalifa/SaringSini/actions/workflows/ci.yml/badge.svg)](https://github.com/SultanZhalifa/SaringSini/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![good first issues](https://img.shields.io/github/issues/SultanZhalifa/SaringSini/good%20first%20issue?label=good%20first%20issues&color=7057ff)](https://github.com/SultanZhalifa/SaringSini/labels/good%20first%20issue)
[![Open Issues](https://img.shields.io/github/issues/SultanZhalifa/SaringSini)](https://github.com/SultanZhalifa/SaringSini/issues)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/Platform-Web_|_PWA-orange.svg)](#)

**SaringSini** adalah aplikasi web bertenaga AI (Google Gemini) yang membantu keluarga Indonesia menyaring konten mencurigakan di grup WhatsApp — dan mendiskusikan misinformasi dengan cara yang lebih membangun, tanpa merusak silaturahmi.

Alih-alih sekadar memberi label "hoaks", SaringSini membantu pengguna **menyusun balasan sopan**, **melatih cara berkomunikasi** dengan anggota keluarga yang skeptis, dan **memahami mengapa** sebuah pesan patut diragukan. Aplikasi berjalan sebagai Single Page Application mobile-first yang dapat dipasang sebagai PWA, dengan mesin AI multimodal (teks, screenshot, deteksi konten buatan AI, dan pengecekan URL).

> Proyek ini bermula dari ajang #JuaraVibeCoding 2026 dan kini dikembangkan sebagai proyek open source yang terbuka untuk kontribusi.

---

## 🎬 Demo

> **Live demo:** _menyusul_ — aplikasi di-deploy ke Google Cloud Run. Setelah URL publik tersedia, tautannya akan dicantumkan di sini. Sementara itu, cara tercepat mencoba adalah menjalankannya secara lokal (lihat [Cara Menjalankan Secara Lokal](#cara-menjalankan-secara-lokal)).

Cuplikan layar aplikasi (tersedia lengkap di [`docs/screenshots/`](docs/screenshots)):

| Beranda | Periksa AI | Hasil Analisis |
|---|---|---|
| ![Beranda](docs/screenshots/JUARAVIBECODING1.png) | ![Periksa AI](docs/screenshots/JUARAVIBECODING2.png) | ![Hasil Analisis](docs/screenshots/JUARAVIBECODING3.png) |

| Simulator Chat | Komunitas |
|---|---|
| ![Simulator Chat](docs/screenshots/JUARAVIBECODING4.png) | ![Komunitas](docs/screenshots/JUARAVIBECODING5.png) |

> ⚠️ **Catatan transparansi:** sebagian metrik pada antarmuka (mis. jumlah keluarga terbantu, papan peringkat) bersifat data demonstrasi dan belum mencerminkan penggunaan nyata di produksi.

---

## Fitur Unggulan

### Tiga Fitur Utama

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

### Fitur Lainnya

- **Palet Warm Earth** — cream `#FDF8F0`, terracotta `#C84B31`, sage green `#5C8374`, warm brown text. Hangat dan nyaman di mata.
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
- **Penyimpanan JSON Lokal** — papan komunitas disimpan ke `data/community.json` agar tahan restart server. Ditujukan untuk pengembangan dan demo; untuk produksi disarankan memakai database terkelola (lihat [Deployment](#deployment)).

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

### 4. Papan Komunitas (Penyimpanan JSON Lokal)
- Disimpan ke `data/community.json` (tahan restart server; untuk dev/demo — lihat catatan produksi di [Deployment](#deployment)).
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
| Security | Rate Limiter 6 req/min + security headers (lihat di bawah) | Proteksi quota dan keamanan |
| Persistence | JSON file (`data/community.json`) | Penyimpanan lokal untuk dev/demo; produksi disarankan pakai database terkelola |
| Frontend | HTML5, CSS3 (warm palette), Vanilla JS ES6+ | SPA responsive |
| PWA | Service Worker + Web App Manifest | Installable, offline-capable, app shortcuts |
| Deployment | Docker + Google Cloud Run | Container portable, auto-scaling |

### Security Headers
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

## Deployment

Contoh deploy ke Google Cloud Run:

```bash
gcloud run deploy saringsini --source . --platform managed --allow-unauthenticated --region asia-southeast2 --set-env-vars GEMINI_API_KEY=YOUR_KEY,NODE_ENV=production
```

Dockerfile sudah disediakan dengan multi-stage build.

> ⚠️ **Catatan persistensi data:** papan komunitas menggunakan penyimpanan file lokal (`data/community.json`) yang ditujukan untuk **pengembangan dan demo**. Pada platform container seperti Cloud Run, filesystem bersifat *ephemeral* dan tidak dibagikan antar-instance — data dapat hilang saat instance diganti atau tidak sinkron jika berjalan di beberapa instance. Untuk penggunaan produksi nyata, ganti lapisan penyimpanan dengan **database terkelola** (mis. Firestore, Cloud SQL, atau Supabase).

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

## Struktur Project

```
SaringSini/
├── public/
│   ├── index.html               (SPA shell + 5 tab panels)
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
│   └── community.json           (penyimpanan JSON lokal untuk dev/demo)
├── docs/
│   └── screenshots/             (screenshot aplikasi)
├── server.js                    (Express + Gemini integration + 9 endpoints)
├── package.json
├── Dockerfile                   (multi-stage + tini + non-root)
├── .github/                     (workflow CI, template issue & PR, CODEOWNERS)
├── test/                        (check.js syntax lint + smoke.js health test)
├── .env.example
├── .gitignore
├── .dockerignore
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── SUPPORT.md
├── ROADMAP.md
├── LICENSE
├── CHANGELOG.md
└── README.md
```

---

## Testing & Continuous Integration

Proyek ini menyertakan pengecekan ringan tanpa dependensi tambahan, dijalankan otomatis oleh **GitHub Actions** pada Node.js 18, 20, dan 22 di setiap push dan pull request:

```bash
npm run check   # syntax check semua file JavaScript (node --check)
npm run smoke   # nyalakan server & verifikasi endpoint /api/health
npm test        # check + smoke sekaligus
```

---

## Berkontribusi

Kontribusi sangat kami sambut! 🎉 Baik itu laporan bug, ide fitur, perbaikan dokumentasi, maupun kode.

- 📋 Baca [**CONTRIBUTING.md**](CONTRIBUTING.md) untuk panduan setup dan alur kerja.
- 🤝 Patuhi [**Kode Etik**](CODE_OF_CONDUCT.md) kami.
- 🔒 Laporkan isu keamanan secara privat sesuai [**SECURITY.md**](SECURITY.md).
- 🗺️ Lihat arah pengembangan di [**ROADMAP.md**](ROADMAP.md).
- 🙋 Butuh bantuan? Lihat [**SUPPORT.md**](SUPPORT.md).
- 🌱 Baru pertama kali? Mulai dari label [**good first issue**](https://github.com/SultanZhalifa/SaringSini/labels/good%20first%20issue) dan [**help wanted**](https://github.com/SultanZhalifa/SaringSini/labels/help%20wanted).

## Lisensi

Didistribusikan di bawah [Lisensi MIT](LICENSE). Bebas digunakan, dimodifikasi, dan disebarluaskan dengan tetap mencantumkan atribusi.

---

*Built in Indonesia to help families verify suspicious content and discuss misinformation more constructively.*
