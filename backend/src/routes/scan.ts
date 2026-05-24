import { Router } from 'express';
import multer from 'multer';
import { analyzeImage } from '../services/vision';
import { generateGuidance } from '../services/gemini';
import { searchSOPs } from '../services/rag';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
export const scanRouter = Router();

scanRouter.post('/', upload.single('image'), async (req, res) => {
  try {
    const startTime = Date.now();
    const companyId = req.headers['x-company-id'] as string;
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    const visionResult = await analyzeImage(req.file.buffer);
    const sopMatches = await searchSOPs(companyId, visionResult.sceneDescription);
    const guidance = await generateGuidance(visionResult, sopMatches);

    res.json({
      ...guidance,
      processingTimeMs: Date.now() - startTime,
      visionSummary: visionResult.sceneDescription,
      objectsDetected: visionResult.objects.length,
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Failed to process scan' });
  }
});
