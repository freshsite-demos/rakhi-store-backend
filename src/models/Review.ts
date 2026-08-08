import { Schema, model, Document } from 'mongoose';

export interface IReview extends Document {
  orderNumber: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail?: string;
  rating?: number; // 1-5 stars
  comment?: string;
  isApproved: boolean; // Admin moderation flag
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    orderNumber: { type: String, required: true, trim: true, index: true },
    productId: { type: String, required: true, index: true },
    productName: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, trim: true },
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, trim: true },
    isApproved: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Ensure a customer can only submit one review per product per order
reviewSchema.index({ orderNumber: 1, productId: 1 }, { unique: true });

export const Review = model<IReview>('Review', reviewSchema);
