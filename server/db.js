import { randomInt } from 'node:crypto';
import {
  INITIAL_MATERIALS,
  INITIAL_CASES,
  INITIAL_ARENA_POSTS,
  INITIAL_SYNTHESIS,
  INITIAL_STUDENT_JOURNAL,
  INITIAL_EVALUATION_RECORDS,
  INITIAL_FORUM_POSTS,
  DEMO_ACCOUNTS,
  DEMO_CLASS,
  DEMO_STUDENTS,
  GURU_ID,
  GURU_NAMA,
  studentId,
} from '../src/data/seedData.js';
import { admin, run, failed, DBError } from './supabase.js';

export { DBError, dbConfig } from './supabase.js';

// Kolom yang boleh ditulis per tabel, dalam bentuk camelCase seperti di klien.
const COLUMNS = {
  users: ['id', 'nama', 'role', 'email'],
  classes: ['id', 'nama', 'sekolah', 'guruId', 'kode'],
  materials: ['id', 'classId', 'judul', 'mapel', 'topik', 'fileName', 'fileSize', 'tanggalUpload', 'status', 'sumber', 'deskripsi', 'poinKunci', 'contohJawaban'],
  cases: ['id', 'materialId', 'judulKasus', 'teksKasus', 'levelBloom', 'aktif', 'kategori', 'kataKunci', 'poinTerkait'],
  evaluations: ['id', 'classId', 'siswaId', 'siswaNama', 'caseId', 'topikKasus', 'levelBloom', 'materiJudul', 'jawabanTeks', 'skor', 'dimensi', 'feedback', 'pertanyaanLanjutan', 'penjelasanKonsep', 'durasiPengerjaan', 'lewatSuara', 'sumberAnalisis', 'tanggal'],
  journals: ['id', 'classId', 'siswaId', 'tanggal', 'caseJudul', 'levelBloom', 'durasiBicara', 'skorArgumen', 'transkrip', 'kutipan', 'cermin', 'dimensi'],
  arena_posts: ['id', 'classId', 'caseId', 'siswaId', 'siswaNama', 'kutub', 'posisiX', 'posisiY', 'transkrip', 'kutipan', 'skorArgumen', 'lewatSuara', 'cermin', 'waktu'],
  arena_replies: ['id', 'postId', 'siswaId', 'siswaNama', 'label', 'isi', 'waktu'],
  forum_posts: ['id', 'classId', 'materiId', 'materiJudul', 'kategori', 'judul', 'isi', 'penulisId', 'penulisNama', 'penulisRole', 'tanggal'],
  forum_comments: ['id', 'postId', 'isi', 'penulisId', 'penulisNama', 'penulisRole', 'tanggal'],
};

const snake = (k) => k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
const camel = (k) => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const clip = (v) => (typeof v === 'string' ? v.slice(0, 12000) : v);
const text = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

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

const spinOf = (s) => ({
  userId: s.user_id,
  classId: s.class_id,
  materialId: s.material_id,
  caseId: s.case_id,
  spunAt: Number(s.spun_at),
  startedAt: s.started_at ? Number(s.started_at) : null,
});

// ---------- Kode kelas ----------

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from({ length: 6 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join('');
export const normalizeCode = (v) => String(v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

async function withUniqueCode(write) {
  for (let i = 0; i < 6; i++) {
    const res = await write(newCode());
    if (res.error?.code === '23505') continue;
    if (res.error) throw failed(res.error);
    return res.data;
  }
  throw new DBError('Gagal membuat kode kelas. Coba lagi.', 502);
}

// ---------- Akun & kelas contoh ----------

const slug = (nama) => nama.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
const newestFirst = (list, t0) => list.map((_, i) => new Date(t0 - (i + 1) * 60000).toISOString());
const oldestFirst = (list, t0) => list.map((_, i) => new Date(t0 - 86400000 + i * 1000).toISOString());

async function ensureAuthUser(db, { email, password, nama, role }) {
  const created = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { nama, role } });
  if (!created.error) return created.data.user.id;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw failed(error);
    const found = data.users.find((u) => u.email === email);
    if (found) {
      // Pastikan kata sandi akun contoh selalu sama dengan yang ditampilkan di halaman masuk.
      await db.auth.admin.updateUserById(found.id, { password, email_confirm: true });
      return found.id;
    }
    if (data.users.length < 200) break;
  }
  throw failed(created.error);
}

