# Berkontribusi untuk SaringSini

Terima kasih atas minat Anda untuk berkontribusi ke **SaringSini** — platform bertenaga AI untuk membantu keluarga Indonesia menyaring hoaks di grup WhatsApp tanpa merusak silaturahmi. 🙏

Kontribusi dalam bentuk apa pun sangat kami hargai: laporan bug, ide fitur, perbaikan dokumentasi, terjemahan, hingga kode. Dokumen ini menjelaskan cara ikut berkontribusi.

> Dengan berpartisipasi dalam proyek ini, Anda diharapkan mematuhi [Kode Etik](CODE_OF_CONDUCT.md) kami.

---

## Daftar Isi

- [Cara Berkontribusi](#cara-berkontribusi)
- [Menyiapkan Lingkungan Pengembangan](#menyiapkan-lingkungan-pengembangan)
- [Alur Kerja Git](#alur-kerja-git)
- [Standar Kode](#standar-kode)
- [Menjalankan Pengecekan Lokal](#menjalankan-pengecekan-lokal)
- [Panduan Pull Request](#panduan-pull-request)
- [Melaporkan Bug](#melaporkan-bug)
- [Mengusulkan Fitur](#mengusulkan-fitur)
- [Mencari Isu Pertama](#mencari-isu-pertama)

---

## Cara Berkontribusi

Ada banyak cara untuk membantu, tidak harus menulis kode:

- 🐛 **Melaporkan bug** melalui [issue tracker](../../issues/new/choose).
- 💡 **Mengusulkan fitur** atau perbaikan alur pengguna.
- 📖 **Memperbaiki dokumentasi** — typo, penjelasan yang kurang jelas, contoh yang salah.
- 🌐 **Menambah/menyempurnakan template bahasa daerah** (Jawa, Sunda, Minang, Batak, dll).
- ♿ **Meningkatkan aksesibilitas** (WCAG 2.1 AA).
- 🧪 **Menulis atau memperbaiki test dan smoke check.**

## Menyiapkan Lingkungan Pengembangan

**Prasyarat:** [Node.js](https://nodejs.org/) 18 atau lebih baru dan npm.

```bash
# 1. Fork repo ini, lalu klon fork Anda
git clone https://github.com/<username-anda>/SaringSini.git
cd SaringSini

# 2. Instal dependensi
npm install

# 3. Siapkan environment
cp .env.example .env
# Buka .env dan isi GEMINI_API_KEY (gratis di https://aistudio.google.com/)

# 4. Jalankan server dev (auto-reload)
npm run dev
```

Buka <http://localhost:3000> di browser. Fitur AI membutuhkan `GEMINI_API_KEY` yang valid; sebagian besar UI tetap dapat dijalankan tanpanya untuk pekerjaan front-end.

## Alur Kerja Git

1. Buat branch dari `master` dengan nama deskriptif:
   ```bash
   git checkout -b feat/nama-fitur      # untuk fitur
   git checkout -b fix/nama-bug         # untuk perbaikan bug
   git checkout -b docs/topik           # untuk dokumentasi
   ```
2. Buat perubahan kecil dan fokus (satu PR = satu tujuan).
3. Commit dengan pesan yang jelas. Kami menganjurkan format [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: tambah template balasan Bahasa Bali
   fix: perbaiki rate limiter menghitung IP di belakang proxy
   docs: perjelas langkah setup .env
   ```
4. Push branch ke fork Anda dan buka Pull Request ke `master`.

## Standar Kode

- **Bahasa:** JavaScript (Node.js + Express) di backend, Vanilla JS ES6+ di frontend.
- **Gaya:** ikuti gaya kode yang sudah ada di sekitarnya (indentasi 2 spasi, `const`/`let`, tanpa `var`).
- **Tanpa dependensi berat baru** tanpa diskusi terlebih dahulu — proyek ini sengaja ringan.
- **Keamanan:** jangan pernah meng-commit `.env`, API key, atau kredensial. Lihat [SECURITY.md](SECURITY.md).
- **Aksesibilitas:** pertahankan ARIA roles, kontras, dan dukungan keyboard yang sudah ada.

## Menjalankan Pengecekan Lokal

Sebelum membuka PR, jalankan pengecekan yang sama dengan CI:

```bash
npm run check   # syntax check semua file JavaScript (node --check)
npm run smoke   # nyalakan server dan verifikasi endpoint /api/health
npm test        # menjalankan check + smoke sekaligus
```

Semua pengecekan harus lulus (hijau) sebelum PR dapat digabung.

## Panduan Pull Request

- Isi [template Pull Request](.github/PULL_REQUEST_TEMPLATE.md) selengkap mungkin.
- Kaitkan PR dengan issue terkait (mis. `Closes #12`).
- Pastikan `npm test` lulus secara lokal dan CI hijau.
- Sertakan screenshot / GIF untuk perubahan yang terlihat di UI.
- PR yang kecil dan terfokus jauh lebih cepat direview.

## Melaporkan Bug

Gunakan [template Bug Report](../../issues/new?template=bug_report.yml). Sertakan:
langkah reproduksi, perilaku yang diharapkan vs aktual, browser/OS, dan screenshot bila ada.

## Mengusulkan Fitur

Gunakan [template Feature Request](../../issues/new?template=feature_request.yml). Jelaskan
masalah yang ingin diselesaikan, bukan hanya solusinya, agar diskusi lebih terarah.

## Mencari Isu Pertama

Baru pertama kali? Cari label:

- [`good first issue`](../../labels/good%20first%20issue) — cocok untuk pemula.
- [`help wanted`](../../labels/help%20wanted) — butuh bantuan tambahan.
- [`documentation`](../../labels/documentation) — perbaikan dokumentasi.

Silakan komentari issue yang ingin Anda kerjakan agar tidak ada pekerjaan ganda. Kami akan membantu Anda selama prosesnya. Selamat berkontribusi! 🚀
