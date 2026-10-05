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

Mekanisme berikut diverifikasi oleh test otomatis proyek (integrasi dan Playwright):

- `GEMINI_API_KEY` dibaca di server dan tidak dimasukkan ke bundle browser.
- Content-Security-Policy tanpa inline script, inline style, maupun script pihak ketiga (`script-src 'self'`, `style-src-attr 'none'`, `object-src 'none'`, `frame-ancestors 'none'`). Pustaka PDF disajikan dari origin sendiri. Mode production menambahkan `Strict-Transport-Security` dan `upgrade-insecure-requests`.
- Header `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, serta COOP/CORP. `X-XSS-Protection: 0` sesuai rekomendasi OWASP untuk fitur legacy tersebut.
- Teks dari feed komunitas, keluaran AI, dan input pengguna dirender dengan `textContent`, bukan `innerHTML`. Keluaran model dinormalisasi (tipe, panjang, label yang diizinkan) sebelum disimpan atau dikirim ke klien.
- Setiap endpoint memvalidasi tipe dan panjang input. Body JSON dibatasi 64 KB. URL harus `http(s)` dan tidak pernah di-fetch oleh server.
- Upload dibatasi 5 MB dan diterima melalui memory storage. Tipe berkas ditentukan dari isinya, bukan dari header klien; hanya gambar PNG/JPEG/WebP/HEIC, dan video MP4/MOV/WebM khusus pemeriksaan deepfake.
- Rate limit per alamat IP: 6 permintaan/menit untuk endpoint AI, 20/menit untuk dukungan komunitas, 120/menit untuk seluruh API. Konfigurasi `TRUST_PROXY` harus sesuai dengan jumlah proxy di depan aplikasi.
- Dukungan komunitas memerlukan identitas klien dan hanya dihitung sekali per klien per entri. Server hanya menyimpan hash identitas tersebut dan tidak pernah mengirim daftar pendukung ke klien.
- Potongan pesan yang ditampilkan di feed disamarkan dari email, nomor telepon, dan deretan angka panjang (best effort). Untuk pemeriksaan URL hanya nama host yang ditampilkan.
- Input pengguna disisipkan ke prompt sebagai blok data bertag.
- Detail error tidak dimasukkan ke respons ketika `NODE_ENV=production`.
- Data feed ditulis secara atomik dan disimpan saat server menerima `SIGTERM`.
- `.env` diabaikan oleh Git dan `.env.example` hanya berisi placeholder.
- CI menjalankan lint, test, `npm audit` untuk dependency produksi, dan CodeQL; Dependabot memantau dependency, GitHub Actions, dan image dasar Docker.

## Batasan keamanan dan data

- Proyek belum menjalani audit keamanan independen. Mekanisme di atas diverifikasi oleh test proyek sendiri, bukan oleh penilaian pihak ketiga.
- Mitigasi prompt injection bersifat parsial. Keluaran model diperlakukan sebagai tidak tepercaya, tetapi tidak ada jaminan model akan selalu mematuhi instruksi.
- Rate limiter dan `data/community.json` bersifat lokal per proses/instance dan bukan kontrol terdistribusi. Identitas klien untuk dukungan komunitas dibuat di browser, sehingga dukungan bukan ukuran integritas yang kuat.
- Font dimuat dari Google Fonts, sehingga alamat IP pengunjung terlihat oleh Google.
- Teks dan file yang dianalisis dikirim ke Gemini. File upload tidak ditulis ke `data/community.json`, tetapi potongan teks atau klaim hasil AI dapat ditambahkan ke feed demonstrasi dan disimpan di file tersebut. Penyamaran data pribadi di feed bukan anonimisasi formal.
- Proyek belum menjanjikan retensi, penghapusan otomatis, enkripsi aplikasi, atau compliance tertentu.

Jangan gunakan deployment demonstrasi untuk rahasia atau data pribadi/sensitif. Lihat [README.md](README.md#privasi-dan-alur-data) untuk penjelasan alur data dan [SUPPORT.md](SUPPORT.md) untuk kanal bantuan lainnya.
