import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../lib/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function issueTokens(userId: string, res: Response): void {
  const accessToken = jwt.sign({ userId }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh',
  });
}

router.post('/register', async (req: Request, res: Response) => {
  const body = RegisterSchema.parse(req.body);

  const existing = await User.findOne({ email: body.email });
  if (existing) throw new AppError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await User.create({ email: body.email, passwordHash, name: body.name });

  issueTokens(user._id.toString(), res);
  res.status(201).json({ user: { id: user._id, email: user.email, name: user.name } });
});

router.post('/login', async (req: Request, res: Response) => {
  const body = LoginSchema.parse(req.body);

  const user = await User.findOne({ email: body.email });
  if (!user) throw new AppError(401, 'Invalid credentials');

  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Invalid credentials');

  issueTokens(user._id.toString(), res);
  res.json({ user: { id: user._id, email: user.email, name: user.name } });
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  res.json({ ok: true });
});

router.post('/refresh', async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken as string | undefined;
  if (!token) throw new AppError(401, 'No refresh token');

  let payload: { userId: string };
  try {
    payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
  } catch {
    throw new AppError(401, 'Refresh token invalid or expired');
  }

  const user = await User.findById(payload.userId);
  if (!user) throw new AppError(401, 'User not found');

  issueTokens(user._id.toString(), res);
  res.json({ user: { id: user._id, email: user.email, name: user.name } });
});

router.get('/me', async (req: Request, res: Response) => {
  const token = req.cookies?.accessToken as string | undefined;
  if (!token) {
    return res.json({ user: null });
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string };
    const user = await User.findById(payload.userId).select('-passwordHash');
    if (!user) {
      return res.json({ user: null });
    }
    return res.json({ user: { id: user._id, email: user.email, name: user.name } });
  } catch (_err) {
    return res.json({ user: null });
  }
});

export default router;
