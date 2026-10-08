import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MessageSquare, Send, Search, PlusCircle, Heart, X, MessageCircle } from 'lucide-react';
import { aiService } from '../services/aiService';
import { colorFor, formatTanggal, initials, isGuru } from '../lib/labels';

const Avatar = ({ nama, guru, size }) => (
  <span
    className="avatar"
    style={{ width: size, height: size, flexShrink: 0, background: guru ? 'var(--ink)' : colorFor(nama), color: guru ? 'var(--surface)' : 'var(--ink)' }}
  >
    {initials(nama)}
  </span>
);

export const ForumDiskusi = () => {
  const {
    materials,
    forumPosts,
    addForumPost,
    addComment,
    toggleLikeForumPost,
    currentUser
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState('Semua');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPostMaterialId, setNewPostMaterialId] = useState(materials[0]?.id || '');
  const [newPostKategori, setNewPostKategori] = useState('Etika & Kebijakan');
  const [newPostJudul, setNewPostJudul] = useState('');
  const [newPostIsi, setNewPostIsi] = useState('');
  const [formError, setFormError] = useState('');

  const [commentInputs, setCommentInputs] = useState({});
  const [notice, setNotice] = useState({ postId: null, text: '', blocked: false });

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostJudul.trim() || !newPostIsi.trim()) {
      setFormError('Isi judul dan pertanyaan diskusinya dulu.');
      return;
    }

    addForumPost({
      materiId: newPostMaterialId,
      kategori: newPostKategori,
      judul: newPostJudul,
      isi: newPostIsi
    });

    setNewPostJudul('');
    setNewPostIsi('');
    setFormError('');
    setIsModalOpen(false);
  };

  const handleSendComment = (postId) => {
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;

    const moderation = aiService.checkModeration(text);
    if (!moderation.allowed) {
      setNotice({ postId, text: moderation.message, blocked: true });
      return;
    }

    setNotice(moderation.hasNudge ? { postId, text: moderation.nudgeText, blocked: false } : { postId: null, text: '', blocked: false });

    addComment(postId, text);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const filteredPosts = (forumPosts || []).filter((post) => {
    const matchSearch =
      post.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.isi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.penulisNama.toLowerCase().includes(searchTerm.toLowerCase());

    const matchMaterial = selectedMaterialFilter === 'Semua' || post.materiId === selectedMaterialFilter;

    return matchSearch && matchMaterial;
  });

  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ background: 'var(--alasan-soft)', color: 'var(--alasan-ink)', border: '1px solid var(--alasan-soft)', padding: '0.15rem 0.6rem', borderRadius: 'var(--r-chip)', fontSize: '0.72rem', fontWeight: 600 }}>
                Diskusi Studi Kasus
              </span>
              <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Kelas {currentUser?.kelas}</span>
            </div>
            <h1 style={{ fontSize: '2.4rem', color: 'var(--ink)', letterSpacing: '-0.03em' }}>
              Forum Diskusi Studi Kasus
            </h1>
            <p style={{ color: 'var(--ink-2)' }}>
              Ruang bedah kasus pembelajaran dan kajian bahan ajar guru tanpa distraksi tren media sosial.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary btn-lg"
            style={{ gap: '0.55rem' }}
          >
            <PlusCircle size={18} />
            Mulai Topik Diskusi
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                type="text"
                className="input-text"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Cari topik kasus atau nama penulis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <select
                className="input-text"
                value={selectedMaterialFilter}
                onChange={(e) => setSelectedMaterialFilter(e.target.value)}
                style={{ background: 'var(--surface)' }}
              >
                <option value="Semua">Semua Bahan Ajar Pelajaran</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.judul}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {filteredPosts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--muted)' }}>
              <MessageSquare size={36} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <h3 style={{ fontSize: '1.2rem', color: 'var(--ink)', marginBottom: '0.4rem' }}>Belum Ada Topik Diskusi</h3>
              <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Jadilah yang pertama memulai pertukaran nalar kritis untuk materi pelajaran ini!
              </p>
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm">
                + Buka Topik Sekarang
              </button>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const isTeacher = isGuru({ role: post.penulisRole });
              const likedBy = post.likedBy || [];
              const liked = likedBy.includes(currentUser.id);

              return (
                <article key={post.id} className="glass-panel" style={{ padding: '2rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Avatar nama={post.penulisNama} guru={isTeacher} size={42} />

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.96rem', color: 'var(--ink)' }}>
                            {post.penulisNama}
                          </span>
                          <span className={`badge ${isTeacher ? 'badge-bloom-evaluasi' : 'badge-bloom-analisis'}`} style={{ fontSize: '0.68rem', padding: '0.15rem 0.55rem' }}>
                            {isTeacher ? 'Guru / Pendamping' : 'Siswa'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                          {formatTanggal(post.tanggal)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ background: 'var(--subtle)', padding: '0.15rem 0.55rem', borderRadius: 'var(--r-chip)', color: 'var(--ink-2)', fontSize: '0.72rem', fontWeight: 600 }}>
                        {post.kategori || 'Kasus'}
                      </span>
                      <span className="mono-tag" style={{ color: 'var(--ink-2)', background: 'var(--subtle)', border: '1px solid var(--line)', padding: '0.2rem 0.6rem', borderRadius: 'var(--r-chip)', fontSize: '0.72rem' }}>
                        {post.materiJudul}
                      </span>
                    </div>
                  </div>

                  <h2 style={{ fontSize: '1.4rem', color: 'var(--ink)', marginBottom: '0.85rem', letterSpacing: '-0.02em', lineHeight: 1.35 }}>
                    {post.judul}
                  </h2>

                  <p style={{
                    color: 'var(--ink-2)',
                    fontSize: '0.96rem',
                    lineHeight: 1.7,
                    marginBottom: '1.25rem',
                    whiteSpace: 'pre-line'
                  }}>
                    {post.isi}
                  </p>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '1.25rem',
                    borderBottom: '1px solid var(--line)',
                    marginBottom: '1.25rem'
                  }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        onClick={() => toggleLikeForumPost(post.id)}
                        aria-pressed={liked}
                        className="btn btn-sm btn-secondary"
                        style={{ gap: '0.35rem', padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        <Heart size={14} style={{ color: 'var(--rec)' }} fill={liked ? 'currentColor' : 'none'} />
                        <span>Apresiasi ({likedBy.length})</span>
                      </button>

                      <div className="btn btn-sm btn-secondary" style={{ gap: '0.35rem', padding: '0.3rem 0.8rem', fontSize: '0.8rem', cursor: 'default' }}>
                        <MessageCircle size={14} />
                        <span>{post.comments?.length || 0} Tanggapan</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ paddingLeft: '0.5rem' }}>
                    {post.comments && post.comments.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
                        {post.comments.map((comment) => {
                          const isCommentTeacher = isGuru({ role: comment.penulisRole });

                          return (
                            <div key={comment.id} style={{
                              display: 'flex',
                              gap: '0.75rem',
                              background: isCommentTeacher ? 'var(--surface)' : 'var(--subtle)',
                              border: isCommentTeacher ? '1px solid var(--alasan)' : '1px solid var(--line)',
                              borderRadius: '14px',
                              padding: '0.9rem 1.1rem'
                            }}>
                              <Avatar nama={comment.penulisNama} guru={isCommentTeacher} size={32} />

                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                                  <strong style={{ fontSize: '0.86rem', color: 'var(--ink)' }}>
                                    {comment.penulisNama}
                                  </strong>
                                  <span className={`badge ${isCommentTeacher ? 'badge-bloom-evaluasi' : 'badge-outline'}`} style={{ fontSize: '0.64rem', padding: '0.1rem 0.45rem' }}>
                                    {isCommentTeacher ? 'Guru' : 'Siswa'}
                                  </span>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', marginLeft: 'auto' }}>
                                    {formatTanggal(comment.tanggal)}
                                  </span>
                                </div>
                                <p style={{ fontSize: '0.88rem', color: 'var(--ink-2)', lineHeight: 1.5, margin: 0 }}>
                                  {comment.isi}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {notice.postId === post.id && (
                      <div role="status" style={{
                        background: notice.blocked ? 'var(--rec-soft)' : 'var(--klaim-soft)',
                        border: `1px solid ${notice.blocked ? 'var(--rec)' : 'var(--klaim)'}`,
                        borderRadius: '10px',
                        padding: '0.65rem 1rem',
                        marginBottom: '0.75rem',
                        fontSize: '0.82rem',
                        color: notice.blocked ? 'var(--rec-ink)' : 'var(--klaim-ink)'
                      }}>
                        {notice.text}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="input-text"
                        style={{ fontSize: '0.86rem', padding: '0.6rem 1rem' }}
                        placeholder={`Tanggapi sebagai ${currentUser.nama}... (tuliskan argumen atau alasan)`}
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSendComment(post.id);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSendComment(post.id)}
                        disabled={!(commentInputs[post.id] || '').trim()}
                        className="btn btn-primary"
                        style={{ padding: '0.6rem 1.1rem', fontSize: '0.86rem' }}
                      >
                        <Send size={14} /> Balas
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {isModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1.5rem'
          }}>
            <div className="glass-panel" style={{
              width: '100%',
              maxWidth: '680px',
              padding: '2.5rem',
              position: 'relative',
              background: 'var(--surface)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.18)'
            }}>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Tutup"
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: 'var(--subtle)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ background: 'var(--subtle)', padding: '0.15rem 0.55rem', borderRadius: 'var(--r-chip)', color: 'var(--ink-2)', fontSize: '0.72rem', fontWeight: 600 }}>
                  Topik Diskusi Baru
                </span>
                <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>Ruang Pelajaran</span>
              </div>

              <h2 style={{ fontSize: '1.6rem', color: 'var(--ink)', marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
                Mulai Topik Diskusi Studi Kasus
              </h2>

              <form onSubmit={handleCreatePost}>
                <div style={{ marginBottom: '1.15rem' }}>
                  <label className="mono-tag" style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--ink)' }}>
                    PILIH MATERI PELAJARAN:
                  </label>
                  <select
                    className="input-text"
                    value={newPostMaterialId}
                    onChange={(e) => setNewPostMaterialId(e.target.value)}
                    required
                  >
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.judul}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1.15rem' }}>
                  <label className="mono-tag" style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--ink)' }}>
                    KATEGORI TOPIK KASUS:
                  </label>
                  <input
                    type="text"
                    className="input-text"
                    placeholder="Contoh: Etika & Regulasi, Bioetika, Hak Cipta & Orisinalitas"
                    value={newPostKategori}
                    onChange={(e) => setNewPostKategori(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1.15rem' }}>
                  <label className="mono-tag" style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--ink)' }}>
                    JUDUL TOPIK DISKUSI:
                  </label>
                  <input
                    type="text"
                    className="input-text"
                    placeholder="Contoh: Larangan vs Pengujian Prompt: Apa Standar Asesmen yang Adil?"
                    value={newPostJudul}
                    onChange={(e) => setNewPostJudul(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="mono-tag" style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--ink)' }}>
                    ARGUMEN ATAU PERTANYAAN PEMANTIK:
                  </label>
                  <textarea
                    className="textarea-custom"
                    rows={5}
                    placeholder="Uraikan latar belakang studi kasus, dilema yang kamu lihat, dan pertanyaan yang ingin kamu diskusikan bersama rekan sekelas dan guru..."
                    value={newPostIsi}
                    onChange={(e) => setNewPostIsi(e.target.value)}
                    required
                  />
                </div>

                {formError && <p role="alert" style={{ color: 'var(--rec-ink)', fontSize: '0.875rem', marginBottom: '1rem' }}>{formError}</p>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    <Send size={15} /> Terbitkan Topik Diskusi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
