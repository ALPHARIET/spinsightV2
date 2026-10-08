import React from 'react';
import { MessageSquare, Sparkles, Lock, Unlock } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ModerasiPanel = () => {
  const { cases, arenaPosts, closedRooms, syntheses, closeDiscussionRoom, reopenDiscussionRoom } = useApp();
  const discussedCases = cases.filter((c) => closedRooms[c.id] || arenaPosts.some((p) => p.caseId === c.id));

  return (
    <div>
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <MessageSquare size={22} style={{ color: 'var(--alasan-ink)' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--ink)' }}>
            Kontrol Moderasi & Sintesis Nalar Kolektif
          </h3>
        </div>
        <p style={{ color: 'var(--ink-2)', fontSize: '0.9rem', maxWidth: '780px', margin: 0 }}>
          Setelah siswa selesai berdebat pada Arena, Anda dapat menutup sesi diskusi untuk memicu perumusan <strong>Sintesis AI Kelas</strong>. Sintesis ini merangkum polaritas pandangan siswa dan kesimpulan reflektif bersama.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {!discussedCases.length && (
          <div className="glass-panel" style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <MessageSquare size={36} style={{ margin: '0 auto 0.75rem', color: 'var(--line-strong)' }} />
            <div style={{ fontWeight: 600, color: 'var(--ink-2)', marginBottom: '0.25rem' }}>
              Belum ada diskusi di Arena
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>
              Topik muncul di sini setelah ada siswa yang menulis pendapat di Arena Debat.
            </p>
          </div>
        )}
        {discussedCases.map((c) => {
          const isClosed = closedRooms[c.id];
          const synth = syntheses[c.id];
          const jumlahPendapat = arenaPosts.filter((p) => p.caseId === c.id).length;
          return (
            <div key={c.id} className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.55rem',
                      borderRadius: 'var(--r-chip)',
                      background: isClosed ? 'var(--accent-soft)' : 'var(--bukti-soft)',
                      color: isClosed ? 'var(--brand)' : 'var(--bukti-ink)',
                      border: `1px solid ${isClosed ? 'var(--accent-soft)' : 'var(--bukti)'}`
                    }}>
                      {isClosed ? <Lock size={12} /> : <Unlock size={12} />}
                      {isClosed ? 'Diskusi Ditutup Guru' : 'Diskusi Terbuka (Live)'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      {jumlahPendapat} pendapat siswa
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.25rem' }}>
                    {c.judulKasus}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ink-2)', margin: 0 }}>
                    {c.teksKasus.length > 180 ? `${c.teksKasus.slice(0, 180)}…` : c.teksKasus}
                  </p>
                </div>

                <button
                  onClick={() => (isClosed ? reopenDiscussionRoom(c.id) : closeDiscussionRoom(c.id))}
                  className={`btn btn-sm ${isClosed ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {isClosed ? (
                    <>
                      <Unlock size={14} /> Buka Kembali Ruang
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Tutup Diskusi & Buat Sintesis
                    </>
                  )}
                </button>
              </div>

              {isClosed && synth && (
                <div style={{
                  background: 'var(--subtle)',
                  border: '1px solid var(--line)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginTop: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Sparkles size={16} style={{ color: 'var(--lavender-ink)' }} />
                    <h5 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                      Sintesis kelas
                    </h5>
                  </div>
                  <dl style={{ display: 'grid', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--ink-2)', lineHeight: 1.6 }}>
                    <div><dt style={{ fontWeight: 600, color: 'var(--ink)' }}>Yang disepakati</dt><dd>{synth.titikTemu}</dd></div>
                    <div><dt style={{ fontWeight: 600, color: 'var(--ink)' }}>Yang masih berbeda</dt><dd>{synth.titikBeda}</dd></div>
                    <div><dt style={{ fontWeight: 600, color: 'var(--ink)' }}>Untuk pertemuan berikutnya</dt><dd>{synth.pertanyaanTerbuka}</dd></div>
                  </dl>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
