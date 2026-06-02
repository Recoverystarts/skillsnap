import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '../db/pool';

const JWT_SECRET = process.env.JWT_SECRET || 'skillsnap-xprize-2026-jwt-secret';
const JWT_EXPIRY = '7d';

interface User {
  id: string;
  email: string;
  name: string;
  company_id: string;
  role: string;
}

export async function registerUser(email: string, password: string, name: string, companyId?: string): Promise<{ user: User; token: string }> {
  const db = getPool();
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) throw new Error('Email already registered');
  
  const passwordHash = await bcrypt.hash(password, 12);
  
  // If no company provided, create a personal company
  let resolvedCompanyId = companyId;
  if (!resolvedCompanyId) {
    const companyResult = await db.query(
      `INSERT INTO companies (name, industry) VALUES ($1, 'General') RETURNING id`,
      [`${name}'s Company`]
    );
    resolvedCompanyId = companyResult.rows[0].id;
  }
  
  const result = await db.query(
    `INSERT INTO users (email, password_hash, name, company_id, role) 
     VALUES ($1, $2, $3, $4, 'admin') 
     RETURNING id, email, name, company_id, role`,
    [email, passwordHash, name, resolvedCompanyId]
  );
  
  const user = result.rows[0];
  const token = jwt.sign(
    { userId: user.id, companyId: user.company_id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
  
  return { user, token };
}

export async function loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
  const db = getPool();
  const result = await db.query(
    'SELECT id, email, name, company_id, role, password_hash FROM users WHERE email = $1',
    [email]
  );
  
  if (result.rows.length === 0) throw new Error('Invalid email or password');
  
  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('Invalid email or password');
  
  const token = jwt.sign(
    { userId: user.id, companyId: user.company_id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
  
  return {
    user: { id: user.id, email: user.email, name: user.name, company_id: user.company_id, role: user.role },
    token,
  };
}

export async function demoLogin(): Promise<{ user: User; token: string }> {
  const db = getPool();

  let result = await db.query(
    'SELECT id, email, name, company_id, role FROM users WHERE email = $1',
    ['demo@skillsnap.dev']
  );

  let user;
  if (result.rows.length === 0) {
    let companyResult = await db.query(
      `SELECT id FROM companies WHERE name = 'SkillSnap Demo Company'`
    );
    let companyId: string;
    if (companyResult.rows.length === 0) {
      companyResult = await db.query(
        `INSERT INTO companies (name, industry) VALUES ('SkillSnap Demo Company', 'Construction') RETURNING id`
      );
    }
    companyId = companyResult.rows[0].id;

    const passwordHash = await bcrypt.hash('demo-not-for-login-xprize', 10);
    const insertResult = await db.query(
      `INSERT INTO users (email, password_hash, name, company_id, role)
       VALUES ($1, $2, 'Demo User', $3, 'admin')
       RETURNING id, email, name, company_id, role`,
      ['demo@skillsnap.dev', passwordHash, companyId]
    );
    user = insertResult.rows[0];
  } else {
    user = result.rows[0];
  }

  const token = jwt.sign(
    { userId: user.id, companyId: user.company_id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  return { user, token };
}

export function verifyToken(token: string): { userId: string; companyId: string; role: string } {
  return jwt.verify(token, JWT_SECRET) as any;
}

export function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = verifyToken(authHeader.slice(7));
    req.user = decoded;
    if (!req.headers['x-company-id']) {
      req.headers['x-company-id'] = decoded.companyId;
    }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
