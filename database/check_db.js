const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'db_sosme',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkDb() {
  const client = await pool.connect();
  try {
    // List all tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('Existing tables:');
    tables.rows.forEach(row => console.log('  - ' + row.table_name));

    // Check if users table exists
    const usersExists = tables.rows.some(r => r.table_name === 'users');
    console.log('\\nUsers table exists:', usersExists);

    // Check if reports table exists
    const reportsExists = tables.rows.some(r => r.table_name === 'reports');
    console.log('Reports table exists:', reportsExists);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDb();
