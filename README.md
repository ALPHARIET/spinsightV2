# SPINSIGHT

> **Spin. Speak. Insight.**  
> Platform Web Pembelajaran Nalar Kritis & Berargumen Lisan Berbasis AI  
> **Lomba Web Development Internasional — RafaTech 2026 (UIN Raden Fatah Palembang)**  
> **Tema: APEX — AI Powered Experience for the Web**

---

## 📌 Ringkasan Proyek

Di kelas konvensional, saat guru bertanya hanya 3 siswa yang berani mengangkat tangan. **SPINSIGHT** mengubah dinamika kelas:
1. **Pilar 1 — Case Forge**: Guru mengunggah e-book materi pelajaran. AI mengekstraknya menjadi bank kasus studi berbasis Taksonomi Bloom (Analisis, Evaluasi, Kreasi) dengan estimasi waktu berpikir 60-120 detik.
2. **Pilar 2 — Spin Arena**: Siswa spin sekali untuk mendapat satu topik dari materi guru, lalu punya 120 detik untuk menuangkan pikiran lewat ketikan atau suara (Web Speech API).
3. **Pilar 3 — Insight Panel**: AI mentranskrip ucapan siswa dan menyajikan evaluasi 3 kartu:
   - **Cermin Argumen**: Bedah struktur Klaim – Alasan – Bukti, deteksi *filler words*, kejelasan tutur, dan asumsi belum teruji.
   - **Fakta Terverifikasi**: Komparasi rujukan bereputasi (UNESCO, Garuda, Kemdikbud) bertanda *Menguatkan* atau *Menyanggah*.
   - **Trend & Fakta Unik**: Konteks perbincangan global terkini.
4. **Pilar 4 — Arena Diskusi Terkunci**: Gerbang forum baru terbuka setelah siswa punya opini sendiri (*Think-Pair-Share*). Transkrip lisan otomatis menjadi post pembuka, dipetakan dalam **Peta Posisi 2D Spektrum Nalar Kelas**, dengan balasan berlabel wajib (*Menguatkan, Menyanggah, Bertanya, Menambah Bukti*) serta AI Moderator.
5. **Jurnal Siswa & Telemetri**: Portofolio refleksi kognitif dengan grafik 5 dimensi nalar dari waktu ke waktu.

---

## 🎨 Desain Antarmuka

