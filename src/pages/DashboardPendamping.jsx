import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MateriForge } from '../components/MateriForge';
import { KelasPanel } from '../components/KelasPanel';
import {
  Award,
  BookOpen,
  CheckSquare,
  RotateCw,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  Sparkles,
  FileText,
  Check,
  Lock,
  Unlock,
  MessageSquare,
  Users
} from 'lucide-react';
import { bloomOf, colorFor, formatTanggal, initials, topicOf } from '../lib/labels';

const LEVELS = ['Analisis', 'Evaluasi', 'Kreasi'];
const SEMESTER = 'Semester Ganjil 2026/2027';

export const DashboardPendamping = () => {
  const {
    currentUser,
    materials,
    cases,
    evaluationRecords,
    addCase,
    toggleCaseActive,
    deleteCase,
    updateCase,
    closeDiscussionRoom,
    reopenDiscussionRoom,
    closedRooms,
    syntheses,
    teacherTab,
    setTeacherTab,
    members,
    activeClass
  } = useApp();

  const activeTab = teacherTab || 'rekap_ai';
  const setActiveTab = setTeacherTab;

  const [notification, setNotification] = useState('');

  const [editingCaseId, setEditingCaseId] = useState(null);
  const [editFields, setEditFields] = useState({ judulKasus: '', teksKasus: '', levelBloom: 'Analisis' });

  const [isAddingCase, setIsAddingCase] = useState(false);
  const emptyCase = () => ({ judulKasus: '', teksKasus: '', levelBloom: 'Analisis', materialId: materials[0]?.id || '' });
  const [newCaseFields, setNewCaseFields] = useState(emptyCase);
  const [newCaseError, setNewCaseError] = useState('');

  const [searchStudent, setSearchStudent] = useState('');
  const [filterMaterial, setFilterMaterial] = useState('Semua');
  const [filterScoreRange, setFilterScoreRange] = useState('Semua');

  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const contentRef = useRef(null);

  const handleStartEdit = (c) => {
    setEditingCaseId(c.id);
    setEditFields({
      judulKasus: c.judulKasus,
      teksKasus: c.teksKasus,
      levelBloom: c.levelBloom
    });
  };

  const handleSaveEdit = (id) => {
    updateCase(id, editFields);
    setEditingCaseId(null);
  };

  const filteredEvaluations = (evaluationRecords || []).filter((rec) => {
    const matchSearch =
      rec.siswaNama.toLowerCase().includes(searchStudent.toLowerCase()) ||
      rec.topikKasus.toLowerCase().includes(searchStudent.toLowerCase());
    const matchMaterial = filterMaterial === 'Semua' || rec.materiJudul === filterMaterial;
    let matchScore = true;
    if (filterScoreRange === 'tinggi') matchScore = rec.skor >= 85;
    else if (filterScoreRange === 'sedang') matchScore = rec.skor >= 75 && rec.skor < 85;
    else if (filterScoreRange === 'bimbingan') matchScore = rec.skor < 75;

    return matchSearch && matchMaterial && matchScore;
  });

  const totalEvaluations = evaluationRecords?.length || 0;
  const avgScore = totalEvaluations
    ? (evaluationRecords.reduce((acc, r) => acc + (r.skor || 0), 0) / totalEvaluations).toFixed(1)
    : null;
  const tuntasCount = (evaluationRecords || []).filter(r => (r.skor || 0) >= 75).length;
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

  const saveNewCase = () => {
    if (!newCaseFields.judulKasus.trim() || !newCaseFields.teksKasus.trim()) {
      setNewCaseError('Isi judul dan konteks topik dulu.');
      return;
    }
    if (!newCaseFields.materialId) {
      setNewCaseError('Unggah materi dulu, topik harus terhubung ke salah satu materi.');
      return;
    }
    addCase({ ...newCaseFields, judulKasus: newCaseFields.judulKasus.trim(), teksKasus: newCaseFields.teksKasus.trim() });
    setIsAddingCase(false);
    setNotification(`Topik "${newCaseFields.judulKasus.trim()}" sudah masuk ke spin siswa.`);
    setNewCaseFields(emptyCase());
    setNewCaseError('');
  };

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

          <div className="glass-panel" style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--r-inner)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem'
          }}>
            <div>
              <div className="mono-tag" style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>PENDAMPING KELAS</div>
              <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.92rem' }}>
                {currentUser?.nama}
              </div>
            </div>
            <div style={{ height: '24px', width: '1px', background: 'var(--line)' }} />
            <div>
              <div className="mono-tag" style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>KELAS</div>
              <div style={{ fontWeight: 600, color: 'var(--alasan-ink)', fontSize: '0.85rem' }}>
                {currentUser?.kelas}
              </div>
            </div>
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
                Ketuntasan KKM (≥ 75)
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
                Jawaban Terkoreksi AI
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--lavender-soft)',
                color: 'var(--lavender-ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.03em' }}>
                {totalEvaluations}
              </span>
              <span style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>jawaban siswa</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--bukti-ink)', margin: 0, fontWeight: 500 }}>
              Dinilai otomatis, tanpa rekap manual
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
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--ink-2)',
                  background: 'var(--subtle)',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '6px',
                  border: '1px solid var(--line)'
                }}>
                  5 Modul
                </span>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {modules.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
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

              <div style={{
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <button
                  onClick={() => setIsAddingCase(true)}
                  className="btn btn-sm btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '0.6rem',
                    fontSize: '0.82rem',
                    gap: '0.4rem',
                    borderRadius: '10px'
                  }}
                >
                  <Plus size={15} />
                  Tambah Topik
                </button>

                <div style={{
                  background: 'var(--subtle)',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  padding: '0.75rem 0.85rem',
                  fontSize: '0.75rem',
                  color: 'var(--muted)',
                  lineHeight: 1.45
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--bukti-ink)', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--bukti-ink)' }} />
                    AI Auto-Scoring Live
                  </div>
                  Transkrip dinilai instan otomatis dengan rubrik taksonomi nalar.
                </div>
              </div>
            </div>
          </aside>

          <main style={{ minWidth: 0 }}>
        {notification && (
          <div style={{
            background: 'var(--bukti-soft)',
            border: '1px solid var(--bukti)',
            color: 'var(--bukti-ink)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--r-inner)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            fontSize: '0.9rem',
            fontWeight: 500
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CheckCircle2 size={18} />
              <span>{notification}</span>
            </div>
            <button
              onClick={() => setNotification('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bukti-ink)' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {activeTab === 'rekap_ai' && (
          <div>
            <div className="glass-panel" style={{
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ position: 'relative', minWidth: 'min(100%, 280px)', flex: '1 1 300px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                <input
                  type="text"
                  placeholder="Cari nama siswa atau topik kasus..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="input-text"
                  style={{ paddingLeft: '2.3rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, maxWidth: '100%', flex: '1 1 260px' }}>
                  <Filter size={14} style={{ color: 'var(--muted)' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Materi:</span>
                  <select
                    value={filterMaterial}
                    onChange={(e) => setFilterMaterial(e.target.value)}
                    style={{
                      minWidth: 0,
                      width: '100%',
                      background: 'var(--surface)',
                      border: '1px solid var(--line-strong)',
                      borderRadius: '8px',
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.82rem',
                      color: 'var(--ink)',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Semua">Semua Materi Pelajaran</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.judul}>{m.judul}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Status Nilai:</span>
                  <select
                    value={filterScoreRange}
                    onChange={(e) => setFilterScoreRange(e.target.value)}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--line-strong)',
                      borderRadius: '8px',
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.82rem',
                      color: 'var(--ink)',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="tinggi">Sangat Baik (≥ 85)</option>
                    <option value="sedang">Tuntas KKM (75 - 84)</option>
                    <option value="bimbingan">Perlu Bimbingan (&lt; 75)</option>
                  </select>
                </div>

                {(searchStudent || filterMaterial !== 'Semua' || filterScoreRange !== 'Semua') && (
                  <button
                    onClick={() => {
                      setSearchStudent('');
                      setFilterMaterial('Semua');
                      setFilterScoreRange('Semua');
                    }}
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '0.78rem' }}
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              <div style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', color: 'var(--ink)', fontWeight: 600 }}>
                    Rekapitulasi Penilaian Nalar AI Siswa
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: 0 }}>
                    Menampilkan {filteredEvaluations.length} dari total {evaluationRecords?.length} pengerjaan studi kasus
                  </p>
                </div>
              </div>

              {filteredEvaluations.length === 0 ? (
                <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
                  <Award size={40} style={{ margin: '0 auto 0.75rem', color: 'var(--line-strong)' }} />
                  <div style={{ fontWeight: 600, color: 'var(--ink-2)', marginBottom: '0.25rem' }}>
                    Tidak ada rekapan evaluasi yang sesuai filter
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                    Coba ganti kata kunci pencarian atau bersihkan filter di atas.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--subtle)', borderBottom: '1px solid var(--line)', color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600 }}>Siswa</th>
                        <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Topik Studi Kasus</th>
                        <th style={{ padding: '0.85rem 1rem', fontWeight: 600, textAlign: 'center' }}>Skor Akhir</th>
                        <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Status KKM</th>
                        <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Dimensi Nalar</th>
                        <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Waktu</th>
                        <th style={{ padding: '0.85rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvaluations.map((rec) => {
                        const isTuntas = (rec.skor || 0) >= 75;
                        const isHigh = (rec.skor || 0) >= 85;
                        return (
                          <tr
                            key={rec.id}
                            style={{
                              borderBottom: '1px solid var(--subtle)',
                              transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--subtle)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '1rem 1.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: colorFor(rec.siswaNama),
                                  color: 'var(--ink)',
                                  fontWeight: 600,
                                  fontSize: '0.78rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {initials(rec.siswaNama)}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{rec.siswaNama}</div>
                                  <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>{rec.kelas}</div>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '1rem 1rem' }}>
                              <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '0.2rem', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {rec.topikKasus}
                              </div>
                              {rec.levelBloom && <span className={`badge ${bloomOf(rec.levelBloom).cls}`}>{rec.levelBloom}</span>}
                            </td>

                            <td style={{ padding: '1rem 1rem', textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-block',
                                fontSize: '1.05rem',
                                fontWeight: 600,
                                color: isHigh ? 'var(--bukti-ink)' : isTuntas ? 'var(--alasan-ink)' : 'var(--klaim-ink)',
                                background: isHigh ? 'var(--bukti-soft)' : isTuntas ? 'var(--alasan-soft)' : 'var(--klaim-soft)',
                                border: `1px solid ${isHigh ? 'var(--bukti)' : isTuntas ? 'var(--alasan)' : 'var(--klaim)'}`,
                                padding: '0.2rem 0.65rem',
                                borderRadius: 'var(--r-chip)',
                                minWidth: '46px'
                              }}>
                                {rec.skor}
                              </span>
                            </td>

                            <td style={{ padding: '1rem 1rem' }}>
                              {isTuntas ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  fontSize: '0.74rem',
                                  fontWeight: 600,
                                  color: 'var(--bukti-ink)',
                                  background: 'var(--bukti-soft)',
                                  border: '1px solid var(--bukti)',
                                  padding: '0.15rem 0.55rem',
                                  borderRadius: 'var(--r-chip)'
                                }}>
                                  <CheckCircle2 size={12} /> Tuntas KKM
                                </span>
                              ) : (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  fontSize: '0.74rem',
                                  fontWeight: 600,
                                  color: 'var(--klaim-ink)',
                                  background: 'var(--klaim-soft)',
                                  border: '1px solid var(--klaim)',
                                  padding: '0.15rem 0.55rem',
                                  borderRadius: 'var(--r-chip)'
                                }}>
                                  <AlertCircle size={12} /> Perlu Bimbingan
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '1rem 1rem' }}>
                              {rec.dimensi ? (
                                <div style={{ display: 'flex', gap: '0.35rem', fontSize: '0.72rem' }}>
                                  <span style={{ background: 'var(--subtle)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: 'var(--ink-2)' }}>
                                    Klaim: {rec.dimensi.kejelasanKlaim}
                                  </span>
                                  <span style={{ background: 'var(--subtle)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: 'var(--ink-2)' }}>
                                    Bukti: {rec.dimensi.ketajamanBukti}
                                  </span>
                                </div>
                              ) : (
                                <span className="muted">–</span>
                              )}
                            </td>

                            <td style={{ padding: '1rem 1rem', fontSize: '0.78rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                              {formatTanggal(rec.tanggal)}
                            </td>

                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                              <button
                                onClick={() => setSelectedEvaluation(rec)}
                                className="btn btn-sm btn-secondary"
                                style={{
                                  fontSize: '0.78rem',
                                  gap: '0.35rem',
                                  padding: '0.35rem 0.75rem'
                                }}
                              >
                                <Eye size={13} />
                                Lihat Detail AI
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'kelas' && <KelasPanel />}

        {activeTab === 'materi' && <MateriForge />}

        {activeTab === 'bank_kasus' && (
          <div>
            <div className="glass-panel" style={{
              padding: '1.25rem 1.5rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              borderLeft: '4px solid var(--alasan-ink)'
            }}>
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.2rem' }}>
                  Topik di Spin Siswa
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-2)', margin: 0, maxWidth: '780px' }}>
                  Topik berstatus <strong>Aktif</strong> muncul di spin siswa sesuai materinya. Nonaktifkan topik yang tidak ingin dipakai di sesi ini.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--bukti-ink)',
                  background: 'var(--bukti-soft)',
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--r-chip)',
                  border: '1px solid var(--bukti)'
                }}>
                  {cases.filter(c => c.aktif).length} Topik Aktif di Spin
                </span>
                <button
                  onClick={() => setIsAddingCase(true)}
                  className="btn btn-sm btn-primary"
                  style={{ gap: '0.35rem' }}
                >
                  <Plus size={15} />
                  Tambah Topik
                </button>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))',
              gap: '1.25rem'
            }}>
              {cases.map((c) => {
                const isEditing = editingCaseId === c.id;
                return (
                  <div
                    key={c.id}
                    className="glass-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: c.aktif ? '1px solid var(--line-strong)' : '1px dashed var(--line-strong)',
                      background: c.aktif ? 'var(--surface)' : 'var(--subtle)',
                      opacity: c.aktif ? 1 : 0.8
                    }}
                  >
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.85rem'
                      }}>
                        <button
                          onClick={() => toggleCaseActive(c.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            background: c.aktif ? 'var(--bukti-soft)' : 'var(--subtle)',
                            color: c.aktif ? 'var(--bukti-ink)' : 'var(--muted)',
                            border: `1px solid ${c.aktif ? 'var(--bukti)' : 'var(--line)'}`,
                            padding: '0.2rem 0.65rem',
                            borderRadius: 'var(--r-chip)',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          title="Klik untuk mengaktifkan atau menonaktifkan topik di spin siswa"
                        >
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: c.aktif ? 'var(--bukti-ink)' : 'var(--muted)'
                          }} />
                          {c.aktif ? 'Aktif di Spin' : 'Nonaktif'}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className={`badge ${bloomOf(c.levelBloom).cls}`}>
                            {c.levelBloom || 'Analisis'}
                          </span>
                        </div>
                      </div>

                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem' }}>
                          <input
                            type="text"
                            value={editFields.judulKasus}
                            onChange={(e) => setEditFields({ ...editFields, judulKasus: e.target.value })}
                            className="input-text"
                            style={{ fontSize: '0.88rem', fontWeight: 600 }}
                          />
                          <textarea
                            rows={4}
                            value={editFields.teksKasus}
                            onChange={(e) => setEditFields({ ...editFields, teksKasus: e.target.value })}
                            className="textarea-custom"
                            style={{ fontSize: '0.82rem' }}
                          />
                          <select
                            value={editFields.levelBloom}
                            onChange={(e) => setEditFields({ ...editFields, levelBloom: e.target.value })}
                            className="select-custom"
                          >
                            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                          </select>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                            <button
                              onClick={() => handleSaveEdit(c.id)}
                              className="btn btn-sm btn-primary"
                              style={{ flex: 1 }}
                            >
                              <Check size={13} /> Simpan
                            </button>
                            <button
                              onClick={() => setEditingCaseId(null)}
                              className="btn btn-sm btn-secondary"
                              style={{ flex: 1 }}
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.45rem', lineHeight: 1.35 }}>
                            {c.judulKasus}
                          </h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: '0.85rem' }}>
                            {c.teksKasus}
                          </p>

                          {c.kunciKonsep && (
                            <div style={{
                              background: 'var(--subtle)',
                              border: '1px solid var(--line)',
                              borderRadius: '8px',
                              padding: '0.55rem 0.75rem',
                              fontSize: '0.76rem',
                              color: 'var(--muted)',
                              marginBottom: '1rem'
                            }}>
                              <strong style={{ color: 'var(--ink-2)' }}>Target Nalar:</strong> {c.kunciKonsep}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {!isEditing && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid var(--subtle)',
                        marginTop: '0.5rem'
                      }}>
                        <span className="badge badge-yellow" style={{ maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {topicOf(materials.find((m) => m.id === c.materialId))}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            onClick={() => handleStartEdit(c)}
                            className="btn btn-sm btn-secondary"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                            title="Ubah judul, konteks, atau tingkat topik"
                          >
                            <Edit3 size={12} />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus topik "${c.judulKasus}"?`)) {
                                deleteCase(c.id);
                              }
                            }}
                            className="btn btn-sm btn-danger"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                            title="Hapus topik"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'moderasi' && (
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
              {cases.map((c) => {
                const isClosed = closedRooms[c.id];
                const synth = syntheses[c.id];
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
        )}
          </main>
        </div>

        <nav className="tabbar tabbar-guru" aria-label="Modul guru">
          {modules.map(({ id, short, icon: Icon }) => (
            <button
              key={id}
              aria-current={activeTab === id ? 'page' : undefined}
              onClick={() => {
                setActiveTab(id);
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

        {selectedEvaluation && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(26, 26, 26, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}>
            <div className="glass-panel" style={{
              width: '100%',
              maxWidth: '740px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '2rem',
              background: 'var(--surface)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid var(--line)',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      background: 'var(--alasan-soft)',
                      color: 'var(--alasan-ink)',
                      padding: '0.15rem 0.55rem',
                      borderRadius: 'var(--r-chip)'
                    }}>
                      Laporan AI
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      {selectedEvaluation.kelas} · {formatTanggal(selectedEvaluation.tanggal)}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--ink)' }}>
                    {selectedEvaluation.siswaNama}
                  </h3>
                  <div style={{ fontSize: '0.88rem', color: 'var(--ink-2)' }}>
                    Topik Kasus: <strong>{selectedEvaluation.topikKasus}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600 }}>SKOR AKHIR</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 600, color: selectedEvaluation.skor >= 75 ? 'var(--bukti-ink)' : 'var(--klaim-ink)' }}>
                      {selectedEvaluation.skor} <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>/ 100</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEvaluation(null)}
                    aria-label="Tutup"
                    style={{
                      background: 'var(--subtle)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'var(--muted)'
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink-2)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={15} style={{ color: 'var(--alasan-ink)' }} />
                  Jawaban siswa ({selectedEvaluation.lewatSuara === false ? 'diketik' : 'lisan'}, {selectedEvaluation.durasiPengerjaan})
                </h4>
                <div style={{
                  background: 'var(--subtle)',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  padding: '1rem',
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                  color: 'var(--ink)',
                  fontStyle: 'italic'
                }}>
                  “{selectedEvaluation.jawabanTeks}”
                </div>
              </div>

              {selectedEvaluation.dimensi && <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink-2)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Award size={15} style={{ color: 'var(--lavender-ink)' }} />
                  Lima dimensi nalar
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  {[
                    { label: 'Klaim', score: selectedEvaluation.dimensi.kejelasanKlaim },
                    { label: 'Alasan', score: selectedEvaluation.dimensi.kekuatanAlasan },
                    { label: 'Bukti', score: selectedEvaluation.dimensi.ketajamanBukti },
                    { label: 'Kelancaran', score: selectedEvaluation.dimensi.kelancaranLisan },
                    { label: 'Kemandirian', score: selectedEvaluation.dimensi.kemandirianNalar }
                  ].map((dim) => (
                    <div key={dim.label} style={{ background: 'var(--subtle)', border: '1px solid var(--line)', borderRadius: '8px', padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>{dim.label}</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--ink)' }}>{dim.score}</div>
                    </div>
                  ))}
                </div>
              </div>}

              <div style={{
                background: 'var(--alasan-soft)',
                border: '1px solid var(--alasan)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                  <Sparkles size={16} style={{ color: 'var(--alasan-ink)' }} />
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--alasan-ink)', margin: 0 }}>
                    Umpan balik AI{selectedEvaluation.sumberAnalisis === 'lokal' ? ' (mode cadangan)' : ''}
                  </h4>
                </div>
                <div style={{ fontSize: '0.86rem', color: 'var(--alasan-ink)', lineHeight: 1.6 }}>
                  <p style={{ margin: 0 }}>{selectedEvaluation.feedback || 'Belum ada umpan balik.'}</p>
                  {selectedEvaluation.penjelasanKonsep && (
                    <p style={{ margin: '0.5rem 0 0' }}>
                      <strong>Konsep kunci:</strong> {selectedEvaluation.penjelasanKonsep}
                    </p>
                  )}
                  {selectedEvaluation.pertanyaanLanjutan && (
                    <p style={{ margin: '0.5rem 0 0' }}>
                      <strong>Pertanyaan lanjutan:</strong> {selectedEvaluation.pertanyaanLanjutan}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  onClick={() => setSelectedEvaluation(null)}
                  className="btn btn-secondary"
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
                >
                  Tutup Laporan
                </button>
              </div>
            </div>
          </div>
        )}

        {isAddingCase && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(26, 26, 26, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}>
            <div className="glass-panel" style={{
              width: '100%',
              maxWidth: '560px',
              padding: '2rem',
              borderRadius: '20px',
              background: 'var(--surface)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--ink)' }}>
                  Tambah Topik Spin Siswa
                </h3>
                <button
                  onClick={() => { setIsAddingCase(false); setNewCaseError(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                  aria-label="Tutup"
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink-2)', marginBottom: '0.35rem' }}>
                    Judul topik *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Perlukah kantin sekolah melarang plastik sekali pakai?"
                    value={newCaseFields.judulKasus}
                    onChange={(e) => setNewCaseFields({ ...newCaseFields, judulKasus: e.target.value })}
                    className="input-text"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink-2)', marginBottom: '0.35rem' }}>
                    Konteks topik *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Dua sampai tiga kalimat tentang situasi atau dilemanya."
                    value={newCaseFields.teksKasus}
                    onChange={(e) => setNewCaseFields({ ...newCaseFields, teksKasus: e.target.value })}
                    className="textarea-custom"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <label>
                    <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink-2)', marginBottom: '0.35rem' }}>Materi *</span>
                    <select
                      value={newCaseFields.materialId}
                      onChange={(e) => setNewCaseFields({ ...newCaseFields, materialId: e.target.value })}
                      className="select-custom"
                    >
                      {materials.map((m) => <option key={m.id} value={m.id}>{m.judul}</option>)}
                    </select>
                  </label>
                  <label>
                    <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink-2)', marginBottom: '0.35rem' }}>Tingkat Bloom</span>
                    <select
                      value={newCaseFields.levelBloom}
                      onChange={(e) => setNewCaseFields({ ...newCaseFields, levelBloom: e.target.value })}
                      className="select-custom"
                    >
                      {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </label>
                </div>

                {newCaseError && <p role="alert" style={{ color: 'var(--rec-ink)', fontSize: '0.875rem' }}>{newCaseError}</p>}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={saveNewCase}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '0.65rem' }}
                  >
                    Simpan Topik
                  </button>
                  <button
                    onClick={() => setIsAddingCase(false)}
                    className="btn btn-secondary"
                    style={{ padding: '0.65rem 1.25rem' }}
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