async function seedDemo(db) {
  const t0 = Date.now();
  const guruId = await ensureAuthUser(db, DEMO_ACCOUNTS.guru);
  const siswaId = await ensureAuthUser(db, DEMO_ACCOUNTS.siswa);

  // Teman sekelas di kelas contoh hanya berupa profil (tanpa akun login).
  const idOf = (nama) => (nama === GURU_NAMA ? guruId : nama === DEMO_ACCOUNTS.siswa.nama ? siswaId : `demo-${slug(nama)}`);
  const oldIds = { [GURU_ID]: guruId, ...Object.fromEntries(DEMO_STUDENTS.map((n) => [studentId(n), idOf(n)])) };
  const classmates = [...new Set([...DEMO_STUDENTS, ...INITIAL_ARENA_POSTS.flatMap((p) => p.replies.map((r) => r.siswaNama))])].filter(
    (n) => n !== DEMO_ACCOUNTS.siswa.nama
  );
  const classId = DEMO_CLASS.id;
  const rows = (table, list, order = newestFirst) => {
    const at = order(list, t0);
    return list.map((x, i) => toRow(table, x, at[i]));
  };

  await run(db.from('users').upsert([
    { id: guruId, nama: GURU_NAMA, role: 'pendamping', email: DEMO_ACCOUNTS.guru.email },
    { id: siswaId, nama: DEMO_ACCOUNTS.siswa.nama, role: 'siswa', email: DEMO_ACCOUNTS.siswa.email },
    ...classmates.map((nama) => ({ id: idOf(nama), nama, role: 'siswa', email: null })),
  ]));
  await run(db.from('classes').upsert(toRow('classes', { ...DEMO_CLASS, guruId })));
  await run(db.from('class_members').upsert([siswaId, ...classmates.map(idOf)].map((user_id) => ({ class_id: classId, user_id }))));

  const inClass = (list) => list.map((x) => ({ ...x, classId }));
  await run(db.from('materials').upsert(rows('materials', inClass(INITIAL_MATERIALS))));
  await run(db.from('cases').upsert(rows('cases', INITIAL_CASES)));
  await run(db.from('evaluations').upsert(rows('evaluations', inClass(INITIAL_EVALUATION_RECORDS.map((e) => ({ ...e, siswaId: idOf(e.siswaNama) }))))));
  await run(db.from('journals').upsert(rows('journals', inClass(INITIAL_STUDENT_JOURNAL.map((j) => ({ ...j, siswaId }))))));
  await run(db.from('arena_posts').upsert(rows('arena_posts', inClass(INITIAL_ARENA_POSTS.map((p) => ({ ...p, siswaId: idOf(p.siswaNama) }))))));
  const replies = INITIAL_ARENA_POSTS.flatMap((p) => p.replies.map((r) => ({ ...r, postId: p.id, siswaId: idOf(r.siswaNama) })));
  await run(db.from('arena_replies').upsert(rows('arena_replies', replies, oldestFirst)));
  await run(db.from('forum_posts').upsert(rows('forum_posts', inClass(INITIAL_FORUM_POSTS.map((p) => ({ ...p, penulisId: idOf(p.penulisNama) }))))));
  const comments = INITIAL_FORUM_POSTS.flatMap((p) => p.comments.map((c) => ({ ...c, postId: p.id, penulisId: idOf(c.penulisNama) })));
  await run(db.from('forum_comments').upsert(rows('forum_comments', comments, oldestFirst)));
  const likes = INITIAL_FORUM_POSTS.flatMap((p) => p.likedBy.map((u) => ({ post_id: p.id, user_id: oldIds[u] || u })));
  await run(db.from('forum_likes').upsert(likes));
  await run(db.from('discussion_rooms').upsert({ case_id: INITIAL_SYNTHESIS.caseId, closed: false, sintesis: INITIAL_SYNTHESIS }));
  await run(db.from('app_meta').upsert({ key: 'seeded_v2', value: new Date(t0).toISOString() }));
}

