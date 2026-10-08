export const BLOOM = {
  Analisis: { nama: 'Membedah', ket: 'Analisis', cls: 'badge-bloom-analisis' },
  Evaluasi: { nama: 'Menimbang', ket: 'Evaluasi', cls: 'badge-bloom-evaluasi' },
  Kreasi: { nama: 'Merancang', ket: 'Kreasi', cls: 'badge-bloom-kreasi' },
};

export const bloomOf = (level) => BLOOM[level] || BLOOM.Analisis;

export const KKM = 75;
export const SKOR_SANGAT_BAIK = 85;

export const scoreTone = (skor) => (skor >= SKOR_SANGAT_BAIK ? 'bukti' : skor >= KKM ? 'alasan' : 'klaim');

const AVATAR_COLORS = ['#FFD02F', '#FFC6C6', '#C3FAF5', '#DDE3FF', '#FFE6CD', '#FFD8F4', '#D5F2C8'];

export const colorFor = (str = '') => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

const pad = (n) => String(n).padStart(2, '0');

export const stamp = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const formatTanggal = (s, withTime = true) => {
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d)) return s || '';
  const tgl = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  return withTime ? `${tgl}, ${pad(d.getHours())}:${pad(d.getMinutes())}` : tgl;
};

export const isGuru = (user) => user?.role === 'pendamping' || user?.role === 'guru';

export const initials = (nama = '') =>
  nama
    .replace(/^(dra?|dr|ir|prof)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export const REPLY_LABELS = {
  Menguatkan: { bg: 'var(--alasan-soft)', bar: 'var(--alasan)', ink: 'var(--alasan-ink)' },
  Menyanggah: { bg: 'var(--rose-soft)', bar: 'var(--rose)', ink: 'var(--rose-ink)' },
  Bertanya: { bg: 'var(--lavender-soft)', bar: 'var(--lavender)', ink: 'var(--lavender-ink)' },
  'Menambah bukti': { bg: 'var(--bukti-soft)', bar: 'var(--bukti)', ink: 'var(--bukti-ink)' },
};

export const topicOf = (m) =>
  (m && (m.topik || (m.judul || '').replace(/^Bab\s*\d+\s*:\s*/i, '').split(/\s+/).slice(0, 2).join(' '))) || 'Topik';
