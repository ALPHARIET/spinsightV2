import { chatJSON, LLMError, llmConfig } from './llm.js';
import { dbConfig, handleData, ensureSeeded } from './db.js';
import { handleAuth, userFromToken } from './auth.js';

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));
const FOREIGN_SCRIPT = /[\p{Script_Extensions=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Cyrillic}]+/gu;
const str = (v, max = 600) => (typeof v === 'string' ? v.replace(FOREIGN_SCRIPT, ' ').replace(/，/g, ', ').replace(/\s+([,.])/g, '$1').replace(/\s{2,}/g, ' ').trim().slice(0, max) : '');
const arr = (v) => (Array.isArray(v) ? v : []);
const LEVELS = ['Analisis', 'Evaluasi', 'Kreasi'];

const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').replace(/[“”"']/g, '').trim();

function keepVerbatim(quotes, answer) {
  const hay = norm(answer);
  return arr(quotes)
    .map((q) => str(q, 400))
    .filter((q) => q.length >= 3 && hay.includes(norm(q)));
}

const TOPICS_SYSTEM = `Kamu adalah perancang bahan ajar berpikir kritis untuk siswa SMA/SMK/MA di Indonesia.
Tugasmu: membaca materi dari guru lalu menyusun TOPIK latihan berargumen yang bisa diputar acak oleh siswa.

Aturan topik:
- Setiap topik harus bisa diperdebatkan: tidak punya satu jawaban benar, siswa harus memilih posisi dan memberi alasan.
- Topik harus berakar pada isi materi, bukan pengetahuan umum yang tidak dibahas.
- Pakai konteks yang dekat dengan kehidupan siswa Indonesia (sekolah, keluarga, kota mereka, media sosial).
- "judul" adalah kalimat tantangan singkat (maks. 90 karakter), berupa pertanyaan atau pernyataan untuk dibela/ditolak.
- "konteks" 2 sampai 3 kalimat yang menjelaskan situasi atau dilemanya.
- Sebar tingkat: Analisis (membedah sebab/akibat, asumsi), Evaluasi (menimbang dan memutuskan), Kreasi (merancang solusi).
- Bahasa Indonesia yang baku tapi ramah remaja. Semua teks WAJIB berbahasa Indonesia, jangan campur bahasa Inggris, Mandarin, atau aksara lain.
- Jangan pakai tanda pisah panjang (—).

Poin kunci:
- 4 sampai 6 gagasan terpenting dari materi, masing-masing 1 kalimat.
- Jika teks memuat penanda halaman seperti [hlm. 12], isi "halaman" dengan angka itu; jika tidak, null.
- "kataKunci" berisi 2 sampai 5 kata/frasa pendek (huruf kecil) yang menandai poin itu, untuk dicocokkan dengan jawaban siswa.

Balas HANYA dengan JSON sesuai skema:
{
  "topikRoda": "nama topik singkat maks 18 karakter",
  "ringkasan": "2 kalimat ringkasan materi",
  "poinKunci": [{ "teks": "...", "halaman": 12, "kataKunci": ["..."] }],
  "topik": [{ "judul": "...", "konteks": "...", "level": "Analisis|Evaluasi|Kreasi", "kataKunci": ["...", "...", "..."], "poinTerkait": [0, 2] }]
}`;

export async function generateTopics(input, env) {
  const judul = str(input?.judul, 200);
  const mapel = str(input?.mapel, 80);
  const teks = str(input?.teks, 24000);
  const jumlah = Math.min(12, Math.max(4, Number(input?.jumlah) || 8));
  if (!judul) throw new LLMError('Judul materi wajib diisi.', 400);
  if (teks.length < 200) throw new LLMError('Teks materi terlalu pendek (minimal sekitar 200 karakter).', 400);

  const out = await chatJSON(
    {
      system: TOPICS_SYSTEM,
      user: `Judul materi: ${judul}\nMata pelajaran: ${mapel || '-'}\nBuat tepat ${jumlah} topik.\n\n=== ISI MATERI ===\n${teks}`,
      temperature: 0.7,
      reasoningEffort: 'none',
      maxTokens: 16000,
    },
    env
  );

  const poinKunci = arr(out.poinKunci)
    .slice(0, 6)
    .map((p) => ({
      teks: str(p?.teks, 300),
      halaman: Number.isFinite(Number(p?.halaman)) && p?.halaman !== null ? Number(p.halaman) : null,
      kata: arr(p?.kataKunci).map((k) => str(k, 40).toLowerCase()).filter(Boolean).slice(0, 5),
    }))
    .filter((p) => p.teks);

  const topik = arr(out.topik)
    .slice(0, jumlah)
    .map((t) => ({
      judulKasus: str(t?.judul, 140),
      teksKasus: str(t?.konteks, 700),
      levelBloom: LEVELS.includes(t?.level) ? t.level : 'Evaluasi',
      kataKunci: arr(t?.kataKunci).map((k) => str(k, 40)).filter(Boolean).slice(0, 4),
      poinTerkait: arr(t?.poinTerkait).map(Number).filter((i) => Number.isInteger(i) && i >= 0 && i < poinKunci.length),
    }))
    .filter((t) => t.judulKasus && t.teksKasus);

  if (!topik.length) throw new LLMError('AI tidak menghasilkan topik. Coba lagi atau periksa isi materi.', 502);

  return {
    topikRoda: str(out.topikRoda, 18) || judul.replace(/^Bab\s*\d+\s*:\s*/i, '').split(/\s+/).slice(0, 2).join(' '),
    ringkasan: str(out.ringkasan, 500),
    poinKunci,
    topik,
    model: out._model,
  };
}

