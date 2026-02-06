import { Pool } from 'pg';

// Check if using HTTP proxy
const USE_HTTP_PROXY = process.env.DB_PROXY_URL !== undefined;

const pool = !USE_HTTP_PROXY ? new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'your_database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
}) : null as any;

export default pool;

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  // Use HTTP proxy if configured
  if (USE_HTTP_PROXY) {
    const proxyUrl = process.env.DB_PROXY_URL;
    try {
      const response = await fetch(`${proxyUrl}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, params }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Database query failed');
      }
      
      const result = await response.json();
      return result.rows as T[];
    } catch (error) {
      console.error('Database proxy error:', error);
      throw error;
    }
  }
  
  // Use direct PostgreSQL connection
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}