let seeding = null;
export function ensureSeeded(env = process.env) {
  if (!seeding) {
    seeding = (async () => {
      const db = admin(env);
      const meta = await run(db.from('app_meta').select('value').eq('key', 'seeded_v2').maybeSingle());
      if (!meta) await seedDemo(db);
    })().catch((e) => {
      seeding = null;
      throw e;
    });
  }
  return seeding;
}

// Mengembalikan kelas contoh ke kondisi awal. Kelas dan akun asli pengguna tidak disentuh.
export async function resetDemo(env = process.env) {
  const db = admin(env);
  await run(db.from('spin_sessions').delete().eq('class_id', DEMO_CLASS.id));
  await run(db.from('classes').delete().eq('id', DEMO_CLASS.id));
  await run(db.from('app_meta').delete().eq('key', 'seeded_v2'));
  seeding = null;
  await seedDemo(db);
}

// ---------- Hak akses ----------

const isGuru = (user) => user.role === 'pendamping';

async function classRow(db, id) {
  if (!id) throw new DBError('Kelas tidak ditemukan.', 404);
  const row = await run(db.from('classes').select('*').eq('id', id).maybeSingle());
  if (!row) throw new DBError('Kelas tidak ditemukan.', 404);
  return row;
}

async function requireOwner(db, user, classId) {
  const row = await classRow(db, classId);
  if (row.guru_id !== user.id) throw new DBError('Hanya guru kelas ini yang bisa melakukannya.', 403);
  return row;
}

async function requireAccess(db, user, classId) {
  const row = await classRow(db, classId);
  if (row.guru_id === user.id) return row;
  const member = await run(db.from('class_members').select('class_id').eq('class_id', classId).eq('user_id', user.id).maybeSingle());
  if (!member) throw new DBError('Kamu belum bergabung di kelas ini.', 403);
  return row;
}

async function classOf(db, table, id) {
  if (!id) throw new DBError('Data tidak ditemukan.', 404);
  const row = await run(db.from(table).select('class_id').eq('id', id).maybeSingle());
  if (!row) throw new DBError('Data tidak ditemukan.', 404);
  return row.class_id;
}

async function classOfCase(db, caseId) {
  if (!caseId) throw new DBError('Topik tidak ditemukan.', 404);
  const row = await run(db.from('cases').select('material_id, materials!inner(class_id)').eq('id', caseId).maybeSingle());
  if (!row) throw new DBError('Topik tidak ditemukan.', 404);
  return row.materials.class_id;
}

// ---------- Bootstrap: semua data untuk satu kelas aktif ----------

async function myClasses(db, user) {
  let classes;
  if (isGuru(user)) {
    classes = await run(db.from('classes').select('*').eq('guru_id', user.id).order('created_at'));
  } else {
    const links = await run(db.from('class_members').select('class_id').eq('user_id', user.id));
    const ids = links.map((l) => l.class_id);
    classes = ids.length ? await run(db.from('classes').select('*').in('id', ids).order('created_at')) : [];
  }
  if (!classes.length) return [];
  const ids = classes.map((c) => c.id);
  const [members, gurus] = await Promise.all([
    run(db.from('class_members').select('class_id').in('class_id', ids)),
    run(db.from('users').select('id, nama').in('id', [...new Set(classes.map((c) => c.guru_id))])),
  ]);
  return classes.map((c) => ({
    id: c.id,
    nama: c.nama,
    sekolah: c.sekolah,
    guruId: c.guru_id,
    guruNama: gurus.find((g) => g.id === c.guru_id)?.nama || 'Guru',
    jumlahSiswa: members.filter((m) => m.class_id === c.id).length,
    // Kode undangan hanya dikirim ke guru pemilik kelas.
    ...(c.guru_id === user.id ? { kode: c.kode } : {}),
    contoh: c.id === DEMO_CLASS.id,
  }));
}

