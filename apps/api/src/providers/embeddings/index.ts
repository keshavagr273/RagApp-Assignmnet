import { IEmbedProvider } from './embed.interface.js';
import { CohereEmbedProvider } from './cohere.embed.js';
import { MockEmbedProvider } from './mock.embed.js';
import { env } from '../../lib/env.js';

let embedInstance: IEmbedProvider;

export function getEmbedProvider(): IEmbedProvider {
  if (!embedInstance) {
    if (env.COHERE_API_KEY) {
      embedInstance = new CohereEmbedProvider();
    } else {
      embedInstance = new MockEmbedProvider();
    }
  }
  return embedInstance;
}

export * from './embed.interface.js';
