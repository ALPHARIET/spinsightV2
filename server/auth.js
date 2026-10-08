import { admin, fresh, run, DBError } from './supabase.js';

const EMAIL = /^[^\s@]+@[^\s@]+$/;
const text = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

const pack = (s) => ({ accessToken: s.access_token, refreshToken: s.refresh_token, expiresAt: s.expires_at });

// Profil disimpan di tabel users. Dibuat otomatis bila akun dibuat di luar aplikasi (mis. dari dashboard Supabase).
async function profileOf(db, authUser) {
  const found = await run(db.from('users').select('id, nama, role, email').eq('id', authUser.id).maybeSingle());
  if (found) return found;
  const meta = authUser.user_metadata || {};
  const row = {
    id: authUser.id,
    nama: text(meta.nama, 80) || String(authUser.email || 'Pengguna').split('@')[0],
    role: meta.role === 'pendamping' ? 'pendamping' : 'siswa',
    email: authUser.email,
  };
  await run(db.from('users').upsert(row));
  return row;
}

async function signin({ email, password }, env) {
  const mail = text(email, 200).toLowerCase();
  if (!mail || !password) throw new DBError('Isi email dan kata sandi.', 400);
  const { data, error } = await fresh(env).auth.signInWithPassword({ email: mail, password: String(password) });
  if (error || !data?.session) {
    if (error && !/invalid|credentials|not confirmed/i.test(error.message)) console.error('[auth]', error.message);
    throw new DBError('Email atau kata sandi salah.', 401);
  }
  return { session: pack(data.session), me: await profileOf(admin(env), data.user) };
}

async function signup({ nama, email, password, role }, env) {
  const name = text(nama, 80);
  const mail = text(email, 200).toLowerCase();
  const pass = String(password ?? '');
  if (name.length < 2) throw new DBError('Isi nama lengkapmu.', 400);
  if (!EMAIL.test(mail)) throw new DBError('Email harus mengandung @, misalnya nama@sekolah.id.', 400);
  if (pass.length < 6) throw new DBError('Kata sandi minimal 6 karakter.', 400);
  const peran = role === 'guru' || role === 'pendamping' ? 'pendamping' : 'siswa';

  const db = admin(env);
  // Dibuat lewat admin API dengan email_confirm: akun langsung aktif tanpa email verifikasi.
  const { data, error } = await db.auth.admin.createUser({
    email: mail,
    password: pass,
    email_confirm: true,
    user_metadata: { nama: name, role: peran },
  });
  if (error) {
    const msg = `${error.code || ''} ${error.message || ''}`;
    if (/exists|already|registered/i.test(msg)) throw new DBError('Email ini sudah terdaftar. Silakan masuk.', 409);
    if (/password/i.test(msg)) throw new DBError('Kata sandi terlalu lemah. Pakai minimal 6 karakter.', 400);
    if (/email/i.test(msg)) throw new DBError('Format email tidak diterima. Contoh: nama@sekolah.id', 400);
    console.error('[auth]', error);
    throw new DBError('Gagal membuat akun. Coba lagi.', 502);
  }
  await run(db.from('users').upsert({ id: data.user.id, nama: name, role: peran, email: mail }));
  return signin({ email: mail, password: pass }, env);
}

async function refresh({ refreshToken }, env) {
  if (!refreshToken) throw new DBError('Sesi berakhir. Silakan masuk lagi.', 401);
  const { data, error } = await fresh(env).auth.refreshSession({ refresh_token: String(refreshToken) });
  if (error || !data?.session) throw new DBError('Sesi berakhir. Silakan masuk lagi.', 401);
  return { session: pack(data.session) };
}

export async function handleAuth(body, env = process.env) {
  if (body?.action === 'signin') return signin(body, env);
  if (body?.action === 'signup') return signup(body, env);
  if (body?.action === 'refresh') return refresh(body, env);
  throw new DBError('Aksi tidak dikenal.', 400);
}

// Token diperiksa ke Supabase Auth, lalu disimpan sebentar supaya tidak memanggil Auth di setiap permintaan.
const tokens = new Map();
const TOKEN_TTL = 60000;

export async function userFromToken(token, env = process.env) {
  if (!token) throw new DBError('Silakan masuk dulu.', 401);
  const hit = tokens.get(token);
  if (hit && hit.until > Date.now()) return hit.user;
  const db = admin(env);
  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user) throw new DBError('Sesi berakhir. Silakan masuk lagi.', 401);
  const user = await profileOf(db, data.user);
  if (tokens.size > 2000) tokens.clear();
  tokens.set(token, { user, until: Date.now() + TOKEN_TTL });
  return user;
}
