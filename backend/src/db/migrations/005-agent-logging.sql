-- Migration: Add agent execution logging
-- Purpose: Track every AI decision for XPRIZE submission evidence
-- Required for: "Product evidence — agent execution logs, API usage records"

CREATE TABLE IF NOT EXISTS agent_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  scan_id UUID REFERENCES scan_requests(id),
  
  -- What happened
  event_type VARCHAR(50) NOT NULL,
  
  -- AI decision details
  model_used VARCHAR(100),
  input_summary TEXT,
  output_summary TEXT,
  confidence DECIMAL(5,4),
  
  -- SOP matching (for retrieval events)
  sop_documents_matched INTEGER,
  top_similarity_score DECIMAL(5,4),
  
  -- Safety
  safety_warnings_generated INTEGER DEFAULT 0,
  safety_override_applied BOOLEAN DEFAULT FALSE,
  
  -- Performance
  processing_time_ms INTEGER,
  tokens_used INTEGER,
  
  -- Metadata
  api_version VARCHAR(20) DEFAULT '0.4.0',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_created ON agent_execution_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_company ON agent_execution_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_event ON agent_execution_logs(event_type, created_at DESC);

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
