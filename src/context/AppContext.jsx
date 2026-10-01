import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { aiService } from '../services/aiService';
import { analyzeAnswer } from '../services/aiClient';
import { authApi, dataApi, getSession, setSession } from '../services/dataClient';
import { stamp } from '../lib/labels';

const AppContext = createContext();

const PAGES = ['landing', 'spin', 'forum', 'arena', 'pendamping', 'jurnal', 'gabung'];
const ACTIVE_CLASS_KEY = 'spinsight_active_class';
const ACTIVE_CASE_KEY = 'spinsight_active_case';

// Hapus sisa data lokal versi lama (sebelum ada akun dan kelas).
try {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('spinsight_') && ![ACTIVE_CLASS_KEY, ACTIVE_CASE_KEY, 'spinsight_session'].includes(k))
    .forEach((k) => localStorage.removeItem(k));
} catch {}

const readLocal = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const writeLocal = (key, value) => {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {}
};

const pageFromPath = () => {
  const path = window.location.pathname.replace(/^\//, '').toLowerCase();
  return PAGES.includes(path) ? path : 'landing';
};

const uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const EMPTY = {
  classes: [],
  members: [],
  materials: [],
  cases: [],
  evaluationRecords: [],
  journals: [],
  arenaPosts: [],
  forumPosts: [],
  syntheses: {},
  closedRooms: {},
  spinSessions: {},
};

export const AppProvider = ({ children }) => {
  const [me, setMe] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeClassId, setActiveClassId] = useState(() => readLocal(ACTIVE_CLASS_KEY));
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [cases, setCases] = useState([]);
  const [evaluationRecords, setEvaluationRecords] = useState([]);
  const [journals, setJournals] = useState([]);
  const [arenaPosts, setArenaPosts] = useState([]);
  const [forumPosts, setForumPosts] = useState([]);
  const [syntheses, setSyntheses] = useState({});
  const [closedRooms, setClosedRooms] = useState({});
  const [spinSessions, setSpinSessions] = useState({});
  const [activeCaseId, setActiveCaseIdState] = useState(() => readLocal(ACTIVE_CASE_KEY));
  const [activePage, setActivePageState] = useState(pageFromPath);
  const [teacherTab, setTeacherTab] = useState('rekap_ai');
  const [dataError, setDataError] = useState('');

  const pending = useRef(0);
  const meRef = useRef(me);
  meRef.current = me;
  const classRef = useRef(activeClassId);
  classRef.current = activeClassId;

  const setActiveCaseId = (id) => {
    setActiveCaseIdState(id);
    writeLocal(ACTIVE_CASE_KEY, id);
  };

  const apply = (d) => {
    setMe(d.me);
    setClasses(d.classes || []);
    setActiveClassId(d.activeClassId);
    writeLocal(ACTIVE_CLASS_KEY, d.activeClassId);
    setMembers(d.members || []);
    setMaterials(d.materials || []);
    setCases(d.cases || []);
    setEvaluationRecords(d.evaluationRecords || []);
    setJournals(d.journals || []);
    setArenaPosts(d.arenaPosts || []);
    setForumPosts(d.forumPosts || []);
    setSyntheses(d.syntheses || {});
    setClosedRooms(d.closedRooms || {});
    setSpinSessions(d.spinSessions || {});
  };

  const clearAll = () => {
    setMe(null);
    apply({ ...EMPTY, me: null, activeClassId: null });
    setActiveCaseId(null);
  };

  const loadData = useCallback(async (classId = classRef.current, { force = false } = {}) => {
    if (pending.current > 0 && !force) return;
    try {
      const d = await dataApi('bootstrap', { classId });
      apply(d);
      setDataError('');
      return d;
    } catch (e) {
      if (e.status === 401) {
        setSession(null);
        clearAll();
      } else {
        setDataError(`Gagal memuat data: ${e.message}`);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (getSession()) await loadData(classRef.current, { force: true });
      setAuthReady(true);
    })();
    const onFocus = () => {
      if (meRef.current && document.visibilityState === 'visible') loadData();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [loadData]);

  const sync = (action, payload = {}) => {
    pending.current += 1;
    return dataApi(action, payload)
      .catch((e) => {
        setDataError(`Perubahan belum tersimpan: ${e.message}`);
        return null;
      })
      .finally(() => {
        pending.current -= 1;
      });
  };

  const activeClass = classes.find((c) => c.id === activeClassId) || null;
  const currentUser = useMemo(
    () => (me ? { ...me, kelas: activeClass?.nama || '', sekolah: activeClass?.sekolah || '' } : null),
    [me, activeClass]
  );

  const spinSession = spinSessions[me?.id] || null;
  const setMySpin = (next) =>
    setSpinSessions((prev) => {
      const id = meRef.current?.id;
      const value = typeof next === 'function' ? next(prev[id] || null) : next;
      const copy = { ...prev };
      if (value) copy[id] = value;
      else delete copy[id];
      return copy;
    });
  const dropSpinsWhere = (match) =>
    setSpinSessions((prev) => Object.fromEntries(Object.entries(prev).filter(([, s]) => !match(s))));

  // Arena terbuka per siswa: hanya topik yang sudah pernah dia jawab sendiri.
  const unlockedCases = useMemo(
    () => [...new Set(evaluationRecords.filter((r) => r.siswaId === me?.id).map((r) => r.caseId))],
    [evaluationRecords, me]
  );

  const setActivePage = (page) => {
    setActivePageState(page);
    const target = page === 'landing' ? '/' : `/${page}`;
    if (window.location.pathname !== target) window.history.pushState({ page }, '', target);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const onPop = () => setActivePageState(pageFromPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // ---------- Akun ----------

  const afterLogin = async ({ session }) => {
    setSession(session);
    const d = await loadData(readLocal(ACTIVE_CLASS_KEY), { force: true });
    if (!d) throw new Error('Berhasil masuk, tapi data kelas gagal dimuat. Coba muat ulang halaman.');
    setActivePage(d.me?.role === 'pendamping' ? 'pendamping' : 'spin');
  };

  const login = async (email, password) => afterLogin(await authApi('signin', { email, password }));
  const signup = async (form) => afterLogin(await authApi('signup', form));

  const logout = () => {
    setSession(null);
    writeLocal(ACTIVE_CLASS_KEY, null);
    clearAll();
    setTeacherTab('rekap_ai');
    setActivePage('landing');
  };

  // ---------- Kelas ----------

  const switchClass = async (classId) => {
    if (!classId || classId === activeClassId) return;
    setActiveCaseId(null);
    await loadData(classId, { force: true });
  };

  const createClass = async ({ nama, sekolah }) => {
    const { class: kelas } = await dataApi('createClass', { nama, sekolah });
    await loadData(kelas.id, { force: true });
    setTeacherTab('kelas');
    return kelas;
  };

  const joinClass = async (kode) => {
    const { class: kelas } = await dataApi('joinClass', { kode });
    setActiveCaseId(null);
    await loadData(kelas.id, { force: true });
    return kelas;
  };

  const regenerateCode = async (classId) => {
    const { kode } = await dataApi('regenerateCode', { classId });
    setClasses((prev) => prev.map((c) => (c.id === classId ? { ...c, kode } : c)));
    return kode;
  };

  const deleteClass = async (classId) => {
    await dataApi('deleteClass', { classId });
    await loadData(null, { force: true });
  };

  const removeMember = async (userId) => {
    await dataApi('removeMember', { classId: activeClassId, userId });
    await loadData(activeClassId, { force: true });
  };

  const leaveClass = async (classId) => {
    await dataApi('leaveClass', { classId });
    await loadData(null, { force: true });
  };

  // ---------- Spin ----------

  const lockSpin = (materialId, caseId) => {
    setActiveCaseId(caseId);
    const session = { userId: me?.id, classId: activeClassId, materialId, caseId, spunAt: Date.now(), startedAt: null };
    setMySpin(session);
    sync('lockSpin', { session }).then((r) => {
      if (r?.conflict) {
        setMySpin(r.session);
        setActiveCaseId(r.session.caseId);
      }
    });
  };
  const beginAnswer = () => {
    setMySpin((s) => (s && !s.startedAt ? { ...s, startedAt: Date.now() } : s));
    sync('beginAnswer');
  };
  const clearSpin = () => {
    setMySpin(null);
    sync('clearSpin');
  };

  // ---------- Materi & topik (guru) ----------

  const publishMaterial = ({ judul, mapel, fileName, fileSize, ai, topikTerpilih }) => {
    const id = uid('mat');
    const material = {
      id,
      classId: activeClassId,
      judul,
      mapel,
      topik: ai.topikRoda,
      fileName: fileName || 'teks_tempel.txt',
      fileSize: fileSize || '-',
      tanggalUpload: stamp().slice(0, 10),
      status: 'selesai',
      sumber: 'ai',
      deskripsi: ai.ringkasan,
      poinKunci: ai.poinKunci,
    };
    const newCases = topikTerpilih.map((t) => ({
      id: uid('case'),
      materialId: id,
      judulKasus: t.judulKasus,
      teksKasus: t.teksKasus,
      levelBloom: t.levelBloom,
      aktif: true,
      kategori: ai.topikRoda,
      kataKunci: t.kataKunci || [],
      poinTerkait: t.poinTerkait || [],
    }));
    setMaterials((prev) => [material, ...prev]);
    setCases((prev) => [...newCases, ...prev]);
    sync('publishMaterial', { classId: activeClassId, material, cases: newCases });
    return { material, cases: newCases };
  };

  const deleteMaterial = (id) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    setCases((prev) => prev.filter((c) => c.materialId !== id));
    dropSpinsWhere((s) => s?.materialId === id);
    sync('deleteMaterial', { id });
  };

  const addCase = (fields) => {
    const material = materials.find((m) => m.id === fields.materialId);
    const kasus = {
      id: uid('case'),
      aktif: true,
      kategori: material?.topik || 'Topik guru',
      kataKunci: [],
      poinTerkait: [],
      ...fields,
    };
    setCases((prev) => [kasus, ...prev]);
    sync('addCase', { kasus });
    return kasus;
  };

  const toggleCaseActive = (id) => {
    const target = cases.find((c) => c.id === id);
    if (!target) return;
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, aktif: !c.aktif } : c)));
    sync('updateCase', { id, fields: { aktif: !target.aktif } });
  };

  const deleteCase = (id) => {
    setCases((prev) => prev.filter((c) => c.id !== id));
    dropSpinsWhere((s) => s?.caseId === id);
    sync('deleteCase', { id });
  };

  const updateCase = (id, fields) => {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...fields } : c)));
    sync('updateCase', { id, fields });
  };

  // ---------- Forum ----------

  const author = () => ({
    penulisId: me.id,
    penulisNama: me.nama,
    penulisRole: me.role,
    tanggal: stamp(),
  });

  const addForumPost = ({ materiId, kategori, judul, isi }) => {
    const materi = materials.find((m) => m.id === materiId) || materials[0];
    const post = {
      id: uid('fp'),
      materiId: materi?.id,
      materiJudul: materi?.judul || 'Diskusi umum',
      kategori: kategori || 'Diskusi Kasus',
      judul: judul.trim(),
      isi: isi.trim(),
      ...author(),
      likedBy: [],
      comments: [],
    };
    setForumPosts((prev) => [post, ...prev]);
    sync('addForumPost', { classId: activeClassId, post });
    return post;
  };

  const addComment = (postId, isi) => {
    if (!isi?.trim()) return null;
    const comment = { id: uid('fpc'), isi: isi.trim(), ...author() };
    setForumPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: [...(p.comments || []), comment] } : p)));
    sync('addComment', { postId, comment });
    return comment;
  };

  const toggleLikeForumPost = (postId) => {
    const mine = me.id;
    setForumPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const likedBy = p.likedBy || [];
        return { ...p, likedBy: likedBy.includes(mine) ? likedBy.filter((id) => id !== mine) : [...likedBy, mine] };
      })
    );
    sync('toggleLike', { postId });
  };

  // ---------- Jawaban siswa ----------

  const submitAnswer = async ({ caseId, jawaban, durasiDetik, lewatSuara }) => {
    const targetCase = cases.find((c) => c.id === caseId);
    if (!targetCase) throw new Error('Topik ini sudah dihapus gurumu. Mulai latihan baru.');
    const material = materials.find((m) => m.id === targetCase.materialId);
    const ai = await analyzeAnswer({
      jawaban,
      durasiDetik,
      lewatSuara,
      topik: {
        judulKasus: targetCase.judulKasus,
        teksKasus: targetCase.teksKasus,
        levelBloom: targetCase.levelBloom,
        kategori: targetCase.kategori,
      },
      materi: material ? { judul: material.judul, poinKunci: material.poinKunci || [] } : null,
    });
    const fillers = aiService.analyzeArgumentStructure(jawaban);
    const menit = `${Math.floor(durasiDetik / 60)}:${String(durasiDetik % 60).padStart(2, '0')}`;
    const tanggal = stamp();
    const cermin = {
      klaim: ai.ringkasan?.klaim || ai.kutipan?.klaim?.[0] || 'Belum terlihat klaim yang jelas.',
      alasan: ai.ringkasan?.alasan || ai.kutipan?.alasan?.[0] || 'Belum mengemukakan alasan.',
      bukti: ai.ringkasan?.bukti || ai.kutipan?.bukti?.[0] || 'Belum menyertakan bukti.',
      fillerHits: fillers.fillerHits,
      detectedFillers: fillers.detectedFillers,
      wordCount: fillers.wordCount,
    };
    const dimensi = {
      kejelasanKlaim: ai.skor.klaim,
      kekuatanAlasan: ai.skor.alasan,
      ketajamanBukti: ai.skor.bukti,
      kelancaranLisan: ai.skor.kejelasan,
      kemandirianNalar: ai.skor.total,
    };

    const evaluation = {
      id: uid('eval'),
      classId: activeClassId,
      siswaId: me.id,
      siswaNama: me.nama,
      caseId: targetCase.id,
      topikKasus: targetCase.judulKasus,
      levelBloom: targetCase.levelBloom,
      materiJudul: material ? material.judul : 'Materi',
      jawabanTeks: jawaban,
      skor: ai.skor.total,
      dimensi,
      feedback: [ai.kekuatan, ...(ai.saran || [])].filter(Boolean).join(' '),
      pertanyaanLanjutan: ai.pertanyaanLanjutan || '',
      durasiPengerjaan: menit,
      lewatSuara,
      tanggal,
      sumberAnalisis: ai.sumber,
    };
    const journal = {
      id: uid('jrn'),
      classId: activeClassId,
      siswaId: me.id,
      tanggal,
      caseJudul: targetCase.judulKasus,
      levelBloom: targetCase.levelBloom,
      durasiBicara: menit,
      skorArgumen: ai.skor.total,
      transkrip: jawaban,
      kutipan: ai.kutipan,
      cermin,
      dimensi,
    };
    const arenaPost = {
      id: uid('post'),
      classId: activeClassId,
      caseId: targetCase.id,
      siswaId: me.id,
      siswaNama: me.nama,
      kutub: ai.ringkasan?.klaim ? ai.ringkasan.klaim.slice(0, 40) : 'Pendapat baru',
      posisiX: Math.floor(Math.random() * 40) + 30,
      posisiY: Math.floor(Math.random() * 50) + 25,
      transkrip: jawaban,
      kutipan: ai.kutipan,
      skorArgumen: ai.skor.total,
      lewatSuara,
      cermin,
      waktu: 'Baru saja',
      replies: [],
    };

    setEvaluationRecords((prev) => [evaluation, ...prev]);
    setJournals((prev) => [journal, ...prev]);
    setArenaPosts((prev) => [arenaPost, ...prev]);
    sync('saveAnswer', { evaluation, journal, arenaPost });

    return {
      caseId: targetCase.id,
      caseJudul: targetCase.judulKasus,
      materialId: material?.id,
      transcript: jawaban,
      durasiBicara: menit,
      durasiDetik,
      lewatSuara,
      ai,
      cermin,
      skor: ai.skor.total,
    };
  };

  // ---------- Arena ----------

  const addArenaReply = (postId, { label, isi }) => {
    const reply = { id: uid('rep'), siswaId: me.id, siswaNama: me.nama, label, isi, waktu: 'Baru saja' };
    setArenaPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, replies: [...p.replies, reply] } : p)));
    sync('addArenaReply', { postId, reply });
  };

  const closeDiscussionRoom = (caseId) => {
    const kasus = cases.find((c) => c.id === caseId);
    const posts = arenaPosts.filter((p) => p.caseId === caseId);
    const sintesis = aiService.generateClassSynthesis(posts, kasus);
    setSyntheses((prev) => ({ ...prev, [caseId]: sintesis }));
    setClosedRooms((prev) => ({ ...prev, [caseId]: true }));
    sync('setRoom', { caseId, closed: true, sintesis });
  };

  const reopenDiscussionRoom = (caseId) => {
    setClosedRooms((prev) => ({ ...prev, [caseId]: false }));
    sync('setRoom', { caseId, closed: false });
  };

  return (
    <AppContext.Provider value={{
      authReady,
      currentUser,
      isAuthenticated: Boolean(me),
      login,
      signup,
      logout,
      classes,
      activeClass,
      activeClassId,
      members,
      switchClass,
      createClass,
      joinClass,
      regenerateCode,
      deleteClass,
      removeMember,
      leaveClass,
      materials,
      cases,
      activeCaseId,
      setActiveCaseId,
      unlockedCases,
      evaluationRecords,
      forumPosts,
      addForumPost,
      addComment,
      toggleLikeForumPost,
      arenaPosts,
      syntheses,
      closedRooms,
      journals,
      activePage,
      setActivePage,
      teacherTab,
      setTeacherTab,
      addCase,
      toggleCaseActive,
      deleteCase,
      updateCase,
      submitAnswer,
      publishMaterial,
      deleteMaterial,
      spinSession,
      lockSpin,
      beginAnswer,
      clearSpin,
      addArenaReply,
      closeDiscussionRoom,
      reopenDiscussionRoom,
      dataError,
      setDataError,
      reloadData: () => loadData(classRef.current, { force: true }),
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
