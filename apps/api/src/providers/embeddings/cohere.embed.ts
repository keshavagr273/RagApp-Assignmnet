import { IEmbedProvider } from './embed.interface.js';
import { env } from '../../lib/env.js';
import { logger } from '../../lib/logger.js';

export class CohereEmbedProvider implements IEmbedProvider {
  dimensions = env.EMBED_DIMENSIONS || 1024;
  private apiKey = env.COHERE_API_KEY || '';
  private model = env.EMBED_MODEL || 'embed-english-v3.0';

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const batchSize = 96;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const res = await fetch('https://api.cohere.com/v2/embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          texts: batch,
          model: this.model,
          input_type: 'search_document',
          embedding_types: ['float'],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        logger.error({ error: err }, 'Cohere embedding error');
        throw new Error(`Cohere API error: ${res.status} ${err}`);
      }

      const data = (await res.json()) as any;
      if (data.embeddings && data.embeddings.float) {
        allEmbeddings.push(...data.embeddings.float);
      } else if (Array.isArray(data.embeddings)) {
        allEmbeddings.push(...data.embeddings);
      } else {
        throw new Error('Unexpected Cohere embeddings response format');
      }
    }

    return allEmbeddings;
  }
}

