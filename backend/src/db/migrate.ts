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
    ALTER TABLE scan_requests ADD COLUMN IF NOT EXISTS image_url TEXT;
  `).catch(() => {});

  // ── 005: Agent execution logging (v0.5.0) ──
  // Mirrors backend/src/db/migrations/005-agent-logging.sql.
  // Inlined here so every server start re-asserts the schema idempotently.
  await db.query(`
    CREATE TABLE IF NOT EXISTS agent_execution_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES companies(id),
      user_id UUID REFERENCES users(id),
      scan_id UUID REFERENCES scan_requests(id),
      event_type VARCHAR(50) NOT NULL,
      model_used VARCHAR(100),
      input_summary TEXT,
      output_summary TEXT,
      confidence DECIMAL(5,4),
      sop_documents_matched INTEGER,
      top_similarity_score DECIMAL(5,4),
      safety_warnings_generated INTEGER DEFAULT 0,
      safety_override_applied BOOLEAN DEFAULT FALSE,
      processing_time_ms INTEGER,
      tokens_used INTEGER,
      api_version VARCHAR(20) DEFAULT '0.5.0',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `).catch((err: any) => { console.error('[Migrate] 005 table failed:', err?.message); });

  await db.query(`CREATE INDEX IF NOT EXISTS idx_agent_logs_created ON agent_execution_logs(created_at DESC);`).catch(() => {});
  await db.query(`CREATE INDEX IF NOT EXISTS idx_agent_logs_company ON agent_execution_logs(company_id, created_at DESC);`).catch(() => {});
  await db.query(`CREATE INDEX IF NOT EXISTS idx_agent_logs_event ON agent_execution_logs(event_type, created_at DESC);`).catch(() => {});

  await db.query(`
    CREATE OR REPLACE VIEW daily_ai_activity AS
    SELECT
      DATE(created_at) as activity_date,
      COUNT(*) as total_events,
      COUNT(DISTINCT scan_id) as total_scans,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(CASE WHEN event_type = 'vision_analysis' THEN 1 END) as vision_analyses,
      COUNT(CASE WHEN event_type = 'sop_retrieval' THEN 1 END) as sop_retrievals,
      COUNT(CASE WHEN event_type = 'guidance_synthesis' THEN 1 END) as guidance_generations,
      COUNT(CASE WHEN event_type = 'safety_check' THEN 1 END) as safety_checks,
      SUM(safety_warnings_generated) as total_safety_warnings,
      COUNT(CASE WHEN safety_override_applied THEN 1 END) as supervisor_referrals,
      AVG(processing_time_ms) as avg_processing_ms,
      SUM(tokens_used) as total_tokens
    FROM agent_execution_logs
    GROUP BY DATE(created_at)
    ORDER BY activity_date DESC;
  `).catch((err: any) => { console.error('[Migrate] 005 view failed:', err?.message); });

  console.log('[Migrate] Complete');
}
