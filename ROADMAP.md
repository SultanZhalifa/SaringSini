# Roadmap SaringSini

Roadmap ini menggambarkan arah pemeliharaan untuk sekitar enam bulan ke depan. Urutan dan waktu dapat berubah sesuai kapasitas maintainer, masukan pengguna, keamanan, dan kontribusi komunitas. Setiap item adalah rencana, bukan janji rilis atau SLA.

## Prinsip pemeliharaan

- Pertahankan identitas Indonesia dan tujuan sosial proyek.
- Utamakan dokumentasi dan perilaku yang jujur daripada klaim pemasaran.
- Perlakukan keluaran AI sebagai bantuan awal, bukan keputusan faktual resmi.
- Jaga pull request tetap kecil, dapat ditinjau, dan tidak mengambil peluang contributor tanpa koordinasi.
- Jangan menganggap data demonstrasi sebagai bukti penggunaan atau dampak.

## Prioritas pemeliharaan saat ini

- Menyelaraskan dokumentasi, metadata, dan copy antarmuka dengan implementasi yang ada.
- Menjelaskan alur data, keterbatasan AI, dan batas persistence lokal/demo.
- Menjaga CI (lint, test, end-to-end, audit, CodeQL) tetap hijau pada Node.js 22 dan 24.
- Meninjau issue dan pull request secara best effort serta menjaga scope kontribusi tetap jelas.

## Near-term — sekitar 1–2 bulan

- Menerima kontribusi terfokus untuk [template Bahasa Bali (#1)](https://github.com/SultanZhalifa/SaringSini/issues/1) dan [feedback tombol Salin (#2)](https://github.com/SultanZhalifa/SaringSini/issues/2).
- Memperluas dokumentasi API melalui [issue #3](https://github.com/SultanZhalifa/SaringSini/issues/3), tanpa menduplikasinya dalam credibility pass.
- Melakukan audit alt text dan ikon melalui [issue #5](https://github.com/SultanZhalifa/SaringSini/issues/5).
- Memperluas pengujian terfokus untuk perilaku baru; baseline unit, integrasi, dan browser sudah tersedia.

## Medium-term — sekitar 3–4 bulan

- Mendiskusikan struktur i18n antarmuka melalui [issue #6](https://github.com/SultanZhalifa/SaringSini/issues/6).
- Mengevaluasi cache berumur pendek melalui [issue #7](https://github.com/SultanZhalifa/SaringSini/issues/7), termasuk implikasi privasi dan deployment multi-instance.
- Mendokumentasikan opsi external storage untuk deployment yang membutuhkan data durable; tidak ada pilihan database yang sudah ditetapkan.
- Meninjau alur consent dan disclosure sebelum feed komunitas digunakan di luar demonstrasi lokal.

## Pekerjaan teknis yang direncanakan

Item berikut bersifat rencana pemeliharaan, bukan janji rilis. Semuanya terpisah dari issue contributor di atas.

- Migrasi ke SDK Gemini yang masih dipelihara (`@google/genai`). Pemakaian SDK terisolasi di `src/services/gemini.js`, tetapi migrasi perlu diverifikasi dengan API key sungguhan sebelum digabung.
- Memecah `public/index.css` menjadi berkas per fitur, dengan test Playwright sebagai jaring pengaman. (`public/app.js` sudah dipecah menjadi modul ES di `public/js/`.)
- Self-host font agar tidak ada permintaan ke Google Fonts.
- Menjadikan publikasi ke feed komunitas sebagai opt-in dengan persetujuan eksplisit (lihat juga item consent di bawah).

## Longer-term exploration — sekitar 5–6 bulan

- Mengeksplorasi penilaian yang didukung sumber dan sitasi, dengan evaluasi kualitas yang dapat direproduksi.
- Mengevaluasi apakah fitur indikasi media AI layak dipertahankan berdasarkan benchmark dan batasan yang terdokumentasi.
- Mengeksplorasi persistence multi-instance, moderasi feed, dan kontrol privasi sebelum mempertimbangkan deployment publik.
- Meninjau kebutuhan observability, abuse prevention, dan security hardening sebagai pekerjaan terpisah dari dokumentasi.

## Bukan komitmen saat ini

Roadmap ini tidak menjanjikan live demo, pengguna tertentu, tingkat akurasi, tanggal rilis, dukungan produksi, atau target dampak. SaringSini belum memiliki database produksi, audit keamanan menyeluruh, audit WCAG penuh, ataupun proses validasi forensik.

## Peluang kontribusi yang dipertahankan

Issue [#1](https://github.com/SultanZhalifa/SaringSini/issues/1), [#2](https://github.com/SultanZhalifa/SaringSini/issues/2), [#3](https://github.com/SultanZhalifa/SaringSini/issues/3), [#5](https://github.com/SultanZhalifa/SaringSini/issues/5), [#6](https://github.com/SultanZhalifa/SaringSini/issues/6), dan [#7](https://github.com/SultanZhalifa/SaringSini/issues/7) sengaja tetap tersedia untuk contributor. Komentari issue sebelum memulai agar scope dapat disepakati dan pekerjaan tidak tumpang tindih.
