import { z } from 'zod';

export const CreateCollectionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

export type CreateCollectionInput = z.infer<typeof CreateCollectionSchema>;
