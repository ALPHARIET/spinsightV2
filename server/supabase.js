import { createClient } from '@supabase/supabase-js';
import { cleanKey } from './llm.js';

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

const AUTH_OPTS = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

function config(env) {
  const cfg = dbConfig(env);
  if (!cfg.url || !cfg.key) throw new DBError('Database belum diatur (SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY kosong).', 503);
  return cfg;
}

// Klien admin bersama untuk query database. Tidak pernah dipakai untuk login supaya sesinya tetap service role.
let cached = null;
export function admin(env = process.env) {
  const { url, key } = config(env);
  if (!cached || cached.url !== url || cached.key !== key) cached = { url, key, db: createClient(url, key, AUTH_OPTS) };
  return cached.db;
}

// Klien baru per permintaan login/refresh, supaya sesi pengguna tidak tercampur dengan klien admin.
export function fresh(env = process.env) {
  const { url, key } = config(env);
  return createClient(url, key, AUTH_OPTS);
}

export function failed(error) {
  const msg = `${error?.code || ''} ${error?.message || ''}`;
  if (/42P01|PGRST205|does not exist|Could not find the table/i.test(msg)) {
    return new DBError('Tabel database belum dibuat. Jalankan supabase/schema.sql di SQL Editor Supabase.', 503);
  }
  if (/JWT|Invalid API key|apikey/i.test(msg)) return new DBError('Key Supabase ditolak. Cek SUPABASE_SERVICE_ROLE_KEY.', 503);
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|network/i.test(msg)) return new DBError('Tidak bisa menghubungi database. Cek SUPABASE_URL.', 504);
  console.error('[db]', error);
  return new DBError('Gagal mengakses database.', 502);
}

export async function run(query) {
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
