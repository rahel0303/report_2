const { Pool } = require('pg');

const pool = new Pool({
  host: 'db.idohuhfpbwotbbqbnazf.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Masadepan0.',
  ssl: { rejectUnauthorized: false },
});

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    const result = await pool.query('SELECT NOW(), version()');
    console.log('✅ Connection successful!');
    console.log('Current time:', result.rows[0].now);
    console.log('PostgreSQL version:', result.rows[0].version);

    // Test query users table
    console.log('\nTesting users table...');
    const users = await pool.query('SELECT id, username, name, role FROM users');
    console.log(`Found ${users.rows.length} users:`);
    users.rows.forEach((user) => {
      console.log(`  - ${user.username} (${user.name}) - Role: ${user.role}`);
    });
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }
}

testConnection();
