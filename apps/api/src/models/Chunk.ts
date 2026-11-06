import { Schema, model, Document as MongoDoc, Types } from 'mongoose';

export interface IChunk extends MongoDoc {
  _id: Types.ObjectId;
  documentId: Types.ObjectId;
  collectionId: Types.ObjectId;
  page: number;
  endPage?: number;
  elementType: string;
  headingPath: Array<{ level: number; text: string }>;
  text: string; // retrieval text (with metadata prefix)
  rawText: string; // actual content text
  rawStructured: unknown; // original parsed JSON
  bbox?: { x: number; y: number; width: number; height: number };
  pageImageRef?: string;
  tokenCount: number;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

const chunkSchema = new Schema<IChunk>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', required: true, index: true },
    page: { type: Number, required: true },
    endPage: { type: Number },
    elementType: { type: String, required: true },
    headingPath: [{ level: Number, text: String }],
    text: { type: String, required: true },
    rawText: { type: String, required: true },
    rawStructured: { type: Schema.Types.Mixed },
    bbox: { x: Number, y: Number, width: Number, height: Number },
    pageImageRef: { type: String },
    tokenCount: { type: Number, default: 0 },
    embedding: [{ type: Number }],
  },
  { timestamps: true },
);

chunkSchema.index({ documentId: 1, page: 1 });
chunkSchema.index({ text: 'text' }); // MongoDB text index for BM25-like search

export const Chunk = model<IChunk>('Chunk', chunkSchema);
