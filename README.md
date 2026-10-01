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
- Node.js 18 ke atas
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

## 🏛️ Struktur Direktori

```
spinsight/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx              # Navigasi atas + tab bar HP
│   │   ├── SlotReel.jsx            # Spin topik bergaya slot + tuas
│   │   ├── MateriForge.jsx         # Guru: materi → topik AI → terbitkan
│   │   ├── Stabilo.jsx             # Highlight klaim/alasan/bukti
│   │   ├── PracticeBits.jsx        # Timer cincin & lampu argumen
│   │   └── ProgressChart.jsx       # Grafik perkembangan di Jurnal
│   ├── context/
│   │   └── AppContext.jsx          # State manajemen siklus tertutup
│   ├── data/
│   │   └── seedData.js             # Data awal materi, kasus, dan telemetri
│   ├── pages/
│   │   ├── LandingPage.jsx         # Landing page & demo spin publik
│   │   ├── DashboardPendamping.jsx # Pilar 1: Case Forge modul guru
│   │   ├── SpinArena.jsx           # Pilar 2 & 3: Roda, rekam, Insight Panel
│   │   ├── ArenaPage.jsx           # Pilar 4: Forum terkunci & Peta Posisi 2D
│   │   └── JurnalSiswa.jsx         # Jurnal reflektif 5 dimensi nalar
│   ├── services/
│   │   ├── aiClient.js             # Panggilan ke /api/* + cadangan lokal
│   │   └── aiService.js            # Heuristik lokal (mode cadangan)
│   ├── App.jsx
│   ├── main.jsx
│   ├── lib/                        # argument.js (pemecah stabilo), labels.js
│   ├── hooks/useSpeech.js          # Web Speech API + gelombang mikrofon asli
│   └── index.css                   # Token desain (referensi Miro)
├── api/                            # Vercel Functions: topics, analyze, status
├── server/                         # llm.js (klien LLM), handlers.js (prompt & validasi), vitePlugin.js
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
