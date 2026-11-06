import { IIngestionQueue, IngestionJobData } from './queue.interface.js';
import { BullMQueue } from './bullmq.queue.js';
import { MemoryQueue } from './memory.queue.js';
import { hasRedis } from '../lib/redis.js';

let queueInstance: IIngestionQueue;

export function getIngestionQueue(): IIngestionQueue {
  if (!queueInstance) {
    if (hasRedis()) {
      queueInstance = new BullMQueue();
    } else {
      queueInstance = new MemoryQueue();
    }
  }
  return queueInstance;
}

export * from './queue.interface.js';

