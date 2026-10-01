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
  const { isAuthenticated, currentUser, activePage } = useApp();

  if (!isAuthenticated) return <LandingPage />;

  const Page = isGuru(currentUser) ? DashboardPendamping : STUDENT_PAGES[activePage] || SpinArena;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Page />
      </main>
    </div>
  );
}
