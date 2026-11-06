import { Schema, model, Document, Types } from 'mongoose';

export interface ICollection extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  description?: string;
  documentIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const collectionSchema = new Schema<ICollection>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    documentIds: [{ type: Schema.Types.ObjectId, ref: 'Document' }],
  },
  { timestamps: true },
);

export const Collection = model<ICollection>('Collection', collectionSchema);
