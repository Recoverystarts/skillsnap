import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { scanRouter } from './routes/scan';
import { sopRouter } from './routes/sop';
import { authRouter } from './routes/auth';
import { historyRouter } from './routes/history';
import { statsRouter } from './routes/stats';
import { healthCheck } from './db/pool';
import { runMigrations } from './db/migrate';
import { authMiddleware } from './services/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', async (_req, res) => {
  const dbHealthy = await healthCheck();
  res.json({
    status: dbHealthy ? 'ok' : 'degraded',
    service: 'skillsnap-api',
    version: '0.5.0',
    database: dbHealthy ? 'connected' : 'unavailable',
    timestamp: new Date().toISOString(),
  });
});

// Public routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/scan', authMiddleware, scanRouter);
app.use('/api/sop', authMiddleware, sopRouter);
app.use('/api/history', historyRouter);
app.use('/api/stats', authMiddleware, statsRouter);

// 404
app.use((_req, res) => { res.status(404).json({ error: 'Not found' }); });

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  if (process.env.DATABASE_URL || process.env.CLOUD_SQL_CONNECTION_NAME) {
    try {
      await runMigrations();
      console.log('[Server] Database ready');
    } catch (err) {
      console.error('[Server] Database migration failed:', err);
    }
  }
  app.listen(PORT, () => {
    console.log(`SkillSnap API v0.5.0 running on port ${PORT}`);
  });
}

start();
