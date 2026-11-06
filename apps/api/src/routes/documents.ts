import { Router, Request, Response } from 'express';
import { DocumentModel } from '../models/Document.js';
import { Chunk } from '../models/Chunk.js';
import { Page } from '../models/Page.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getStorage } from '../storage/index.js';
import { getIngestionQueue } from '../queue/index.js';
import { logger } from '../lib/logger.js';
import fs from 'fs';

const router = Router();
router.use(requireAuth);

router.get('/:id', async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const doc = await DocumentModel.findOne({ _id: req.params.id, userId });
  if (!doc) throw new AppError(404, 'Document not found');
  res.json({ document: doc });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const doc = await DocumentModel.findOneAndDelete({ _id: req.params.id, userId });
  if (!doc) throw new AppError(404, 'Document not found');

  // Also delete chunks and pages
  await Chunk.deleteMany({ documentId: doc._id });
  await Page.deleteMany({ documentId: doc._id });

  // Delete physical storage file if present
  try {
    const storage = getStorage();
    await storage.deleteFile(doc.filename);
  } catch (err: any) {
    logger.warn({ error: err.message }, 'Could not delete storage file');
  }

  res.json({ ok: true });
});

// Reprocess document
router.post('/:id/reprocess', async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const doc = await DocumentModel.findOne({ _id: req.params.id, userId });
  if (!doc) throw new AppError(404, 'Document not found');

  doc.status = 'queued';
  doc.error = undefined;
  await doc.save();

  const queue = getIngestionQueue();
  const jobId = await queue.addJob({
    documentId: doc._id.toString(),
    collectionId: doc.collectionId.toString(),
    userId,
    storageKey: doc.storageKey,
  });

  doc.ingestionJobId = jobId;
  await doc.save();

  res.json({ ok: true, document: doc });
});

// Stream original PDF file for react-pdf viewer
router.get('/:id/file', async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const doc = await DocumentModel.findOne({ _id: req.params.id, userId });
  if (!doc) throw new AppError(404, 'Document not found');

  const storage = getStorage();
  try {
    const buffer = await storage.getFile(doc.storageKey);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);
    res.send(buffer);
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed to serve PDF file');
    throw new AppError(404, 'File not found on storage');
  }
});

// Serve rendered page image
router.get('/:id/pages/:n/image', async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const doc = await DocumentModel.findOne({ _id: req.params.id, userId });
  if (!doc) throw new AppError(404, 'Document not found');

  const pageNum = parseInt(req.params.n, 10);
  const imageKey = `pages/${doc._id}/page-${pageNum}.png`;

  const storage = getStorage();
  try {
    const buffer = await storage.getFile(imageKey);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (err: any) {
    throw new AppError(404, `Page ${pageNum} image not found`);
  }
});

// SSE status stream
router.get('/:id/status', async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const doc = await DocumentModel.findOne({ _id: req.params.id, userId });
  if (!doc) throw new AppError(404, 'Document not found');

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: unknown) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Immediate send
  send({ status: doc.status, pageCount: doc.pageCount, error: doc.error });
  if (doc.status === 'ready' || doc.status === 'failed') {
    res.end();
    return;
  }

  // Poll for status updates
  const interval = setInterval(async () => {
    const updated = await DocumentModel.findById(req.params.id);
    if (!updated) {
      clearInterval(interval);
      res.end();
      return;
    }
    send({ status: updated.status, pageCount: updated.pageCount, error: updated.error });
    if (updated.status === 'ready' || updated.status === 'failed') {
      clearInterval(interval);
      res.end();
    }
  }, 1000);

  req.on('close', () => clearInterval(interval));
});

// Get parsed elements (chunks) for inspection
router.get('/:id/elements', async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const doc = await DocumentModel.findOne({ _id: req.params.id, userId });
  if (!doc) throw new AppError(404, 'Document not found');

  const page = parseInt(req.query.page as string) || undefined;
  const query: Record<string, unknown> = { documentId: doc._id };
  if (page) query.page = page;

  const chunks = await Chunk.find(query).select('-embedding').sort({ page: 1 });
  res.json({ elements: chunks });
});

export default router;
