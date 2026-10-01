import React, { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProgressChart } from '../components/ProgressChart';
import { StabiloText } from '../components/Stabilo';
import { bloomOf } from '../lib/labels';

const DIMS = [
  { key: 'kejelasanKlaim', label: 'Kejelasan klaim', ket: 'Pendapatmu mudah ditangkap' },
  { key: 'kekuatanAlasan', label: 'Kekuatan alasan', ket: 'Ada “karena” yang masuk akal' },
  { key: 'ketajamanBukti', label: 'Ketajaman bukti', ket: 'Contoh, data, atau pengalaman nyata' },
  { key: 'kelancaranLisan', label: 'Kelancaran bicara', ket: 'Sedikit “eh” dan “anu”' },
  { key: 'kemandirianNalar', label: 'Kemandirian nalar', ket: 'Pendapat sendiri, bukan ikut-ikutan' },
];

export const JurnalSiswa = () => {
  const { journals, currentUser, setActivePage } = useApp();
  const [level, setLevel] = useState('Semua');

  const sessions = useMemo(
    () =>
      journals
        .filter((j) => j.siswaId === currentUser?.id && j.dimensi)
        .sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal))),
    [journals, currentUser]
  );

  const firstName = (currentUser?.nama || '').split(' ')[0];

  if (!sessions.length) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p className="eyebrow">Jurnal {firstName}</p>
            <h1 style={{ fontSize: '1.75rem', marginTop: '0.4rem' }}>Belum ada latihan</h1>
            <p className="muted" style={{ marginTop: '0.5rem' }}>Selesaikan satu latihan dulu. Perkembangan nalarmu akan tercatat di sini.</p>
            <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={() => setActivePage('spin')}>Mulai latihan</button>
          </div>
        </div>
      </div>
    );
  }

  const first = sessions[0].dimensi;
  const last = sessions[sessions.length - 1].dimensi;
  const deltas = DIMS.map((d) => ({ ...d, now: last[d.key], delta: last[d.key] - first[d.key] }));
  const best = [...deltas].sort((a, b) => b.delta - a.delta)[0];
  const weakest = [...deltas].sort((a, b) => a.now - b.now)[0];

  const history = [...sessions].reverse().filter((j) => level === 'Semua' || j.levelBloom === level);

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-head">
          <div>
            <p className="eyebrow">Jurnal {firstName}</p>
            <h1 className="page-title" style={{ marginTop: '0.4rem' }}>Perkembangan nalarmu</h1>
            <p className="page-lead">Semua yang pernah kamu ucapkan di latihan tersimpan di sini, lengkap dengan stabilonya.</p>
          </div>
        </div>

        <div className="jurnal-top">
          <section className="card" style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Klaim, alasan, dan bukti dari sesi ke sesi</h2>
            <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Skor 0 sampai 100 per bagian argumen, {sessions.length} sesi terakhir.</p>
            <ProgressChart sessions={sessions} />
          </section>

          <aside style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
            <div className="card-green" style={{ padding: '1.5rem' }}>
              <p style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 500 }}><TrendingUp size={18} /> Paling berkembang</p>
              <p style={{ fontSize: '2.75rem', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: '0.5rem' }}>
                {best.delta > 0 ? `+${best.delta}` : best.delta}
              </p>
              <p style={{ color: 'var(--ink-2)' }}>{best.label.toLowerCase()} sejak sesi pertama.</p>
            </div>
            <div className="card-yellow" style={{ padding: '1.5rem' }}>
              <p style={{ fontWeight: 500 }}>Fokus minggu ini</p>
              <p style={{ fontSize: '1.375rem', fontWeight: 500, marginTop: '0.4rem' }}>{weakest.label}</p>
              <p style={{ color: 'var(--ink-2)', marginTop: '0.25rem' }}>{weakest.ket}. Coba tambahkan satu hal ini di latihan berikutnya.</p>
            </div>
          </aside>
        </div>

        <section className="card" style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)', marginTop: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Lima kemampuan yang dilatih</h2>
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            {deltas.map((d) => (
              <div key={d.key} className="dim-row">
                <div>
                  <div style={{ fontWeight: 500 }}>{d.label}</div>
                  <div className="muted" style={{ fontSize: '0.8125rem' }}>{d.ket}</div>
                </div>
                <div className="dim-track" aria-hidden="true">
                  <i style={{ width: `${d.now}%` }} />
                  <b style={{ left: `${first[d.key]}%` }} title="Sesi pertama" />
                </div>
                <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ fontWeight: 500 }}>{d.now}</span>
                  <span className="muted" style={{ fontSize: '0.8125rem', marginLeft: 6 }}>{d.delta >= 0 ? '+' : ''}{d.delta}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="muted" style={{ fontSize: '0.8125rem', marginTop: '0.9rem' }}>Garis tipis menandai nilaimu di sesi pertama.</p>
        </section>

        <section style={{ marginTop: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem' }}>Riwayat latihan</h2>
            <div className="segmented" role="group" aria-label="Saring tingkat">
              {['Semua', 'Analisis', 'Evaluasi', 'Kreasi'].map((l) => (
                <button key={l} aria-pressed={level === l} onClick={() => setLevel(l)}>{l === 'Semua' ? 'Semua' : bloomOf(l).nama}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {history.map((j) => {
              const b = bloomOf(j.levelBloom);
              const d = new Date(String(j.tanggal).replace(' ', 'T'));
              return (
                <article key={j.id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className={`badge ${b.cls}`}>{b.nama}</span>
                        <span className="muted" style={{ fontSize: '0.8125rem' }}>
                          {isNaN(d) ? j.tanggal : d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })} · bicara {j.durasiBicara}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.125rem', marginTop: '0.5rem' }}>{j.caseJudul}</h3>
                    </div>
                    <span className="muted" style={{ fontSize: '0.875rem' }}>Skor <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{j.skorArgumen}</strong></span>
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <StabiloText text={j.transkrip} kutipan={j.kutipan} size="1rem" lineHeight={1.75} />
                  </div>
                </article>
              );
            })}
            {!history.length && <p className="muted">Belum ada latihan di tingkat ini.</p>}
          </div>
        </section>
      </div>
    </div>
  );
};
