import { getEmbedProvider } from '../providers/embeddings/index.js';
import { getVectorStore } from '../providers/vector/index.js';
import { Chunk, IChunk } from '../models/Chunk.js';
import { QueryIntent } from './query-rewriter.js';
import { logger } from '../lib/logger.js';
import mongoose from 'mongoose';

export interface RetrievedChunk {
  chunk: IChunk;
  score: number;
  vectorRank?: number;
  textRank?: number;
}

export interface RetrievalFilter {
  collectionId?: string;
  documentIds?: string[];
}

export async function hybridRetrieve(
  query: string,
  intent: QueryIntent,
  filter: RetrievalFilter,
  limit = 25
): Promise<RetrievedChunk[]> {
  const embedder = getEmbedProvider();
  const vectorStore = getVectorStore();

  logger.info({ query, intent, filter }, 'Starting parallel hybrid retrieval (Vector + BM25)');

  // 1. Vector Search
  const vectorPromise = (async () => {
    try {
      const [queryVector] = await embedder.embed([query]);
      return await vectorStore.search(queryVector, filter, 35);
    } catch (err: any) {
      logger.error({ error: err.message }, 'Vector retrieval failed');
      return [];
    }
  })();

  // 2. BM25 Keyword Search in MongoDB
  const textPromise = (async () => {
    try {
      const mongoFilter: any = {};
      if (filter.collectionId) {
        mongoFilter.collectionId = new mongoose.Types.ObjectId(filter.collectionId);
      }
      if (filter.documentIds && filter.documentIds.length > 0) {
        mongoFilter.documentId = { $in: filter.documentIds.map((id) => new mongoose.Types.ObjectId(id)) };
      }

      // Try text search
      try {
        const textResults = await Chunk.find(
          { ...mongoFilter, $text: { $search: query } },
          { score: { $meta: 'textScore' } }
        )
          .sort({ score: { $meta: 'textScore' } })
          .limit(35)
          .select('_id')
          .lean();

        return textResults.map((r) => r._id.toString());
      } catch (_textIdxErr) {
        // Fallback to regex keywords if text index isn't ready
        const words = query.split(/\s+/).filter((w) => w.length > 3).slice(0, 5);
        if (words.length === 0) return [];
        const regexes = words.map((w) => new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
        const fallback = await Chunk.find({
          ...mongoFilter,
          text: { $in: regexes },
        })
          .limit(35)
          .select('_id')
          .lean();
        return fallback.map((r) => r._id.toString());
      }
    } catch (err: any) {
      logger.error({ error: err.message }, 'BM25 text retrieval failed');
      return [];
    }
  })();

  const [vectorHits, textHits] = await Promise.all([vectorPromise, textPromise]);

  // 3. Reciprocal Rank Fusion (RRF)
  const k = 60;
  const scoresMap = new Map<
    string,
    { score: number; vectorRank?: number; textRank?: number }
  >();

  // Process Vector Ranks
  vectorHits.forEach((hit, rank) => {
    const existing = scoresMap.get(hit.chunkId) || { score: 0 };
    existing.score += 1 / (k + (rank + 1));
    existing.vectorRank = rank + 1;
    scoresMap.set(hit.chunkId, existing);
  });

  // Process Text Ranks
  textHits.forEach((chunkId, rank) => {
    const existing = scoresMap.get(chunkId) || { score: 0 };
    existing.score += 1 / (k + (rank + 1));
    existing.textRank = rank + 1;
    scoresMap.set(chunkId, existing);
  });

  // Fetch full chunk documents
  const allChunkIds = Array.from(scoresMap.keys()).map((id) => new mongoose.Types.ObjectId(id));
  const chunkDocs = await Chunk.find({ _id: { $in: allChunkIds } }).lean();

  const results: RetrievedChunk[] = [];

  for (const doc of chunkDocs) {
    const id = doc._id.toString();
    const rankInfo = scoresMap.get(id);
    if (!rankInfo) continue;

    let finalScore = rankInfo.score;

    // Element Type Boost for numeric/visual intents
    const isNumericOrVisual = intent === 'visual_chart_table' || intent === 'calculation';
    if (isNumericOrVisual && (doc.elementType === 'table' || doc.elementType === 'chart')) {
      finalScore += 0.05; // Noticeable boost in reciprocal rank score
    }

    results.push({
      chunk: doc as unknown as IChunk,
      score: finalScore,
      vectorRank: rankInfo.vectorRank,
      textRank: rankInfo.textRank,
    });
  }

  // Sort by final combined score descending
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

