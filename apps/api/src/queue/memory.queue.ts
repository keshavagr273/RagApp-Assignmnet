import { IIngestionQueue, IngestionJobData } from './queue.interface.js';
import { logger } from '../lib/logger.js';
import { env } from '../lib/env.js';

export class MemoryQueue implements IIngestionQueue {
  private queue: IngestionJobData[] = [];
  private handler?: (data: IngestionJobData) => Promise<void>;
  private running = 0;
  private maxConcurrency = env.INGESTION_CONCURRENCY || 2;
  private closed = false;

  async addJob(data: IngestionJobData): Promise<string> {
    this.queue.push(data);
    logger.info({ docId: data.documentId }, 'Enqueued ingestion job in MemoryQueue');
    setImmediate(() => this.processNext());
    return `mem-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  async startWorker(handler: (data: IngestionJobData) => Promise<void>): Promise<void> {
    this.handler = handler;
    logger.info({ concurrency: this.maxConcurrency }, 'MemoryQueue worker started');
    setImmediate(() => this.processNext());
  }

  private async processNext(): Promise<void> {
    if (this.closed || !this.handler) return;
    if (this.running >= this.maxConcurrency) return;
    if (this.queue.length === 0) return;

    const data = this.queue.shift();
    if (!data) return;

    this.running++;
    (async () => {
      try {
        await this.handler!(data);
      } catch (err: any) {
        logger.error({ docId: data.documentId, error: err.message }, 'MemoryQueue job processing error');
      } finally {
        this.running--;
        this.processNext();
      }
    })();
  }

  async close(): Promise<void> {
    this.closed = true;
    this.queue = [];
  }
}

