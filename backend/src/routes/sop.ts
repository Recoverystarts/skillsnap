import { Router } from 'express';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
export const sopRouter = Router();

sopRouter.post('/upload', upload.single('document'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No document provided' });
  res.json({ message: 'SOP upload - scaffold', fileName: req.file.originalname, size: req.file.size });
});

sopRouter.get('/list', async (_req, res) => {
  res.json({ documents: [], message: 'SOP list - scaffold' });
});
