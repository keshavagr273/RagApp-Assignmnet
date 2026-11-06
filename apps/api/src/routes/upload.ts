import { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { DocumentModel } from '../models/Document.js';
import { Collection } from '../models/Collection.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';
import { getIngestionQueue } from '../queue/index.js';

const router = Router();
router.use(requireAuth);

// Ensure upload dir exists
fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Only PDF files are accepted'));
    }
  },
});

router.post(
  '/:id/documents',
  upload.array('files', 20),
  async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).userId;
    const collection = await Collection.findOne({ _id: req.params.id, userId });
    if (!collection) throw new AppError(404, 'Collection not found');

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) throw new AppError(400, 'No files uploaded');

    const documents = [];
    const queue = getIngestionQueue();

    for (const file of files) {
      // Compute SHA-256
      const fileBuffer = fs.readFileSync(file.path);
      const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Magic byte check for PDF (%PDF-)
      if (fileBuffer.slice(0, 5).toString('ascii') !== '%PDF-') {
        fs.unlinkSync(file.path);
        throw new AppError(400, `File ${file.originalname} is not a valid PDF`);
      }

      // Check for duplicate
      const existing = await DocumentModel.findOne({ userId, sha256 });
      if (existing) {
        fs.unlinkSync(file.path);
        logger.info(
          { sha256, originalName: file.originalname },
          'Duplicate document, skipping',
        );
        documents.push({ ...existing.toObject(), duplicate: true });
        continue;
      }

      const doc = await DocumentModel.create({
        userId,
        collectionId: collection._id,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        sha256,
        storageKey: file.path,
        status: 'queued',
      });

      // Add to collection
      collection.documentIds.push(doc._id as unknown as import('mongoose').Types.ObjectId);
      await collection.save();

      // Enqueue background ingestion job
      const jobId = await queue.addJob({
        documentId: doc._id.toString(),
        collectionId: collection._id.toString(),
        userId: userId,
        storageKey: file.path,
      });

      doc.ingestionJobId = jobId;
      await doc.save();

      logger.info({ documentId: doc._id, jobId }, 'Document queued for ingestion');
      documents.push(doc.toObject());
    }

    res.status(201).json({ documents });
  },
);

export default router;
