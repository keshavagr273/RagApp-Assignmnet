import { z } from 'zod';

export const IngestionStageEnum = z.enum([
  'rendering_pages',
  'extracting_text',
  'vision_parsing',
  'stitching',
  'chunking',
  'embedding',
  'indexing',
]);

export const IngestionStatusEnum = z.enum([
  'queued',
  'rendering',
  'parsing',
  'embedding',
  'ready',
  'failed',
]);

export const IngestionProgressSchema = z.object({
  documentId: z.string(),
  status: IngestionStatusEnum,
  stage: IngestionStageEnum.optional(),
  progress: z.number().min(0).max(100),
  currentPage: z.number().optional(),
  totalPages: z.number().optional(),
  error: z.string().optional(),
});

export const IngestionJobSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  collectionId: z.string(),
  userId: z.string(),
  status: IngestionStatusEnum,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type IngestionStage = z.infer<typeof IngestionStageEnum>;
export type IngestionStatus = z.infer<typeof IngestionStatusEnum>;
export type IngestionProgress = z.infer<typeof IngestionProgressSchema>;
export type IngestionJob = z.infer<typeof IngestionJobSchema>;
