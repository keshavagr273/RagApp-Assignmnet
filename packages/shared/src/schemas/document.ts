import { z } from 'zod';

export const DocumentStatusEnum = z.enum([
  'queued',
  'rendering',
  'parsing',
  'embedding',
  'ready',
  'failed',
]);

export const DocumentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  collectionId: z.string(),
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  sha256: z.string(),
  storageKey: z.string(),
  status: DocumentStatusEnum,
  pageCount: z.number().optional(),
  error: z.string().optional(),
  ingestionJobId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type DocumentStatus = z.infer<typeof DocumentStatusEnum>;
export type Document = z.infer<typeof DocumentSchema>;
