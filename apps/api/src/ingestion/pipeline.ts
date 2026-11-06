import { DocumentModel } from '../models/Document.js';
import { getStorage } from '../storage/index.js';
import { stage1RenderPages } from './stage1-render.js';
import { stage2NativeExtraction } from './stage2-native.js';
import { stage3VisionPageUnderstanding } from './stage3-vision.js';
import { stage4CrossPageStitch } from './stage4-stitch.js';
import { stage5SemanticChunking } from './stage5-chunk.js';
import { stage6EmbedAndIndex } from './stage6-index.js';
import { logger } from '../lib/logger.js';
import mongoose from 'mongoose';

export async function processDocumentIngestion(documentId: string): Promise<void> {
  const doc = await DocumentModel.findById(documentId);
  if (!doc) {
    logger.error({ documentId }, 'Cannot ingest: Document not found in database');
    return;
  }

  logger.info({ documentId, filename: doc.originalName }, 'Starting complete ingestion pipeline');
  const storage = getStorage();

  try {
    // Read PDF buffer
    let pdfBuffer: Buffer;
    pdfBuffer = await storage.getFile(doc.storageKey);

    // Stage 1: Render pages
    await DocumentModel.findByIdAndUpdate(documentId, { status: 'rendering' });
    const renderedPages = await stage1RenderPages(documentId, pdfBuffer);

    await DocumentModel.findByIdAndUpdate(documentId, {
      pageCount: renderedPages.length,
      status: 'parsing',
    });

    // Stage 2: Native text extraction
    const nativePages = await stage2NativeExtraction(documentId, pdfBuffer);

    // Stage 3: Vision page understanding
    const visionPages = await stage3VisionPageUnderstanding(documentId, renderedPages, nativePages);

    // Stage 4: Cross-page stitching
    const stitched = stage4CrossPageStitch(documentId, visionPages);

    // Stage 5: Semantic chunking
    await DocumentModel.findByIdAndUpdate(documentId, { status: 'embedding' });
    const preparedChunks = stage5SemanticChunking(
      documentId,
      doc.collectionId.toString(),
      doc.originalName,
      stitched
    );

    // Stage 6: Embedding & indexing
    await stage6EmbedAndIndex(documentId, preparedChunks);

    // Finalize status
    await DocumentModel.findByIdAndUpdate(documentId, {
      status: 'ready',
      error: undefined,
    });

    logger.info({ documentId, chunks: preparedChunks.length }, 'Ingestion pipeline completed successfully: Document READY');
  } catch (err: any) {
    logger.error({ documentId, error: err.message, stack: err.stack }, 'Ingestion pipeline failed');
    await DocumentModel.findByIdAndUpdate(documentId, {
      status: 'failed',
      error: err.message || 'Ingestion failed',
    });
    throw err;
  }
}

