import { Redis } from 'ioredis';
import { logger } from './logger.js';
import { env } from './env.js';

let redis: Redis | null = null;
let isRedisAvailable = false;

export function getRedis(): Redis | null {
  return redis;
}

export function hasRedis(): boolean {
  return isRedisAvailable;
}

export async function connectRedis(): Promise<boolean> {
  return new Promise((resolve) => {
    const client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      retryStrategy: () => null, // don't infinite retry on dev fallback
      enableReadyCheck: false,
    });

    client.on('error', (err) => {
      logger.warn({ error: err.message }, 'Redis unavailable. Ingestion will use internal in-memory queue fallback.');
      isRedisAvailable = false;
      client.disconnect();
      resolve(false);
    });

    client.on('connect', () => {
      logger.info('Redis connected successfully');
      redis = client;
      isRedisAvailable = true;
      resolve(true);
    });
  });
}
