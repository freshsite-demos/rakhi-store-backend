import { Schema, model, Document } from "mongoose";

export interface IOrderItem {
  productId: string;
  name: string;
  imageUrl: string;
  quantity: number;
  price: number; // original price
  discountedPrice?: number;
  subtotal: number;
}

export interface IDeliveryAddress {
  societyId: string;
  societyName: string;
  block?: string;
  floor?: string;
  flatNumber: string;
  instructions?: string;
}

export interface ICustomer {
  name: string;
  phone: string;
  email?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  customer: ICustomer;
  deliveryAddress: IDeliveryAddress;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  total: number;
  status:
    | "PLACED"
    | "CONFIRMED"
    | "PACKED"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    imageUrl: { type: String, required: true },
    quantity: { type: Schema.Types.Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const deliveryAddressSchema = new Schema<IDeliveryAddress>(
  {
    societyId: { type: String, required: true },
    societyName: { type: String, required: true },
    block: { type: String },
    floor: { type: String },
    flatNumber: { type: String, required: true },
    instructions: { type: String },
  },
  { _id: false },
);

const customerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: customerSchema, required: true },
    deliveryAddress: { type: deliveryAddressSchema, required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, default: 0, min: 0 },
    couponCode: { type: String, trim: true },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        "PLACED",
        "CONFIRMED",
        "PACKED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PLACED",
    },
  },
  { timestamps: true },
);

export const Order = model<IOrder>("Order", orderSchema);
