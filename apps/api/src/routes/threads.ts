import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Thread } from '../models/Thread.js';
import { Message } from '../models/Message.js';
import { Collection } from '../models/Collection.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { streamAnswer } from '../rag/answering.service.js';
import { logger } from '../lib/logger.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const { collectionId } = req.query;
  const q: Record<string, unknown> = { userId };
  if (collectionId) q.collectionId = collectionId;
  const threads = await Thread.find(q).sort({ updatedAt: -1 });
  res.json({ threads });
});

router.post('/', async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const body = z
    .object({
      collectionId: z.string(),
      documentIds: z.array(z.string()).optional(),
      title: z.string().optional(),
    })
    .parse(req.body);
  const collection = await Collection.findOne({ _id: body.collectionId, userId });
  if (!collection) throw new AppError(404, 'Collection not found');
  const thread = await Thread.create({ userId, ...body, title: body.title ?? 'New Thread' });
  res.status(201).json({ thread });
});

router.get('/:id', async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const thread = await Thread.findOne({ _id: req.params.id, userId });
  if (!thread) throw new AppError(404, 'Thread not found');
  res.json({ thread });
});

router.get('/:id/messages', async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const thread = await Thread.findOne({ _id: req.params.id, userId });
  if (!thread) throw new AppError(404, 'Thread not found');
  const messages = await Message.find({ threadId: thread._id }).sort({ createdAt: 1 });
  res.json({ messages });
});

// POST /api/threads/:id/messages (SSE Streamed answer)
router.post('/:id/messages', async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const thread = await Thread.findOne({ _id: req.params.id, userId });
  if (!thread) throw new AppError(404, 'Thread not found');

  const body = z.object({ content: z.string().min(1) }).parse(req.body);

  // Save user message
  await Message.create({ threadId: thread._id, role: 'user', content: body.content });

  // Update thread title if first message
  if (thread.title === 'New Thread') {
    thread.title = body.content.slice(0, 50);
    await thread.save();
  }

  // Retrieve prior messages for conversation history
  const previousMessages = await Message.find({ threadId: thread._id })
    .sort({ createdAt: 1 })
    .limit(10)
    .lean();

  const conversationHistory = previousMessages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const filter = {
    collectionId: thread.collectionId.toString(),
    documentIds: thread.documentIds?.map((d) => d.toString()),
  };

  try {
    let finalAnswerData: any = null;

    for await (const evt of streamAnswer(body.content, filter, conversationHistory)) {
      send(evt.event, evt.data);
      if (evt.event === 'done') {
        finalAnswerData = evt.data;
      }
    }

    if (finalAnswerData) {
      // Save assistant message in database
      const assistantMessage = await Message.create({
        threadId: thread._id,
        role: 'assistant',
        content: finalAnswerData.answer_markdown,
        citations: finalAnswerData.citations,
        tables: finalAnswerData.tables,
        charts: finalAnswerData.charts,
        confidence: finalAnswerData.confidence,
        followups: finalAnswerData.followups,
        latencyMs: finalAnswerData.durationMs,
      });

      send('saved', { messageId: assistantMessage._id });
    }
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed during SSE message streaming');
    send('error', { error: err.message });
  } finally {
    res.end();
  }
});

export default router;