Referensi sistem desain: **Miro** (via [awesome-design-md](https://github.com/VoltAgent/awesome-design-md)). Alasannya, Miro memakai warna *sticky note* untuk menandai isi produk, dan SpinSight memakai warna yang sama untuk menandai struktur argumen.

- **Stabilo argumen** sebagai ciri khas: Klaim = kuning, Alasan = biru, Bukti = hijau. Dipakai konsisten di Latihan, Arena Debat, dan Jurnal.
- **Kanvas putih**, tombol pil hitam untuk aksi utama, kuning merek hanya untuk momen Putar dan logo.
- **Font**: Outfit (self-hosted lewat `@fontsource`, tetap jalan tanpa internet).
- **Token desain** ada di `src/index.css`. Komponen memakai `var(--token)`, bukan hex.
- **Spin topik** bergaya slot vertikal dengan tuas, hanya sekali per latihan. Topik berasal dari materi guru, dan hasil analisis AI merujuk ke poin kunci materi tersebut.
- Responsif: tab bar bawah di HP, tanpa scroll horizontal di lebar 390px.

## 🤖 Alur Utama & Integrasi AI

1. **Guru** (Portal Guru → Materi Guru) mengunggah PDF/DOCX/TXT atau menempel teks. Teks dibaca di peramban, lalu dikirim ke `/api/topics`. AI menyusun topik yang bisa diperdebatkan + poin kunci materi. Guru meninjau, menyunting, lalu **menerbitkan** ke spin siswa.
2. **Siswa** (Latihan) memilih materi lalu **spin sekali** (slot vertikal + tuas). Hasil spin dikunci dan tersimpan, jadi refresh tidak membuka spin ulang.
3. Siswa punya **120 detik** untuk menuangkan pikiran di kolom jawaban, bisa diketik atau lewat tombol **Pakai suara** (Web Speech API). Timer dihitung dari waktu mulai yang tersimpan; saat habis, jawaban otomatis dikirim.
4. Jawaban dikirim ke `/api/analyze`. AI mengembalikan kutipan klaim/alasan/bukti (untuk stabilo), skor, umpan balik, pertanyaan uji, asumsi, dan keterkaitan dengan poin materi guru.

**API key hanya ada di server.** `/api/*` dijalankan oleh `server/handlers.js`, dipakai bersama oleh Vercel Functions (`api/`) dan middleware dev server Vite (`server/vitePlugin.js`). Klien LLM memakai format OpenAI Chat Completions, jadi bisa dipakai dengan Gemini (default), OpenAI, Groq, OpenRouter, atau Atria. Untuk Gemini, bila model utama kena limit atau sibuk, server otomatis mencoba model cadangan (`LLM_FALLBACK_MODELS`).

Jika AI tidak tersedia (key kosong, offline, kuota habis), analisis jawaban memakai heuristik lokal dan halaman hasil menampilkan label **Mode cadangan tanpa AI**. Pembuatan topik oleh guru sengaja tidak punya cadangan, supaya guru tahu AI-nya belum aktif.

## 🚀 Menjalankan Aplikasi Secara Lokal

### Prasyarat
- Node.js 20.6 ke atas
- API key LLM, misalnya gratis dari [Google AI Studio](https://aistudio.google.com/apikey). Tier gratis dibatasi sekitar 20 permintaan per hari per model.

### Langkah
```bash
npm install
cp .env.example .env      # lalu isi LLM_API_KEY dan cek LLM_MODEL
npm run dev               # http://localhost:3000
```

`LLM_MODEL` harus ditulis persis seperti nama model di dokumentasi penyedia (misalnya `gemini-3.5-flash`). Jangan beri awalan `VITE_` pada variabel ini supaya key tidak ikut terkirim ke peramban.

### Deploy ke Vercel
1. Import repo ke Vercel (framework: Vite).
2. Di **Settings → Environment Variables**, isi `LLM_API_KEY`, `LLM_BASE_URL`, dan `LLM_MODEL`.
3. Deploy. Folder `api/` otomatis menjadi serverless function, dan `vercel.json` mengarahkan rute SPA ke `index.html`.

### Deploy ke Render
Render menjalankan `server/index.js` (server Node yang menyajikan `dist/` dan `/api/*`).
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment: `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

Layanan gratis Render tidur setelah sekitar 15 menit tanpa pengunjung, dan permintaan pertama sesudahnya butuh waktu untuk bangun. Buka web beberapa menit sebelum demo.

### Database & akun (Supabase, wajib)
Login, kelas, dan semua data disimpan di Supabase (PostgreSQL + Supabase Auth).

1. Buat project di [supabase.com](https://supabase.com).
2. Buka **SQL Editor → New query**, tempel isi `supabase/schema.sql`, lalu **Run**.
3. Dari **Project Settings → API Keys**, salin Project URL dan **secret** key (atau `service_role`) ke `.env`:
   ```
   SUPABASE_URL=https://xxxxxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
   Isi juga keduanya di hosting (Render/Vercel → Environment Variables).
4. Jalankan `npm run dev`. Akun dan kelas contoh dibuat otomatis saat server pertama kali berjalan.

Perintah lain:
- `npm run db:reset` mengembalikan **kelas contoh** ke data awal. Kelas dan akun asli tidak disentuh.
- `npm run test:flow` menguji alur kelas langsung ke database: buat kelas, gabung dengan kode, hak akses guru/siswa, spin sekali, rekap nilai, forum, ganti kode, dan keluarkan siswa.

**Keamanan.** Browser tidak pernah memegang key Supabase. Login lewat `/api/auth`, lalu setiap permintaan `/api/data`, `/api/topics`, dan `/api/analyze` membawa token yang diperiksa server ke Supabase Auth. Server mengecek kepemilikan kelas di setiap aksi: hanya guru pemilik kelas yang bisa mengubah materi, topik, kode, dan anggota; siswa hanya bisa mengakses kelas yang dia ikuti. Semua tabel memakai RLS tanpa policy, sehingga key publik tidak bisa membaca atau menulis apa pun.

Catatan: project Supabase gratis dijeda otomatis bila lama tidak dipakai. Buka dashboard Supabase beberapa hari sebelum penilaian.

## 👥 Akun, Kelas, dan Akun Contoh

1. **Daftar** sebagai guru atau siswa (nama, email, kata sandi). Tidak ada verifikasi email.
2. **Guru** membuat kelas dan mendapat **kode undangan** 6 karakter (Portal Guru → Kelas & Kode). Kode bisa disalin, diganti, dan siswa bisa dikeluarkan.
3. **Siswa** memasukkan kode itu sekali untuk bergabung. Satu akun bisa ikut beberapa kelas; pindah kelas lewat pemilih kelas di navbar.
4. Kelas baru benar-benar kosong. Siswa baru bisa spin setelah guru menerbitkan materi.

**Akun contoh** (sudah berisi kelas XI-IPA 2, 5 materi, 18 topik, jawaban, jurnal, dan diskusi):

| Peran | Email | Kata sandi |
|---|---|---|
| Guru | `guru@spinsight.test` | `spinsight123` |
| Siswa | `siswa@spinsight.test` | `spinsight123` |

Kode kelas contoh: `DEMO26`. Akun siswa baru bisa memakainya untuk mencoba kelas yang sudah berisi data.

## 🏛️ Struktur Direktori

```
spinsight/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx              # Navigasi atas + tab bar HP
│   │   ├── AuthDialog.jsx          # Masuk / daftar + akun contoh
│   │   ├── SlotReel.jsx            # Spin topik bergaya slot + tuas
│   │   ├── TimerRing.jsx           # Timer cincin 120 detik
│   │   ├── Stabilo.jsx             # Highlight klaim/alasan/bukti
│   │   ├── ProgressChart.jsx       # Grafik perkembangan di Jurnal
│   │   ├── KelasPanel.jsx          # Guru: kelas, kode undangan, anggota
│   │   ├── RekapPanel.jsx          # Guru: rekap nilai siswa + detail AI
│   │   ├── MateriForge.jsx         # Guru: materi → topik AI → terbitkan
│   │   ├── BankTopikPanel.jsx      # Guru: kelola topik di spin siswa
│   │   └── ModerasiPanel.jsx       # Guru: tutup diskusi & sintesis kelas
│   ├── context/
│   │   └── AppContext.jsx          # State manajemen siklus tertutup
│   ├── data/
│   │   └── seedData.js             # Data awal materi, kasus, dan telemetri
│   ├── pages/
│   │   ├── LandingPage.jsx         # Landing page & demo spin publik
│   │   ├── DashboardPendamping.jsx # Portal guru: statistik + navigasi modul
│   │   ├── GabungKelas.jsx         # Siswa: masuk kelas dengan kode
│   │   ├── SpinArena.jsx           # Pilar 2 & 3: Roda, rekam, Insight Panel
│   │   ├── ArenaPage.jsx           # Pilar 4: Forum terkunci & Peta Posisi 2D
│   │   ├── ForumDiskusi.jsx        # Forum diskusi kelas
│   │   └── JurnalSiswa.jsx         # Jurnal reflektif 5 dimensi nalar
│   ├── services/
│   │   ├── dataClient.js           # Sesi login + panggilan /api/auth & /api/data
│   │   ├── aiClient.js             # Panggilan ke /api/* + cadangan lokal
│   │   └── aiService.js            # Heuristik lokal (mode cadangan)
│   ├── App.jsx
│   ├── main.jsx
│   ├── lib/                        # argument.js (pemecah stabilo), labels.js, extractText.js, sfx.js
│   ├── hooks/useSpeech.js          # Web Speech API + gelombang mikrofon asli
│   └── index.css                   # Token desain (referensi Miro)
├── api/                            # Vercel Functions: auth, data, topics, analyze, status
├── server/                         # llm.js (AI), handlers.js (rute & prompt), auth.js (login), db.js (data per kelas), index.js (server produksi)
├── supabase/schema.sql             # Schema database + RLS
├── scripts/                        # db-reset.js (reset kelas contoh), test-flow.js (uji alur kelas)
├── .env.example
├── vercel.json
├── index.html
├── package.json
└── vite.config.js
```

---

## 🛡️ Etika & Privasi
- **Minimalisasi Data**: SpinSight tidak menyimpan rekaman suara. Catatan: pengenalan suara Web Speech API di Chrome diproses oleh server Google; yang disimpan SpinSight hanya teks jawabannya. File materi guru dibaca di peramban dan hanya teksnya yang dikirim ke AI.
- **Anti-Klaim Kebenaran Tunggal**: AI tidak pernah memvonis "jawaban benar atau salah", melainkan menyajikan perspektif komparatif dari rujukan ilmiah.
- **Transparansi Rujukan**: Sumber data dibatasi pada whitelist domain akademik resmi.
