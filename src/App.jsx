import React from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { KelasPanel } from './components/KelasPanel';
import { LandingPage } from './pages/LandingPage';
import { DashboardPendamping } from './pages/DashboardPendamping';
import { SpinArena } from './pages/SpinArena';
import { ForumDiskusi } from './pages/ForumDiskusi';
import { ArenaPage } from './pages/ArenaPage';
import { JurnalSiswa } from './pages/JurnalSiswa';
import { GabungKelas } from './pages/GabungKelas';
import { isGuru } from './lib/labels';

const STUDENT_PAGES = {
  spin: SpinArena,
  forum: ForumDiskusi,
  arena: ArenaPage,
  jurnal: JurnalSiswa,
  gabung: GabungKelas,
};

const FirstClass = () => (
  <div className="page-wrapper">
    <div className="container">
      <div className="page-head">
        <div>
          <p className="eyebrow">Portal Guru</p>
          <h1 className="page-title" style={{ marginTop: '0.4rem' }}>Mulai dengan membuat kelas</h1>
          <p className="page-lead">Setelah kelas dibuat, kamu mendapat kode undangan untuk siswa, lalu bisa mengunggah materi pertama.</p>
        </div>
      </div>
      <KelasPanel onboarding />
    </div>
  </div>
);

export default function App() {
  const { authReady, isAuthenticated, currentUser, activePage, classes, dataError, setDataError, reloadData } = useApp();

  if (!authReady) {
    return (
      <div role="status" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
        Memuat…
      </div>
    );
  }

  if (!isAuthenticated) return <LandingPage />;

  const guru = isGuru(currentUser);
  let Page;
  if (guru) Page = classes.length ? DashboardPendamping : FirstClass;
  else Page = classes.length ? STUDENT_PAGES[activePage] || SpinArena : GabungKelas;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Page />
      </main>
      {dataError && (
        <div role="alert" className="card" style={{ position: 'fixed', left: 16, right: 16, bottom: 88, zIndex: 1500, maxWidth: 560, margin: '0 auto', padding: '0.8rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', boxShadow: 'var(--shadow-lg)', fontSize: '0.875rem' }}>
          <span style={{ flex: 1 }}>{dataError}</span>
          <button className="btn btn-sm btn-secondary" onClick={() => { setDataError(''); reloadData(); }}>Muat ulang</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setDataError('')}>Tutup</button>
        </div>
      )}
    </div>
  );
}
