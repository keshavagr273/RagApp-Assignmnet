import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { connectDB, disconnectDB } from '../src/lib/db.js';
import { User } from '../src/models/User.js';
import { Collection } from '../src/models/Collection.js';
import { DocumentModel } from '../src/models/Document.js';
import { Chunk } from '../src/models/Chunk.js';
import { getStorage } from '../src/storage/index.js';
import { processDocumentIngestion } from '../src/ingestion/pipeline.js';
import { generateCompleteAnswer } from '../src/rag/answering.service.js';

describe('Integration Test: Upload → 6-Stage Ingest → RAG Ask', () => {
  let userId: string;
  let collectionId: string;
  let documentId: string;

  beforeAll(async () => {
    await connectDB();

    const user = await User.create({
      email: `test-runner-${Date.now()}@folioq.internal`,
      name: 'Integration Test Runner',
      passwordHash: 'dummy',
    });
    userId = user._id.toString();

    const collection = await Collection.create({
      userId: user._id,
      name: 'Integration Test Collection',
    });
    collectionId = collection._id.toString();
  }, 30000);

  afterAll(async () => {
    if (documentId) {
      await Chunk.deleteMany({ documentId });
      await DocumentModel.findByIdAndDelete(documentId);
    }
    if (collectionId) {
      await Collection.findByIdAndDelete(collectionId);
    }
    if (userId) {
      await User.findByIdAndDelete(userId);
    }
    await disconnectDB();
  });

  it('should ingest financial PDF through all 6 stages and answer grounded queries', async () => {
    let pdfPath = path.resolve(process.cwd(), 'eval', 'financial-q3.pdf');
    if (!fs.existsSync(pdfPath)) {
      pdfPath = path.resolve(process.cwd(), '../../eval', 'financial-q3.pdf');
    }
    expect(fs.existsSync(pdfPath)).toBe(true);

    const fileBuffer = fs.readFileSync(pdfPath);
    const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const storageKey = `integration-${Date.now()}.pdf`;

    const storage = getStorage();
    await storage.uploadFile(storageKey, fileBuffer, 'application/pdf');

    const doc = await DocumentModel.create({
      userId,
      collectionId,
      filename: storageKey,
      originalName: 'financial-q3.pdf',
      mimeType: 'application/pdf',
      sizeBytes: fileBuffer.length,
      sha256,
      storageKey,
      status: 'queued',
    });
    documentId = doc._id.toString();

    // Run complete ingestion pipeline
    await processDocumentIngestion(documentId);

    // Verify document status is ready
    const updatedDoc = await DocumentModel.findById(documentId);
    expect(updatedDoc?.status).toBe('ready');
    expect(updatedDoc?.pageCount).toBe(1);

    // Verify chunks were created with embeddings
    const chunks = await Chunk.find({ documentId });
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].embedding?.length).toBeGreaterThan(0);

    // Run RAG Ask
    const question = 'What was the Total Revenue in Q3 FY2024?';
    const answer = await generateCompleteAnswer(question, { collectionId });

    expect(answer.answer_markdown).toBeTruthy();
    expect(answer.answer_markdown.toLowerCase()).toContain('370.9');
    expect(answer.citations.length).toBeGreaterThan(0);
    expect(answer.citations[0].page).toBe(1);
    expect(answer.confidence).toBe('high');
  }, 45000);
});
