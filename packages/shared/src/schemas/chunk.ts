import { z } from 'zod';

export const ElementTypeEnum = z.enum([
  'heading',
  'paragraph',
  'list',
  'table',
  'chart',
  'figure',
  'equation',
  'footnote',
  'header_footer',
]);

export const BBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export const HeadingPathItemSchema = z.object({
  level: z.number(),
  text: z.string(),
});

export const ChunkSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  collectionId: z.string(),
  page: z.number(),
  endPage: z.number().optional(),
  elementType: ElementTypeEnum,
  headingPath: z.array(HeadingPathItemSchema),
  text: z.string(),
  rawText: z.string(),
  rawStructured: z.unknown().optional(),
  bbox: BBoxSchema.optional(),
  pageImageRef: z.string().optional(),
  tokenCount: z.number(),
});

export type ElementType = z.infer<typeof ElementTypeEnum>;
export type BBox = z.infer<typeof BBoxSchema>;
export type HeadingPathItem = z.infer<typeof HeadingPathItemSchema>;
export type Chunk = z.infer<typeof ChunkSchema>;
