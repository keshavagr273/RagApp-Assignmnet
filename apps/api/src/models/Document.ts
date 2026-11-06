import { Schema, model, Document as MongoDoc, Types } from 'mongoose';

export type DocumentStatus = 'queued' | 'rendering' | 'parsing' | 'embedding' | 'ready' | 'failed';

export interface IDocument extends MongoDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  collectionId: Types.ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  storageKey: string;
  status: DocumentStatus;
  pageCount?: number;
  error?: string;
  ingestionJobId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', required: true, index: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    sha256: { type: String, required: true, index: true },
    storageKey: { type: String, required: true },
    status: {
      type: String,
      enum: ['queued', 'rendering', 'parsing', 'embedding', 'ready', 'failed'],
      default: 'queued',
    },
    pageCount: { type: Number },
    error: { type: String },
    ingestionJobId: { type: String },
  },
  { timestamps: true },
);

export const DocumentModel = model<IDocument>('Document', documentSchema);
