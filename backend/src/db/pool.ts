import { Pool, PoolConfig } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const config: PoolConfig = {
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

    // Cloud SQL socket connection (Cloud Run)
    if (process.env.CLOUD_SQL_CONNECTION_NAME) {
      config.host = `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`;
      config.user = process.env.DB_USER || 'skillsnap';
      config.password = process.env.DB_PASSWORD;
      config.database = process.env.DB_NAME || 'skillsnap';
      delete config.connectionString;
    }

    pool = new Pool(config);
    pool.on('error', (err) => {
      console.error('[DB] Unexpected pool error:', err);
    });
  }
  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

export async function healthCheck(): Promise<boolean> {
  try {
    await getPool().query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
