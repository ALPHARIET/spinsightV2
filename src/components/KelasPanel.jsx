import React, { useState } from 'react';
import { Copy, Check, RefreshCw, Trash2, UserMinus, Plus, Users, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatTanggal } from '../lib/labels';

const CodeBox = ({ kelas, onRegenerate }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(kelas.kode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  return (
    <section className="card-yellow" style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)', borderRadius: 'var(--r-card)' }}>
      <p className="eyebrow" style={{ color: 'var(--ink-2)' }}>Kode undangan kelas {kelas.nama}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
        <span aria-label={`Kode kelas ${kelas.kode.split('').join(' ')}`} style={{ fontSize: 'clamp(2rem, 6vw, 2.75rem)', fontWeight: 600, letterSpacing: '0.18em', fontVariantNumeric: 'tabular-nums' }}>
          {kelas.kode}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-sm btn-primary" onClick={copy}>{copied ? <><Check size={15} /> Tersalin</> : <><Copy size={15} /> Salin kode</>}</button>
          {!kelas.contoh && <button className="btn btn-sm btn-secondary" style={{ background: 'var(--surface)' }} onClick={onRegenerate}><RefreshCw size={15} /> Buat kode baru</button>}
        </div>
      </div>
      <p style={{ color: 'var(--ink-2)', marginTop: '0.6rem', fontSize: '0.9rem' }}>
        Bagikan kode ini ke siswa. Mereka memasukkannya setelah mendaftar sebagai siswa.
        {!kelas.contoh && ' Buat kode baru bila kode lama tersebar ke luar kelas; siswa yang sudah bergabung tetap di kelas.'}
      </p>
    </section>
  );
};

export const KelasPanel = ({ onboarding = false }) => {
  const { classes, activeClass, members, createClass, regenerateCode, deleteClass, removeMember, switchClass } = useApp();
  const [nama, setNama] = useState('');
  const [sekolah, setSekolah] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const act = async (fn) => {
    setError('');
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const buat = (e) => {
    e.preventDefault();
    if (nama.trim().length < 2) return setError('Isi nama kelas, misalnya XI-IPA 2.');
    act(async () => {
      await createClass({ nama: nama.trim(), sekolah: sekolah.trim() });
      setNama('');
      setSekolah('');
    });
  };

  const form = (
    <form onSubmit={buat} className="card" style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
      <h2 style={{ fontSize: '1.25rem', display: 'flex', gap: 8, alignItems: 'center' }}><Plus size={18} /> {onboarding ? 'Buat kelas pertamamu' : 'Buat kelas baru'}</h2>
      <p className="muted" style={{ marginTop: '0.25rem' }}>Setiap kelas punya materi, topik spin, rekap nilai, dan forum sendiri.</p>
      <div className="grid-2" style={{ marginTop: '1rem' }}>
        <label>
          <span className="field-label">Nama kelas *</span>
          <input className="input-text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="XI-IPA 2" maxLength={60} />
        </label>
        <label>
          <span className="field-label">Sekolah</span>
          <input className="input-text" value={sekolah} onChange={(e) => setSekolah(e.target.value)} placeholder="SMA Negeri 1 Palembang" maxLength={80} />
        </label>
      </div>
      <button className="btn btn-primary" type="submit" disabled={busy} style={{ marginTop: '1rem' }}>{busy ? 'Membuat…' : 'Buat kelas & kode undangan'}</button>
    </form>
  );

  const errorLine = error && (
    <p role="alert" style={{ color: 'var(--rec-ink)', display: 'flex', gap: 6, alignItems: 'center' }}><AlertTriangle size={16} /> {error}</p>
  );

  if (onboarding || !activeClass) {
    return (
      <div style={{ display: 'grid', gap: '1rem', maxWidth: 720 }}>
        {form}
        {errorLine}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <CodeBox
        kelas={activeClass}
        onRegenerate={() => window.confirm('Buat kode baru? Kode lama tidak bisa dipakai lagi.') && act(() => regenerateCode(activeClass.id))}
      />
      {errorLine}

      <section className="card" style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', gap: 8, alignItems: 'center' }}><Users size={18} /> Siswa di {activeClass.nama}</h2>
          <span className="muted" style={{ fontSize: '0.875rem' }}>{members.length} siswa</span>
        </div>
        {members.length ? (
          <ul style={{ listStyle: 'none', display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
            {members.map((m) => (
              <li key={m.id} className="card-inset" style={{ padding: '0.7rem 0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ fontWeight: 500 }}>{m.nama}</span>
                  <span className="muted" style={{ display: 'block', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.email || 'Siswa contoh'} · bergabung {formatTanggal(m.joinedAt, false)}
                  </span>
                </span>
                <button
                  className="btn btn-sm btn-ghost btn-icon"
                  aria-label={`Keluarkan ${m.nama}`}
                  title="Keluarkan dari kelas"
                  onClick={() => window.confirm(`Keluarkan ${m.nama} dari kelas ini?`) && act(() => removeMember(m.id))}
                >
                  <UserMinus size={16} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted" style={{ marginTop: '0.75rem' }}>Belum ada siswa. Bagikan kode di atas supaya siswa bisa bergabung.</p>
        )}
      </section>

      {classes.length > 1 && (
        <section className="card" style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
          <h2 style={{ fontSize: '1.25rem' }}>Kelas lainmu</h2>
          <ul style={{ listStyle: 'none', display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}>
            {classes.filter((c) => c.id !== activeClass.id).map((c) => (
              <li key={c.id} className="card-inset" style={{ padding: '0.7rem 0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                <span>{c.nama}{c.sekolah ? <span className="muted"> · {c.sekolah}</span> : null} <span className="muted">· {c.jumlahSiswa} siswa</span></span>
                <button className="btn btn-sm btn-secondary" onClick={() => act(() => switchClass(c.id))}>Buka</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {form}

      {!activeClass.contoh && (
        <div>
          <button
            className="btn btn-sm btn-ghost"
            style={{ color: 'var(--rec-ink)' }}
            onClick={() => window.confirm(`Hapus kelas ${activeClass.nama}? Semua materi, topik, nilai, dan diskusi di kelas ini ikut terhapus permanen.`) && act(() => deleteClass(activeClass.id))}
          >
            <Trash2 size={15} /> Hapus kelas {activeClass.nama}
          </button>
        </div>
      )}
    </div>
  );
};
