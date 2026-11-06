import { IVectorStore, VectorSearchResult } from './vector.interface.js';
import { Chunk } from '../../models/Chunk.js';
import { LocalCosineVectorStore } from './local-cosine.vector.js';
import { logger } from '../../lib/logger.js';
import mongoose from 'mongoose';

export class AtlasVectorStore implements IVectorStore {
  private fallbackStore = new LocalCosineVectorStore();

  async search(
    queryVector: number[],
    filter: { collectionId?: string; documentIds?: string[] },
    topK = 30
  ): Promise<VectorSearchResult[]> {
    try {
      const filterConditions: any = {};
      if (filter.collectionId) {
        filterConditions.collectionId = new mongoose.Types.ObjectId(filter.collectionId);
      }
      if (filter.documentIds && filter.documentIds.length > 0) {
        filterConditions.documentId = {
          $in: filter.documentIds.map((id) => new mongoose.Types.ObjectId(id)),
        };
      }

      const pipeline: any[] = [
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: queryVector,
            numCandidates: topK * 10,
            limit: topK,
            filter: Object.keys(filterConditions).length > 0 ? filterConditions : undefined,
          },
        },
        {
          $project: {
            _id: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
      ];

      const results = await Chunk.aggregate(pipeline);
      return results.map((r) => ({
        chunkId: r._id.toString(),
        score: r.score ?? 0,
      }));
    } catch (err: any) {
      logger.warn({ error: err.message }, 'Atlas $vectorSearch failed, falling back to local cosine similarity');
      return this.fallbackStore.search(queryVector, filter, topK);
    }
  }
}

