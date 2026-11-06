import { IVectorStore, VectorSearchResult } from './vector.interface.js';
import { Chunk } from '../../models/Chunk.js';
import mongoose from 'mongoose';

export class LocalCosineVectorStore implements IVectorStore {
  async search(
    queryVector: number[],
    filter: { collectionId?: string; documentIds?: string[] },
    topK = 30
  ): Promise<VectorSearchResult[]> {
    const query: Record<string, any> = {
      embedding: { $exists: true, $ne: [] },
    };

    if (filter.collectionId) {
      query.collectionId = new mongoose.Types.ObjectId(filter.collectionId);
    }
    if (filter.documentIds && filter.documentIds.length > 0) {
      query.documentId = { $in: filter.documentIds.map((id) => new mongoose.Types.ObjectId(id)) };
    }

    // Retrieve candidate chunks with embeddings
    const chunks = await Chunk.find(query).select('_id embedding').lean();
    if (!chunks || chunks.length === 0) return [];

    const scored: VectorSearchResult[] = [];

    for (const chunk of chunks) {
      if (!chunk.embedding || chunk.embedding.length === 0) continue;
      const score = this.cosineSimilarity(queryVector, chunk.embedding);
      scored.push({
        chunkId: chunk._id.toString(),
        score,
      });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const len = Math.min(a.length, b.length);
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < len; i++) {
      const valA = a[i];
      const valB = b[i];
      dot += valA * valB;
      normA += valA * valA;
      normB += valB * valB;
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
