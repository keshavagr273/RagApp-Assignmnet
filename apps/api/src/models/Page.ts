import { Schema, model, Document as MongoDoc, Types } from 'mongoose';

export interface IPage extends MongoDoc {
  _id: Types.ObjectId;
  documentId: Types.ObjectId;
  pageNumber: number;
  imageRef: string;
  textLayerQuality: 'good' | 'poor' | 'none';
  needsOcr: boolean;
  degraded: boolean;
  width: number;
  height: number;
  createdAt: Date;
  updatedAt: Date;
}

const pageSchema = new Schema<IPage>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    pageNumber: { type: Number, required: true },
    imageRef: { type: String, required: true },
    textLayerQuality: { type: String, enum: ['good', 'poor', 'none'], default: 'good' },
    needsOcr: { type: Boolean, default: false },
    degraded: { type: Boolean, default: false },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { timestamps: true },
);

pageSchema.index({ documentId: 1, pageNumber: 1 }, { unique: true });

export const Page = model<IPage>('Page', pageSchema);
