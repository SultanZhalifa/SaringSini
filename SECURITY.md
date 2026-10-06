# Kebijakan Keamanan

Terima kasih telah membantu menjaga SaringSini dan contributornya tetap aman. Proyek ini masih berada pada tahap awal dan dipelihara secara best effort.

## Status dukungan

Belum ada release atau tag stabil dengan jangka dukungan keamanan formal. Perbaikan keamanan, bila tersedia, ditargetkan ke branch `master`. Nomor versi package tidak menyiratkan SLA, audit keamanan, atau dukungan produksi.

## Melaporkan kerentanan

**Jangan melaporkan kerentanan melalui issue, pull request, atau diskusi publik.**

Kirim laporan secara privat ke **sultanzhalifunnasmusyaffa@gmail.com** dengan subjek `[SECURITY] SaringSini`.

Private vulnerability reporting melalui GitHub belum diaktifkan untuk repositori ini. Dokumentasi akan diperbarui apabila kanal tersebut tersedia.

Jika aman untuk dibagikan melalui email, sertakan:

- jenis kerentanan;
- langkah reproduksi minimal;
- file atau endpoint yang terdampak;
- dampak potensial;
- bukti pendukung yang sudah dibersihkan dari rahasia dan data pribadi.

Jangan mengirim API key aktif, token, isi percakapan pribadi, atau data pihak ketiga yang tidak diperlukan.

## Ekspektasi respons

Laporan akan ditinjau dan ditangani sesuai kapasitas maintainer, tingkat risiko, dan informasi yang tersedia. Proyek tidak menjanjikan batas waktu untuk konfirmasi, penilaian, perbaikan, atau rilis. Koordinasi pengungkapan akan dilakukan secara best effort.

## Mekanisme yang diterapkan

Implementasi saat ini memiliki mekanisme berikut:

- `GEMINI_API_KEY` dibaca di server dan tidak dimasukkan ke bundle browser.
- Endpoint berbasis AI memakai rate limiter in-memory sebanyak enam permintaan per menit untuk alamat yang dilihat proses server.
- Server mengirim `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, dan `X-XSS-Protection`.
- Body JSON dibatasi 1 MB.
- Upload Multer dibatasi 5 MB dan diterima melalui memory storage.
- Detail error tidak dimasukkan ke respons ketika `NODE_ENV=production`.
- `.env` diabaikan oleh Git dan `.env.example` hanya berisi placeholder.

## Batasan keamanan dan data

- Content-Security-Policy belum diterapkan.
- Rate limiter dan `data/community.json` bersifat lokal per proses/instance dan bukan kontrol terdistribusi.
- Validasi berbeda untuk setiap endpoint; proyek belum menjalani audit sanitasi atau keamanan menyeluruh.
- Teks dan file yang dianalisis dikirim ke Gemini. File upload tidak ditulis ke `data/community.json`, tetapi potongan teks atau klaim hasil AI dapat ditambahkan ke feed demonstrasi dan disimpan di file tersebut.
- UUID klien untuk dukungan komunitas dapat dikirim dan disimpan di server bersama entri feed.
- Proyek belum menjanjikan retensi, penghapusan otomatis, enkripsi aplikasi, anonimisasi formal, atau compliance tertentu.

Jangan gunakan deployment demonstrasi untuk rahasia atau data pribadi/sensitif. Lihat [README.md](README.md#privasi-dan-alur-data) untuk penjelasan alur data dan [SUPPORT.md](SUPPORT.md) untuk kanal bantuan lainnya.
