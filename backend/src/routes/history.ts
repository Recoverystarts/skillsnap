import { Router } from 'express';
import { getPool } from '../db/pool';
import { authMiddleware } from '../services/auth';

export const historyRouter = Router();

// Get scan history for the authenticated user
historyRouter.get('/', authMiddleware, async (req: any, res) => {
  try {
    const db = getPool();
    const result = await db.query(
      `SELECT id, scene_description, objects_detected, confidence, guidance_steps,
              safety_warnings, processing_time_ms, created_at
       FROM scan_requests 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.userId]
    );
    res.json({ scans: result.rows });
  } catch (error) {
    console.error('[History] Error:', error);
    res.status(500).json({ error: 'Failed to load scan history' });
  }
});

// Get single scan details
historyRouter.get('/:scanId', authMiddleware, async (req: any, res) => {
  try {
    const db = getPool();
    const result = await db.query(
      'SELECT * FROM scan_requests WHERE id = $1 AND user_id = $2',
      [req.params.scanId, req.user.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Scan not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load scan' });
  }
});
