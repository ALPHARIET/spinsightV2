import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_MATERIALS,
  INITIAL_CASES,
  INITIAL_ARENA_POSTS,
  INITIAL_SYNTHESIS,
  INITIAL_STUDENT_JOURNAL,
  INITIAL_EVALUATION_RECORDS,
  INITIAL_FORUM_POSTS
} from '../data/seedData';
import { aiService } from '../services/aiService';
import { analyzeAnswer } from '../services/aiClient';
import { stamp } from '../lib/labels';

const AppContext = createContext();

const DATA_VERSION = '5';
const DATA_KEYS = ['spin_session', 'active_case', 'materials', 'cases', 'unlocked_cases', 'evaluations', 'forum_posts', 'arena_posts', 'synthesis', 'closed_rooms', 'journals'];
const PAGES = ['landing', 'spin', 'forum', 'arena', 'pendamping', 'jurnal'];
const KELAS = 'XI-IPA 2';
const SEKOLAH = 'SMA Cerdas Mandiri';

try {
  if (localStorage.getItem('spinsight_data_version') !== DATA_VERSION) {
    DATA_KEYS.forEach((k) => localStorage.removeItem('spinsight_' + k));
    localStorage.setItem('spinsight_data_version', DATA_VERSION);
  }
} catch {}

function usePersisted(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem('spinsight_' + key);
      return saved !== null ? JSON.parse(saved) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('spinsight_' + key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue];
}

