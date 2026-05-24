import { readFileSync } from 'fs';
import { join } from 'path';
import { getPool } from './pool';

export async function runMigrations(): Promise<void> {
  const pool = getPool();
  
  console.log('[DB] Running migrations...');
  
  try {
    // Read and execute schema
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Split on semicolons but respect $$ blocks (for functions if we add them)
    const statements = schema
      .split(/;\s*$/m)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (err: any) {
        // Skip "already exists" errors gracefully
        if (err.code === '42710' || err.code === '42P07') {
          console.log(`[DB] Skipping (already exists): ${stmt.slice(0, 60)}...`);
          continue;
        }
        throw err;
      }
    }
    
    console.log('[DB] Migrations complete');
  } catch (error) {
    console.error('[DB] Migration failed:', error);
    throw error;
  }
}

// Run directly if called as script
if (require.main === module) {
  runMigrations()
    .then(() => { process.exit(0); })
    .catch(() => { process.exit(1); });
}
