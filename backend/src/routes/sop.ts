import { Router } from 'express';
import multer from 'multer';
import { processSOPUpload, listSOPDocuments, deleteSOPDocument, getSOPStats } from '../services/sop';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/csv',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Supported: PDF, TXT, DOCX, MD, CSV`));
    }
  },
});

export const sopRouter = Router();

/**
 * POST /api/sop/upload
 * Upload and process an SOP document
 */
sopRouter.post('/upload', upload.single('document'), async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    if (!companyId) return res.status(400).json({ error: 'x-company-id header required' });
    if (!req.file) return res.status(400).json({ error: 'No document provided' });

    console.log(`[SOP] Upload: ${req.file.originalname} for company ${companyId}`);

    const result = await processSOPUpload(
      companyId,
      req.file.originalname,
      req.file.buffer,
      req.file.mimetype,
      req.headers['x-user-id'] as string,
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[SOP] Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to process document' });
  }
});

/**
 * GET /api/sop/list
 * List all SOP documents for a company
 */
sopRouter.get('/list', async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    if (!companyId) return res.status(400).json({ error: 'x-company-id header required' });

    const documents = await listSOPDocuments(companyId);
    res.json({ documents });
  } catch (error: any) {
    console.error('[SOP] List error:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

/**
 * GET /api/sop/stats
 * Get SOP statistics for a company
 */
sopRouter.get('/stats', async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    if (!companyId) return res.status(400).json({ error: 'x-company-id header required' });

    const stats = await getSOPStats(companyId);
    res.json(stats);
  } catch (error: any) {
    console.error('[SOP] Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

/**
 * DELETE /api/sop/:documentId
 * Delete an SOP document and its chunks
 */
sopRouter.delete('/:documentId', async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    if (!companyId) return res.status(400).json({ error: 'x-company-id header required' });

    const deleted = await deleteSOPDocument(req.params.documentId, companyId);
    if (!deleted) return res.status(404).json({ error: 'Document not found' });

    res.json({ success: true, message: 'Document and chunks deleted' });
  } catch (error: any) {
    console.error('[SOP] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});
