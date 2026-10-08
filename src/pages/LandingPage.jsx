import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, FileText, LockOpen, ShieldCheck, X, GraduationCap, BookOpen, Mic, Upload, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BrandMark } from '../components/BrandMark';
import { StabiloLegend, StabiloText } from '../components/Stabilo';
import { SlotReel } from '../components/SlotReel';
import { TimerRing } from '../components/TimerRing';
import { DEMO_STUDENTS as STUDENTS, GURU_NAMA } from '../data/seedData';

const CONTOH =
  'Menurut saya, larangan plastik di kantin sebaiknya bertahap. Karena kalau langsung dilarang, pedagang kantin yang paling dirugikan. Misalnya, sekolah bisa menyediakan wadah pinjam dulu, baru setelah itu plastik sekali pakai dilarang.';


const Shot = ({ src, alt, style }) => (
  <img src={src} alt={alt} loading="lazy" className="mockup" style={{ width: '100%', height: 'auto', ...style }} />
);

export const LandingPage = () => {
  const { login, cases } = useApp();
  const topics = cases.filter((c) => c.materialId === 'mat-4' || c.materialId === 'mat-1').slice(0, 6).map((c) => ({ id: c.id, label: c.judulKasus }));
  const [demoLock, setDemoLock] = useState(null);
  const reduce = useReducedMotion();
  const [modal, setModal] = useState(false);
  const [role, setRole] = useState('siswa');
  const [nama, setNama] = useState(STUDENTS[0]);

  const cobaSiswa = () => login('siswa', 'Jason Pratama');
  const masukGuru = () => login('pendamping', GURU_NAMA);

  const rise = (d = 0) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.5, delay: d, ease: [0.2, 0.8, 0.2, 1] } };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <header className="topnav">
        <div className="container topnav-inner">
          <a className="brand" href="/" aria-label="SpinSight">
            <BrandMark className="brand-mark" />
            SpinSight
          </a>
          <nav className="navlinks hide-sm" aria-label="Bagian halaman">
            <a className="navlink" href="#cara-kerja">Cara kerja</a>
            <a className="navlink" href="#stabilo">Stabilo argumen</a>
            <a className="navlink" href="#guru">Untuk guru</a>
          </nav>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-ghost hide-sm" onClick={() => setModal(true)}>Masuk</button>
            <button className="btn btn-primary btn-sm" onClick={cobaSiswa}>Coba spin sekarang</button>
          </div>
        </div>
      </header>

      <main>
        <section className="container" style={{ paddingTop: 'calc(var(--nav-h) + clamp(2.5rem, 7vw, 5.5rem))', textAlign: 'center' }}>
          <motion.div {...rise(0)}>
            <h1 className="hero-title" style={{ maxWidth: '20ch', margin: '0 auto', fontSize: 'clamp(2.25rem, 5.6vw, 4.5rem)' }}>
              Latihan <span className="hero-mark">berpendapat</span> yang tidak bisa dicontek AI.
            </h1>
            <p style={{ maxWidth: '38rem', margin: '1.25rem auto 0', fontSize: '1.125rem', color: 'var(--ink-2)' }}>
              Spin satu topik dari materi gurumu, lalu tuangkan pendapatmu dalam 120 detik, diketik atau lewat suara. AI membedah{' '}
              <span className="hl hl-klaim">klaim</span>, <span className="hl hl-alasan">alasan</span>, dan <span className="hl hl-bukti">buktinya</span>.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
              <button className="btn btn-primary btn-lg" onClick={cobaSiswa}>
                Coba spin sekarang <ArrowRight size={18} />
              </button>
              <button className="btn btn-secondary btn-lg" onClick={masukGuru}>Masuk sebagai guru</button>
            </div>
          </motion.div>

          <motion.div {...rise(0.15)} style={{ marginTop: 'clamp(2.5rem, 6vw, 4.5rem)', position: 'relative' }}>
            <Shot src="/shots/latihan.webp" alt="Halaman Latihan SpinSight: spin topik dari materi guru" />
          </motion.div>
        </section>

        <section id="cara-kerja" className="container" style={{ paddingTop: 'clamp(4rem, 10vw, 7.5rem)' }}>
          <motion.div {...rise()} style={{ maxWidth: '40rem' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)' }}>Dari bab pelajaran ke argumen, dalam tiga menit.</h2>
            <p style={{ marginTop: '0.75rem', fontSize: '1.125rem', color: 'var(--ink-2)' }}>
              Cukup untuk dilakukan di awal pelajaran, sebelum diskusi kelas dimulai.
            </p>
          </motion.div>

          <div className="bento">
            <motion.article {...rise(0)} className="card-blue bento-b">
              <div className="bento-copy">
                <h3>1. Guru unggah materi</h3>
                <p>PDF, DOCX, atau teks bab yang sedang diajarkan. AI menyusunnya jadi topik yang bisa diperdebatkan, guru memilih mana yang dipakai.</p>
              </div>
              <div style={{ marginTop: 'auto', display: 'grid', gap: 8 }} aria-hidden="true">
                <span className="card" style={{ padding: '0.8rem 1rem', display: 'flex', gap: 10, alignItems: 'center' }}><Upload size={18} /> Bab 5 Sampah Plastik.pdf</span>
                <span className="card" style={{ padding: '0.8rem 1rem', display: 'flex', gap: 10, alignItems: 'center' }}><Sparkles size={18} /> 8 topik disusun AI</span>
              </div>
            </motion.article>

            <motion.article {...rise(0.08)} className="card-yellow bento-a">
              <div className="bento-copy">
                <h3>2. Siswa spin, sekali saja</h3>
                <p>Topik yang keluar harus dijawab. Tidak bisa diputar ulang untuk mencari yang gampang. Coba tarik tuasnya.</p>
              </div>
              <div className="card" style={{ marginTop: 'auto', padding: '0.5rem 1rem' }}>
                <SlotReel items={topics} compact locked={Boolean(demoLock)} landedId={demoLock} onSpinStart={(it) => setDemoLock(it.id)} />
                {demoLock && (
                  <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--muted)', paddingBottom: '0.5rem' }}>
                    Topik terkunci. <button className="btn btn-sm btn-ghost" onClick={() => setDemoLock(null)}>Ulangi demo</button>
                  </p>
                )}
              </div>
            </motion.article>

            <motion.article {...rise(0)} className="card-rose bento-a">
              <div className="bento-copy">
                <h3>3. 120 detik untuk menuangkan pikiran</h3>
                <p>Ketik di kolom jawaban, atau tekan tombol suara dan ucapanmu langsung jadi teks. Saat waktu habis, jawaban otomatis dikirim.</p>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', gap: '1.5rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }} aria-hidden="true">
                <TimerRing left={74} total={120} />
                <span className="btn btn-secondary btn-lg" style={{ background: 'var(--surface)', cursor: 'default' }}><Mic size={18} /> Pakai suara</span>
              </div>
            </motion.article>

            <motion.article {...rise(0.08)} className="card-green bento-b">
              <div className="bento-copy">
                <h3>4. Dibedah AI</h3>
                <p>Klaim, alasan, dan bukti distabilo, lengkap dengan saran dan poin materi yang bisa memperkuat jawabanmu.</p>
              </div>
              <div className="card" style={{ marginTop: 'auto', padding: '1rem' }}>
                <StabiloText text={CONTOH} size="0.9375rem" lineHeight={1.7} />
              </div>
            </motion.article>
          </div>
        </section>

        <section id="stabilo" className="container" style={{ paddingTop: 'clamp(4rem, 10vw, 7.5rem)' }}>
          <div className="split">
            <motion.div {...rise()}>
              <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)' }}>Tiga warna yang kamu ingat sampai ujian.</h2>
              <p style={{ marginTop: '1rem', fontSize: '1.125rem', color: 'var(--ink-2)' }}>
                Kuning untuk pendapatmu. Biru untuk alasannya. Hijau untuk buktinya. Warna yang sama muncul di latihan, forum, dan jurnal, jadi struktur argumen jadi kebiasaan.
              </p>
              <p style={{ marginTop: '1rem', color: 'var(--ink-2)' }}>
                AI tidak memberi vonis benar atau salah. Ia hanya menunjukkan bagian mana yang sudah ada dan mana yang masih kosong.
              </p>
            </motion.div>
            <motion.div {...rise(0.1)} className="card-feature" style={{ padding: 'clamp(1.5rem, 3vw, 2.25rem)', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <span className="eyebrow">Contoh jawaban siswa</span>
                <StabiloLegend />
              </div>
              <StabiloText text={CONTOH} animate={!reduce} />
            </motion.div>
          </div>
        </section>

        <section id="guru" className="container" style={{ paddingTop: 'clamp(4rem, 10vw, 7.5rem)' }}>
          <div className="split split-rev">
            <motion.div {...rise(0.1)}>
              <Shot src="/shots/guru.webp" alt="Portal Guru SpinSight: rekap penilaian argumen siswa" />
            </motion.div>
            <motion.div {...rise()}>
              <span className="badge"><FileText size={14} /> Untuk guru</span>
              <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)', marginTop: '1rem' }}>Unggah bab. Topiknya tersusun sendiri.</h2>
              <p style={{ marginTop: '1rem', fontSize: '1.125rem', color: 'var(--ink-2)' }}>
                Kirim PDF, DOCX, atau teks materi. AI menyusun topik bertingkat yang bisa kamu sunting, lalu setiap umpan balik ke siswa merujuk ke poin dan halaman materimu sendiri.
              </p>
              <button className="btn btn-secondary btn-lg" style={{ marginTop: '1.75rem' }} onClick={masukGuru}>
                Masuk sebagai guru <ArrowRight size={18} />
              </button>
            </motion.div>
          </div>
        </section>

        <section className="container" style={{ paddingTop: 'clamp(4rem, 10vw, 7.5rem)' }}>
          <div className="grid-2">
            <motion.div {...rise()} className="card-feature" style={{ padding: 'clamp(1.5rem, 3vw, 2.25rem)' }}>
              <LockOpen size={26} />
              <h3 style={{ fontSize: '1.375rem', marginTop: '1rem' }}>Pendapatmu dulu, baru pendapat teman</h3>
              <p style={{ marginTop: '0.5rem', color: 'var(--ink-2)' }}>
                Forum kasus terkunci sampai kamu menyelesaikan latihanmu sendiri. Tidak ada yang bisa sekadar ikut-ikutan.
              </p>
            </motion.div>
            <motion.div {...rise(0.08)} className="card-feature" style={{ padding: 'clamp(1.5rem, 3vw, 2.25rem)' }}>
              <ShieldCheck size={26} />
              <h3 style={{ fontSize: '1.375rem', marginTop: '1rem' }}>Suaramu tidak disimpan</h3>
              <p style={{ marginTop: '0.5rem', color: 'var(--ink-2)' }}>
                SpinSight tidak menyimpan rekaman suara. Yang disimpan hanya teks transkripnya, dan hanya kamu serta gurumu yang bisa melihat skornya.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="container" style={{ padding: 'clamp(4rem, 10vw, 7.5rem) 1rem' }}>
          <motion.div {...rise()} className="cta-yellow">
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', maxWidth: '16ch', margin: '0 auto' }}>Satu topik sudah menunggu untuk kamu jawab.</h2>
            <button className="btn btn-primary btn-lg" style={{ marginTop: '2rem' }} onClick={cobaSiswa}>
              Coba spin sekarang <ArrowRight size={18} />
            </button>
          </motion.div>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid var(--line)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', padding: '1.75rem 1rem' }}>
          <span className="brand" style={{ fontSize: '1rem' }}>
            <BrandMark size={24} /> SpinSight
          </span>
          <span className="muted" style={{ fontSize: '0.875rem' }}>Tim SpinSight · Web Development Competition RafaTech 2026</span>
        </div>
      </footer>

      {modal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Masuk ke SpinSight"
          onClick={(e) => e.target === e.currentTarget && setModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(5, 0, 56, 0.35)', display: 'grid', placeItems: 'center', padding: '1rem' }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 420, padding: '1.75rem', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
            <button className="btn btn-ghost btn-icon" style={{ position: 'absolute', top: 12, right: 12 }} onClick={() => setModal(false)} aria-label="Tutup">
              <X size={18} />
            </button>
            <BrandMark size={36} />
            <h2 style={{ fontSize: '1.5rem', marginTop: '1rem' }}>Masuk ke SpinSight</h2>
            <p className="muted" style={{ marginTop: '0.25rem' }}>Akun demo, tanpa kata sandi.</p>

            <div className="toggle" role="group" aria-label="Peran" style={{ marginTop: '1.25rem', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <button aria-pressed={role === 'siswa'} onClick={() => setRole('siswa')} style={{ justifyContent: 'center' }}>
                <GraduationCap size={16} /> Siswa
              </button>
              <button aria-pressed={role === 'guru'} onClick={() => setRole('guru')} style={{ justifyContent: 'center' }}>
                <BookOpen size={16} /> Guru
              </button>
            </div>

            {role === 'siswa' ? (
              <label style={{ display: 'block', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Pilih siswa</span>
                <select className="select-custom" style={{ marginTop: '0.4rem' }} value={nama} onChange={(e) => setNama(e.target.value)}>
                  {STUDENTS.map((s) => <option key={s} value={s}>{s} · XI-IPA 2</option>)}
                </select>
              </label>
            ) : (
              <p style={{ marginTop: '1rem', color: 'var(--ink-2)' }}>Masuk sebagai Dra. Sri Wahyuni, M.Pd., wali kelas XI-IPA 2.</p>
            )}

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '1.25rem' }}
              onClick={() => (role === 'guru' ? masukGuru() : login('siswa', nama))}
            >
              Masuk <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
