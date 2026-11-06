import { IEmbedProvider } from './embed.interface.js';
import { env } from '../../lib/env.js';
import crypto from 'crypto';

export class MockEmbedProvider implements IEmbedProvider {
  dimensions = env.EMBED_DIMENSIONS || 1024;

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((text) => this.generateVector(text));
  }

  private generateVector(text: string): number[] {
    const vec = new Float64Array(this.dimensions);
    const words = text.toLowerCase().split(/\W+/).filter(Boolean);

    for (const word of words) {
      const hash = crypto.createHash('sha256').update(word).digest();
      for (let i = 0; i < 8; i++) {
        const index = hash.readUInt16BE(i * 2) % this.dimensions;
        const sign = (hash[i * 2] % 2 === 0 ? 1 : -1);
        vec[index] += sign;
      }
    }

    // Add general text signature
    const textHash = crypto.createHash('sha256').update(text).digest();
    for (let i = 0; i < 16; i++) {
      const idx = textHash.readUInt16BE(i * 2) % this.dimensions;
      vec[idx] += 0.5;
    }

    // L2 Normalize
    let norm = 0;
    for (let i = 0; i < this.dimensions; i++) {
      norm += vec[i] * vec[i];
    }
    norm = Math.sqrt(norm);
    if (norm === 0) norm = 1;

    const result = new Array(this.dimensions);
    for (let i = 0; i < this.dimensions; i++) {
      result[i] = vec[i] / norm;
    }
    return result;
  }
}

