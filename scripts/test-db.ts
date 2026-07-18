import { config } from 'dotenv';
config({ path: '.env' });

async function main() {
  const { sql } = await import('drizzle-orm');
  const { db } = await import('../database/client');

  const result = await db.execute(
    sql`SELECT current_database() as db, (SELECT count(*)::int FROM users) as users`
  );
  console.log('App client OK:', result.rows?.[0] ?? result);
  process.exit(0);
}

main().catch((e) => {
  console.error('App client FAIL:', e);
  process.exit(1);
});
