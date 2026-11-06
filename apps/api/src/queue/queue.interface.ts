export interface IngestionJobData {
  documentId: string;
  collectionId: string;
  userId: string;
  storageKey: string;
}

export interface IIngestionQueue {
  addJob(data: IngestionJobData): Promise<string>;
  startWorker(handler: (data: IngestionJobData) => Promise<void>): Promise<void>;
  close(): Promise<void>;
}

