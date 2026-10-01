import React, { useEffect, useRef, useState } from 'react';
import { Upload, FileText, Sparkles, Trash2, Check, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { extractText, formatSize, ACCEPT, MAX_CHARS } from '../lib/extractText';
import { generateTopics, aiStatus } from '../services/aiClient';
import { bloomOf, topicOf } from '../lib/labels';

export const MateriForge = () => {
  const { materials, cases, publishMaterial, deleteMaterial, setTeacherTab } = useApp();

  const [ai, setAi] = useState(null);
  const [judul, setJudul] = useState('');
  const [mapel, setMapel] = useState('');
  const [jumlah, setJumlah] = useState(8);
  const [teks, setTeks] = useState('');
  const [file, setFile] = useState(null);
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null);
  const [done, setDone] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { aiStatus().then(setAi); }, []);

  const onFile = async (f) => {
    if (!f) return;
    setError('');
    setReading(true);
    try {
      const out = await extractText(f);
      setFile({ name: f.name, size: formatSize(f.size), pages: out.pages, truncated: out.truncated });
      setTeks(out.text);
      if (!judul) setJudul(f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
    } catch (e) {
      setError(e.message);
    } finally {
      setReading(false);
    }
  };

  const buat = async () => {
    setError('');
    setDone('');
    if (!judul.trim()) return setError('Isi judul materi dulu.');
    if (teks.trim().length < 200) return setError('Teks materi terlalu pendek. Unggah file atau tempel minimal satu paragraf panjang.');
    setBusy(true);
    try {
      const res = await generateTopics({ judul: judul.trim(), mapel: mapel.trim(), teks, jumlah });
      setDraft({ ...res, topik: res.topik.map((t) => ({ ...t, pilih: true })) });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const ubahTopik = (i, patch) => setDraft((d) => ({ ...d, topik: d.topik.map((t, k) => (k === i ? { ...t, ...patch } : t)) }));

  const terbitkan = () => {
    const terpilih = draft.topik.filter((t) => t.pilih && t.judulKasus.trim());
    if (!terpilih.length) return setError('Pilih minimal satu topik.');
    publishMaterial({ judul: judul.trim(), mapel: mapel.trim(), fileName: file?.name, fileSize: file?.size, ai: draft, topikTerpilih: terpilih });
    setDone(`${terpilih.length} topik “${draft.topikRoda}” sudah muncul di spin siswa.`);
    setDraft(null);
    setJudul('');
    setMapel('');
    setTeks('');
    setFile(null);
  };

  const aiOff = ai && !ai.aiAktif;

  return (
    <div className="forge">
      <section className="card" style={{ padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
        {!draft ? (
          <>
            <h2 style={{ fontSize: '1.5rem' }}>Ubah materi jadi topik latihan</h2>
            <p className="muted" style={{ marginTop: '0.25rem' }}>Unggah bab yang sedang diajarkan. AI menyusun topik yang bisa diperdebatkan, lalu kamu memilih mana yang masuk ke spin siswa.</p>

            {aiOff && (
              <p className="card-inset" role="status" style={{ marginTop: '1rem', padding: '0.8rem 1rem', display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.9rem' }}>
                <AlertTriangle size={17} style={{ flex: 'none', marginTop: 2 }} />
                <span>AI belum aktif. Isi <code>LLM_API_KEY</code> di file <code>.env</code> server, lalu jalankan ulang aplikasi.</span>
              </p>
            )}

            <div className="grid-2" style={{ marginTop: '1.25rem' }}>
              <label>
                <span className="field-label">Judul materi *</span>
                <input className="input-text" value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Bab 5: Sampah Plastik dan Ekonomi Sirkular" />
              </label>
              <label>
                <span className="field-label">Mata pelajaran</span>
                <input className="input-text" value={mapel} onChange={(e) => setMapel(e.target.value)} placeholder="Biologi" />
              </label>
            </div>

            <div
              className="dropzone"
              data-over={dragOver}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); onFile(e.dataTransfer.files?.[0]); }}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
            >
              <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={(e) => onFile(e.target.files?.[0])} />
              {reading ? (
                <span>Membaca file…</span>
              ) : file ? (
                <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <FileText size={20} />
                  <span style={{ textAlign: 'left' }}>
                    <strong style={{ fontWeight: 500 }}>{file.name}</strong>
                    <span className="muted" style={{ display: 'block', fontSize: '0.8125rem' }}>
                      {file.size}{file.pages ? ` · ${file.pages} halaman` : ''} · {teks.length.toLocaleString('id-ID')} karakter terbaca{file.truncated ? ` (dipotong ke ${MAX_CHARS.toLocaleString('id-ID')})` : ''}
                    </span>
                  </span>
                  <button className="btn btn-sm btn-ghost btn-icon" onClick={(e) => { e.stopPropagation(); setFile(null); setTeks(''); }} aria-label="Hapus file"><X size={16} /></button>
                </span>
              ) : (
                <span style={{ display: 'grid', justifyItems: 'center', gap: 6 }}>
                  <Upload size={22} />
                  <span><strong style={{ fontWeight: 500 }}>Pilih file</strong> atau seret ke sini</span>
                  <span className="muted" style={{ fontSize: '0.8125rem' }}>PDF, DOCX, atau TXT. File dibaca di peramban, hanya teksnya yang dikirim ke AI.</span>
                </span>
              )}
            </div>

            <label style={{ display: 'block', marginTop: '1rem' }}>
              <span className="field-label">Atau tempel teks materi</span>
              <textarea className="textarea-custom" rows={6} value={teks} onChange={(e) => setTeks(e.target.value.slice(0, MAX_CHARS))} placeholder="Tempel isi bab, ringkasan, atau capaian pembelajaran di sini…" />
            </label>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
                Jumlah topik
                <select className="select-pill" value={jumlah} onChange={(e) => setJumlah(Number(e.target.value))}>
                  {[6, 8, 10, 12].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <button className="btn btn-primary btn-lg" onClick={buat} disabled={busy || reading || aiOff}>
                <Sparkles size={17} /> {busy ? 'AI sedang menyusun topik…' : 'Buat topik dengan AI'}
              </button>
            </div>
            {busy && <p className="muted" role="status" style={{ marginTop: '0.6rem', fontSize: '0.875rem', textAlign: 'right' }}>Biasanya 15 sampai 30 detik. Jangan tutup halaman ini.</p>}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div>
                <p className="eyebrow"><Sparkles size={14} /> Disusun AI ({draft.model}) · tinjau sebelum diterbitkan</p>
                <h2 style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>{judul}</h2>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => setDraft(null)}>Kembali</button>
            </div>

            <label style={{ display: 'block', marginTop: '1rem', maxWidth: 320 }}>
              <span className="field-label">Nama topik di spin siswa</span>
              <input className="input-text" maxLength={18} value={draft.topikRoda} onChange={(e) => setDraft((d) => ({ ...d, topikRoda: e.target.value }))} />
            </label>

            {draft.ringkasan && <p style={{ marginTop: '1rem', color: 'var(--ink-2)' }}>{draft.ringkasan}</p>}

            {draft.poinKunci.length > 0 && (
              <div className="card-inset" style={{ padding: '1rem 1.1rem', marginTop: '1rem' }}>
                <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Poin kunci materi (dipakai AI saat menilai jawaban siswa)</p>
                <ol style={{ paddingLeft: '1.2rem', display: 'grid', gap: 4, color: 'var(--ink-2)', fontSize: '0.9375rem' }}>
                  {draft.poinKunci.map((p) => <li key={p.teks}>{p.teks}{p.halaman ? <span className="muted"> (hlm. {p.halaman})</span> : null}</li>)}
                </ol>
              </div>
            )}

            <h3 style={{ fontSize: '1.125rem', margin: '1.5rem 0 0.75rem' }}>{draft.topik.filter((t) => t.pilih).length} dari {draft.topik.length} topik dipilih</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {draft.topik.map((t, i) => (
                <div key={i} className="topic-edit" data-off={!t.pilih}>
                  <label className="topic-check">
                    <input type="checkbox" checked={t.pilih} onChange={(e) => ubahTopik(i, { pilih: e.target.checked })} />
                    <span className="sr-only">Pilih topik {i + 1}</span>
                  </label>
                  <div style={{ display: 'grid', gap: 6, minWidth: 0 }}>
                    <input className="input-text" style={{ fontWeight: 500 }} value={t.judulKasus} onChange={(e) => ubahTopik(i, { judulKasus: e.target.value })} aria-label="Judul topik" />
                    <textarea className="textarea-custom" rows={3} value={t.teksKasus} onChange={(e) => ubahTopik(i, { teksKasus: e.target.value })} aria-label="Konteks topik" style={{ fontSize: '0.9375rem' }} />
                  </div>
                  <select className="select-pill" value={t.levelBloom} onChange={(e) => ubahTopik(i, { levelBloom: e.target.value })} aria-label="Tingkat">
                    {['Analisis', 'Evaluasi', 'Kreasi'].map((l) => <option key={l} value={l}>{bloomOf(l).nama}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={buat} disabled={busy}>{busy ? 'Menyusun ulang…' : 'Susun ulang'}</button>
              <button className="btn btn-primary btn-lg" onClick={terbitkan}>
                Terbitkan ke spin siswa <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}

        {error && <p role="alert" style={{ marginTop: '1rem', color: 'var(--rec-ink)', display: 'flex', gap: 6, alignItems: 'center' }}><AlertTriangle size={16} /> {error}</p>}
        {done && <p role="status" style={{ marginTop: '1rem', color: 'var(--bukti-ink)', display: 'flex', gap: 6, alignItems: 'center' }}><Check size={16} /> {done}</p>}
      </section>

      <aside className="card" style={{ padding: '1.25rem', alignSelf: 'start' }}>
        <h2 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>Materi di spin siswa</h2>
        <ul style={{ listStyle: 'none', display: 'grid', gap: '0.5rem' }}>
          {materials.map((m) => {
            const n = cases.filter((c) => c.materialId === m.id && c.aktif).length;
            return (
              <li key={m.id} className="card-inset" style={{ padding: '0.75rem 0.9rem', overflow: 'hidden', display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ minWidth: 0 }}>
                  <span className="badge badge-yellow">{topicOf(m)}</span>
                  <span style={{ display: 'block', fontSize: '0.875rem', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.judul}</span>
                  <span className="muted" style={{ fontSize: '0.8125rem' }}>{n} topik aktif{m.sumber === 'ai' ? ' · disusun AI' : ''}</span>
                </span>
                <button className="btn btn-sm btn-ghost btn-icon" onClick={() => { if (window.confirm(`Hapus materi “${m.judul}” beserta topiknya?`)) deleteMaterial(m.id); }} aria-label={`Hapus ${m.judul}`}>
                  <Trash2 size={16} />
                </button>
              </li>
            );
          })}
        </ul>
        <button className="btn btn-sm btn-secondary" style={{ marginTop: '0.9rem' }} onClick={() => setTeacherTab('bank_kasus')}>Kelola semua topik</button>
      </aside>
    </div>
  );
};
