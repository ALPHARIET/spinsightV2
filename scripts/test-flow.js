// Uji alur kelas end-to-end langsung ke database (tanpa login): guru, siswa, kode undangan, hak akses.
// Jalankan: npm run test:flow  (membaca SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY dari .env)
// Membuat profil uji sementara lalu menghapusnya lagi. Akun dan kelas asli tidak disentuh.
import { handleData, ensureSeeded } from '../server/db.js';
import { admin, run } from '../server/supabase.js';
import { DEMO_ACCOUNTS, DEMO_CLASS } from '../src/data/seedData.js';

const db = admin();
const tag = Date.now().toString(36);
const guru = { id: `test-guru-${tag}`, nama: 'Guru Uji', role: 'pendamping', email: null };
const siswa = { id: `test-siswa-${tag}`, nama: 'Siswa Uji', role: 'siswa', email: null };
let passed = 0;
let failed = 0;

const ok = (cond, label) => {
  if (cond) passed++;
  else failed++;
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}`);
};
const rejects = async (promise, status, label) => {
  try {
    await promise;
    ok(false, `${label} (tidak ditolak)`);
  } catch (e) {
    ok(e.status === status, `${label} → ${e.status} ${e.message}`);
  }
};
const call = (user, action, payload = {}) => handleData({ action, ...payload }, user);

let classId;
try {
  await ensureSeeded();
  const demoGuru = await run(db.from('users').select('id, nama, role, email').eq('email', DEMO_ACCOUNTS.guru.email).single());
  const demoSiswa = await run(db.from('users').select('id, nama, role, email').eq('email', DEMO_ACCOUNTS.siswa.email).single());

  console.log('Akun & kelas contoh');
  const dg = await call(demoGuru, 'bootstrap', { classId: DEMO_CLASS.id });
  ok(dg.activeClassId === DEMO_CLASS.id && dg.classes[0]?.kode === DEMO_CLASS.kode, 'guru contoh melihat kelas contoh beserta kodenya');
  ok(dg.materials.length === 5 && dg.cases.length === 18, `kelas contoh berisi 5 materi dan 18 topik (${dg.materials.length}/${dg.cases.length})`);
  ok(dg.evaluationRecords.length >= 5 && dg.members.length >= 6, `rekap guru berisi jawaban dan daftar siswa (${dg.evaluationRecords.length} jawaban, ${dg.members.length} siswa)`);
  const ds = await call(demoSiswa, 'bootstrap', {});
  ok(ds.classes.length >= 1 && ds.classes.every((c) => c.kode === undefined), 'siswa contoh tidak menerima kode undangan kelas');
  ok(ds.journals.length >= 5, `jurnal siswa contoh terisi (${ds.journals.length})`);
  ok(ds.arenaPosts.filter((p) => p.siswaId !== demoSiswa.id).every((p) => p.skorArgumen === undefined), 'skor teman sekelas disembunyikan dari siswa');
  ok(ds.evaluationRecords.every((e) => e.siswaId === demoSiswa.id), 'siswa hanya menerima nilainya sendiri');
  await rejects(call(demoGuru, 'deleteClass', { classId: DEMO_CLASS.id }), 403, 'kelas contoh tidak bisa dihapus');

  console.log('Kelas baru');
  await run(db.from('users').insert([guru, siswa]));
  await rejects(call(siswa, 'createClass', { nama: 'X' }), 403, 'siswa tidak bisa membuat kelas');
  const created = await call(guru, 'createClass', { nama: 'XI Uji', sekolah: 'SMA Uji' });
  classId = created.class.id;
  ok(/^[A-Z2-9]{6}$/.test(created.class.kode), `guru membuat kelas dengan kode ${created.class.kode}`);

  const kosong = await call(siswa, 'bootstrap', {});
  ok(kosong.classes.length === 0 && kosong.materials.length === 0, 'siswa baru belum punya kelas dan data');
  await rejects(call(siswa, 'joinClass', { kode: 'ZZZZZZ' }), 404, 'kode salah ditolak');
  await call(siswa, 'joinClass', { kode: created.class.kode.toLowerCase().split('').join(' ') });
  const masuk = await call(siswa, 'bootstrap', {});
  ok(masuk.activeClassId === classId, 'siswa bergabung dengan kode (huruf kecil dan spasi tetap diterima)');
  ok(masuk.cases.length === 0, 'kelas tanpa materi: tidak ada topik untuk di-spin');

  console.log('Materi & topik');
  const material = { id: `mat-uji-${tag}`, judul: 'Bab Uji', topik: 'Uji', poinKunci: [] };
  const cases = [1, 2].map((i) => ({ id: `case-uji-${tag}-${i}`, materialId: material.id, judulKasus: `Topik uji ${i}`, teksKasus: 'Konteks uji', levelBloom: 'Analisis', aktif: true }));
  await rejects(call(siswa, 'publishMaterial', { classId, material, cases }), 403, 'siswa tidak bisa menerbitkan materi');
  await rejects(call(demoGuru, 'publishMaterial', { classId, material, cases }), 403, 'guru kelas lain tidak bisa menerbitkan ke kelas ini');
  await call(guru, 'publishMaterial', { classId, material, cases });
  const ada = await call(siswa, 'bootstrap', { classId });
  ok(ada.cases.length === 2, 'siswa melihat topik setelah guru menerbitkan materi');
  await rejects(call(demoSiswa, 'lockSpin', { session: { materialId: material.id, caseId: cases[0].id } }), 403, 'siswa kelas lain tidak bisa spin topik kelas ini');

  console.log('Spin & jawaban');
  const s1 = await call(siswa, 'lockSpin', { session: { materialId: material.id, caseId: cases[0].id } });
  const s2 = await call(siswa, 'lockSpin', { session: { materialId: material.id, caseId: cases[1].id } });
  ok(!s1.conflict && s2.conflict && s2.session.caseId === cases[0].id, 'spin kedua ditolak, topik tetap yang pertama');
  await call(siswa, 'saveAnswer', {
    evaluation: { id: `eval-uji-${tag}`, caseId: cases[0].id, skor: 80, jawabanTeks: 'jawaban uji' },
    journal: { id: `jrn-uji-${tag}`, skorArgumen: 80, transkrip: 'jawaban uji' },
    arenaPost: { id: `post-uji-${tag}`, caseId: cases[0].id, transkrip: 'jawaban uji', skorArgumen: 80 },
  });
  const rekap = await call(guru, 'bootstrap', { classId });
  ok(rekap.evaluationRecords.some((e) => e.siswaId === siswa.id && e.siswaNama === 'Siswa Uji'), 'jawaban siswa masuk rekap guru dengan nama dari server');
  ok(!(await call(siswa, 'bootstrap', { classId })).spinSessions[siswa.id], 'sesi spin dihapus setelah menjawab');
  const luar = await call(demoGuru, 'bootstrap', {});
  ok(!luar.evaluationRecords.some((e) => e.id === `eval-uji-${tag}`), 'guru lain tidak melihat jawaban kelas ini');

  console.log('Forum');
  await call(siswa, 'addForumPost', { classId, post: { id: `fp-uji-${tag}`, judul: 'Uji', isi: 'Isi uji', penulisNama: 'Nama palsu' } });
  const forum = await call(guru, 'bootstrap', { classId });
  ok(forum.forumPosts[0]?.penulisNama === 'Siswa Uji', 'nama penulis forum diambil dari akun, bukan dari kiriman');
  await rejects(call(demoSiswa, 'addComment', { postId: `fp-uji-${tag}`, comment: { id: `c-${tag}`, isi: 'spam' } }), 403, 'siswa kelas lain tidak bisa berkomentar');

  console.log('Kode & anggota');
  const lama = created.class.kode;
  const baru = (await call(guru, 'regenerateCode', { classId })).kode;
  ok(baru !== lama, `kode baru dibuat (${lama} → ${baru})`);
  await rejects(call(demoSiswa, 'joinClass', { kode: lama }), 404, 'kode lama tidak bisa dipakai lagi');
  await call(guru, 'removeMember', { classId, userId: siswa.id });
  ok((await call(siswa, 'bootstrap', {})).classes.length === 0, 'siswa yang dikeluarkan kehilangan akses kelas');
} catch (e) {
  failed++;
  console.error('  ✗ Error:', e.message);
} finally {
  if (classId) await run(db.from('classes').delete().eq('id', classId)).catch(() => {});
  await run(db.from('users').delete().in('id', [guru.id, siswa.id])).catch(() => {});
  console.log(`\n${passed} lulus, ${failed} gagal`);
  process.exit(failed ? 1 : 0);
}
