import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, GraduationCap, X, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BrandMark } from './BrandMark';
import { DEMO_ACCOUNTS } from '../data/seedData';

export const AuthDialog = ({ initialMode = 'masuk', initialRole = 'siswa', onClose }) => {
  const { login, signup } = useApp();
  const [mode, setMode] = useState(initialMode);
  const [role, setRole] = useState(initialRole);
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const daftar = mode === 'daftar';

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (daftar && nama.trim().length < 2) return setError('Isi nama lengkapmu.');
    if (!email.includes('@')) return setError('Email harus mengandung @, misalnya nama@sekolah.id.');
    if (password.length < 6) return setError('Kata sandi minimal 6 karakter.');
    setBusy(true);
    try {
      if (daftar) await signup({ nama: nama.trim(), email: email.trim(), password, role });
      else await login(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Gagal masuk. Coba lagi.');
      setBusy(false);
    }
  };

  const pakaiContoh = (jenis) => {
    setMode('masuk');
    setEmail(DEMO_ACCOUNTS[jenis].email);
    setPassword(DEMO_ACCOUNTS[jenis].password);
    setError('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={daftar ? 'Daftar akun SpinSight' : 'Masuk ke SpinSight'}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(5, 0, 56, 0.35)', display: 'grid', placeItems: 'center', padding: '1rem', overflowY: 'auto' }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 440, padding: '1.75rem', boxShadow: 'var(--shadow-lg)', position: 'relative', margin: '1rem 0' }}>
        <button className="btn btn-ghost btn-icon" style={{ position: 'absolute', top: 12, right: 12 }} onClick={onClose} aria-label="Tutup">
          <X size={18} />
        </button>
        <BrandMark size={36} />
        <h2 style={{ fontSize: '1.5rem', marginTop: '1rem' }}>{daftar ? 'Buat akun SpinSight' : 'Masuk ke SpinSight'}</h2>
        <p className="muted" style={{ marginTop: '0.25rem' }}>
          {daftar ? 'Gratis. Tidak perlu verifikasi email.' : 'Pakai akun yang sudah kamu daftarkan.'}
        </p>

        <div className="toggle" role="group" aria-label="Pilih masuk atau daftar" style={{ marginTop: '1.25rem', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <button type="button" aria-pressed={!daftar} onClick={() => { setMode('masuk'); setError(''); }} style={{ justifyContent: 'center' }}>Masuk</button>
          <button
            type="button"
            aria-pressed={daftar}
            onClick={() => {
              setMode('daftar');
              setError('');
              // Jangan bawa kredensial akun contoh ke form daftar.
              if (Object.values(DEMO_ACCOUNTS).some((a) => a.email === email)) {
                setEmail('');
                setPassword('');
              }
            }}
            style={{ justifyContent: 'center' }}
          >
            Daftar
          </button>
        </div>

        <form onSubmit={submit} style={{ display: 'grid', gap: '0.9rem', marginTop: '1.25rem' }}>
          {daftar && (
            <>
              <div>
                <span className="field-label">Saya mendaftar sebagai</span>
                <div className="toggle" role="group" aria-label="Peran" style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  <button type="button" aria-pressed={role === 'siswa'} onClick={() => setRole('siswa')} style={{ justifyContent: 'center' }}>
                    <GraduationCap size={16} /> Siswa
                  </button>
                  <button type="button" aria-pressed={role === 'guru'} onClick={() => setRole('guru')} style={{ justifyContent: 'center' }}>
                    <BookOpen size={16} /> Guru
                  </button>
                </div>
              </div>
              <label>
                <span className="field-label">Nama lengkap</span>
                <input className="input-text" value={nama} onChange={(e) => setNama(e.target.value)} autoComplete="name" placeholder={role === 'guru' ? 'Dra. Sri Wahyuni, M.Pd.' : 'Jason Pratama'} />
              </label>
            </>
          )}
          <label>
            <span className="field-label">Email</span>
            <input className="input-text" type="text" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="nama@sekolah.id" />
          </label>
          <label>
            <span className="field-label">Kata sandi</span>
            <input className="input-text" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={daftar ? 'new-password' : 'current-password'} placeholder="Minimal 6 karakter" />
          </label>

          {error && (
            <p role="alert" style={{ color: 'var(--rec-ink)', display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: '0.9rem' }}>
              <AlertTriangle size={16} style={{ flex: 'none', marginTop: 2 }} /> {error}
            </p>
          )}

          <button className="btn btn-primary btn-lg" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Sebentar…' : daftar ? 'Buat akun' : 'Masuk'} {!busy && <ArrowRight size={18} />}
          </button>
          {daftar && role === 'siswa' && (
            <p className="muted" style={{ fontSize: '0.8125rem', textAlign: 'center' }}>Setelah daftar, masukkan kode kelas dari gurumu.</p>
          )}
          {daftar && role === 'guru' && (
            <p className="muted" style={{ fontSize: '0.8125rem', textAlign: 'center' }}>Setelah daftar, buat kelas dan bagikan kodenya ke siswa.</p>
          )}
        </form>

        <div className="card-inset" style={{ marginTop: '1.25rem', padding: '1rem' }}>
          <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>Akun contoh untuk mencoba</p>
          <p className="muted" style={{ fontSize: '0.8125rem', marginTop: 2 }}>Sudah berisi kelas, materi, jawaban siswa, dan diskusi.</p>
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.3rem 0.75rem', fontSize: '0.875rem', marginTop: '0.6rem' }}>
            <dt className="muted">Guru</dt>
            <dd style={{ fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all' }}>{DEMO_ACCOUNTS.guru.email}</dd>
            <dt className="muted">Siswa</dt>
            <dd style={{ fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all' }}>{DEMO_ACCOUNTS.siswa.email}</dd>
            <dt className="muted">Kata sandi</dt>
            <dd style={{ fontFamily: 'ui-monospace, monospace' }}>{DEMO_ACCOUNTS.siswa.password}</dd>
          </dl>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            <button type="button" className="btn btn-sm btn-secondary" onClick={() => pakaiContoh('guru')}>Isi akun guru</button>
            <button type="button" className="btn btn-sm btn-secondary" onClick={() => pakaiContoh('siswa')}>Isi akun siswa</button>
          </div>
        </div>
      </div>
    </div>
  );
};
