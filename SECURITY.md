# Kebijakan Keamanan

Kami menganggap keamanan pengguna SaringSini sebagai prioritas. Terima kasih telah membantu menjaga proyek dan penggunanya tetap aman.

## Versi yang Didukung

Pembaruan keamanan diberikan untuk rilis minor terbaru.

| Versi | Didukung |
| ----- | -------- |
| 2.3.x | ✅       |
| < 2.3 | ❌       |

## Melaporkan Kerentanan

**Mohon JANGAN melaporkan kerentanan keamanan melalui issue publik, pull request, atau diskusi publik.**

Sebagai gantinya, laporkan secara privat melalui salah satu cara berikut:

1. **GitHub Security Advisories (disarankan)** — buka tab **Security → Report a vulnerability** pada repositori ini untuk membuat laporan privat.
2. **Email** — kirim ke pemelihara proyek di **sultanzhalifunnasmusyaffa@gmail.com** dengan subjek `[SECURITY] SaringSini`.

Sertakan sebanyak mungkin informasi berikut agar kami dapat menindaklanjuti dengan cepat:

- Jenis kerentanan (mis. XSS, injeksi, kebocoran API key, SSRF, dsb).
- Langkah-langkah untuk mereproduksi.
- File/endpoint yang terdampak (mis. `/api/analyze`).
- Dampak potensial dan skenario eksploitasi.
- Bukti pendukung (log, screenshot, PoC) bila ada.

## Waktu Respons

- **Konfirmasi penerimaan:** dalam 72 jam.
- **Penilaian awal:** dalam 7 hari.
- **Perbaikan:** kami akan mengoordinasikan jadwal rilis perbaikan bersama Anda sebelum publikasi.

Kami mengapresiasi *responsible disclosure* dan akan dengan senang hati memberikan kredit kepada pelapor pada catatan rilis, kecuali Anda meminta untuk tetap anonim.

## Praktik Keamanan dalam Proyek Ini

Kontributor wajib memperhatikan hal berikut:

- **Jangan pernah meng-commit rahasia.** File `.env` sudah masuk `.gitignore`. Gunakan `.env.example` sebagai referensi variabel.
- `GEMINI_API_KEY` hanya digunakan di sisi server (`server.js`) dan tidak boleh diekspos ke klien.
- Endpoint AI dibatasi *rate limit* (6 permintaan/menit per IP) untuk melindungi kuota.
- Header keamanan produksi aktif: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, dan `X-XSS-Protection`.
- Unggahan file dibatasi ukuran (5 MB) dan diproses di memori.
- Validasi dan sanitasi setiap input pengguna sebelum diproses atau ditampilkan.

Jika Anda menemukan rahasia yang tidak sengaja ter-commit, segera laporkan secara privat sesuai prosedur di atas — jangan membukanya di issue publik.