const EMPTY = {
  materials: [],
  cases: [],
  evaluationRecords: [],
  journals: [],
  arenaPosts: [],
  forumPosts: [],
  syntheses: {},
  closedRooms: {},
  spinSessions: {},
  members: [],
};

async function bootstrap(db, user, { classId }) {
  const classes = await myClasses(db, user);
  const active = classes.find((c) => c.id === classId) || classes[0];
  const base = { me: user, classes, activeClassId: active?.id || null };
  if (!active) return { ...base, ...EMPTY };

  const guru = isGuru(user);
  const all = (q, ascending = false) => run(q.order('created_at', { ascending }));
  const [materials, evaluations, journals, posts, forum, spin, memberLinks] = await Promise.all([
    all(db.from('materials').select('*').eq('class_id', active.id)),
    guru
      ? all(db.from('evaluations').select('*').eq('class_id', active.id))
      : all(db.from('evaluations').select('*').eq('class_id', active.id).eq('siswa_id', user.id)),
    guru ? [] : all(db.from('journals').select('*').eq('class_id', active.id).eq('siswa_id', user.id)),
    all(db.from('arena_posts').select('*').eq('class_id', active.id)),
    all(db.from('forum_posts').select('*').eq('class_id', active.id)),
    run(db.from('spin_sessions').select('*').eq('user_id', user.id).maybeSingle()),
    guru ? run(db.from('class_members').select('user_id, joined_at').eq('class_id', active.id).order('joined_at')) : [],
  ]);

  const materialIds = materials.map((m) => m.id);
  const postIds = posts.map((p) => p.id);
  const forumIds = forum.map((p) => p.id);
  const memberIds = memberLinks.map((m) => m.user_id);
  const cases = materialIds.length ? await all(db.from('cases').select('*').in('material_id', materialIds)) : [];
  const caseIds = cases.map((c) => c.id);
  const [replies, comments, likes, rooms, people] = await Promise.all([
    postIds.length ? all(db.from('arena_replies').select('*').in('post_id', postIds), true) : [],
    forumIds.length ? all(db.from('forum_comments').select('*').in('post_id', forumIds), true) : [],
    forumIds.length ? run(db.from('forum_likes').select('*').in('post_id', forumIds)) : [],
    caseIds.length ? run(db.from('discussion_rooms').select('*').in('case_id', caseIds)) : [],
    memberIds.length ? run(db.from('users').select('id, nama, email').in('id', memberIds)) : [],
  ]);

  const syntheses = {};
  const closedRooms = {};
  rooms.forEach((r) => {
    if (r.sintesis) syntheses[r.case_id] = r.sintesis;
    closedRooms[r.case_id] = r.closed;
  });

  return {
    ...base,
    materials: materials.map(fromRow),
    cases: cases.map(fromRow),
    evaluationRecords: evaluations.map(fromRow),
    journals: journals.map(fromRow),
    arenaPosts: posts.map((p) => {
      const post = { ...fromRow(p), replies: replies.filter((r) => r.post_id === p.id).map(fromRow) };
      // Skor hanya untuk siswa itu sendiri dan gurunya.
      if (!guru && p.siswa_id !== user.id) delete post.skorArgumen;
      return post;
    }),
    forumPosts: forum.map((p) => ({
      ...fromRow(p),
      likedBy: likes.filter((l) => l.post_id === p.id).map((l) => l.user_id),
      comments: comments.filter((c) => c.post_id === p.id).map(fromRow),
    })),
    syntheses,
    closedRooms,
    spinSessions: spin && spin.class_id === active.id ? { [user.id]: spinOf(spin) } : {},
    members: memberLinks.map((m) => {
      const p = people.find((x) => x.id === m.user_id);
      return { id: m.user_id, nama: p?.nama || 'Siswa', email: p?.email || null, joinedAt: m.joined_at };
    }),
  };
}

