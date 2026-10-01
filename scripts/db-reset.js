// Mengosongkan database Supabase lalu mengisi ulang data demo.
// Jalankan: npm run db:reset  (membaca SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY dari .env)
import { resetDemo } from '../server/db.js';

try {
  await resetDemo(process.env);
  console.log('Database demo sudah dikembalikan ke data awal.');
} catch (e) {
  console.error('Gagal reset:', e.message);
  process.exit(1);
}
