# AI CLIPPER PRO — versi awal

Aplikasi web/PWA untuk memotong video di browser tanpa kredit. Video diproses di perangkat pengguna dengan FFmpeg.wasm.

## Fitur yang sudah tersedia
- Upload video lokal dan pratinjau.
- Atur waktu mulai/akhir.
- Rasio asli, 9:16, 1:1, 16:9.
- Overlay teks sederhana.
- Ekspor MP4.
- Smart Clip Finder sederhana berbasis tingkat energi/volume audio (bukan AI semantik).
- Tidak ada akun, koin, kredit, atau upload video ke server.

## Cara menjalankan
1. Ekstrak ZIP.
2. Buka folder melalui server lokal atau unggah ke hosting statis HTTPS.
3. Untuk Acode, gunakan preview/server lokal Acode jika tersedia. Jangan hanya membuka `index.html` sebagai `file://` karena FFmpeg dan PWA memerlukan server.
4. Hosting gratis yang bisa dipakai: GitHub Pages, Netlify, atau Cloudflare Pages. Unggah seluruh isi folder.
5. Setelah terbit, bagikan URL hosting kepada orang lain. Pengguna bisa memilih "Add to Home Screen" di browser Android.

## Catatan penting
- Tidak memakai API key berbayar dan tidak ada sistem kredit aplikasi.
- FFmpeg core dimuat dari CDN saat ekspor, sehingga koneksi internet diperlukan saat pertama kali.
- Pemrosesan dilakukan di perangkat. Video besar dapat lambat atau gagal di ponsel dengan RAM terbatas.
- Smart Clip Finder saat ini memilih bagian dengan volume audio menonjol; belum memahami isi percakapan, wajah, atau konteks untuk memilih momen viral.
- Subtitle otomatis speech-to-text, login multi-user, dashboard admin, penyimpanan cloud, dan server job queue belum termasuk pada versi awal ini.
- Website publik membutuhkan hosting. "Gratis tanpa kredit" bukan berarti biaya hosting/penyimpanan/server selalu nol; versi ini menghindari server pemrosesan dengan memproses video di perangkat.


## Import link (V2)
- Link file video langsung MP4/WebM dapat diimpor dengan `fetch` jika host mengizinkan CORS.
- YouTube link hanya menyediakan pratinjau melalui embed resmi. URL YouTube biasa tidak dapat diubah menjadi file untuk diedit.
- Untuk video milik sendiri, unduh melalui YouTube Studio sesuai ketentuan YouTube, kemudian upload file ke editor.
- Link privat, link yang memerlukan login, HLS/DASH, atau host yang memblokir CORS tidak didukung.
