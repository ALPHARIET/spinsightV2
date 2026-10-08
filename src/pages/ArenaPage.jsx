import React, { useState } from 'react';
import { Lock, ArrowRight, Send, MessageSquare, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { aiService } from '../services/aiService';
import { StabiloText, StabiloLegend } from '../components/Stabilo';
import { REPLY_LABELS, colorFor, initials, bloomOf, topicOf } from '../lib/labels';

const LABELS = Object.keys(REPLY_LABELS);

const Avatar = ({ nama, size = 36 }) => (
  <span className="avatar" style={{ width: size, height: size, background: colorFor(nama) }}>{initials(nama)}</span>
);

export const ArenaPage = () => {
  const { cases, materials, activeCaseId, unlockedCases, arenaPosts, addArenaReply, syntheses, closedRooms, setActivePage, currentUser } = useApp();

  const activeCase = cases.find((c) => c.id === activeCaseId) || cases[0];
  const material = activeCase && materials.find((m) => m.id === activeCase.materialId);
  const isUnlocked = Boolean(activeCase) && unlockedCases.includes(activeCase.id);
  const posts = activeCase ? arenaPosts.filter((p) => p.caseId === activeCase.id) : [];
  const synth = activeCase && syntheses[activeCase.id];
  const closed = Boolean(activeCase && closedRooms[activeCase.id]);

  const [replyingId, setReplyingId] = useState(null);
  const [label, setLabel] = useState('Menguatkan');
  const [text, setText] = useState('');
  const [notice, setNotice] = useState('');
  const [hover, setHover] = useState(null);

  const send = (postId) => {
    const mod = aiService.checkModeration(text);
    if (!mod.allowed) {
      setNotice(mod.message);
      return;
    }
    setNotice(mod.hasNudge ? mod.nudgeText : '');
    addArenaReply(postId, { label, isi: text.trim() });
    setText('');
    setReplyingId(null);
  };

  if (!activeCase) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.75rem' }}>Arena debat belum dibuka</h1>
            <p className="muted" style={{ marginTop: '0.5rem' }}>Arena terbuka setelah gurumu menerbitkan topik dan kamu menjawab salah satunya.</p>
            <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={() => setActivePage('spin')}>Ke latihan</button>
          </div>
        </div>
      </div>
    );
  }

  const header = (
    <div className="page-head">
      <div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span className="badge badge-yellow">{topicOf(material)}</span>
          <span className={`badge ${bloomOf(activeCase.levelBloom).cls}`}>{bloomOf(activeCase.levelBloom).nama}</span>
        </div>
        <h1 className="page-title" style={{ marginTop: '0.75rem', maxWidth: '24ch' }}>{activeCase.judulKasus}</h1>
        {material && (
          <p className="eyebrow" style={{ marginTop: '0.6rem' }}><FileText size={15} /> {material.judul}</p>
        )}
      </div>
    </div>
  );

  if (!isUnlocked) {
    return (
      <div className="page-wrapper">
        <div className="container">
          {header}
          <div style={{ position: 'relative' }}>
            <div aria-hidden="true" style={{ filter: 'blur(7px)', opacity: 0.6, pointerEvents: 'none', display: 'grid', gap: '1rem' }}>
              {posts.slice(0, 2).map((p) => (
                <div key={p.id} className="note"><StabiloText text={p.transkrip} kutipan={p.kutipan} size="1rem" /></div>
              ))}
            </div>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: '1rem' }}>
              <div className="card" style={{ maxWidth: 460, padding: '2rem', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
                <span style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--brand)', display: 'inline-grid', placeItems: 'center' }}>
                  <Lock size={24} />
                </span>
                <h2 style={{ fontSize: '1.625rem', marginTop: '1rem' }}>Pendapatmu dulu</h2>
                <p style={{ marginTop: '0.5rem', color: 'var(--ink-2)' }}>
                  {posts.length} teman sudah berpendapat di sini. Forum terbuka setelah kamu menyelesaikan latihan kasus ini, supaya pendapatmu tidak ikut-ikutan.
                </p>
                <button className="btn btn-primary btn-lg" style={{ marginTop: '1.5rem' }} onClick={() => setActivePage('spin')}>
                  Mulai latihan <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        {header}

        <div className="arena-layout">
          <aside className="arena-side">
            <section className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.9rem' }}>
                <h2 style={{ fontSize: '1.125rem' }}>Peta posisi kelas</h2>
                <span className="muted" style={{ fontSize: '0.8125rem' }}>{posts.length} pendapat</span>
              </div>
              <div className="posmap" role="img" aria-label="Sebaran posisi pendapat siswa">
                <span className="posmap-axis" style={{ left: 10, top: '50%', transform: 'translateY(-130%)' }}>Tidak setuju</span>
                <span className="posmap-axis" style={{ right: 10, top: '50%', transform: 'translateY(-130%)' }}>Setuju</span>
                <span className="posmap-axis" style={{ top: 10, left: '50%', transform: 'translateX(8px)' }}>Fokus dampak</span>
                <span className="posmap-axis" style={{ bottom: 10, left: '50%', transform: 'translateX(8px)' }}>Fokus prinsip</span>
                {posts.map((p) => {
                  const me = p.siswaId === currentUser?.id;
                  return (
                    <button
                      key={p.id}
                      className="posmap-dot"
                      data-me={me}
                      data-hover={hover === p.id}
                      style={{ left: `${p.posisiX || 50}%`, top: `${p.posisiY || 50}%`, background: colorFor(p.siswaNama) }}
                      onMouseEnter={() => setHover(p.id)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => document.getElementById(p.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                      title={`${p.siswaNama}: ${p.kutub}`}
                    >
                      {initials(p.siswaNama)}
                    </button>
                  );
                })}
              </div>
            </section>

            {synth && (
              <section className="card-yellow" style={{ padding: '1.25rem', borderRadius: 'var(--r-card)' }}>
                <h2 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>Kesimpulan kelas</h2>
                <dl style={{ display: 'grid', gap: '0.8rem', fontSize: '0.9375rem' }}>
                  <div><dt style={{ fontWeight: 500 }}>Yang disepakati</dt><dd style={{ color: 'var(--ink-2)' }}>{synth.titikTemu}</dd></div>
                  <div><dt style={{ fontWeight: 500 }}>Yang masih berbeda</dt><dd style={{ color: 'var(--ink-2)' }}>{synth.titikBeda}</dd></div>
                  <div><dt style={{ fontWeight: 500 }}>Untuk pertemuan berikutnya</dt><dd style={{ color: 'var(--ink-2)' }}>{synth.pertanyaanTerbuka}</dd></div>
                </dl>
              </section>
            )}
          </aside>

          <section style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Pendapat teman sekelas{closed && <span className="badge" style={{ marginLeft: 8, verticalAlign: 'middle' }}><Lock size={12} /> Ditutup guru</span>}</h2>
              <StabiloLegend />
            </div>

            {notice && (
              <div className="card-inset" role="status" style={{ padding: '0.9rem 1.1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
                <span>{notice}</span>
                <button className="btn btn-sm btn-ghost" onClick={() => setNotice('')}>Tutup</button>
              </div>
            )}

            {posts.map((post) => {
              const me = post.siswaId === currentUser?.id;
              return (
                <article
                  key={post.id}
                  id={post.id}
                  className="note"
                  style={{ scrollMarginTop: 90, boxShadow: hover === post.id ? 'var(--shadow-md)' : undefined, borderColor: me ? 'var(--brand)' : undefined }}
                  onMouseEnter={() => setHover(post.id)}
                  onMouseLeave={() => setHover(null)}
                >
                  <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.9rem' }}>
                    <Avatar nama={post.siswaNama} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 500 }}>{post.siswaNama}{me && <span className="badge badge-yellow" style={{ marginLeft: 8 }}>Kamu</span>}</div>
                      <div className="muted" style={{ fontSize: '0.8125rem' }}>{post.waktu} · {post.lewatSuara === false ? 'diketik' : 'dari suara'}</div>
                    </div>
                    <span className="badge hide-sm" style={{ marginLeft: 'auto' }}>{post.kutub}</span>
                  </header>

                  <StabiloText text={post.transkrip} kutipan={post.kutipan} size="1.0625rem" lineHeight={1.8} />

                  {post.replies?.length > 0 && (
                    <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
                      {post.replies.map((r) => {
                        const L = REPLY_LABELS[r.label] || REPLY_LABELS.Menguatkan;
                        return (
                          <div key={r.id} className="reply" style={{ background: L.bg }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                              <Avatar nama={r.siswaNama} size={24} />
                              <strong style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{r.siswaNama}</strong>
                              <span className="badge" style={{ background: L.bar, color: 'var(--ink)' }}>{r.label}</span>
                              <span className="muted" style={{ fontSize: '0.8125rem', marginLeft: 'auto' }}>{r.waktu}</span>
                            </div>
                            <p style={{ fontSize: '0.9375rem', color: 'var(--ink-2)' }}>{r.isi}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {replyingId === post.id ? (
                    <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.45rem' }}>Balasanmu sifatnya apa?</p>
                        <div className="segmented" role="group" aria-label="Jenis balasan">
                          {LABELS.map((l) => (
                            <button key={l} aria-pressed={label === l} onClick={() => setLabel(l)}>{l}</button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        className="textarea-custom"
                        rows={3}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={label === 'Bertanya' ? 'Tulis pertanyaanmu…' : 'Tulis balasanmu, sertakan “karena…” kalau bisa.'}
                        autoFocus
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => { setReplyingId(null); setText(''); }}>Batal</button>
                        <button className="btn btn-sm btn-primary" onClick={() => send(post.id)} disabled={!text.trim()}>
                          <Send size={14} /> Kirim
                        </button>
                      </div>
                    </div>
                  ) : !closed && (
                    <button className="btn btn-sm btn-secondary" style={{ marginTop: '1rem' }} onClick={() => { setReplyingId(post.id); setNotice(''); }}>
                      <MessageSquare size={15} /> Balas
                    </button>
                  )}
                </article>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
};
