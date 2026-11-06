import { PreparedChunk } from './stage5-chunk.js';
import { getEmbedProvider } from '../providers/embeddings/index.js';
import { Chunk } from '../models/Chunk.js';
import { DocumentModel } from '../models/Document.js';
import { logger } from '../lib/logger.js';
import mongoose from 'mongoose';

export async function stage6EmbedAndIndex(
  documentId: string,
  preparedChunks: PreparedChunk[]
): Promise<void> {
  logger.info({ documentId, chunksCount: preparedChunks.length }, 'Stage 6: Batch embedding and atomic indexing');
  const embedder = getEmbedProvider();

  const batchSize = 16;
  const chunkDocsToInsert: any[] = [];

  for (let i = 0; i < preparedChunks.length; i += batchSize) {
    const batch = preparedChunks.slice(i, i + batchSize);
    const textsToEmbed = batch.map((c) => c.text);

    let embeddings: number[][];
    try {
      embeddings = await embedder.embed(textsToEmbed);
    } catch (err: any) {
      logger.error({ error: err.message, batchIndex: i }, 'Embedding failed in stage 6');
      throw err;
    }

    for (let j = 0; j < batch.length; j++) {
      const c = batch[j];
      chunkDocsToInsert.push({
        documentId: new mongoose.Types.ObjectId(c.documentId),
        collectionId: new mongoose.Types.ObjectId(c.collectionId),
        page: c.page,
        endPage: c.endPage,
        elementType: c.elementType,
        headingPath: c.headingPath,
        text: c.text,
        rawText: c.rawText,
        rawStructured: c.rawStructured,
        bbox: c.bbox,
        pageImageRef: c.pageImageRef,
        tokenCount: c.tokenCount,
        embedding: embeddings[j] || [],
      });
    }
  }

  // Atomic replacement: Delete old chunks for this document first
  await Chunk.deleteMany({ documentId: new mongoose.Types.ObjectId(documentId) });

  if (chunkDocsToInsert.length > 0) {
    await Chunk.insertMany(chunkDocsToInsert);
  }

  // Ensure text search indexes exist on collection
  try {
    await Chunk.collection.createIndex({ text: 'text' });
  } catch (_e) {
    // Index may already exist
  }

  logger.info({ documentId, indexedCount: chunkDocsToInsert.length }, 'Stage 6 complete: Indexed successfully');
}

