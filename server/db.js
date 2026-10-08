import { createClient } from '@supabase/supabase-js';
import { cleanKey } from './llm.js';
import {
  INITIAL_USERS,
  INITIAL_MATERIALS,
  INITIAL_CASES,
  INITIAL_ARENA_POSTS,
  INITIAL_SYNTHESIS,
  INITIAL_STUDENT_JOURNAL,
  INITIAL_EVALUATION_RECORDS,
  INITIAL_FORUM_POSTS,
  GURU_ID,
  GURU_NAMA,
  studentId,
} from '../src/data/seedData.js';

export class DBError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

export function dbConfig(env = process.env) {
  return {
    url: cleanKey(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL).replace(/\/+$/, ''),
    key: cleanKey(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY),
  };
}

let cached = null;
function client(env) {
  const { url, key } = dbConfig(env);
  if (!url || !key) throw new DBError('Database belum diatur (SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY kosong).', 503);
  if (!cached || cached.url !== url || cached.key !== key) {
    cached = { url, key, db: createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) };
  }
  return cached.db;
}

// Kolom yang boleh ditulis per tabel, dalam bentuk camelCase seperti di klien.
const COLUMNS = {
  users: ['id', 'nama', 'role', 'kelas', 'sekolah'],
  materials: ['id', 'kelasId', 'judul', 'mapel', 'topik', 'fileName', 'fileSize', 'tanggalUpload', 'status', 'sumber', 'deskripsi', 'poinKunci', 'contohJawaban'],
  cases: ['id', 'materialId', 'judulKasus', 'teksKasus', 'levelBloom', 'aktif', 'kategori', 'kataKunci', 'poinTerkait'],
  evaluations: ['id', 'siswaId', 'siswaNama', 'kelas', 'caseId', 'topikKasus', 'levelBloom', 'materiJudul', 'jawabanTeks', 'skor', 'dimensi', 'feedback', 'pertanyaanLanjutan', 'penjelasanKonsep', 'durasiPengerjaan', 'lewatSuara', 'sumberAnalisis', 'tanggal'],
  journals: ['id', 'siswaId', 'tanggal', 'caseJudul', 'levelBloom', 'durasiBicara', 'skorArgumen', 'transkrip', 'kutipan', 'cermin', 'dimensi'],
  arena_posts: ['id', 'caseId', 'siswaId', 'siswaNama', 'kutub', 'posisiX', 'posisiY', 'transkrip', 'kutipan', 'skorArgumen', 'lewatSuara', 'cermin', 'waktu'],
  arena_replies: ['id', 'postId', 'siswaId', 'siswaNama', 'label', 'isi', 'waktu'],
  forum_posts: ['id', 'materiId', 'materiJudul', 'kategori', 'judul', 'isi', 'penulisId', 'penulisNama', 'penulisRole', 'tanggal'],
  forum_comments: ['id', 'postId', 'isi', 'penulisId', 'penulisNama', 'penulisRole', 'tanggal'],
};

const snake = (k) => k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
const camel = (k) => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const clip = (v) => (typeof v === 'string' ? v.slice(0, 12000) : v);

function toRow(table, obj, createdAt) {
  const row = {};
  COLUMNS[table].forEach((k) => {
    if (obj?.[k] !== undefined) row[snake(k)] = clip(obj[k]);
  });
  if (createdAt) row.created_at = createdAt;
  return row;
}

function fromRow(row) {
  const out = {};
  Object.entries(row).forEach(([k, v]) => {
    if (k !== 'created_at' && v !== null) out[camel(k)] = v;
  });
  return out;
}

function failed(error) {
  const msg = `${error?.code || ''} ${error?.message || ''}`;
  if (/42P01|PGRST205|does not exist|Could not find the table/i.test(msg)) {
    return new DBError('Tabel database belum dibuat. Jalankan supabase/schema.sql di SQL Editor Supabase.', 503);
  }
  if (/JWT|Invalid API key|apikey/i.test(msg)) return new DBError('Key Supabase ditolak. Cek SUPABASE_SERVICE_ROLE_KEY.', 503);
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|network/i.test(msg)) return new DBError('Tidak bisa menghubungi database. Cek SUPABASE_URL.', 504);
  console.error('[db]', error);
  return new DBError('Gagal mengakses database.', 502);
}

async function run(query) {
  let res;
  try {
    res = await query;
  } catch (e) {
    console.error('[db]', e);
    throw new DBError('Tidak bisa menghubungi database.', 504);
  }
  if (res.error) throw failed(res.error);
  return res.data;
}

// created_at buatan supaya urutan seed sama dengan urutan array (terbaru di atas).
const newestFirst = (list, t0) => list.map((_, i) => new Date(t0 - (i + 1) * 60000).toISOString());
const oldestFirst = (list, t0) => list.map((_, i) => new Date(t0 - 86400000 + i * 1000).toISOString());
const authorId = (nama) => (nama === GURU_NAMA ? GURU_ID : studentId(nama));

