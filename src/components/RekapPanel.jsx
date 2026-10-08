import React, { useState } from 'react';
import { Search, Filter, Award, CheckCircle2, AlertCircle, Eye, X, Sparkles, FileText, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { bloomOf, colorFor, formatTanggal, initials, KKM, SKOR_SANGAT_BAIK, scoreTone } from '../lib/labels';

export const RekapPanel = () => {
  const { materials, evaluationRecords } = useApp();

  const [searchStudent, setSearchStudent] = useState('');
  const [filterMaterial, setFilterMaterial] = useState('Semua');
  const [filterScoreRange, setFilterScoreRange] = useState('Semua');
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);

  const filteredEvaluations = (evaluationRecords || []).filter((rec) => {
    const matchSearch =
      rec.siswaNama.toLowerCase().includes(searchStudent.toLowerCase()) ||
      rec.topikKasus.toLowerCase().includes(searchStudent.toLowerCase());
    const matchMaterial = filterMaterial === 'Semua' || rec.materiJudul === filterMaterial;
    let matchScore = true;
    if (filterScoreRange === 'tinggi') matchScore = rec.skor >= SKOR_SANGAT_BAIK;
    else if (filterScoreRange === 'sedang') matchScore = rec.skor >= KKM && rec.skor < SKOR_SANGAT_BAIK;
    else if (filterScoreRange === 'bimbingan') matchScore = rec.skor < KKM;

    return matchSearch && matchMaterial && matchScore;
  });

  return (
    <>
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
                <option value="tinggi">{`Sangat Baik (≥ ${SKOR_SANGAT_BAIK})`}</option>
                <option value="sedang">{`Tuntas KKM (${KKM} - ${SKOR_SANGAT_BAIK - 1})`}</option>
                <option value="bimbingan">{`Perlu Bimbingan (< ${KKM})`}</option>
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
            <>
            <ul className="rekap-cards">
              {filteredEvaluations.map((rec) => {
                const isTuntas = rec.skor >= KKM;
                const tone = scoreTone(rec.skor);
                return (
                  <li key={rec.id} style={{ borderBottom: '1px solid var(--subtle)' }}>
                    <button
                      onClick={() => setSelectedEvaluation(rec)}
                      style={{
                        width: '100%',
                        display: 'grid',
                        gap: '0.6rem',
                        padding: '1rem 1.25rem',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        font: 'inherit',
                        color: 'inherit',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: colorFor(rec.siswaNama),
                          color: 'var(--ink)',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {initials(rec.siswaNama)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {rec.siswaNama}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                            {rec.kelas} · {formatTanggal(rec.tanggal)}
                          </div>
                        </div>
                        <span style={{
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          color: `var(--${tone}-ink)`,
                          background: `var(--${tone}-soft)`,
                          border: `1px solid var(--${tone})`,
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--r-chip)',
                          minWidth: '46px',
                          textAlign: 'center'
                        }}>
                          {rec.skor}
                        </span>
                      </div>

                      <div style={{
                        fontSize: '0.88rem',
                        fontWeight: 500,
                        color: 'var(--ink-2)',
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {rec.topikKasus}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {rec.levelBloom && <span className={`badge ${bloomOf(rec.levelBloom).cls}`}>{rec.levelBloom}</span>}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: isTuntas ? 'var(--bukti-ink)' : 'var(--klaim-ink)',
                          background: isTuntas ? 'var(--bukti-soft)' : 'var(--klaim-soft)',
                          border: `1px solid ${isTuntas ? 'var(--bukti)' : 'var(--klaim)'}`,
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--r-chip)'
                        }}>
                          {isTuntas ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          {isTuntas ? 'Tuntas KKM' : 'Perlu Bimbingan'}
                        </span>
                        <ChevronRight size={18} style={{ marginLeft: 'auto', color: 'var(--muted)' }} />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="rekap-table" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'var(--subtle)', borderBottom: '1px solid var(--line)', color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>Siswa</th>
                    <th style={{ padding: '0.85rem 0.75rem', fontWeight: 600 }}>Topik Studi Kasus</th>
                    <th style={{ padding: '0.85rem 0.75rem', fontWeight: 600, textAlign: 'center' }}>Skor</th>
                    <th className="col-dimensi" style={{ padding: '0.85rem 0.75rem', fontWeight: 600 }}>Dimensi Nalar</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvaluations.map((rec) => {
                    const isTuntas = rec.skor >= KKM;
                    const tone = scoreTone(rec.skor);
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
                        <td style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>
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
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {initials(rec.siswaNama)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{rec.siswaNama}</div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>{formatTanggal(rec.tanggal)}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '1rem 0.75rem', width: '100%', maxWidth: 0 }}>
                          <div title={rec.topikKasus} style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {rec.topikKasus}
                          </div>
                          {rec.levelBloom && <span className={`badge ${bloomOf(rec.levelBloom).cls}`}>{rec.levelBloom}</span>}
                        </td>

                        <td style={{ padding: '1rem 0.75rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-block',
                            fontSize: '1.05rem',
                            fontWeight: 600,
                            color: `var(--${tone}-ink)`,
                            background: `var(--${tone}-soft)`,
                            border: `1px solid var(--${tone})`,
                            padding: '0.2rem 0.65rem',
                            borderRadius: 'var(--r-chip)',
                            minWidth: '46px'
                          }}>
                            {rec.skor}
                          </span>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem',
                            marginTop: '0.3rem',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: isTuntas ? 'var(--bukti-ink)' : 'var(--klaim-ink)'
                          }}>
                            {isTuntas ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                            {isTuntas ? 'Tuntas KKM' : 'Perlu Bimbingan'}
                          </div>
                        </td>

                        <td className="col-dimensi" style={{ padding: '1rem 0.75rem', whiteSpace: 'nowrap' }}>
                          {rec.dimensi ? (
                            <div style={{ display: 'flex', gap: '0.35rem', fontSize: '0.72rem' }}>
                              <span style={{ background: 'var(--subtle)', padding: '0.15rem 0.45rem', borderRadius: '4px', color: 'var(--ink-2)' }}>
                                Klaim {rec.dimensi.kejelasanKlaim}
                              </span>
                              <span style={{ background: 'var(--subtle)', padding: '0.15rem 0.45rem', borderRadius: '4px', color: 'var(--ink-2)' }}>
                                Bukti {rec.dimensi.ketajamanBukti}
                              </span>
                            </div>
                          ) : (
                            <span className="muted">–</span>
                          )}
                        </td>

                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedEvaluation(rec)}
                            className="btn btn-sm btn-secondary"
                            style={{
                              fontSize: '0.78rem',
                              gap: '0.35rem',
                              padding: '0.35rem 0.75rem',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <Eye size={13} />
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      </div>

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
          padding: 'clamp(0.75rem, 4vw, 1.5rem)'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '740px',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: 'clamp(1.25rem, 5vw, 2rem)',
            background: 'var(--surface)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1rem',
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
                  <div style={{ fontSize: '1.75rem', fontWeight: 600, whiteSpace: 'nowrap', color: selectedEvaluation.skor >= KKM ? 'var(--bukti-ink)' : 'var(--klaim-ink)' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))', gap: '0.6rem' }}>
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
    </>
  );
};
