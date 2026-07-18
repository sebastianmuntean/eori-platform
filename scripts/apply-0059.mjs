import fs from 'fs';
import postgres from 'postgres';

const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env';
const env = fs.readFileSync(envPath, 'utf8');
const match = env.match(/^DATABASE_URL=(.+)$/m);
if (!match) {
  console.error('No DATABASE_URL found');
  process.exit(1);
}
const url = match[1].trim().replace(/^['"]|['"]$/g, '');
const sql = fs.readFileSync(
  'database/migrations/0059_update_general_register_resolution.sql',
  'utf8'
);

const sqlClient = postgres(url, { max: 1 });
try {
  await sqlClient.unsafe(sql);
  console.log('Migration 0059 applied successfully');
} catch (e) {
  console.error('Migration failed:', e.message);
  process.exitCode = 1;
} finally {
  await sqlClient.end();
}