async function seed(db) {
  const t0 = Date.now();
  const rows = (table, list, order = newestFirst) => {
    const at = order(list, t0);
    return list.map((x, i) => toRow(table, x, at[i]));
  };
  const posts = INITIAL_ARENA_POSTS.map((p) => ({ ...p, siswaId: studentId(p.siswaNama) }));
  const replies = INITIAL_ARENA_POSTS.flatMap((p) => p.replies.map((r) => ({ ...r, postId: p.id, siswaId: studentId(r.siswaNama) })));
  const forum = INITIAL_FORUM_POSTS.map((p) => ({ ...p, penulisId: authorId(p.penulisNama) }));
  const comments = INITIAL_FORUM_POSTS.flatMap((p) => p.comments.map((c) => ({ ...c, postId: p.id, penulisId: authorId(c.penulisNama) })));
  const likes = INITIAL_FORUM_POSTS.flatMap((p) => p.likedBy.map((u) => ({ post_id: p.id, user_id: u })));

  await run(db.from('users').upsert(rows('users', INITIAL_USERS)));
  await run(db.from('materials').upsert(rows('materials', INITIAL_MATERIALS)));
  await run(db.from('cases').upsert(rows('cases', INITIAL_CASES)));
  await run(db.from('evaluations').upsert(rows('evaluations', INITIAL_EVALUATION_RECORDS)));
  await run(db.from('journals').upsert(rows('journals', INITIAL_STUDENT_JOURNAL)));
  await run(db.from('arena_posts').upsert(rows('arena_posts', posts)));
  await run(db.from('arena_replies').upsert(rows('arena_replies', replies, oldestFirst)));
  await run(db.from('forum_posts').upsert(rows('forum_posts', forum)));
  await run(db.from('forum_comments').upsert(rows('forum_comments', comments, oldestFirst)));
  await run(db.from('forum_likes').upsert(likes));
  await run(db.from('discussion_rooms').upsert({ case_id: INITIAL_SYNTHESIS.caseId, closed: false, sintesis: INITIAL_SYNTHESIS }));
  await run(db.from('app_meta').upsert({ key: 'seeded', value: new Date(t0).toISOString() }));
}

async function ensureSeeded(db) {
  const meta = await run(db.from('app_meta').select('value').eq('key', 'seeded').maybeSingle());
  if (!meta) await seed(db);
}

export async function resetDemo(env = process.env) {
  const db = client(env);
  const wipe = [
    ['spin_sessions', 'user_id'],
    ['forum_likes', 'post_id'],
    ['forum_comments', 'id'],
    ['forum_posts', 'id'],
    ['arena_replies', 'id'],
    ['arena_posts', 'id'],
    ['journals', 'id'],
    ['evaluations', 'id'],
    ['cases', 'id'],
    ['materials', 'id'],
    ['discussion_rooms', 'case_id'],
    ['app_meta', 'key'],
    ['users', 'id'],
  ];
  for (const [table, key] of wipe) await run(db.from(table).delete().neq(key, ''));
  await seed(db);
}

async function bootstrap(db) {
  await ensureSeeded(db);
  const all = (table, ascending = false) => run(db.from(table).select('*').order('created_at', { ascending }));
  const [materials, cases, evaluations, journals, posts, replies, forum, comments, likes, rooms, spins] = await Promise.all([
    all('materials'),
    all('cases'),
    all('evaluations'),
    all('journals'),
    all('arena_posts'),
    all('arena_replies', true),
    all('forum_posts'),
    all('forum_comments', true),
    run(db.from('forum_likes').select('*')),
    run(db.from('discussion_rooms').select('*')),
    run(db.from('spin_sessions').select('*')),
  ]);

  const repliesOf = (id) => replies.filter((r) => r.post_id === id).map(fromRow);
  const syntheses = {};
  const closedRooms = {};
  rooms.forEach((r) => {
    if (r.sintesis) syntheses[r.case_id] = r.sintesis;
    closedRooms[r.case_id] = r.closed;
  });
  const spinSessions = {};
  spins.forEach((s) => {
    spinSessions[s.user_id] = { userId: s.user_id, materialId: s.material_id, caseId: s.case_id, spunAt: Number(s.spun_at), startedAt: s.started_at ? Number(s.started_at) : null };
  });

  return {
    materials: materials.map(fromRow),
    cases: cases.map(fromRow),
    evaluationRecords: evaluations.map(fromRow),
    journals: journals.map(fromRow),
    arenaPosts: posts.map((p) => ({ ...fromRow(p), replies: repliesOf(p.id) })),
    forumPosts: forum.map((p) => ({
      ...fromRow(p),
      likedBy: likes.filter((l) => l.post_id === p.id).map((l) => l.user_id),
      comments: comments.filter((c) => c.post_id === p.id).map(fromRow),
    })),
    syntheses,
    closedRooms,
    spinSessions,
  };
}

const GURU_ONLY = new Set(['publishMaterial', 'deleteMaterial', 'addCase', 'updateCase', 'deleteCase', 'setRoom']);
const CASE_FIELDS = ['judulKasus', 'teksKasus', 'levelBloom', 'aktif', 'materialId'];
const isId = (v) => typeof v === 'string' && v.length > 0 && v.length <= 80;

