import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' } });
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
  }
}
