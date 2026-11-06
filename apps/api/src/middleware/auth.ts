import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env.js';
import { AppError } from './errorHandler.js';

export interface AuthRequest extends Request {
  userId: string;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.accessToken as string | undefined;
  if (!token) throw new AppError(401, 'Not authenticated');
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string };
    (req as AuthRequest).userId = payload.userId;
    next();
  } catch {
    throw new AppError(401, 'Token invalid or expired');
  }
}