const ANALYZE_SYSTEM = `Kamu adalah pelatih argumentasi untuk siswa SMA di Indonesia. Kamu membaca jawaban siswa atas sebuah topik
(ditulis atau hasil transkrip suara dalam 120 detik) lalu membedah strukturnya dengan model Toulmin sederhana:
- KLAIM: posisi/pendapat utama siswa.
- ALASAN: mengapa klaim itu benar (hubungan sebab-akibat, prinsip).
- BUKTI: contoh nyata, data, fakta, pengalaman, atau rujukan yang mendukung.

Prinsip penting:
- NON-DOGMATIS: jangan menilai posisi siswa benar atau salah. Nilai hanya kekuatan struktur dan penalarannya.
- Kutipan di "kutipan" WAJIB disalin persis kata demi kata dari jawaban siswa (substring), jangan diparafrasekan.
  Jika suatu bagian tidak ada, kembalikan array kosong.
- Jawaban dari suara bisa tanpa tanda baca dan ada kata pengisi; jangan hukum itu di klaim/alasan/bukti, cukup di "kejelasan".
- Umpan balik memakai "kamu", spesifik merujuk kata-kata siswa, maksimal 2 kalimat per butir, nada menyemangati.
- Setiap skor adalah bilangan bulat 0 sampai 100 (bukan skala 1-5 atau 1-10). Pedoman: 0-39 belum ada, 40-69 ada tapi lemah, 70-84 cukup kuat, 85-100 sangat kuat.
- Jika jawaban tidak menjawab topik atau kurang dari 10 kata, set "relevan": false dan beri skor rendah.
- Gunakan poin kunci materi guru untuk menilai keterkaitan. "materi.dipakai" = indeks poin yang sudah disinggung siswa
  (beserta kutipan persis dari jawaban). "materi.bisaDipakai" = indeks poin yang relevan untuk memperkuat jawabannya.
- Semua teks (ringkasan, kekuatan, saran, asumsi, pertanyaan) WAJIB berbahasa Indonesia, jangan campur bahasa Inggris, Mandarin, atau aksara lain.
- Jangan pakai tanda pisah panjang (—).

Balas HANYA dengan JSON sesuai skema:
{
  "relevan": true,
  "kutipan": { "klaim": ["..."], "alasan": ["..."], "bukti": ["..."] },
  "ringkasan": { "klaim": "... atau null", "alasan": "... atau null", "bukti": "... atau null" },
  "skor": { "klaim": 0-100, "alasan": 0-100, "bukti": 0-100, "kejelasan": 0-100 },
  "kekuatan": "satu hal yang sudah bagus",
  "saran": ["saran konkret 1", "saran konkret 2"],
  "asumsi": "asumsi tersembunyi yang belum diuji, atau null",
  "pertanyaanLanjutan": "satu pertanyaan dari sudut pandang berlawanan untuk menguji argumen",
  "materi": { "dipakai": [{ "poin": 0, "kutipan": "..." }], "bisaDipakai": [1, 3] }
}`;

