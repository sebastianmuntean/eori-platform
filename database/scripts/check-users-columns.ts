import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = postgres(process.env.DATABASE_URL);

async function checkColumns() {
  try {
    console.log('Checking users table columns...');
    
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `;
    
    console.log('\nUsers table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    
    const missingColumns = [];
    const requiredColumns = ['role', 'parish_id', 'permissions', 'admin_notes'];
    
    for (const col of requiredColumns) {
      const exists = columns.some(c => c.column_name === col);
      if (!exists) {
        missingColumns.push(col);
      }
    }
    
    if (missingColumns.length > 0) {
      console.log(`\n⚠️  Missing columns: ${missingColumns.join(', ')}`);
      console.log('You need to run migration 0005 to add these columns.');
    } else {
      console.log('\n✓ All required columns exist');
    }
  } catch (error) {
    console.error('❌ Error checking columns:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

checkColumns();






