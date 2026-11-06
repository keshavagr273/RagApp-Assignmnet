import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Collection } from '../models/Collection.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
router.use(requireAuth);

const CreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

router.get('/', async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const cols = await Collection.find({ userId }).sort({ updatedAt: -1 });
  res.json({ collections: cols });
});

router.post('/', async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const body = CreateSchema.parse(req.body);
  const col = await Collection.create({ userId, ...body });
  res.status(201).json({ collection: col });
});

router.get('/:id', async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const col = await Collection.findOne({ _id: req.params.id, userId });
  if (!col) throw new AppError(404, 'Collection not found');
  res.json({ collection: col });
});

router.patch('/:id', async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const body = CreateSchema.partial().parse(req.body);
  const col = await Collection.findOneAndUpdate(
    { _id: req.params.id, userId },
    { $set: body },
    { new: true },
  );
  if (!col) throw new AppError(404, 'Collection not found');
  res.json({ collection: col });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const col = await Collection.findOneAndDelete({ _id: req.params.id, userId });
  if (!col) throw new AppError(404, 'Collection not found');
  res.json({ ok: true });
});

export default router;
