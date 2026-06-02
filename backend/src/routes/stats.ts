import { Router } from 'express';
import { getPool } from '../db/pool';
import { getExecutionStats, getDailyActivity } from '../services/agent-logger';

export const statsRouter = Router();

/**
 * GET /api/stats/execution
 * Returns aggregate agent-execution stats + last 30 days of daily activity.
 * Used as XPRIZE submission product-evidence dashboard.
 */
statsRouter.get('/execution', async (_req, res) => {
  try {
    const pool = getPool();
    const [executionStats, dailyActivity] = await Promise.all([
      getExecutionStats(pool),
      getDailyActivity(pool, 30),
    ]);
    res.json({ executionStats, dailyActivity });
  } catch (error) {
    console.error('[Stats] Failed to fetch execution stats:', error);
    res.status(500).json({ error: 'Failed to fetch execution stats' });
  }
});
