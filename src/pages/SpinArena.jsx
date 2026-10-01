import React, { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Mic,
  Square,
  Volume2,
  VolumeX,
  ArrowRight,
  Lock,
  LockOpen,
  FileText,
  Check,
  Plus,
  Sparkles,
  Lightbulb,
  HelpCircle,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SlotReel } from '../components/SlotReel';
import { StabiloLegend, StabiloText } from '../components/Stabilo';
import { TimerRing } from '../components/TimerRing';
import { useSpeech } from '../hooks/useSpeech';
import { PART_META } from '../lib/argument';
import { bloomOf, topicOf } from '../lib/labels';
import { aiStatus } from '../services/aiClient';

const WAKTU = 120;

const words = (t) => (t.trim() ? t.trim().split(/\s+/).length : 0);

const STEPS = ['Spin topik', 'Tuangkan pikiran', 'Dibedah AI'];
const Steps = ({ at }) => (
  <div className="steps" aria-label={`Langkah ${at + 1} dari 3`}>
    {STEPS.map((s, i) => (
      <React.Fragment key={s}>
        {i > 0 && <b />}
        <span data-on={i === at} data-done={i < at}>
          <i>{i < at ? <Check size={13} strokeWidth={3} /> : i + 1}</i>
          <span className="hide-sm">{s}</span>
        </span>
      </React.Fragment>
    ))}
  </div>
);

const ScoreRow = ({ label, value, color }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 6 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span className="legend-swatch" style={{ background: color }} /> {label}
      </span>
      <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
    <div className="score-bar"><i style={{ width: `${value}%`, background: 'var(--ink)' }} /></div>
  </div>
);

