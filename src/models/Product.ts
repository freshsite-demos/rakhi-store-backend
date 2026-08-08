import { Schema, model, Document, Types } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  discountedPrice?: number;
  category: string;
  stock: number;
  isAvailable: boolean;
  availableSocieties: Types.ObjectId[]; // empty = available in all regions
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, min: 0 },
    category: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
    isAvailable: { type: Boolean, default: true },
    availableSocieties: [{ type: Schema.Types.ObjectId, ref: 'Society' }],
  },
  { timestamps: true }
);

export const Product = model<IProduct>('Product', productSchema);