// ---------- Aksi ----------

const CASE_FIELDS = ['judulKasus', 'teksKasus', 'levelBloom', 'aktif', 'materialId'];
const guruOnly = (user) => {
  if (!isGuru(user)) throw new DBError('Hanya guru yang bisa melakukan ini.', 403);
};
const siswaOnly = (user) => {
  if (isGuru(user)) throw new DBError('Fitur ini untuk siswa.', 403);
};

const ACTIONS = {
  async createClass(db, { nama, sekolah }, user) {
    guruOnly(user);
    const name = text(nama, 60);
    if (name.length < 2) throw new DBError('Isi nama kelas, misalnya XI-IPA 2.', 400);
    const id = `kls-${Date.now().toString(36)}${randomInt(1e6).toString(36)}`;
    const row = await withUniqueCode((kode) =>
      db.from('classes').insert({ id, nama: name, sekolah: text(sekolah, 80) || null, guru_id: user.id, kode }).select().single()
    );
    return { class: { id: row.id, nama: row.nama, sekolah: row.sekolah, kode: row.kode } };
  },
  async regenerateCode(db, { classId }, user) {
    await requireOwner(db, user, classId);
    if (classId === DEMO_CLASS.id) throw new DBError('Kode kelas contoh tidak bisa diganti.', 403);
    const row = await withUniqueCode((kode) => db.from('classes').update({ kode }).eq('id', classId).select().single());
    return { kode: row.kode };
  },
  async deleteClass(db, { classId }, user) {
    await requireOwner(db, user, classId);
    if (classId === DEMO_CLASS.id) throw new DBError('Kelas contoh tidak bisa dihapus.', 403);
    await run(db.from('classes').delete().eq('id', classId));
  },
  async removeMember(db, { classId, userId }, user) {
    await requireOwner(db, user, classId);
    await run(db.from('class_members').delete().eq('class_id', classId).eq('user_id', userId));
    await run(db.from('spin_sessions').delete().eq('class_id', classId).eq('user_id', userId));
  },
  async joinClass(db, { kode }, user) {
    siswaOnly(user);
    const code = normalizeCode(kode);
    if (code.length < 4) throw new DBError('Masukkan kode kelas dari gurumu.', 400);
    const row = await run(db.from('classes').select('id, nama').eq('kode', code).maybeSingle());
    if (!row) throw new DBError('Kode kelas tidak ditemukan. Periksa lagi ke gurumu.', 404);
    await run(db.from('class_members').upsert({ class_id: row.id, user_id: user.id }, { ignoreDuplicates: true }));
    return { class: { id: row.id, nama: row.nama } };
  },
  async leaveClass(db, { classId }, user) {
    siswaOnly(user);
    await run(db.from('class_members').delete().eq('class_id', classId).eq('user_id', user.id));
    await run(db.from('spin_sessions').delete().eq('class_id', classId).eq('user_id', user.id));
  },

  async publishMaterial(db, { classId, material, cases }, user) {
    await requireOwner(db, user, classId);
    await run(db.from('materials').insert(toRow('materials', { ...material, classId })));
    if (Array.isArray(cases) && cases.length) {
      await run(db.from('cases').insert(cases.map((c) => toRow('cases', { ...c, materialId: material.id }))));
    }
  },
  async deleteMaterial(db, { id }, user) {
    await requireOwner(db, user, await classOf(db, 'materials', id));
    await run(db.from('spin_sessions').delete().eq('material_id', id));
    await run(db.from('materials').delete().eq('id', id));
  },
  async addCase(db, { kasus }, user) {
    await requireOwner(db, user, await classOf(db, 'materials', kasus?.materialId));
    await run(db.from('cases').insert(toRow('cases', kasus)));
  },
  async updateCase(db, { id, fields }, user) {
    await requireOwner(db, user, await classOfCase(db, id));
    const allowed = Object.fromEntries(Object.entries(fields || {}).filter(([k]) => CASE_FIELDS.includes(k)));
    if (allowed.materialId) await requireOwner(db, user, await classOf(db, 'materials', allowed.materialId));
    await run(db.from('cases').update(toRow('cases', allowed)).eq('id', id));
  },
  async deleteCase(db, { id }, user) {
    await requireOwner(db, user, await classOfCase(db, id));
    await run(db.from('spin_sessions').delete().eq('case_id', id));
    await run(db.from('cases').delete().eq('id', id));
  },
  async setRoom(db, { caseId, closed, sintesis }, user) {
    await requireOwner(db, user, await classOfCase(db, caseId));
    const row = { case_id: caseId, closed: Boolean(closed) };
    if (sintesis !== undefined) row.sintesis = sintesis;
    await run(db.from('discussion_rooms').upsert(row));
  },

  async addForumPost(db, { classId, post }, user) {
    await requireAccess(db, user, classId);
    const own = { ...post, classId, penulisId: user.id, penulisNama: user.nama, penulisRole: user.role };
    await run(db.from('forum_posts').insert(toRow('forum_posts', own)));
  },
  async addComment(db, { postId, comment }, user) {
    await requireAccess(db, user, await classOf(db, 'forum_posts', postId));
    const own = { ...comment, postId, penulisId: user.id, penulisNama: user.nama, penulisRole: user.role };
    await run(db.from('forum_comments').insert(toRow('forum_comments', own)));
  },
  async toggleLike(db, { postId }, user) {
    await requireAccess(db, user, await classOf(db, 'forum_posts', postId));
    const match = { post_id: postId, user_id: user.id };
    const found = await run(db.from('forum_likes').select('post_id').match(match).maybeSingle());
    if (found) await run(db.from('forum_likes').delete().match(match));
    else await run(db.from('forum_likes').insert(match));
    return { liked: !found };
  },

  async saveAnswer(db, { evaluation, journal, arenaPost }, user) {
    siswaOnly(user);
    const classId = await classOfCase(db, evaluation?.caseId);
    await requireAccess(db, user, classId);
    const mine = { classId, siswaId: user.id, siswaNama: user.nama };
    await run(db.from('evaluations').insert(toRow('evaluations', { ...evaluation, ...mine })));
    await run(db.from('journals').insert(toRow('journals', { ...journal, classId, siswaId: user.id })));
    if (arenaPost) await run(db.from('arena_posts').insert(toRow('arena_posts', { ...arenaPost, ...mine, caseId: evaluation.caseId })));
    await run(db.from('spin_sessions').delete().eq('user_id', user.id));
  },
  async addArenaReply(db, { postId, reply }, user) {
    await requireAccess(db, user, await classOf(db, 'arena_posts', postId));
    await run(db.from('arena_replies').insert(toRow('arena_replies', { ...reply, postId, siswaId: user.id, siswaNama: user.nama })));
  },

  async lockSpin(db, { session }, user) {
    siswaOnly(user);
    const classId = await classOfCase(db, session?.caseId);
    await requireAccess(db, user, classId);
    const row = { user_id: user.id, class_id: classId, material_id: session.materialId, case_id: session.caseId, spun_at: Date.now(), started_at: null };
    const res = await db.from('spin_sessions').insert(row);
    if (res.error?.code === '23505') {
      const s = await run(db.from('spin_sessions').select('*').eq('user_id', user.id).single());
      return { session: spinOf(s), conflict: true };
    }
    if (res.error) throw failed(res.error);
    return { session: spinOf(row) };
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

export async function handleData(body, user, env = process.env) {
  const db = admin(env);
  const action = body?.action;
  if (action === 'bootstrap') return bootstrap(db, user, body);
  const fn = ACTIONS[action];
  if (!fn) throw new DBError('Aksi data tidak dikenal.', 400);
  return (await fn(db, body, user)) || { ok: true };
}