async function actorOf(db, id) {
  if (!isId(id)) throw new DBError('Masuk dulu untuk menyimpan data.', 401);
  const user = await run(db.from('users').select('*').eq('id', id).maybeSingle());
  if (!user) throw new DBError('Akun tidak dikenal.', 401);
  return user;
}

const ACTIONS = {
  async publishMaterial(db, { material, cases }) {
    await run(db.from('materials').insert(toRow('materials', material)));
    if (Array.isArray(cases) && cases.length) await run(db.from('cases').insert(cases.map((c) => toRow('cases', c))));
  },
  async deleteMaterial(db, { id }) {
    await run(db.from('spin_sessions').delete().eq('material_id', id));
    await run(db.from('materials').delete().eq('id', id));
  },
  async addCase(db, { kasus }) {
    await run(db.from('cases').insert(toRow('cases', kasus)));
  },
  async updateCase(db, { id, fields }) {
    const allowed = Object.fromEntries(Object.entries(fields || {}).filter(([k]) => CASE_FIELDS.includes(k)));
    await run(db.from('cases').update(toRow('cases', allowed)).eq('id', id));
  },
  async deleteCase(db, { id }) {
    await run(db.from('spin_sessions').delete().eq('case_id', id));
    await run(db.from('cases').delete().eq('id', id));
  },
  async setRoom(db, { caseId, closed, sintesis }) {
    const row = { case_id: caseId, closed: Boolean(closed) };
    if (sintesis !== undefined) row.sintesis = sintesis;
    await run(db.from('discussion_rooms').upsert(row));
  },
  async addForumPost(db, { post }, user) {
    const own = { ...post, penulisId: user.id, penulisNama: user.nama, penulisRole: user.role };
    await run(db.from('forum_posts').insert(toRow('forum_posts', own)));
  },
  async addComment(db, { postId, comment }, user) {
    const own = { ...comment, postId, penulisId: user.id, penulisNama: user.nama, penulisRole: user.role };
    await run(db.from('forum_comments').insert(toRow('forum_comments', own)));
  },
  async toggleLike(db, { postId }, user) {
    const match = { post_id: postId, user_id: user.id };
    const found = await run(db.from('forum_likes').select('post_id').match(match).maybeSingle());
    if (found) await run(db.from('forum_likes').delete().match(match));
    else await run(db.from('forum_likes').insert(match));
    return { liked: !found };
  },
  async saveAnswer(db, { evaluation, journal, arenaPost }, user) {
    const mine = { siswaId: user.id, siswaNama: user.nama };
    await run(db.from('evaluations').insert(toRow('evaluations', { ...evaluation, ...mine })));
    await run(db.from('journals').insert(toRow('journals', { ...journal, siswaId: user.id })));
    if (arenaPost) await run(db.from('arena_posts').insert(toRow('arena_posts', { ...arenaPost, ...mine })));
    await run(db.from('spin_sessions').delete().eq('user_id', user.id));
  },
  async addArenaReply(db, { postId, reply }, user) {
    await run(db.from('arena_replies').insert(toRow('arena_replies', { ...reply, postId, siswaId: user.id, siswaNama: user.nama })));
  },
  async lockSpin(db, { session }, user) {
    const row = { user_id: user.id, material_id: session?.materialId, case_id: session?.caseId, spun_at: Date.now(), started_at: null };
    const res = await db.from('spin_sessions').insert(row);
    if (res.error?.code === '23505') {
      const s = await run(db.from('spin_sessions').select('*').eq('user_id', user.id).single());
      return { session: { userId: s.user_id, materialId: s.material_id, caseId: s.case_id, spunAt: Number(s.spun_at), startedAt: s.started_at ? Number(s.started_at) : null }, conflict: true };
    }
    if (res.error) throw failed(res.error);
    return { session: { userId: user.id, materialId: row.material_id, caseId: row.case_id, spunAt: row.spun_at, startedAt: null } };
  },
  async beginAnswer(db, _, user) {
    const startedAt = Date.now();
    await run(db.from('spin_sessions').update({ started_at: startedAt }).eq('user_id', user.id).is('started_at', null));
    return { startedAt };
  },
  async clearSpin(db, _, user) {
    await run(db.from('spin_sessions').delete().eq('user_id', user.id));
  },
};

export async function handleData(body, env = process.env) {
  const action = body?.action;
  const { url, key } = dbConfig(env);
  // Tanpa Supabase, klien memakai localStorage. Dibalas 200 supaya tidak tampil sebagai error di konsol.
  if (action === 'bootstrap' && (!url || !key)) return { enabled: false };
  const db = client(env);
  if (action === 'bootstrap') return bootstrap(db);
  const fn = ACTIONS[action];
  if (!fn) throw new DBError('Aksi data tidak dikenal.', 400);
  const user = await actorOf(db, body.actor);
  if (GURU_ONLY.has(action) && user.role !== 'pendamping') throw new DBError('Hanya guru yang bisa melakukan ini.', 403);
  return (await fn(db, body, user)) || { ok: true };
}
