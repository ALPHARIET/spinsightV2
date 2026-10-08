-- Schema database SpinSight untuk Supabase (PostgreSQL).
-- Jalankan sekali di Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Data awal (materi, topik, contoh jawaban) diisi otomatis oleh server saat database masih kosong.

create table if not exists users (
  id text primary key,
  nama text not null,
  role text not null check (role in ('siswa', 'pendamping')),
  kelas text,
  sekolah text,
  created_at timestamptz not null default now()
);

create table if not exists materials (
  id text primary key,
  kelas_id text,
  judul text not null,
  mapel text,
  topik text,
  file_name text,
  file_size text,
  tanggal_upload text,
  status text default 'selesai',
  sumber text,
  deskripsi text,
  poin_kunci jsonb not null default '[]',
  contoh_jawaban text,
  created_at timestamptz not null default now()
);

create table if not exists cases (
  id text primary key,
  material_id text not null references materials (id) on delete cascade,
  judul_kasus text not null,
  teks_kasus text not null,
  level_bloom text not null default 'Analisis',
  aktif boolean not null default true,
  kategori text,
  kata_kunci jsonb not null default '[]',
  poin_terkait jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index if not exists cases_material_idx on cases (material_id);

-- Rekap penilaian untuk guru. Disimpan sebagai salinan (judul topik, materi) supaya tetap utuh walau topiknya dihapus.
create table if not exists evaluations (
  id text primary key,
  siswa_id text not null references users (id),
  siswa_nama text,
  kelas text,
  case_id text,
  topik_kasus text,
  level_bloom text,
  materi_judul text,
  jawaban_teks text,
  skor integer,
  dimensi jsonb,
  feedback text,
  pertanyaan_lanjutan text,
  penjelasan_konsep text,
  durasi_pengerjaan text,
  lewat_suara boolean,
  sumber_analisis text,
  tanggal text,
  created_at timestamptz not null default now()
);
create index if not exists evaluations_siswa_idx on evaluations (siswa_id);

create table if not exists journals (
  id text primary key,
  siswa_id text not null references users (id),
  tanggal text,
  case_judul text,
  level_bloom text,
  durasi_bicara text,
  skor_argumen integer,
  transkrip text,
  kutipan jsonb,
  cermin jsonb,
  dimensi jsonb,
  created_at timestamptz not null default now()
);
create index if not exists journals_siswa_idx on journals (siswa_id);

create table if not exists arena_posts (
  id text primary key,
  case_id text not null,
  siswa_id text,
  siswa_nama text,
  kutub text,
  posisi_x integer,
  posisi_y integer,
  transkrip text,
  kutipan jsonb,
  skor_argumen integer,
  lewat_suara boolean,
  cermin jsonb,
  waktu text,
  created_at timestamptz not null default now()
);
create index if not exists arena_posts_case_idx on arena_posts (case_id);

create table if not exists arena_replies (
  id text primary key,
  post_id text not null references arena_posts (id) on delete cascade,
  siswa_id text,
  siswa_nama text,
  label text,
  isi text not null,
  waktu text,
  created_at timestamptz not null default now()
);

create table if not exists forum_posts (
  id text primary key,
  materi_id text,
  materi_judul text,
  kategori text,
  judul text not null,
  isi text not null,
  penulis_id text,
  penulis_nama text,
  penulis_role text,
  tanggal text,
  created_at timestamptz not null default now()
);

create table if not exists forum_comments (
  id text primary key,
  post_id text not null references forum_posts (id) on delete cascade,
  isi text not null,
  penulis_id text,
  penulis_nama text,
  penulis_role text,
  tanggal text,
  created_at timestamptz not null default now()
);

create table if not exists forum_likes (
  post_id text not null references forum_posts (id) on delete cascade,
  user_id text not null,
  primary key (post_id, user_id)
);

create table if not exists discussion_rooms (
  case_id text primary key,
  closed boolean not null default false,
  sintesis jsonb
);

-- Satu sesi spin aktif per siswa. Primary key di user_id yang menjamin "spin sekali" di semua perangkat.
create table if not exists spin_sessions (
  user_id text primary key references users (id),
  material_id text,
  case_id text,
  spun_at bigint,
  started_at bigint
);

create table if not exists app_meta (
  key text primary key,
  value text
);

-- RLS aktif tanpa policy: anon key dari browser tidak bisa membaca atau menulis apa pun.
-- Semua akses lewat server (/api/data) dengan service role key.
alter table users enable row level security;
alter table materials enable row level security;
alter table cases enable row level security;
alter table evaluations enable row level security;
alter table journals enable row level security;
alter table arena_posts enable row level security;
alter table arena_replies enable row level security;
alter table forum_posts enable row level security;
alter table forum_comments enable row level security;
alter table forum_likes enable row level security;
alter table discussion_rooms enable row level security;
alter table spin_sessions enable row level security;
alter table app_meta enable row level security;
