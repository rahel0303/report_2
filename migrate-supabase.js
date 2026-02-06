const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'db.idohuhfpbwotbbqbnazf.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Masadepan0.',
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  try {
    console.log('Connecting to Supabase...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Running schema migration...');
    await pool.query(schema);
    
    console.log('✅ Schema migration completed successfully!');
    
    // Check if tables exist
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\nCreated tables:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
