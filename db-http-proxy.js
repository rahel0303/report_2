/**
 * PostgreSQL HTTP Proxy
 * Expose PostgreSQL via HTTP API
 */
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: '10.100.14.216',
  port: 5432,
  database: 'db_report_phase_2_test',
  user: 'postgres',
  password: 'pass1234',
  ssl: false,
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', message: 'Database connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Execute query
app.post('/query', async (req, res) => {
  try {
    const { text, params } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Query text is required' });
    }

    const result = await pool.query(text, params);
    res.json({ rows: result.rows, rowCount: result.rowCount });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`PostgreSQL HTTP Proxy running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log('\nNext steps:');
  console.log('1. Install ngrok: choco install ngrok (or download from https://ngrok.com)');
  console.log(`2. Run: ngrok http ${PORT}`);
  console.log('3. Copy the public URL and use it in Vercel environment variables');
});
