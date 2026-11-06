import { RetrievedChunk } from './retrieval.js';
import { logger } from '../lib/logger.js';

export async function rerankChunks(
  query: string,
  candidates: RetrievedChunk[],
  topK = 8
): Promise<RetrievedChunk[]> {
  if (candidates.length <= topK) {
    return candidates;
  }

  logger.info({ candidateCount: candidates.length, topK }, 'Reranking retrieval candidates');

  // Term overlap & keyword density scoring to re-order top candidates
  const queryTerms = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);

  const scored = candidates.map((cand) => {
    const textLower = cand.chunk.text.toLowerCase();
    let termMatchCount = 0;
    for (const term of queryTerms) {
      if (textLower.includes(term)) termMatchCount++;
    }
    const overlapFraction = queryTerms.length > 0 ? termMatchCount / queryTerms.length : 0;

    // Combine base RRF score with lexical keyword overlap
    const combinedScore = cand.score * 0.7 + overlapFraction * 0.3;

    return {
      ...cand,
      score: combinedScore,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

