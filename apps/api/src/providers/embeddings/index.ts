import { IEmbedProvider } from './embed.interface.js';
import { VoyageEmbedProvider } from './voyage.embed.js';
import { OpenAIEmbedProvider } from './openai.embed.js';
import { CohereEmbedProvider } from './cohere.embed.js';
import { MockEmbedProvider } from './mock.embed.js';
import { env } from '../../lib/env.js';

let embedInstance: IEmbedProvider;

export function getEmbedProvider(): IEmbedProvider {
  if (!embedInstance) {
    if (env.COHERE_API_KEY) {
      embedInstance = new CohereEmbedProvider();
    } else if (env.VOYAGE_API_KEY) {
      embedInstance = new VoyageEmbedProvider();
    } else if (env.OPENAI_API_KEY) {
      embedInstance = new OpenAIEmbedProvider();
    } else {
      embedInstance = new MockEmbedProvider();
    }
  }
  return embedInstance;
}

export * from './embed.interface.js';

