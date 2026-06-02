import { Pool } from 'pg';

interface LogEntry {
  eventType: string;
  modelUsed?: string;
  inputSummary?: string;
  outputSummary?: string;
  confidence?: number;
  sopDocumentsMatched?: number;
  topSimilarityScore?: number;
  safetyWarningsGenerated?: number;
  safetyOverrideApplied?: boolean;
  processingTimeMs?: number;
  tokensUsed?: number;
}

export class AgentLogger {
  private pool: Pool;
  private companyId: string;
  private userId: string;
  private scanId: string;

  constructor(pool: Pool, companyId: string, userId: string, scanId: string) {
    this.pool = pool;
    this.companyId = companyId;
    this.userId = userId;
    this.scanId = scanId;
  }

  async log(eventType: string, details: Partial<LogEntry> = {}): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO agent_execution_logs 
         (company_id, user_id, scan_id, event_type, model_used, 
          input_summary, output_summary, confidence, 
          sop_documents_matched, top_similarity_score,
          safety_warnings_generated, safety_override_applied,
          processing_time_ms, tokens_used)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          this.companyId, this.userId, this.scanId, eventType,
          details.modelUsed || null,
          details.inputSummary ? details.inputSummary.substring(0, 500) : null,
          details.outputSummary ? details.outputSummary.substring(0, 500) : null,
          details.confidence || null,
          details.sopDocumentsMatched || null,
          details.topSimilarityScore || null,
          details.safetyWarningsGenerated || 0,
          details.safetyOverrideApplied || false,
          details.processingTimeMs || null,
          details.tokensUsed || null
        ]
      );
    } catch (error) {
      console.error('[AgentLogger] Failed to write log:', error);
    }
  }

  async logVision(result: {
    objectCount: number; sceneDescription: string;
    confidence: number; processingTimeMs: number;
  }): Promise<void> {
    await this.log('vision_analysis', {
      modelUsed: 'gemini-3.5-flash',
      inputSummary: 'Photo uploaded for scene analysis',
      outputSummary: `Detected ${result.objectCount} objects. ${result.sceneDescription.substring(0, 200)}`,
      confidence: result.confidence,
      processingTimeMs: result.processingTimeMs,
    });
  }

  async logRetrieval(result: {
    chunksMatched: number; topScore: number;
    sopTitles: string[]; processingTimeMs: number;
  }): Promise<void> {
    await this.log('sop_retrieval', {
      modelUsed: 'text-embedding-004',
      inputSummary: 'RAG query from vision output',
      outputSummary: `Matched ${result.chunksMatched} chunks from: ${result.sopTitles.join(', ')}`,
      sopDocumentsMatched: result.chunksMatched,
      topSimilarityScore: result.topScore,
      processingTimeMs: result.processingTimeMs,
    });
  }

  async logSynthesis(result: {
    stepsGenerated: number; safetyWarnings: number;
    supervisorReferral: boolean; confidence: number;
    processingTimeMs: number;
  }): Promise<void> {
    await this.log('guidance_synthesis', {
      modelUsed: 'gemini-3.5-flash',
      inputSummary: 'Vision analysis + SOP matches combined for guidance',
      outputSummary: `Generated ${result.stepsGenerated} steps, ${result.safetyWarnings} safety warnings`,
      confidence: result.confidence,
      safetyWarningsGenerated: result.safetyWarnings,
      safetyOverrideApplied: result.supervisorReferral,
      processingTimeMs: result.processingTimeMs,
    });
  }

  async logScanComplete(totalProcessingMs: number): Promise<void> {
    await this.log('scan_complete', { processingTimeMs: totalProcessingMs });
  }
}

export async function getDailyActivity(pool: Pool, days: number = 30): Promise<any[]> {
  const result = await pool.query(
    `SELECT * FROM daily_ai_activity WHERE activity_date >= CURRENT_DATE - $1::interval ORDER BY activity_date DESC`,
    [`${days} days`]
  );
  return result.rows;
}

export async function getExecutionStats(pool: Pool): Promise<{
  totalScans: number; totalAIDecisions: number;
  totalSafetyWarnings: number; avgProcessingMs: number;
  uniqueUsers: number; firstActivity: string; lastActivity: string;
}> {
  const result = await pool.query(`
    SELECT COUNT(DISTINCT scan_id) as total_scans, COUNT(*) as total_ai_decisions,
      SUM(safety_warnings_generated) as total_safety_warnings,
      AVG(CASE WHEN event_type = 'scan_complete' THEN processing_time_ms END) as avg_processing_ms,
      COUNT(DISTINCT user_id) as unique_users,
      MIN(created_at) as first_activity, MAX(created_at) as last_activity
    FROM agent_execution_logs
  `);
  const row = result.rows[0];
  return {
    totalScans: parseInt(row.total_scans) || 0,
    totalAIDecisions: parseInt(row.total_ai_decisions) || 0,
    totalSafetyWarnings: parseInt(row.total_safety_warnings) || 0,
    avgProcessingMs: Math.round(parseFloat(row.avg_processing_ms) || 0),
    uniqueUsers: parseInt(row.unique_users) || 0,
    firstActivity: row.first_activity, lastActivity: row.last_activity,
  };
}
