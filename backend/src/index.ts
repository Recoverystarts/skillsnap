import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { scanRouter } from './routes/scan';
import { sopRouter } from './routes/sop';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'skillsnap-api', version: '0.1.0' });
});

app.use('/api/scan', scanRouter);
app.use('/api/sop', sopRouter);

app.listen(PORT, () => {
  console.log(`SkillSnap API running on port ${PORT}`);
});
