import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { scanRouter } from './routes/scan';
import { sopRouter } from './routes/sop';
import { healthCheck } from './db/pool';
import { runMigrations } from './db/migrate';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check with database status
app.get('/health', async (_req, res) => {
  const dbHealthy = await healthCheck();
  res.json({
    status: dbHealthy ? 'ok' : 'degraded',
    service: 'skillsnap-api',
    version: '0.2.0',
    database: dbHealthy ? 'connected' : 'unavailable',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/scan', scanRouter);
app.use('/api/sop', sopRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  // Run database migrations if database is configured
  if (process.env.DATABASE_URL || process.env.CLOUD_SQL_CONNECTION_NAME) {
    try {
      await runMigrations();
      console.log('[Server] Database ready');
    } catch (err) {
      console.error('[Server] Database migration failed — running without database:', err);
    }
  } else {
    console.log('[Server] No database configured — running in degraded mode (no SOP storage/search)');
  }

  app.listen(PORT, () => {
    console.log(`SkillSnap API v0.2.0 running on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
  });
}

start();
