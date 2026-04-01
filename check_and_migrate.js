const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true',
});

async function main() {
  const client = await pool.connect();
  try {
    // Check if export_history table exists
    const check = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'export_history'
      ) as exists
    `);
    const tableExists = check.rows[0].exists;
    console.log('export_history table exists:', tableExists);

    if (!tableExists) {
      console.log('Creating export_history table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.export_history (
          id               SERIAL PRIMARY KEY,
          user_id          INTEGER REFERENCES users(id) ON DELETE SET NULL,
          name             VARCHAR(255) NOT NULL,
          brand_name       VARCHAR(255) NOT NULL,
          period           VARCHAR(20)  NOT NULL,
          slide_count      INTEGER      NOT NULL,
          is_partial       BOOLEAN      NOT NULL DEFAULT false,
          config           JSONB        NOT NULL DEFAULT '{}',
          gcs_object_name  VARCHAR(500),
          cover_image_url  TEXT,
          exported_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_export_history_user_id ON public.export_history(user_id);
        CREATE INDEX IF NOT EXISTS idx_export_history_brand_period ON public.export_history(brand_name, period);
      `);
      console.log('Table created!');
    } else {
      const count = await client.query('SELECT COUNT(*) FROM public.export_history');
      console.log('Rows in export_history:', count.rows[0].count);

      const cols = await client.query(`
        SELECT column_name, data_type FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'export_history'
        ORDER BY ordinal_position
      `);
      console.log('Columns:', cols.rows.map(r => r.column_name).join(', '));
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
