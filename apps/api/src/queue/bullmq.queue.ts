import { Queue, Worker } from 'bullmq';
import { IIngestionQueue, IngestionJobData } from './queue.interface.js';
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';
import { Redis } from 'ioredis';

export class BullMQueue implements IIngestionQueue {
  private queue: Queue;
  private worker?: Worker;
  private connection: Redis;

  constructor() {
    this.connection = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue('document-ingestion', { connection: this.connection });
  }

  async addJob(data: IngestionJobData): Promise<string> {
    const job = await this.queue.add('ingest-document', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
    });
    return job.id || data.documentId;
  }

  async startWorker(handler: (data: IngestionJobData) => Promise<void>): Promise<void> {
    this.worker = new Worker(
      'document-ingestion',
      async (job) => {
        logger.info({ jobId: job.id, docId: job.data.documentId }, 'Processing BullMQ ingestion job');
        await handler(job.data);
      },
      {
        connection: this.connection,
        concurrency: env.INGESTION_CONCURRENCY,
      }
    );

    this.worker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, err: err.message }, 'BullMQ job failed');
    });
  }

  async close(): Promise<void> {
    if (this.worker) await this.worker.close();
    await this.queue.close();
    await this.connection.quit();
  }
}

