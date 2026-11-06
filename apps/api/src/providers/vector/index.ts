import { IVectorStore } from './vector.interface.js';
import { LocalCosineVectorStore } from './local-cosine.vector.js';
import { AtlasVectorStore } from './atlas.vector.js';
import { env } from '../../lib/env.js';

let vectorStoreInstance: IVectorStore;

export function getVectorStore(): IVectorStore {
  if (!vectorStoreInstance) {
    if (env.MONGODB_USE_ATLAS) {
      vectorStoreInstance = new AtlasVectorStore();
    } else {
      vectorStoreInstance = new LocalCosineVectorStore();
    }
  }
  return vectorStoreInstance;
}

export * from './vector.interface.js';

