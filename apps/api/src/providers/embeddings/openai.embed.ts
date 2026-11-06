import OpenAI from 'openai';
import { IEmbedProvider } from './embed.interface.js';
import { env } from '../../lib/env.js';

export class OpenAIEmbedProvider implements IEmbedProvider {
  dimensions = 1536;
  private client: OpenAI;
  private model = 'text-embedding-3-small';

  constructor() {
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY || '',
    });
  }

  async embed(texts: string[]): Promise<number[][]> {
    const res = await this.client.embeddings.create({
      model: this.model,
      input: texts,
    });
    return res.data.map((d) => d.embedding);
  }
}

