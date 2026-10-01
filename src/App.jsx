import React from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPendamping } from './pages/DashboardPendamping';
import { SpinArena } from './pages/SpinArena';
import { ForumDiskusi } from './pages/ForumDiskusi';
import { ArenaPage } from './pages/ArenaPage';
import { JurnalSiswa } from './pages/JurnalSiswa';
import { isGuru } from './lib/labels';

const STUDENT_PAGES = {
  spin: SpinArena,
  forum: ForumDiskusi,
  arena: ArenaPage,
  jurnal: JurnalSiswa,
};

export default function App() {
  const { isAuthenticated, currentUser, activePage, dataMode, dataError, setDataError, reloadData } = useApp();

  if (!isAuthenticated) return <LandingPage />;

  if (dataMode === 'loading') {
    return (
      <div role="status" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
        Memuat data kelas…
      </div>
    );
  }

  const Page = isGuru(currentUser) ? DashboardPendamping : STUDENT_PAGES[activePage] || SpinArena;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Page />
      </main>
      {dataError && (
        <div role="alert" className="card" style={{ position: 'fixed', left: 16, right: 16, bottom: 88, zIndex: 1500, maxWidth: 560, margin: '0 auto', padding: '0.8rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', boxShadow: 'var(--shadow-lg)', fontSize: '0.875rem' }}>
          <span style={{ flex: 1 }}>{dataError}</span>
          {dataMode === 'on' && <button className="btn btn-sm btn-secondary" onClick={() => { setDataError(''); reloadData(); }}>Muat ulang</button>}
          <button className="btn btn-sm btn-ghost" onClick={() => setDataError('')}>Tutup</button>
        </div>
      )}
    </div>
  );
}
