import React, { useState } from 'react';
import { Plus, Trash2, Edit3, CheckCircle2, X, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { bloomOf, topicOf } from '../lib/labels';

const LEVELS = ['Analisis', 'Evaluasi', 'Kreasi'];

export const BankTopikPanel = () => {
  const { materials, cases, addCase, toggleCaseActive, deleteCase, updateCase } = useApp();

  const [notification, setNotification] = useState('');

  const [editingCaseId, setEditingCaseId] = useState(null);
  const [editFields, setEditFields] = useState({ judulKasus: '', teksKasus: '', levelBloom: 'Analisis' });

  const [isAddingCase, setIsAddingCase] = useState(false);
  const emptyCase = () => ({ judulKasus: '', teksKasus: '', levelBloom: 'Analisis', materialId: materials[0]?.id || '' });
  const [newCaseFields, setNewCaseFields] = useState(emptyCase);
  const [newCaseError, setNewCaseError] = useState('');

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
    <>
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
    </>
  );
};