const pageFromPath = () => {
  const path = window.location.pathname.replace(/^\//, '').toLowerCase();
  return PAGES.includes(path) ? path : 'landing';
};

const makeUser = (role, nama) => {
  const guru = role === 'pendamping' || role === 'guru';
  const name = nama || (guru ? 'Dra. Sri Wahyuni, M.Pd.' : 'Jason Pratama');
  return {
    id: guru ? 'usr-guru' : 'usr-' + name.toLowerCase().replace(/[^a-z]+/g, '-'),
    nama: name,
    role: guru ? 'pendamping' : 'siswa',
    kelas: KELAS,
    sekolah: SEKOLAH,
  };
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = usePersisted('user', makeUser('siswa'));
  const [isAuthenticated, setIsAuthenticated] = usePersisted('is_authenticated', false);
  const [materials, setMaterials] = usePersisted('materials', INITIAL_MATERIALS);
  const [cases, setCases] = usePersisted('cases', INITIAL_CASES);
  const [activeCaseId, setActiveCaseId] = usePersisted('active_case', INITIAL_CASES[0].id);
  const [unlockedCases, setUnlockedCases] = usePersisted('unlocked_cases', ['case-1']);
  const [evaluationRecords, setEvaluationRecords] = usePersisted('evaluations', INITIAL_EVALUATION_RECORDS);
  const [forumPosts, setForumPosts] = usePersisted('forum_posts', INITIAL_FORUM_POSTS);
  const [arenaPosts, setArenaPosts] = usePersisted('arena_posts', INITIAL_ARENA_POSTS);
  const [syntheses, setSyntheses] = usePersisted('synthesis', { 'case-1': INITIAL_SYNTHESIS });
  const [closedRooms, setClosedRooms] = usePersisted('closed_rooms', {});
  const [journals, setJournals] = usePersisted('journals', INITIAL_STUDENT_JOURNAL);
  const [spinSession, setSpinSession] = usePersisted('spin_session', null);
  const [activePage, setActivePageState] = useState(pageFromPath);
  const [teacherTab, setTeacherTab] = useState('rekap_ai');

  const setActivePage = (page) => {
    setActivePageState(page);
    const target = page === 'landing' ? '/' : `/${page}`;
    if (window.location.pathname !== target) window.history.pushState({ page }, '', target);
  };

  useEffect(() => {
    const onPop = () => setActivePageState(pageFromPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const login = (role = 'siswa', nama = null) => {
    const user = makeUser(role, nama);
    setCurrentUser(user);
    setIsAuthenticated(true);
    setActivePage(user.role === 'pendamping' ? 'pendamping' : 'spin');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setActivePage('landing');
  };

  const lockSpin = (materialId, caseId) => {
    setActiveCaseId(caseId);
    setSpinSession({ userId: currentUser?.id, materialId, caseId, spunAt: Date.now(), startedAt: null });
  };
  const beginAnswer = () => setSpinSession((s) => (s && !s.startedAt ? { ...s, startedAt: Date.now() } : s));
  const clearSpin = () => setSpinSession(null);

  const publishMaterial = ({ judul, mapel, fileName, fileSize, ai, topikTerpilih }) => {
    const id = 'mat-' + Date.now();
    const material = {
      id,
      kelasId: currentUser?.kelas || KELAS,
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
    const newCases = topikTerpilih.map((t, i) => ({
      id: `case-${Date.now()}-${i}`,
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
    return { material, cases: newCases };
  };

  const deleteMaterial = (id) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    setCases((prev) => prev.filter((c) => c.materialId !== id));
    setSpinSession((s) => (s?.materialId === id ? null : s));
  };

  const addCase = (fields) => {
    const material = materials.find((m) => m.id === fields.materialId);
    const kasus = {
      id: 'case-' + Date.now(),
      aktif: true,
      kategori: material?.topik || 'Topik guru',
      kataKunci: [],
      poinTerkait: [],
      ...fields,
    };
    setCases((prev) => [kasus, ...prev]);
    return kasus;
  };

  const toggleCaseActive = (id) => {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, aktif: !c.aktif } : c)));
  };

  const deleteCase = (id) => {
    setCases((prev) => prev.filter((c) => c.id !== id));
    setSpinSession((s) => (s?.caseId === id ? null : s));
  };

  const updateCase = (id, fields) => {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...fields } : c)));
  };

  const author = () => ({
    penulisId: currentUser.id,
    penulisNama: currentUser.nama,
    penulisRole: currentUser.role,
    tanggal: stamp(),
  });

  const addForumPost = ({ materiId, kategori, judul, isi }) => {
    const materi = materials.find((m) => m.id === materiId) || materials[0];
    const post = {
      id: 'fp-' + Date.now(),
      materiId: materi?.id,
      materiJudul: materi?.judul || 'Materi',
      kategori: kategori || 'Diskusi Kasus',
      judul: judul.trim(),
      isi: isi.trim(),
      ...author(),
      likedBy: [],
      comments: [],
    };
    setForumPosts((prev) => [post, ...prev]);
    return post;
  };

  const addComment = (postId, isi) => {
    if (!isi?.trim()) return null;
    const comment = { id: 'fpc-' + Date.now(), isi: isi.trim(), ...author() };
    setForumPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: [...(p.comments || []), comment] } : p)));
    return comment;
  };

  const toggleLikeForumPost = (postId) => {
    const me = currentUser.id;
    setForumPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const likedBy = p.likedBy || [];
        return { ...p, likedBy: likedBy.includes(me) ? likedBy.filter((id) => id !== me) : [...likedBy, me] };
      })
    );
  };

  const submitAnswer = async ({ caseId, jawaban, durasiDetik, lewatSuara }) => {
    const targetCase = cases.find((c) => c.id === caseId) || cases[0];
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

    setEvaluationRecords((prev) => [
      {
        id: 'eval-' + Date.now(),
        siswaId: currentUser.id,
        siswaNama: currentUser.nama,
        kelas: currentUser.kelas || KELAS,
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
      },
      ...prev,
    ]);

    setJournals((prev) => [
      {
        id: 'jrn-' + Date.now(),
        siswaId: currentUser.id,
        tanggal,
        caseJudul: targetCase.judulKasus,
        levelBloom: targetCase.levelBloom,
        durasiBicara: menit,
        skorArgumen: ai.skor.total,
        transkrip: jawaban,
        kutipan: ai.kutipan,
        cermin,
        dimensi,
      },
      ...prev,
    ]);

    setArenaPosts((prev) => [
      {
        id: 'post-' + Date.now(),
        caseId: targetCase.id,
        siswaNama: currentUser.nama,
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
      },
      ...prev,
    ]);

    setUnlockedCases((prev) => (prev.includes(targetCase.id) ? prev : [...prev, targetCase.id]));

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

  const addArenaReply = (postId, { label, isi }) => {
    const reply = { id: 'rep-' + Date.now(), siswaNama: currentUser.nama, label, isi, waktu: 'Baru saja' };
    setArenaPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, replies: [...p.replies, reply] } : p)));
  };

  const closeDiscussionRoom = (caseId) => {
    const kasus = cases.find((c) => c.id === caseId);
    const posts = arenaPosts.filter((p) => p.caseId === caseId);
    setSyntheses((prev) => ({ ...prev, [caseId]: aiService.generateClassSynthesis(posts, kasus) }));
    setClosedRooms((prev) => ({ ...prev, [caseId]: true }));
  };

  const reopenDiscussionRoom = (caseId) => {
    setClosedRooms((prev) => ({ ...prev, [caseId]: false }));
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      isAuthenticated,
      login,
      logout,
      materials,
      cases,
      activeCaseId,
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
      reopenDiscussionRoom
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
