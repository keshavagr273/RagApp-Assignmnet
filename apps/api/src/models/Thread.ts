import { Schema, model, Document as MongoDoc, Types } from 'mongoose';

export interface IThread extends MongoDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  collectionId: Types.ObjectId;
  documentIds?: Types.ObjectId[]; // if scoped to subset
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const threadSchema = new Schema<IThread>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', required: true, index: true },
    documentIds: [{ type: Schema.Types.ObjectId, ref: 'Document' }],
    title: { type: String, default: 'New Thread' },
  },
  { timestamps: true },
);

export const Thread = model<IThread>('Thread', threadSchema);
