import React from 'react';
import { useApp } from '../context/AppContext';
import { Disc3, MessagesSquare, Users, NotebookPen, LogOut } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { colorFor, initials, isGuru } from '../lib/labels';

export const Navbar = () => {
  const {
    currentUser,
    isAuthenticated,
    logout,
    activePage,
    setActivePage,
    unlockedCases,
    activeCaseId,
    setTeacherTab,
    classes,
    activeClassId,
    switchClass,
  } = useApp();

  if (!isAuthenticated) return null;

  const guru = isGuru(currentUser);
  const isArenaUnlocked = unlockedCases.includes(activeCaseId);
  const page = activePage === 'landing' || activePage === 'pendamping' ? 'spin' : activePage;

  const items = [
    { id: 'spin', label: 'Latihan', icon: Disc3 },
    { id: 'arena', label: 'Arena Debat', short: 'Arena', icon: Users, badge: isArenaUnlocked && page !== 'arena' },
    { id: 'forum', label: 'Forum Kelas', short: 'Forum', icon: MessagesSquare },
    { id: 'jurnal', label: 'Jurnal', icon: NotebookPen },
  ];

  const nama = currentUser?.nama || '';
  const hasClass = classes.length > 0;

  const onClassChange = (e) => {
    const v = e.target.value;
    if (v === '__join') return setActivePage('gabung');
    if (v === '__manage') return setTeacherTab('kelas');
    switchClass(v);
  };

  const classPicker = hasClass && (
    <label className="class-picker">
      <span className="sr-only">Kelas aktif</span>
      <select className="select-pill" value={activeClassId || ''} onChange={onClassChange} title="Ganti kelas">
        {classes.map((c) => (
          <option key={c.id} value={c.id}>{c.nama}{c.contoh ? ' (contoh)' : ''}</option>
        ))}
        <option value={guru ? '__manage' : '__join'}>{guru ? '+ Buat / kelola kelas' : '+ Gabung kelas lain'}</option>
      </select>
    </label>
  );

  return (
    <>
      <header className="topnav">
        <div className="container topnav-inner">
          <button
            className="brand"
            onClick={() => (guru ? setTeacherTab('rekap_ai') : setActivePage('spin'))}
            aria-label="SpinSight, ke beranda"
          >
            <BrandMark className="brand-mark" />
            SpinSight
            {guru && <span className="chip hide-sm" style={{ marginLeft: '0.25rem' }}>Portal Guru</span>}
          </button>

          {!guru && hasClass && (
            <nav className="navlinks" aria-label="Menu siswa">
              {items.map(({ id, label, icon: Icon, badge }) => (
                <button
                  key={id}
                  className="navlink"
                  aria-current={page === id ? 'page' : undefined}
                  onClick={() => setActivePage(id)}
                >
                  <Icon size={17} strokeWidth={2.2} />
                  {label}
                  {badge && <span className="dot-new" aria-label="baru terbuka" />}
                </button>
              ))}
            </nav>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            {classPicker}
            <span className="user-chip">
              <span className="avatar" style={{ background: colorFor(nama) }}>{initials(nama)}</span>
              <span className="user-name" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nama}
              </span>
            </span>
            <button onClick={logout} className="btn btn-sm btn-ghost" title="Keluar" aria-label="Keluar">
              <LogOut size={16} />
              <span className="hide-sm">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {!guru && hasClass && (
        <nav className="tabbar" aria-label="Menu siswa">
          {items.map(({ id, label, short, icon: Icon, badge }) => (
            <button key={id} aria-current={page === id ? 'page' : undefined} onClick={() => setActivePage(id)}>
              <span className="tab-ico">
                <Icon size={19} strokeWidth={2.2} />
              </span>
              {short || label}
              {badge && <span className="dot-new" />}
            </button>
          ))}
        </nav>
      )}
    </>
  );
};
