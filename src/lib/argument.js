const REASON_START = /^(karena|sebab|dikarenakan|oleh sebab|alasannya|pasalnya|mengingat|hal ini (?:karena|disebabkan)|ini karena)\b/i;
const EVIDENCE_START = /^(misalnya|contohnya|sebagai contoh|sebagai bukti|buktinya|faktanya|menurut (?:data|laporan|studi|riset|survei)|berdasarkan (?:data|laporan|studi|riset|survei)|data |studi |riset |survei |laporan )/i;
const EVIDENCE_ANY = /(\d+\s?%|\d{4}|\bstudi\b|\briset\b|\bsurvei\b|\bdata\b|\blaporan\b|\bpenelitian\b|\bunesco\b|\bpisa\b|\bcontoh(?:nya)?\b|\bmisalnya\b)/i;
const CLAIM_ANY = /(menurut saya|saya berpendapat|bagi saya|saya (?:tidak )?(?:setuju|sepakat)|seharusnya|sebaiknya|harus|wajib|keliru|solusi(?:nya)? (?:yang )?(?:adil|tepat|terbaik))/i;

const SPLIT_BEFORE = /\s*,?\s+(?=(?:karena|sebab|dikarenakan|alasannya|pasalnya|mengingat|misalnya|contohnya|sebagai contoh|sebagai bukti|buktinya|faktanya)\b)/gi;

export function segmentArgument(text = '') {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (!clean) return { segments: [], has: { klaim: false, alasan: false, bukti: false } };

  const sentences = clean.match(/[^.!?]+[.!?]*/g) || [clean];
  const segments = [];

  sentences.forEach((sentence) => {
    const parts = sentence.trim().split(SPLIT_BEFORE).filter(Boolean);
    parts.forEach((raw) => {
      const part = raw.trim();
      let type = null;
      if (REASON_START.test(part)) type = 'alasan';
      else if (EVIDENCE_START.test(part)) type = 'bukti';
      else if (CLAIM_ANY.test(part)) type = 'klaim';
      else if (EVIDENCE_ANY.test(part)) type = 'bukti';
      segments.push({ text: part, type });
    });
  });

  if (!segments.some((s) => s.type === 'klaim')) {
    const first = segments.find((s) => s.type === null);
    if (first) first.type = 'klaim';
  }

  const has = {
    klaim: segments.some((s) => s.type === 'klaim'),
    alasan: segments.some((s) => s.type === 'alasan'),
    bukti: segments.some((s) => s.type === 'bukti'),
  };

  return { segments, has };
}

export const PART_META = {
  klaim: {
    label: 'Klaim',
    tanya: 'Apa pendapatmu?',
    kosong: 'Pendapat utamamu belum jelas. Coba mulai dengan “Menurut saya…”.',
  },
  alasan: {
    label: 'Alasan',
    tanya: 'Kenapa begitu?',
    kosong: 'Alasannya belum ada. Sambungkan klaimmu dengan “karena…”.',
  },
  bukti: {
    label: 'Bukti',
    tanya: 'Apa buktinya?',
    kosong: 'Buktinya belum ada. Tambahkan satu contoh nyata, data, atau pengalaman.',
  },
};

export function segmentsFromQuotes(text = '', kutipan = {}) {
  const src = String(text);
  const lower = src.toLowerCase();
  const ranges = [];
  ['klaim', 'alasan', 'bukti'].forEach((type) => {
    (kutipan[type] || []).forEach((q) => {
      const needle = String(q || '').trim();
      if (needle.length < 3) return;
      let at = lower.indexOf(needle.toLowerCase());
      let len = needle.length;
      if (at < 0) {
        const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+').replace(/["“”']/g, '["“”\']?');
        const m = new RegExp(esc, 'i').exec(src);
        if (!m) return;
        at = m.index;
        len = m[0].length;
      }
      ranges.push({ start: at, end: at + len, type });
    });
  });
  ranges.sort((a, b) => a.start - b.start || b.end - a.end);
  const clean = [];
  ranges.forEach((r) => {
    const last = clean[clean.length - 1];
    if (!last || r.start >= last.end) clean.push(r);
  });
  const segments = [];
  let cur = 0;
  clean.forEach((r) => {
    if (r.start > cur) segments.push({ text: src.slice(cur, r.start), type: null });
    segments.push({ text: src.slice(r.start, r.end), type: r.type });
    cur = r.end;
  });
  if (cur < src.length) segments.push({ text: src.slice(cur), type: null });
  const has = { klaim: false, alasan: false, bukti: false };
  clean.forEach((r) => { has[r.type] = true; });
  return { segments, has, raw: true };
}