export async function analyzeAnswer(input, env) {
  const jawaban = str(input?.jawaban, 5000);
  const topik = input?.topik || {};
  const materi = input?.materi || {};
  if (!jawaban || jawaban.split(/\s+/).length < 3) throw new LLMError('Jawaban terlalu pendek untuk dianalisis.', 400);

  const poinKunci = arr(materi.poinKunci).slice(0, 8).map((p) => str(p?.teks, 300)).filter(Boolean);

  const out = await chatJSON(
    {
      system: ANALYZE_SYSTEM,
      user: [
        `TOPIK: ${str(topik.judulKasus, 200)}`,
        `KONTEKS: ${str(topik.teksKasus, 800)}`,
        `TINGKAT: ${str(topik.levelBloom, 20)}`,
        `SUMBER JAWABAN: ${input?.lewatSuara ? 'transkrip suara' : 'ketikan'}, ${Number(input?.durasiDetik) || 0} detik`,
        `MATERI GURU: ${str(materi.judul, 200) || '-'}`,
        'POIN KUNCI MATERI:',
        ...(poinKunci.length ? poinKunci.map((p, i) => `[${i}] ${p}`) : ['(tidak ada)']),
        '',
        '=== JAWABAN SISWA ===',
        jawaban,
      ].join('\n'),
      temperature: 0.3,
      maxTokens: 8000,
    },
    env
  );

  const kutipan = {
    klaim: keepVerbatim(out?.kutipan?.klaim, jawaban),
    alasan: keepVerbatim(out?.kutipan?.alasan, jawaban),
    bukti: keepVerbatim(out?.kutipan?.bukti, jawaban),
  };
  const relevan = out?.relevan !== false;
  const raw = ['klaim', 'alasan', 'bukti', 'kejelasan'].map((k) => Number(out?.skor?.[k]) || 0);
  const top = Math.max(...raw);
  const scale = relevan && top > 0 && top <= 10 ? 100 / (top <= 5 ? 5 : 10) : 1;
  const [klaim, alasan, bukti, kejelasan] = raw.map((v) => clamp(v * scale));
  const skor = { klaim, alasan, bukti, kejelasan };
  const total = clamp(skor.klaim * 0.3 + skor.alasan * 0.3 + skor.bukti * 0.25 + skor.kejelasan * 0.15);

  const idxOk = (i) => Number.isInteger(i) && i >= 0 && i < poinKunci.length;
  const dipakai = arr(out?.materi?.dipakai)
    .map((d) => ({ poin: Number(d?.poin), kutipan: keepVerbatim([d?.kutipan], jawaban)[0] || '' }))
    .filter((d) => idxOk(d.poin));
  const dipakaiIdx = new Set(dipakai.map((d) => d.poin));
  const bisaDipakai = arr(out?.materi?.bisaDipakai).map(Number).filter((i) => idxOk(i) && !dipakaiIdx.has(i));

  return {
    sumber: 'ai',
    model: out._model,
    relevan,
    kutipan,
    ringkasan: {
      klaim: str(out?.ringkasan?.klaim, 300) || null,
      alasan: str(out?.ringkasan?.alasan, 300) || null,
      bukti: str(out?.ringkasan?.bukti, 300) || null,
    },
    skor: { ...skor, total: relevan ? total : Math.min(total, 40) },
    kekuatan: str(out?.kekuatan, 400),
    saran: arr(out?.saran).map((s) => str(s, 400)).filter(Boolean).slice(0, 3),
    asumsi: str(out?.asumsi, 400) || null,
    pertanyaanLanjutan: str(out?.pertanyaanLanjutan, 400),
    materi: { dipakai, bisaDipakai },
  };
}

const hits = new Map();
function rateLimited(key, limit = 30, windowMs = 60000) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > limit;
}

const LIMITS = { data: 240, auth: 20, topics: 30, analyze: 30 };

// token = isi header Authorization tanpa awalan "Bearer ".
export async function handleApi(route, { method, body, ip, token }, env = process.env) {
  if (route === 'status') {
    const cfg = llmConfig(env);
    const db = dbConfig(env);
    return { status: 200, json: { aiAktif: Boolean(cfg.apiKey), model: cfg.model, dbAktif: Boolean(db.url && db.key) } };
  }
  if (method !== 'POST') return { status: 405, json: { error: 'Gunakan POST.' } };
  if (!LIMITS[route]) return { status: 404, json: { error: 'Endpoint tidak ditemukan.' } };
  if (rateLimited(`${route}:${ip || 'local'}`, LIMITS[route])) {
    return { status: 429, json: { error: 'Terlalu banyak permintaan. Tunggu sebentar.' } };
  }
  try {
    await ensureSeeded(env);
    if (route === 'auth') return { status: 200, json: await handleAuth(body, env) };
    // Semua fitur lain butuh login, termasuk AI, supaya kuota AI tidak bisa dipakai orang luar.
    const user = await userFromToken(token, env);
    if (route === 'data') return { status: 200, json: await handleData(body, user, env) };
    if (route === 'topics') {
      if (user.role !== 'pendamping') return { status: 403, json: { error: 'Hanya guru yang bisa membuat topik.' } };
      return { status: 200, json: await generateTopics(body, env) };
    }
    return { status: 200, json: await analyzeAnswer(body, env) };
  } catch (e) {
    const status = Number.isInteger(e.status) ? e.status : 500;
    if (!Number.isInteger(e.status)) console.error('[api]', e);
    return { status, json: { error: e.message || 'Terjadi kesalahan.' } };
  }
}
