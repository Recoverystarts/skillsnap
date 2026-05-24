import { Router } from 'express';
import { registerUser, loginUser } from '../services/auth';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, name, companyId } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    const result = await registerUser(email, password, name, companyId || null);
    res.json(result);
  } catch (error: any) {
    const status = error.message === 'Email already registered' ? 409 : 500;
    res.status(status).json({ error: error.message });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await loginUser(email, password);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});
