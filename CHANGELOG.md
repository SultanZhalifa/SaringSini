# Changelog

Semua perubahan signifikan pada project SaringSini didokumentasikan di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/) dan project ini menggunakan [Semantic Versioning](https://semver.org/).

---

## [2.3.0] - 2026-05-28 — Triple-Threat Vibe: WOW Factor Features

### Added
- **Bahasa Mama Mode** (WOW Factor #1) — Conversational AI Coach yang berperan sebagai orang tua Indonesia (Mama/Papa/Om/Tante) untuk melatih cara meluruskan hoaks tanpa konflik keluarga.
  - 4 persona unik dengan karakter berbeda (lembut/tegas/pamer/heboh)
  - 4 skenario hoaks preset + custom input
  - Multi-turn chat realistis: AI defensif di awal, melunak jika argumen user sopan + bersumber + logis
  - **Live mood indicator**: Skeptis-Defensif → Mulai Mendengar → Mempertimbangkan → Mendukung
  - **AI Evaluator**: skor komunikasi 0-100 + kekuatan + saran perbaikan + rekomendasi
  - Endpoint baru: `POST /api/coach`, `POST /api/coach/evaluate`
- **AI Tone Adjuster Slider** (WOW Factor #2) — Slider realtime untuk regenerate balasan dari "Sangat Formal" ke "Bercanda Ringan" via Gemini.
  - 5 tingkat tone (Formal, Tradisional, Hangat, Akrab, Bercanda)
  - Debounced API call (600ms) untuk efisiensi
  - AbortController untuk cancel request lama saat slide cepat
  - Endpoint baru: `POST /api/retone`
- **Hoax DNA Visualization** (WOW Factor #3) — Setiap analisis dapat sidik jari SVG generatif unik berdasarkan hash konten + skor AI.
  - Mulberry32 PRNG seeded by djb2 hash konten untuk reproducibility
  - Color mapping berdasarkan skor (sage/amber/terracotta)
  - Mirrored symmetric pattern dengan helix curves overlay
  - Download as 3x scaled PNG
  - WhatsApp share dengan link aplikasi
- **Hero Promo Card di Beranda** — Banner gradient untuk highlight Bahasa Mama Mode sebagai fitur unggulan, navigasi langsung dengan smooth scroll.
- **UX Polish Layer** (`css/polish.css`) — Better focus rings, smooth scroll, skeleton shimmer, press feedback, warm selection color, safe-area-insets, print styles.

### Changed
- **File structure improvement** — Split CSS jadi domain files: `css/coach.css`, `css/tone-slider.css`, `css/hoax-dna.css`, `css/polish.css`. Split JS jadi modules: `js/coach.js`, `js/tone-slider.js`, `js/hoax-dna.js`, `js/dna-integrator.js`.
- **Font loading optimization** — Hapus weight 600 yang tidak dipakai, gunakan `media="print" onload="all"` trick untuk non-blocking CSS load + noscript fallback.
- **JSON-LD featureList** updated dengan 3 fitur unggulan baru di atas list.
- **Version bump**: 2.2.0 → 2.3.0 di package.json, metadata.json, server.js, console signature.

### Removed
- **Easter egg Konami code + Dev Mode badge** — noise tanpa nilai untuk submission. Hapus ~70 lines JS + 35 lines CSS.

---

## [2.2.1] - 2026-05-28 — Production Hardening & Light-Only Mode

### Removed
- **Dark Mode dihilangkan sepenuhnya** atas request — semua block CSS `[data-theme="dark"]`, JS theme manager (`applyTheme`, `getCurrentTheme`, listener `prefers-color-scheme`), tombol toggle, ikon sun/moon, dan anti-FOUC inline script di `<head>`. Aplikasi sekarang hanya **Warm Earth (Light)** untuk konsistensi premium.

### Fixed
- **Critical: Multi-panel rendering bug di desktop** — `#panel-periksa`, `#panel-simulator`, `#panel-edukasi` override `.tab-panel { display: none }` via ID specificity. Sekarang qualified dengan `.active` selector + defensive rule `.tab-panel:not(.active) { display: none !important }`.
- **Skip-link visibility** — sebelumnya pakai `position: absolute; top: -40px` yang tidak bekerja karena body `position: fixed`. Sekarang `transform: translateY(-200%)` + `opacity: 0` + `pointer-events: none` sampai user `:focus`.
- **Author/Team metadata** — `metadata.json` di-update ke "Sultan dan Misha" / "Sultan & Misha", removed mention "Antigravity AI" di console signature dev mode.
- **JSON-LD featureList** — hapus "Dark Mode Hangat" agar SEO structured data sesuai aplikasi.

### Changed
- README `## Highlights v2.0` → `## Highlights v2.2` dengan analytics dashboard, hoax map, quiz, onboarding sebagai highlights baru.
- Live activity initial value `0` → `23` agar tidak flash "0 keluarga" sebelum random walk start.

---

## [2.2.0] - 2026-05-27 — Polish & Final Touches

### Added
- **Live Activity Indicator** di Beranda — Social proof "X keluarga sedang memeriksa hoaks sekarang" dengan random walk smooth animation.
- **Confetti Celebration** — Canvas-based confetti effect saat quiz score ≥ 80% dan setelah upvote sukses, dengan respect `prefers-reduced-motion`.
- **Easter Egg / Konami Code** — Tekan ↑↑↓↓←→←→BA di luar input box untuk aktifkan Developer Mode dengan stats badge floating.
- **Console Signature** — Branded console message untuk dev yang inspect element.
- **Global Error Boundary** — `window.error` dan `unhandledrejection` catch dengan friendly toast.
- **JSON-LD Structured Data** — WebApplication + Organization + FAQPage schema.org untuk SEO premium.
- **Open Graph + Twitter Cards** lengkap dengan og:image, canonical URL.
- **Multi-stage Dockerfile** dengan tini sebagai PID 1, non-root user, HEALTHCHECK, dan layer cache optimal.

### Changed
- **REDESIGN SIMULATOR CHAT** — Phone mockup awkward iPhone-style **diganti total** dengan natural WhatsApp-inspired chat window:
  - Warm gradient header (sage green) dengan group avatar
  - Day divider, bubble enter animation, typing indicator inline
  - Quick suggestion chips di atas input
  - Paste button (auto-tempel balasan terbaru dari Periksa AI)
  - Family roster card (4 member avatars dengan role badges)
- **Fix Double Scrollbar Desktop** — `body { overflow: hidden }`, app-shell fit viewport dengan `100dvh`, hanya `.app-content` yang scroll.
- **Sender colors** di simulator chat di-remap dari cold tones ke warm palette (brick red mama, sage papa, amber om, warm purple tante).
- **Reset chat** sekarang pakai sender class `sender-om` untuk consistency.

### Fixed
- Phone mockup style legacy di-disable via `display: none !important` untuk avoid conflict dengan layout baru.
- Simulator typing indicator sekarang inline bubble, bukan via `.contact-status` element yang sudah di-remove.

---

## [2.1.0] - 2026-05-27 — Game Changers untuk Juara 1

### Added
- **Hoax Trend Analytics Dashboard** di panel Edukasi:
  - 4 stat cards live (total hoax, keluarga terselamatkan, kategori teratas, tingkat bahaya)
  - CSS-only animated bar chart distribusi kategori
  - AI Daily Insight auto-generated dari pattern data (no extra API call)
- **Live Hoax Map Indonesia** — Interactive SVG dengan 7 wilayah (Sumatera, Jawa, Kalimantan, Sulawesi, Bali-NT, Maluku, Papua):
  - Heatmap intensity (low/mid/high/critical) dengan critical pulse animation
  - Click region untuk detail panel
  - Keyboard accessible (Tab + Enter)
  - Distribusi laporan berbobot populasi
- **Educational Quiz Mode** — 10 pertanyaan real hoax Indonesia (vaksin chip 5G, daun sirsak kanker, Kemendikbud kuota, dll):
  - Progress bar + score live + correct count tracking
  - Animasi feedback (correct-pop, wrong-shake)
  - Result badges (Master/Pejuang/Berlatih/Semangat)
  - Share score via WhatsApp deep link
- **Family Onboarding Tour** — 4-step interactive guide dengan SVG illustrations, animated scale entry, progress dots, localStorage persistence.

### Changed
- Moved screenshot showcase PNGs (2.1MB) dari root ke `docs/screenshots/` untuk lean deployment.
- `.dockerignore` expanded untuk exclude docs/, data/, .claude/, *.md.
- `package.json` engines node >= 18.

---

## [2.0.0] - 2026-05-27 — Warm Earth Premium Overhaul

### Added
- **Warm Earth Color Palette** — cream `#FDF8F0`, terracotta `#C84B31`, sage green `#5C8374`, warm brown text. Eye-friendly, premium, BERBEDA dari kompetitor.
- **Dark Mode** — warm dark (deep brown bg + warm sand) dengan toggle button, persist via localStorage + `prefers-color-scheme` fallback, anti-FOUC inline script.
- **Voice Input** — Web Speech API (`id-ID`) untuk dikte pesan hoaks. Visual recording state (red pulse).
- **WhatsApp Deep Link Share** — Button hijau WA di setiap reply card (`wa.me/?text=...`).
- **URL Phishing Checker** — Tab keempat baru untuk analisis link mencurigakan via Gemini.
- **Regional Language Templates** — Konversi balasan ke Bahasa Jawa Krama, Sunda Halus, Minang, Batak via Gemini.
- **PDF Report Export** — Branded laporan PDF (terracotta header, gauge score, claims, replies) via jsPDF lazy-loaded.
- **PWA Installable** — manifest.webmanifest, sw.js (stale-while-revalidate + network-first), banner install, app shortcuts.
- **Accessibility WCAG 2.1 AA** — Skip-link, ARIA roles/labels, focus rings, `prefers-reduced-motion`, semantic HTML, color contrast AA.
- **Persistent JSON DB** (`data/community.json`) — Tahan restart server.
- **New API endpoints**: `/api/translate-replies`, `/api/stats`.
- **Toast notification system** — Multi-variant (safe/warning/danger) replace native `alert()`.
- **Animated counters** — Hero stats count-up dari 0.
- **Production-grade server**: security headers, Cache-Control, SPA fallback, global error handler, NODE_ENV awareness.

### Changed
- `/api/analyze` extended dengan `checkType=url` support.
- Hero card gradient di-remap dari blue/purple ke warm terracotta/peach.
- Quick action cards remapped ke warm colors (terracotta/olive/coral/sage).
- Server version bumped 1.0.0 → 2.0.0 di `/api/health`.

### Migration Notes (1.0 → 2.0)
- Existing community reports tetap kompatibel; data otomatis di-migrate ke `data/community.json` saat first start.
- No breaking changes untuk konsumer API. `/api/analyze` payload tetap sama.

---

## [1.0.0] - 2026-05-26 — Initial JuaraVibeCoding Submission

### Added
- 5-tab mobile dashboard: Beranda, Periksa AI, Simulator Chat, Komunitas, Edukasi.
- Gemini 3.5 Flash multimodal integration (text + screenshot + deepfake).
- 3 polite reply templates (Sopan/Santai/Humor).
- iPhone 14 Pro mockup simulator chat (replaced di v2.2).
- In-memory community board dengan upvote.
- Pahlawan Fakta leaderboard.
- Rate limiter (6 req/min per IP).
- Docker + Google Cloud Run deployment setup.
- Auto-redirect dari Periksa → Simulator saat klik Salin.
