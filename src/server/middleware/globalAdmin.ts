import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const GLOBAL_ADMIN_EMAIL = process.env.GLOBAL_ADMIN_EMAIL || 'global@asc.com';
const GLOBAL_ADMIN_PASSWORD = process.env.GLOBAL_ADMIN_PASSWORD || 'change-me';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export interface GlobalAdminRequest extends Request {
  globalAdmin?: { email: string };
}

export const issueGlobalAdminToken = (email: string): string => {
  return jwt.sign({ email, global: true }, JWT_SECRET, { expiresIn: '12h', audience: 'global-admin' });
};

export const authenticateGlobalAdmin = (req: GlobalAdminRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Access token required' });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded?.global) return res.status(403).json({ success: false, message: 'Global admin only' });
    req.globalAdmin = { email: decoded.email };
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export const verifyGlobalAdminCredentials = (email: string, password: string): boolean => {
  return email === GLOBAL_ADMIN_EMAIL && password === GLOBAL_ADMIN_PASSWORD;
};