export const SpinArena = () => {
  const { cases, materials, currentUser, spinSession, lockSpin, beginAnswer, clearSpin, submitAnswer, setActivePage, arenaPosts } = useApp();
  const reduce = useReducedMotion();

  const [muted, setMuted] = useState(false);
  const [landed, setLanded] = useState(Boolean(spinSession));
  const [answer, setAnswer] = useState('');
  const [usedVoice, setUsedVoice] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [phase, setPhase] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [ai, setAi] = useState(null);
  const reelRef = useRef(null);
  const topRef = useRef(null);
  const submitting = useRef(false);

  useEffect(() => { aiStatus().then(setAi); }, []);

  const materiList = useMemo(
    () => materials.filter((m) => m.status !== 'draf' && cases.some((c) => c.materialId === m.id && c.aktif)),
    [materials, cases]
  );
  const materiUrut = useMemo(() => {
    const bab = (m) => Number((m.judul || '').match(/^\s*bab\s*(\d+)/i)?.[1] ?? Infinity);
    return [...materiList].sort((a, b) => bab(a) - bab(b));
  }, [materiList]);
  const [materiId, setMateriId] = useState(() => spinSession?.materialId || materiList[0]?.id || '');
  useEffect(() => {
    if (!materiList.some((m) => m.id === materiId) && materiList[0]) setMateriId(materiList[0].id);
  }, [materiList, materiId]);

  const pool = useMemo(
    () => cases.filter((c) => c.aktif && c.materialId === materiId),
    [cases, materiId]
  );
  const items = pool.map((c) => ({ id: c.id, label: c.judulKasus }));

  const mine = spinSession && spinSession.userId === currentUser?.id ? spinSession : null;
  const kasus = mine ? cases.find((c) => c.id === mine.caseId) : null;
  const session = kasus ? mine : null;
  const locked = Boolean(session);
  const materi = kasus ? materials.find((m) => m.id === kasus.materialId) : materials.find((m) => m.id === materiId);
  const stage = result ? 'hasil' : session?.startedAt ? 'jawab' : 'spin';

  useEffect(() => {
    if (mine && !kasus) {
      clearSpin();
      setLanded(false);
    }
  }, [mine, kasus, clearSpin]);

  const left = session?.startedAt ? Math.max(0, WAKTU - Math.floor((now - session.startedAt) / 1000)) : WAKTU;
  useEffect(() => {
    if (stage !== 'jawab') return undefined;
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [stage]);

  const speech = useSpeech({
    onFinal: (t) => {
      setUsedVoice(true);
      setAnswer((prev) => (prev.trim() ? prev.trim() + ' ' : '') + t);
    },
  });
  const live = speech.recording && speech.interim ? `${answer}${answer ? ' ' : ''}${speech.interim}` : answer;
  const timeUp = stage === 'jawab' && left <= 0;

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });

  const kirim = async () => {
    if (submitting.current || !session) return;
    const text = answer.trim();
    if (words(text) < 3) {
      setError('Tulis atau ucapkan minimal satu kalimat dulu.');
      return;
    }
    submitting.current = true;
    speech.stop();
    setError('');
    setPhase('loading');
    scrollTop();
    try {
      const durasi = Math.min(WAKTU, Math.round((Date.now() - session.startedAt) / 1000));
      const res = await submitAnswer({ caseId: session.caseId, jawaban: text, durasiDetik: durasi, lewatSuara: usedVoice });
      setResult(res);
      setPhase('done');
      clearSpin();
      const s = res.ai.skor;
      if (!reduce && res.ai.kutipan.klaim.length && res.ai.kutipan.alasan.length && res.ai.kutipan.bukti.length && s.total >= 70) {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.3 }, colors: ['#FFE066', '#A6CCF5', '#A8E6A1', '#FFD02F'] });
      }
    } catch (e) {
      setPhase('error');
      setError(e.message || 'Gagal menganalisis jawaban.');
    } finally {
      submitting.current = false;
    }
  };

  useEffect(() => {
    if (timeUp && phase === 'idle') {
      speech.stop();
      if (words(answer) >= 3) kirim();
    }
  }, [timeUp]);

  const latihanBaru = () => {
    speech.stop();
    clearSpin();
    setResult(null);
    setAnswer('');
    setUsedVoice(false);
    setPhase('idle');
    setError('');
    setLanded(false);
    scrollTop();
  };

  const fade = reduce
    ? {}
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.25, ease: [0.2, 0.8, 0.2, 1] } };

  const spinView = (
    <motion.section key="spin" {...fade} className="stage" style={{ padding: 'clamp(1.25rem, 4vw, 3rem)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
        <Steps at={0} />
        <button className="btn btn-sm btn-secondary btn-icon" style={{ background: 'var(--surface)' }} onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Nyalakan suara' : 'Matikan suara'}>
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      <div className="practice-grid">
        <div>
          <h1 style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)' }}>Satu putaran. Satu topik. Dua menit.</h1>
          <ol className="howto">
            <li><b style={{ background: 'var(--klaim)' }}>1</b><span>Pilih materi dari gurumu, lalu spin. Kamu hanya punya <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>satu kali</strong> putaran.</span></li>
            <li><b style={{ background: 'var(--alasan)' }}>2</b><span>Tuangkan pikiranmu dalam 120 detik. Boleh diketik, boleh pakai suara.</span></li>
            <li><b style={{ background: 'var(--bukti)' }}>3</b><span>AI membedah klaim, alasan, dan buktimu, lalu mengaitkannya dengan materi.</span></li>
          </ol>
        </div>

        <div className="card" style={{ padding: 'clamp(1rem, 3vw, 1.75rem)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <label className="sr-only" htmlFor="pilih-materi">Materi</label>
            <select id="pilih-materi" className="select-pill select-materi" value={session?.materialId || materiId} onChange={(e) => setMateriId(e.target.value)} disabled={locked}>
              {materiUrut.map((m) => (
                <option key={m.id} value={m.id}>{m.judul}</option>
              ))}
            </select>
          </div>

          <SlotReel
            ref={reelRef}
            items={locked && kasus && !items.some((i) => i.id === kasus.id) ? cases.filter((c) => c.materialId === kasus.materialId).map((c) => ({ id: c.id, label: c.judulKasus })) : items}
            landedId={session?.caseId || null}
            locked={locked}
            muted={muted}
            onSpinStart={(it) => lockSpin(materiId, it.id)}
            onLand={() => setLanded(true)}
          />

          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.25rem' }}>
            {!locked ? (
              <button className="btn btn-yellow btn-lg" onClick={() => reelRef.current?.spin()} disabled={!items.length}>
                Spin!
              </button>
            ) : (
              <span className="badge" style={{ alignSelf: 'center' }}><Lock size={13} /> {landed ? 'Topikmu terkunci' : 'Memutar…'}</span>
            )}
            <button className="btn btn-primary btn-lg" disabled={!locked || !landed} onClick={() => { beginAnswer(); setNow(Date.now()); scrollTop(); }}>
              Mulai 120 detik <ArrowRight size={18} />
            </button>
          </div>
          <p className="muted" style={{ textAlign: 'center', fontSize: '0.8125rem', marginTop: '0.9rem' }}>
            {locked ? 'Tidak bisa spin ulang. Jawab topik ini untuk membuka latihan berikutnya.' : 'Tarik tuas di kanan atau tekan Spin!'}
          </p>
        </div>
      </div>
    </motion.section>
  );

  const answerView = kasus && (
    <motion.section key="jawab" {...fade} className="stage" style={{ padding: 'clamp(1.25rem, 4vw, 2.5rem)' }}>
      <div style={{ marginBottom: 'clamp(1.25rem, 3vw, 2rem)' }}><Steps at={1} /></div>

      {phase === 'loading' ? (
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', padding: '2rem 0' }} role="status">
          <Sparkles size={28} />
          <h2 style={{ fontSize: '1.75rem', marginTop: '0.75rem' }}>AI sedang membedah jawabanmu…</h2>
          <p className="muted" style={{ marginTop: '0.4rem' }}>Mencari klaim, alasan, dan bukti, lalu mencocokkannya dengan materi gurumu. Biasanya sekitar 20 detik.</p>
          <div style={{ display: 'grid', gap: 10, marginTop: '2rem', textAlign: 'left' }}>
            {[92, 78, 85, 60].map((w, i) => <div key={i} className="skeleton" style={{ height: 16, width: `${w}%` }} />)}
          </div>
        </div>
      ) : (
        <div className="answer-grid">
          <div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <span className="badge badge-yellow">{topicOf(materi)}</span>
              <span className={`badge ${bloomOf(kasus.levelBloom).cls}`}>{bloomOf(kasus.levelBloom).nama}</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3.2vw, 2.125rem)' }}>{kasus.judulKasus}</h2>
            <p style={{ color: 'var(--ink-2)', marginTop: '0.6rem', maxWidth: '62ch' }}>{kasus.teksKasus}</p>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '1.25rem 0 0.6rem' }} aria-hidden="true">
              {['klaim', 'alasan', 'bukti'].map((k) => (
                <span key={k} className="badge" style={{ background: `var(--${k}-soft)`, color: 'var(--ink)' }}>
                  <span className="legend-swatch" style={{ background: `var(--${k})` }} /> {PART_META[k].label}: {PART_META[k].tanya.toLowerCase()}
                </span>
              ))}
            </div>

            <label htmlFor="jawaban" className="sr-only">Jawabanmu</label>
            <textarea
              id="jawaban"
              className={`textarea-custom answer-area ${speech.recording ? 'listening' : ''}`}
              value={live}
              readOnly={speech.recording || timeUp}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Tuangkan pikiranmu di sini. Mulai dengan pendapatmu, lalu alasannya, lalu contoh atau buktinya."
              autoFocus
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  className={`btn ${speech.recording ? 'btn-danger recording-pulse' : 'btn-secondary'}`}
                  style={speech.recording ? undefined : { background: 'var(--surface)' }}
                  onClick={() => (speech.recording ? speech.stop() : speech.start())}
                  disabled={timeUp}
                >
                  {speech.recording ? <><Square size={15} /> Berhenti</> : <><Mic size={16} /> Pakai suara</>}
                </button>
                <span className="muted" style={{ fontSize: '0.875rem' }}>{words(live)} kata</span>
                {materi?.contohJawaban && <button className="btn btn-sm btn-ghost" onClick={() => setAnswer(materi.contohJawaban)} disabled={timeUp} title="Untuk demo tanpa mengetik">Isi contoh</button>}
              </div>
              <button className="btn btn-primary btn-lg" onClick={kirim} disabled={words(live) < 3}>
                Kirim ke AI <ArrowRight size={18} />
              </button>
            </div>

            {(speech.error || error) && (
              <p role="alert" style={{ marginTop: '0.75rem', color: 'var(--rec-ink)', display: 'flex', gap: 6, alignItems: 'center' }}>
                <AlertTriangle size={16} /> {speech.error || error}
              </p>
            )}
            {timeUp && words(answer) < 3 && (
              <div className="card-inset" style={{ marginTop: '1rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span>Waktu habis dan belum ada jawaban.</span>
                <button className="btn btn-sm btn-secondary" onClick={latihanBaru}>Mulai latihan baru</button>
              </div>
            )}
            {phase === 'error' && (
              <button className="btn btn-sm btn-secondary" style={{ marginTop: '0.5rem' }} onClick={kirim}>Coba kirim lagi</button>
            )}
          </div>

          <aside className="answer-side">
            <TimerRing left={left} total={WAKTU} />
            <p className="muted" style={{ fontSize: '0.8125rem', textAlign: 'center', maxWidth: 220 }}>
              {timeUp ? 'Waktu habis. Jawabanmu dikirim otomatis.' : 'Saat waktu habis, jawabanmu otomatis dikirim ke AI.'}
            </p>
          </aside>
        </div>
      )}
    </motion.section>
  );

  const resultView = result && (() => {
    const a = result.ai;
    const has = { klaim: a.kutipan.klaim.length > 0, alasan: a.kutipan.alasan.length > 0, bukti: a.kutipan.bukti.length > 0 };
    const missing = ['klaim', 'alasan', 'bukti'].filter((k) => !has[k]);
    const headline = !a.relevan
      ? 'Jawabanmu belum menjawab topiknya.'
      : missing.length === 0
        ? 'Argumenmu lengkap: ada klaim, alasan, dan bukti.'
        : `Tinggal ${missing.map((k) => PART_META[k].label.toLowerCase()).join(' dan ')} yang perlu kamu tambahkan.`;
    const poin = materi?.poinKunci || [];
    const classmates = arenaPosts.filter((p) => p.caseId === result.caseId).length;

    return (
      <motion.section key="hasil" {...fade}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <Steps at={2} />
          <button className="btn btn-secondary" onClick={latihanBaru}><RotateCcw size={16} /> Latihan baru</button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="eyebrow">{topicOf(materi)} · {result.caseJudul}</span>
        </div>
        <h1 className="page-title" style={{ marginTop: '0.4rem', maxWidth: '22ch' }}>{headline}</h1>
        <p style={{ marginTop: '0.6rem', display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.875rem', color: a.sumber === 'ai' ? 'var(--muted)' : 'var(--rec-ink)' }}>
          {a.sumber === 'ai' ? <><Sparkles size={14} /> Dianalisis AI ({a.model})</> : <><AlertTriangle size={14} /> Mode cadangan tanpa AI: {a.catatan || 'server AI tidak tersedia'}</>}
        </p>

        {!a.relevan && (
          <div className="card-inset" role="status" style={{ marginTop: '1.25rem', padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <AlertTriangle size={18} style={{ flex: 'none', marginTop: 3, color: 'var(--rec-ink)' }} />
            <div>
              <p style={{ fontWeight: 500 }}>Jawabanmu membahas hal lain, jadi strukturnya belum bisa dinilai.</p>
              <p style={{ color: 'var(--ink-2)', marginTop: 2 }}>Topikmu: <strong style={{ fontWeight: 500, color: 'var(--ink)' }}>{result.caseJudul}</strong>. Mulai latihan baru dan jawab topik yang keluar.</p>
            </div>
          </div>
        )}

        <div className="insight-grid" style={{ marginTop: '1.75rem' }}>
          <article className="card" style={{ padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.375rem' }}>Jawabanmu, sudah distabilo</h2>
              <StabiloLegend has={has} />
            </div>
            <StabiloText text={result.transcript} kutipan={a.kutipan} animate={!reduce} />
            <p className="muted" style={{ fontSize: '0.8125rem', marginTop: '0.75rem' }}>
              {result.lewatSuara ? 'Sebagian atau seluruhnya dari suara' : 'Diketik'} · {result.durasiBicara} dari 2:00
            </p>

            <div className="grid-3" style={{ marginTop: '1.25rem' }}>
              {['klaim', 'alasan', 'bukti'].map((k) => {
                const ada = has[k] || Boolean(a.ringkasan[k]);
                return (
                  <div
                    key={k}
                    style={{
                      background: ada ? `var(--${k}-soft)` : 'var(--surface)',
                      border: ada ? '1.5px solid transparent' : '1.5px dashed var(--line-strong)',
                      borderRadius: 16,
                      padding: '1rem',
                    }}
                  >
                    <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="legend-swatch" style={{ background: `var(--${k})` }} /> {PART_META[k].label}
                      {!ada && <span className="muted" style={{ fontWeight: 400, fontSize: '0.8125rem', marginLeft: 'auto' }}>belum ada</span>}
                    </div>
                    <p style={{ fontSize: '0.9375rem', color: 'var(--ink-2)', marginTop: 4 }}>
                      {a.ringkasan[k] || (has[k] ? a.kutipan[k][0] : PART_META[k].kosong.replace(/^[^.]+\.\s*/, ''))}
                    </p>
                  </div>
                );
              })}
            </div>
          </article>

          <aside style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
            <div className="card" style={{ padding: '1.25rem', display: 'grid', gap: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontSize: '1.125rem' }}>Skor argumen</h3>
                <span style={{ fontSize: '2rem', fontWeight: 500, letterSpacing: '-0.03em' }}>{a.skor.total}</span>
              </div>
              <ScoreRow label="Klaim" value={a.skor.klaim} color="var(--klaim)" />
              <ScoreRow label="Alasan" value={a.skor.alasan} color="var(--alasan)" />
              <ScoreRow label="Bukti" value={a.skor.bukti} color="var(--bukti)" />
              <ScoreRow label="Kejelasan" value={a.skor.kejelasan} color="var(--lavender)" />
              <p className="muted" style={{ fontSize: '0.8125rem' }}>Hanya kamu dan gurumu yang bisa melihat skor ini.</p>
            </div>

            <div className="card-yellow" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1.0625rem', display: 'flex', gap: 8, alignItems: 'center' }}><Lightbulb size={18} /> Umpan balik</h3>
              {a.relevan && a.kekuatan && (
                <div style={{ marginTop: '0.75rem' }}>
                  <p className="feedback-label">Sudah bagus</p>
                  <p style={{ color: 'var(--ink-2)' }}>{a.kekuatan}</p>
                </div>
              )}
              {a.saran.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <p className="feedback-label">Coba perbaiki</p>
                  <ul className="feedback-list">
                    {a.saran.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>

        {a.relevan && (a.pertanyaanLanjutan || a.asumsi) && (
          <div className={a.pertanyaanLanjutan && a.asumsi ? 'grid-2' : undefined} style={{ marginTop: '1rem' }}>
            {a.pertanyaanLanjutan && (
              <div className="card-blue" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1.0625rem', display: 'flex', gap: 8, alignItems: 'center' }}><HelpCircle size={18} /> Uji argumenmu</h3>
                <p style={{ marginTop: '0.4rem', color: 'var(--ink-2)' }}>{a.pertanyaanLanjutan}</p>
              </div>
            )}
            {a.asumsi && (
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1.0625rem' }}>Asumsi yang belum kamu uji</h3>
                <p style={{ marginTop: '0.4rem', color: 'var(--ink-2)' }}>{a.asumsi}</p>
              </div>
            )}
          </div>
        )}

        {materi && poin.length > 0 && (
          <section className="card-feature" style={{ marginTop: '1rem', padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
            <p className="eyebrow"><FileText size={15} /> {materi.mapel ? `${materi.mapel} · ` : ''}{materi.fileName}</p>
            <h2 style={{ fontSize: '1.5rem', marginTop: '0.35rem' }}>Dikaitkan dengan materi gurumu</h2>
            <p className="muted" style={{ marginTop: '0.2rem' }}>{materi.judul}</p>
            <div className="grid-2" style={{ marginTop: '1.25rem' }}>
              <div className="card-green" style={{ padding: '1.25rem', borderRadius: 20 }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Sudah kamu pakai</h3>
                {a.materi.dipakai.length ? (
                  <ul style={{ listStyle: 'none', display: 'grid', gap: '0.8rem' }}>
                    {a.materi.dipakai.map((d) => (
                      <li key={d.poin} style={{ display: 'flex', gap: '0.6rem' }}>
                        <Check size={18} style={{ flex: 'none', marginTop: 2 }} />
                        <span>
                          {poin[d.poin]?.teks} {poin[d.poin]?.halaman && <span className="muted">(hlm. {poin[d.poin].halaman})</span>}
                          {d.kutipan && <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--ink-2)', marginTop: 2 }}>Kamu menulis: “{d.kutipan}”</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Belum ada poin materi yang kamu singgung.</p>
                )}
              </div>
              <div className="card-inset" style={{ padding: '1.25rem', borderRadius: 20 }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Bisa memperkuat jawabanmu</h3>
                <ul style={{ listStyle: 'none', display: 'grid', gap: '0.8rem' }}>
                  {a.materi.bisaDipakai.map((i) => (
                    <li key={i} style={{ display: 'flex', gap: '0.6rem' }}>
                      <Plus size={18} style={{ flex: 'none', marginTop: 2, color: 'var(--muted)' }} />
                      <span>{poin[i]?.teks} {poin[i]?.halaman && <span className="muted">(hlm. {poin[i].halaman})</span>}</span>
                    </li>
                  ))}
                  {!a.materi.bisaDipakai.length && <li className="muted">Tidak ada saran tambahan dari materi.</li>}
                </ul>
              </div>
            </div>
            <p className="muted" style={{ fontSize: '0.8125rem', marginTop: '1rem' }}>
              AI tidak menilai posisimu benar atau salah. Yang dinilai adalah kekuatan penalaranmu.
            </p>
          </section>
        )}

        <div className="card-blue" style={{ marginTop: '1rem', padding: 'clamp(1.25rem, 3vw, 2rem)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem', flexWrap: 'wrap', background: 'var(--bukti-soft)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--surface)', display: 'grid', placeItems: 'center', flex: 'none' }}><LockOpen size={24} /></span>
            <div>
              <h2 style={{ fontSize: '1.375rem' }}>Gerbang diskusi terbuka</h2>
              <p style={{ color: 'var(--ink-2)' }}>Kamu sudah punya pendapat sendiri. Sekarang lihat {classmates > 1 ? `${classmates - 1} pendapat teman sekelas` : 'pendapat teman sekelas'}.</p>
            </div>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => setActivePage('arena')}>Masuk Arena Debat <ArrowRight size={18} /></button>
        </div>
      </motion.section>
    );
  })();

  return (
    <div className="page-wrapper" ref={topRef}>
      <div className="container">
        {ai && !ai.aiAktif && stage !== 'hasil' && (
          <p role="status" className="card-inset" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertTriangle size={16} /> AI belum aktif di server (LLM_API_KEY belum diisi). Analisis akan memakai mode cadangan sederhana.
          </p>
        )}
        {!materiList.length && !session ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.75rem' }}>Belum ada topik dari gurumu</h1>
            <p className="muted" style={{ marginTop: '0.5rem' }}>Topik muncul di sini setelah guru mengunggah materi dan menerbitkannya.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {stage === 'hasil' ? resultView : stage === 'jawab' ? answerView : spinView}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
