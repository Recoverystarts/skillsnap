-- SkillSnap Database Schema
-- PostgreSQL + pgvector for SOP embeddings

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  tier VARCHAR(20) NOT NULL DEFAULT 'trial' CHECK (tier IN ('trial', 'team', 'enterprise')),
  territory_exclusive BOOLEAN DEFAULT FALSE,
  region VARCHAR(100),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  max_users INTEGER DEFAULT 2,
  max_documents INTEGER DEFAULT 3,
  scans_per_day INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'worker' CHECK (role IN ('admin', 'manager', 'worker')),
  firebase_uid VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SOP Documents table
CREATE TABLE IF NOT EXISTS sop_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  storage_url TEXT NOT NULL,
  mime_type VARCHAR(100),
  file_size_bytes BIGINT,
  page_count INTEGER DEFAULT 0,
  embeddings_generated BOOLEAN DEFAULT FALSE,
  chunk_count INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SOP Chunks table with vector embeddings
CREATE TABLE IF NOT EXISTS sop_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES sop_documents(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  page_number INTEGER,
  chunk_index INTEGER NOT NULL,
  token_count INTEGER,
  embedding vector(768),  -- Gemini text-embedding-004 outputs 768 dims
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scan requests table
CREATE TABLE IF NOT EXISTS scan_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  image_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'complete', 'failed')),
  vision_result JSONB,
  guidance_result JSONB,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily scan usage tracking
CREATE TABLE IF NOT EXISTS daily_scan_usage (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  scan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  scan_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, scan_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sop_chunks_company ON sop_chunks(company_id);
CREATE INDEX IF NOT EXISTS idx_sop_chunks_document ON sop_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_sop_documents_company ON sop_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_scan_requests_user ON scan_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_requests_company ON scan_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_daily_scan_usage_lookup ON daily_scan_usage(user_id, scan_date);

-- HNSW index for fast vector similarity search
CREATE INDEX IF NOT EXISTS idx_sop_chunks_embedding ON sop_chunks 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
