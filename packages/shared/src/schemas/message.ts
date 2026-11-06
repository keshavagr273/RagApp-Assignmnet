import { z } from 'zod';
import { BBoxSchema } from './chunk.js';

export const CitationSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  documentTitle: z.string(),
  page: z.number(),
  chunkId: z.string(),
  elementType: z.string(),
  excerpt: z.string(),
  bbox: BBoxSchema.optional(),
  pageImageRef: z.string().optional(),
});

export const ChatMessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  citations: z.array(CitationSchema).optional(),
  tables: z.array(z.unknown()).optional(),
  charts: z.array(z.unknown()).optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  followups: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
});

export const AnswerResponseSchema = z.object({
  answer_markdown: z.string(),
  citations: z.array(CitationSchema),
  tables: z.array(z.unknown()),
  charts: z.array(z.unknown()),
  confidence: z.enum(['high', 'medium', 'low']),
  followups: z.array(z.string()),
});

export type Citation = z.infer<typeof CitationSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type AnswerResponse = z.infer<typeof AnswerResponseSchema>;
