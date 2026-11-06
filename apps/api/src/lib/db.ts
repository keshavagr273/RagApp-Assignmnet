import mongoose from 'mongoose';
import { logger } from './logger.js';
import { env } from './env.js';

let mongod: any = null;

export async function connectDB(): Promise<void> {
  try {
    // Attempt standard connection with 2.5s timeout for local fallback
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2500,
    });
    logger.info({ uri: env.MONGODB_URI.replace(/\/\/.*@/, '//***@') }, 'MongoDB connected');
  } catch (err: any) {
    logger.warn({ error: err.message }, 'Failed to connect to configured MongoDB URI. Initializing in-memory MongoDB fallback...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      const inMemoryUri = mongod.getUri();
      await mongoose.connect(inMemoryUri);
      logger.info({ inMemoryUri }, 'In-Memory MongoDB fallback connected successfully');
    } catch (fallbackErr: any) {
      logger.error(fallbackErr, 'Fatal: Failed to connect to MongoDB and could not start in-memory fallback');
      throw fallbackErr;
    }
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}
