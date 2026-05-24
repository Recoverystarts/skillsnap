import { Router } from 'express';
import multer from 'multer';
import { analyzeImage } from '../services/vision';
import { generateGuidance } from '../services/gemini';
import { searchSOPs } from '../services/rag';
import { getPool } from '../db/pool';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
export const scanRouter = Router();

scanRouter.post('/', upload.single('image'), async (req: any, res) => {
  try {
    const startTime = Date.now();
    const companyId = req.headers['x-company-id'] || req.user?.companyId;
    const userId = req.user?.userId;
    
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    // Three-tier AI pipeline
    const visionResult = await analyzeImage(req.file.buffer);
    const sopMatches = await searchSOPs(companyId, visionResult.sceneDescription);
    const guidance = await generateGuidance(visionResult, sopMatches);
    
    const processingTimeMs = Date.now() - startTime;
    const result = {
      ...guidance,
      processingTimeMs,
      visionSummary: visionResult.sceneDescription,
      objectsDetected: visionResult.objects.length,
    };

    // Save to database (fire-and-forget)
    if (userId) {
      const db = getPool();
      db.query(
        `INSERT INTO scan_requests (user_id, company_id, scene_description, objects_detected, 
         confidence, guidance_steps, safety_warnings, processing_time_ms)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, companyId, visionResult.sceneDescription, visionResult.objects.length,
         result.confidence, JSON.stringify(result.steps), JSON.stringify(result.safetyWarnings),
         processingTimeMs]
      ).catch(err => console.error('[Scan] Failed to save scan:', err));
    }

    res.json(result);
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Failed to process scan' });
  }
});
