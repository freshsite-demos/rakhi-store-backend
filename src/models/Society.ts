import { Schema, model, Document } from 'mongoose';

export interface IBlock {
  name: string;
  floors: number[];
}

export interface ISociety extends Document {
  name: string;
  blocks: IBlock[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const blockSchema = new Schema<IBlock>({
  name: { type: String, required: true, trim: true },
  floors: [{ type: Number, required: true }],
}, { _id: false });

const societySchema = new Schema<ISociety>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    blocks: [blockSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Society = model<ISociety>('Society', societySchema);
