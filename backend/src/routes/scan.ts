import { Router } from 'express';
import multer from 'multer';
import { analyzeImage } from '../services/vision';
import { generateGuidance } from '../services/gemini';
import { searchSOPs } from '../services/rag';
import { getPool } from '../db/pool';
import { AgentLogger } from '../services/agent-logger';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
export const scanRouter = Router();

scanRouter.post('/', upload.single('image'), async (req: any, res) => {
  try {
    const startTime = Date.now();
    const companyId = req.headers['x-company-id'] || req.user?.companyId;
    const userId = req.user?.userId;

    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    // Create the scan record up front so we have a scan_id to attach logs to.
    // If insert fails the pipeline still runs — logging just becomes a no-op.
    const db = getPool();
    let scanId: string | null = null;
    let logger: AgentLogger | null = null;
    if (userId && companyId) {
      try {
        const ins = await db.query(
          `INSERT INTO scan_requests (user_id, company_id, scene_description, objects_detected,
             confidence, guidance_steps, safety_warnings, processing_time_ms)
           VALUES ($1, $2, '', 0, 0, '[]'::jsonb, '[]'::jsonb, 0)
           RETURNING id`,
          [userId, companyId]
        );
        scanId = ins.rows[0].id;
        if (scanId) logger = new AgentLogger(db, companyId, userId, scanId);
      } catch (err) {
        console.error('[Scan] Failed to create scan record:', err);
      }
    }

    // ── Tier 1 — Vision ───────────────────────────────────────────
    const visionStart = Date.now();
    const visionResult = await analyzeImage(req.file.buffer);
    const visionMs = Date.now() - visionStart;
    logger?.logVision({
      objectCount: visionResult.objects.length,
      sceneDescription: visionResult.sceneDescription,
      confidence: visionResult.confidence,
      processingTimeMs: visionMs,
    }).catch(() => {});

    // ── Tier 2 — SOP retrieval ────────────────────────────────────
    const ragStart = Date.now();
    const sopMatches = await searchSOPs(companyId, visionResult.sceneDescription);
    const ragMs = Date.now() - ragStart;
    // rag.ts attaches `documentTitle` and `relevanceScore` as extras on each chunk
    // (cast through any since SOPChunk doesn't declare them).
    const sopTitles = Array.from(new Set(sopMatches.map((m: any) => m.documentTitle || 'Unknown')));
    const topScore = sopMatches.length > 0 ? ((sopMatches[0] as any).relevanceScore || 0) : 0;
    logger?.logRetrieval({
      chunksMatched: sopMatches.length,
      topScore,
      sopTitles,
      processingTimeMs: ragMs,
    }).catch(() => {});

    // ── Tier 3 — Synthesis ────────────────────────────────────────
    const synthStart = Date.now();
    const guidance = await generateGuidance(visionResult, sopMatches);
    const synthMs = Date.now() - synthStart;
    const supervisorReferral = (guidance.safetyWarnings || []).some(
      (w: any) => typeof w === 'string' && /supervisor/i.test(w)
    );
    logger?.logSynthesis({
      stepsGenerated: guidance.steps?.length || 0,
      safetyWarnings: guidance.safetyWarnings?.length || 0,
      supervisorReferral,
      confidence: guidance.confidence || 0,
      processingTimeMs: synthMs,
    }).catch(() => {});

    const processingTimeMs = Date.now() - startTime;
    const result = {
      ...guidance,
      processingTimeMs,
      visionSummary: visionResult.sceneDescription,
      objectsDetected: visionResult.objects.length,
    };

    // Update the scan record with final pipeline output.
    if (scanId) {
      db.query(
        `UPDATE scan_requests SET
           scene_description = $1,
           objects_detected = $2,
           confidence = $3,
           guidance_steps = $4,
           safety_warnings = $5,
           processing_time_ms = $6
         WHERE id = $7`,
        [
          visionResult.sceneDescription,
          visionResult.objects.length,
          result.confidence,
          JSON.stringify(result.steps),
          JSON.stringify(result.safetyWarnings),
          processingTimeMs,
          scanId,
        ]
      ).catch(err => console.error('[Scan] Failed to update scan:', err));
    }

    logger?.logScanComplete(processingTimeMs).catch(() => {});

    res.json(result);
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Failed to process scan' });
  }
});
