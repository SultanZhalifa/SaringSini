# Roadmap SaringSini

Dokumen ini menjabarkan arah pengembangan SaringSini. Roadmap bersifat hidup — prioritas dapat berubah berdasarkan masukan komunitas. Punya ide? Buka [issue](../../issues/new/choose) atau mulai [diskusi](../../discussions).

> Legenda: ✅ selesai · 🚧 sedang dikerjakan · 🔜 direncanakan · 💡 ide/eksplorasi

---

## Sekarang (v2.3)

- ✅ Deteksi hoaks multimodal (teks, screenshot, deteksi konten AI, URL) via Gemini
- ✅ Generator balasan sopan + konversi bahasa daerah (Jawa, Sunda, Minang, Batak)
- ✅ Bahasa Mama Mode (coaching komunikasi via role-play AI)
- ✅ AI Tone Slider & Hoax DNA Visualization
- ✅ PWA installable, aksesibilitas WCAG 2.1 AA
- ✅ Baseline open source: CI, dokumen komunitas, template issue/PR

## Berikutnya (v2.4) — Kualitas & Kepercayaan

Fokus: memperkuat fondasi agar proyek layak dipakai jangka panjang.

- 🔜 Perluas cakupan test: `/api/stats`, upvote komunitas, rate limiter, validasi request ([#4](../../issues/4))
- 🔜 Tambah `Content-Security-Policy` yang teruji tanpa merusak fitur
- 🔜 Abstraksi lapisan penyimpanan agar mudah diganti ke database terkelola (Firestore/Supabase)
- 🔜 Internasionalisasi antarmuka (ID ↔ EN) ([#6](../../issues/6))
- 🔜 Cache singkat hasil analisis untuk menghemat kuota Gemini ([#7](../../issues/7))
- 🔜 Dokumentasi API dengan contoh `curl` ([#3](../../issues/3))

## Menengah (v3.0) — Skala & Komunitas

Fokus: dari demo menuju layanan yang dapat diandalkan.

- 💡 Backend database terkelola untuk papan komunitas (menggantikan JSON lokal)
- 💡 Autentikasi ringan opsional & moderasi laporan komunitas
- 💡 Riwayat pemeriksaan per pengguna (lokal-first / opsional sinkron)
- 💡 Integrasi sumber cek fakta resmi (mis. TurnBackHoax, Kominfo) bila API tersedia
- 💡 Mode luring lebih kuat untuk area dengan koneksi terbatas
- 💡 Ekstensi bahasa daerah tambahan (Bali, Bugis, dll) ([#1](../../issues/1))

## Ide Eksplorasi

- 💡 Ekstensi browser / share target untuk cek cepat dari aplikasi lain
- 💡 Panduan literasi digital terkurasi untuk orang tua
- 💡 Ekspor laporan yang lebih kaya (PDF/gambar) untuk edukasi keluarga

---

## Prinsip

1. **Privasi dulu** — minimalkan pengumpulan data; jelas soal apa yang dikirim ke AI.
2. **Ramah orang tua** — antarmuka sederhana, mudah diakses, hangat.
3. **Jujur soal keterbatasan** — AI bisa salah; SaringSini adalah alat bantu, bukan penentu kebenaran mutlak.
4. **Ringan** — hindari dependensi berat tanpa alasan kuat.

Ingin membantu salah satu item di atas? Lihat [CONTRIBUTING.md](CONTRIBUTING.md) dan label [`good first issue`](../../labels/good%20first%20issue) / [`help wanted`](../../labels/help%20wanted).
