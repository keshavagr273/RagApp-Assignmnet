import { IEmbedProvider } from './embed.interface.js';
import { env } from '../../lib/env.js';
import { logger } from '../../lib/logger.js';

export class VoyageEmbedProvider implements IEmbedProvider {
  dimensions = env.EMBED_DIMENSIONS || 1024;
  private apiKey = env.VOYAGE_API_KEY || '';
  private model = env.EMBED_MODEL || 'voyage-3';

  async embed(texts: string[]): Promise<number[][]> {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: texts,
        model: this.model,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error({ error: err }, 'Voyage embedding error');
      throw new Error(`Voyage API error: ${res.status} ${err}`);
    }

    const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
    return data.data.map((d) => d.embedding);
  }
}

