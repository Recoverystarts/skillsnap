import { getPool } from './pool';

export async function runMigrations() {
  const db = getPool();
  console.log('[Migrate] Running migrations...');
  
  // Auth columns
  await db.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'worker';
  `).catch(() => {});
  
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);`).catch(() => {});
  
  // Scan history columns
  await db.query(`
    ALTER TABLE scan_requests ADD COLUMN IF NOT EXISTS scene_description TEXT;
    ALTER TABLE scan_requests ADD COLUMN IF NOT EXISTS objects_detected INTEGER DEFAULT 0;
    ALTER TABLE scan_requests ADD COLUMN IF NOT EXISTS confidence REAL DEFAULT 0;
    ALTER TABLE scan_requests ADD COLUMN IF NOT EXISTS guidance_steps JSONB;
    ALTER TABLE scan_requests ADD COLUMN IF NOT EXISTS safety_warnings JSONB;
    ALTER TABLE scan_requests ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;
  `).catch(() => {});
  
  console.log('[Migrate] Complete');
}
