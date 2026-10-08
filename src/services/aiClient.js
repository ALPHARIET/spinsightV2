import { aiService } from './aiService';
import { segmentArgument } from '../lib/argument';
import { authedPost } from './dataClient';

const post = (path, body) => authedPost(path, body, 'Server AI tidak merespons');

export async function aiStatus() {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) return { aiAktif: false };
    return await res.json();
  } catch {
    return { aiAktif: false };
  }
}

export function generateTopics({ judul, mapel, teks, jumlah = 8 }) {
  return post('/api/topics', { judul, mapel, teks, jumlah });
}

function localAnalysis({ jawaban, topik, materi }) {
  const seg = segmentArgument(jawaban);
  const pick = (t) => seg.segments.filter((s) => s.type === t).map((s) => s.text);
  const base = aiService.evaluateStudentAnswer(topik, jawaban, materi);
  const poin = materi?.poinKunci || [];
  const matched = base.materi?.poin || [];
  return {
    sumber: 'lokal',
    relevan: jawaban.split(/\s+/).length >= 10,
    kutipan: { klaim: pick('klaim'), alasan: pick('alasan'), bukti: pick('bukti') },
    ringkasan: { klaim: null, alasan: null, bukti: null },
    skor: {
      klaim: seg.has.klaim ? 80 : 40,
      alasan: seg.has.alasan ? 78 : 35,
      bukti: seg.has.bukti ? 75 : 30,
      kejelasan: base.cermin.clarityScore,
      total: base.skor,
    },
    kekuatan: '',
    saran: [base.feedback],
    asumsi: null,
    pertanyaanLanjutan: '',
    materi: {
      dipakai: matched.map((p, i) => (p.disinggung ? { poin: i, kutipan: '' } : null)).filter(Boolean),
      bisaDipakai: matched.map((p, i) => (!p.disinggung ? i : null)).filter((i) => i !== null && i < poin.length),
    },
  };
}

export async function analyzeAnswer(payload) {
  try {
    return await post('/api/analyze', payload);
  } catch (e) {
    if (e.status === 400) throw e;
    const fallback = localAnalysis(payload);
    fallback.catatan = e.message;
    return fallback;
  }
}
