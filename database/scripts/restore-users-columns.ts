import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = postgres(process.env.DATABASE_URL);

async function restoreColumns() {
  try {
    console.log('Restoring address, city, phone columns to users table...');
    
    await sql`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "address" text;
    `;
    console.log('✓ Added address column');
    
    await sql`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "city" text;
    `;
    console.log('✓ Added city column');
    
    await sql`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" text;
    `;
    console.log('✓ Added phone column');
    
    console.log('✓ All columns restored successfully');
  } catch (error) {
    console.error('❌ Error restoring columns:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

restoreColumns();

