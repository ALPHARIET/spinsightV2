import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MateriForge } from '../components/MateriForge';
import { KelasPanel } from '../components/KelasPanel';
import { RekapPanel } from '../components/RekapPanel';
import { BankTopikPanel } from '../components/BankTopikPanel';
import { ModerasiPanel } from '../components/ModerasiPanel';
import { Award, BookOpen, CheckSquare, RotateCw, CheckCircle2, MessageSquare, Users } from 'lucide-react';
import { KKM } from '../lib/labels';

const SEMESTER = 'Semester Ganjil 2026/2027';

export const DashboardPendamping = () => {
  const { currentUser, materials, cases, evaluationRecords, teacherTab, setTeacherTab, members, activeClass } = useApp();
  const contentRef = useRef(null);

  const totalEvaluations = evaluationRecords?.length || 0;
  const avgScore = totalEvaluations
    ? (evaluationRecords.reduce((acc, r) => acc + (r.skor || 0), 0) / totalEvaluations).toFixed(1)
    : null;
  const tuntasCount = (evaluationRecords || []).filter((r) => r.skor >= KKM).length;
  const tuntasPct = totalEvaluations ? Math.round((tuntasCount / totalEvaluations) * 100) : 0;
  const activeCasesCount = cases.filter(c => c.aktif).length;

  const modules = [
    {
      id: 'kelas',
      label: 'Kelas & Kode',
      short: 'Kelas',
      desc: 'Undang siswa ke kelas',
      icon: Users,
      badge: members?.length
    },
    {
      id: 'rekap_ai',
      label: 'Rekapitulasi AI',
      short: 'Rekap',
      desc: 'Evaluasi nalar lisan siswa',
      icon: Award,
      badge: evaluationRecords?.length
    },
    {
      id: 'materi',
      label: 'Materi Guru',
      short: 'Materi',
      desc: 'Materi jadi topik (AI)',
      icon: BookOpen,
      badge: materials?.length
    },
    {
      id: 'bank_kasus',
      label: 'Bank Topik',
      short: 'Topik',
      desc: 'Topik di spin siswa',
      icon: CheckSquare,
      badge: cases?.length
    },
    {
      id: 'moderasi',
      label: 'Moderasi Diskusi',
      short: 'Diskusi',
      desc: 'Forum & sintesis kelas',
      icon: MessageSquare
    }
  ];

  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              marginBottom: '0.45rem',
              fontSize: '0.85rem',
              color: 'var(--muted)',
              flexWrap: 'wrap'
            }}>
              <span style={{ color: 'var(--muted)', fontWeight: 500 }}>Portal Guru</span>
              <span style={{ color: 'var(--line-strong)', userSelect: 'none' }}>/</span>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                Kelas {currentUser?.kelas}{currentUser?.sekolah ? ` (${currentUser.sekolah})` : ''}{activeClass?.contoh ? ' · kelas contoh' : ''}
              </span>
              <span style={{ color: 'var(--line-strong)' }}>•</span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: 'var(--bukti-ink)',
                fontWeight: 600,
                fontSize: '0.8rem'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--bukti-ink)' }} />
                {SEMESTER}
              </span>
            </div>
            <h1 style={{ fontSize: '2.1rem', color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: '0.35rem', fontWeight: 600 }}>
              Pusat Kendali Pembelajaran
            </h1>
            <p style={{ color: 'var(--ink-2)', fontSize: '0.92rem', maxWidth: '680px', lineHeight: 1.55 }}>
              Unggah materi jadi topik spin, pantau evaluasi penalaran lisan siswa, dan kelola sintesis diskusi kelas.
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-2)' }}>
                Rata-rata Skor Kelas
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--alasan-soft)',
                color: 'var(--alasan-ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Award size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.03em' }}>
                {avgScore ?? '–'}
              </span>
              <span style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>/ 100</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ width: `${avgScore || 0}%`, height: '100%', background: 'var(--alasan-ink)', borderRadius: '9999px' }} />
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-2)' }}>
                Ketuntasan KKM (≥ {KKM})
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--bukti-soft)',
                color: 'var(--bukti-ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.03em' }}>
                {tuntasPct}%
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>({tuntasCount} dari {totalEvaluations} jawaban)</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: 0 }}>
              {!totalEvaluations ? 'Belum ada jawaban siswa' : totalEvaluations - tuntasCount > 0 ? `${totalEvaluations - tuntasCount} jawaban perlu penguatan` : 'Semua jawaban sudah tuntas KKM'}
            </p>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-2)' }}>
                Topik Spin Siswa
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--klaim-soft)',
                color: 'var(--klaim-ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <RotateCw size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.03em' }}>
                {activeCasesCount}
              </span>
              <span style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>/ {cases.length} Aktif</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: 0 }}>
              Tampil di spin siswa
            </p>
          </div>
        </div>

        <div ref={contentRef} className="dashboard-grid-layout" style={{ marginBottom: '2.5rem' }}>

          <aside className="dashboard-side">
            <div className="glass-panel" style={{
              padding: '1.15rem',
              borderRadius: '16px',
              border: '1px solid var(--line)',
              background: 'var(--surface)',
              boxShadow: '0 4px 20px -4px rgba(26, 26, 26, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '0.85rem',
                marginBottom: '0.75rem',
                borderBottom: '1px solid var(--subtle)'
              }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: 'var(--muted)',
                  textTransform: 'uppercase'
                }}>
                  Modul Kontrol Guru
                </span>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {modules.map((item) => {
                  const isActive = teacherTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTeacherTab(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.85rem 0.95rem',
                        borderRadius: '12px',
                        border: isActive ? '1px solid var(--ink)' : '1px solid transparent',
                        background: isActive ? 'var(--ink)' : 'transparent',
                        color: isActive ? 'var(--surface)' : 'var(--ink-2)',
                        boxShadow: isActive ? '0 4px 14px rgba(26, 26, 26, 0.16)' : 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.18s ease',
                        width: '100%'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'var(--subtle)';
                          e.currentTarget.style.color = 'var(--ink)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--ink-2)';
                        }
                      }}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '9px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: isActive ? 'rgba(255, 255, 255, 0.16)' : 'var(--subtle)',
                        color: isActive ? 'var(--surface)' : 'var(--muted)'
                      }}>
                        <item.icon size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem' }}>
                          <span style={{
                            fontSize: '0.88rem',
                            fontWeight: isActive ? 700 : 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.label}
                          </span>
                          {item.badge !== undefined && (
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              padding: '0.1rem 0.45rem',
                              borderRadius: '9999px',
                              background: isActive ? 'rgba(255, 255, 255, 0.22)' : 'var(--line)',
                              color: isActive ? 'var(--surface)' : 'var(--muted)'
                            }}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: '0.72rem',
                          color: isActive ? 'rgba(255, 255, 255, 0.7)' : 'var(--muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '0.1rem'
                        }}>
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <main style={{ minWidth: 0 }}>
            {teacherTab === 'rekap_ai' && <RekapPanel key={activeClass?.id} />}
            {teacherTab === 'kelas' && <KelasPanel />}
            {teacherTab === 'materi' && <MateriForge />}
            {teacherTab === 'bank_kasus' && <BankTopikPanel key={activeClass?.id} />}
            {teacherTab === 'moderasi' && <ModerasiPanel />}
          </main>
        </div>

        <nav className="tabbar tabbar-guru" aria-label="Modul guru">
          {modules.map(({ id, short, icon: Icon }) => (
            <button
              key={id}
              aria-current={teacherTab === id ? 'page' : undefined}
              onClick={() => {
                setTeacherTab(id);
                contentRef.current?.scrollIntoView();
              }}
            >
              <span className="tab-ico">
                <Icon size={19} strokeWidth={2.2} />
              </span>
              {short}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
