import { getPool } from './pool';

export async function runMigrations() {
  const db = getPool();
  
  console.log('[Migrate] Running migrations...');
  
  // Ensure auth columns exist on users table
  await db.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'worker';
  `).catch(() => console.log('[Migrate] Auth columns already exist or table not ready'));
  
  // Create unique index on email (idempotent)
  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `).catch(() => console.log('[Migrate] Email index already exists'));
  
  console.log('[Migrate] Migrations complete');
}
