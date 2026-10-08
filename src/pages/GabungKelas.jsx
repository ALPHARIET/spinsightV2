import React, { useState } from 'react';
import { ArrowRight, AlertTriangle, KeyRound } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEMO_CLASS } from '../data/seedData';

export const GabungKelas = () => {
  const { joinClass, classes, currentUser, setActivePage } = useApp();
  const [kode, setKode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const firstName = (currentUser?.nama || '').split(' ')[0];

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (kode.replace(/[^a-z0-9]/gi, '').length < 4) return setError('Masukkan kode kelas dari gurumu.');
    setBusy(true);
    try {
      await joinClass(kode);
      setActivePage('spin');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 560 }}>
        <form onSubmit={submit} className="card" style={{ padding: 'clamp(1.5rem, 4vw, 2.25rem)' }}>
          <span style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--brand)', display: 'inline-grid', placeItems: 'center' }}>
            <KeyRound size={24} />
          </span>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2rem)', marginTop: '1rem' }}>
            {classes.length ? 'Gabung kelas lain' : `Halo ${firstName}, masuk ke kelasmu`}
          </h1>
          <p style={{ color: 'var(--ink-2)', marginTop: '0.4rem' }}>
            Minta kode kelas dari gurumu. Topik spin, forum, dan arena debat akan mengikuti kelas ini.
          </p>
          <label style={{ display: 'block', marginTop: '1.25rem' }}>
            <span className="field-label">Kode kelas</span>
            <input
              className="input-text"
              value={kode}
              onChange={(e) => setKode(e.target.value.toUpperCase())}
              placeholder="K7Q2MX"
              maxLength={12}
              autoFocus
              autoComplete="off"
              style={{ fontSize: '1.5rem', letterSpacing: '0.2em', textAlign: 'center', fontWeight: 600 }}
            />
          </label>
          {error && (
            <p role="alert" style={{ marginTop: '0.75rem', color: 'var(--rec-ink)', display: 'flex', gap: 6, alignItems: 'center' }}>
              <AlertTriangle size={16} /> {error}
            </p>
          )}
          <button className="btn btn-primary btn-lg" type="submit" disabled={busy} style={{ width: '100%', marginTop: '1rem' }}>
            {busy ? 'Memeriksa kode…' : 'Gabung kelas'} {!busy && <ArrowRight size={18} />}
          </button>
          <p className="muted" style={{ fontSize: '0.8125rem', marginTop: '1rem', textAlign: 'center' }}>
            Ingin mencoba dulu? Pakai kode kelas contoh <strong style={{ color: 'var(--ink)', letterSpacing: '0.1em' }}>{DEMO_CLASS.kode}</strong>.
          </p>
        </form>
        {classes.length > 0 && (
          <p style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button className="btn btn-sm btn-ghost" onClick={() => setActivePage('spin')}>Kembali ke latihan</button>
          </p>
        )}
      </div>
    </div>
  );
};
