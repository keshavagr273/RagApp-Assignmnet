import { Schema, model, Document as MongoDoc, Types } from 'mongoose';

export interface ICitation {
  id: string;
  documentId: string;
  documentTitle: string;
  page: number;
  chunkId: string;
  elementType: string;
  excerpt: string;
  bbox?: { x: number; y: number; width: number; height: number };
  pageImageRef?: string;
}

export interface IMessage extends MongoDoc {
  _id: Types.ObjectId;
  threadId: Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  citations?: ICitation[];
  tables?: unknown[];
  charts?: unknown[];
  confidence?: string;
  followups?: string[];
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    threadId: { type: Schema.Types.ObjectId, ref: 'Thread', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    citations: [Schema.Types.Mixed],
    tables: [Schema.Types.Mixed],
    charts: [Schema.Types.Mixed],
    confidence: { type: String },
    followups: [String],
    promptTokens: { type: Number },
    completionTokens: { type: Number },
    latencyMs: { type: Number },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Message = model<IMessage>('Message', messageSchema);
