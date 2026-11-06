import { IStorageAdapter } from './storage.interface.js';
import { LocalStorageAdapter } from './local.storage.js';
import { S3StorageAdapter } from './s3.storage.js';
import { env } from '../lib/env.js';

let storageInstance: IStorageAdapter;

export function getStorage(): IStorageAdapter {
  if (!storageInstance) {
    if (env.STORAGE_TYPE === 's3' && env.AWS_BUCKET && env.AWS_ACCESS_KEY_ID) {
      storageInstance = new S3StorageAdapter();
    } else {
      storageInstance = new LocalStorageAdapter();
    }
  }
  return storageInstance;
}

export * from './storage.interface.js';

