import mongoose, { Schema, model, type Document, Types } from "mongoose";

export type OrderStatus =
  | "PENDING"
  | "PAYMENT_PROCESSING"
  | "PAID"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentMethod = "ONLINE" | "COD";

export interface IOrderAddress {
  recipientName: string;
  recipientPhone: string;
  province: string;
  city: string;
  postalCode: string;
  fullAddress: string;
}

export interface IOrderItem {
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  sku: string;
  title: string;
  price: number;
  quantity: number;
  total: number; 
}

export interface IOrderDocument extends Document {
  user: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IOrderAddress;
  couponCode?: string;
  discount: number; 
  shippingCost: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentId?: Types.ObjectId;
  note?: string;
  placedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId, ref: "Variant" },
    sku: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrderDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: (v: any[]) => v.length > 0,
    },
    shippingAddress: {
      recipientName: { type: String, required: true },
      recipientPhone: { type: String, required: true },
      province: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      fullAddress: { type: String, required: true },
    },
    couponCode: { type: String, trim: true },
    discount: { type: Number, default: 0, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        "PENDING",
        "PAYMENT_PROCESSING",
        "PAID",
        "PREPARING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "REFUNDED",
      ],
      default: "PENDING",
      index: true,
    },
    paymentMethod: { type: String, enum: ["ONLINE", "COD"], required: true },
    paymentId: { type: Schema.Types.ObjectId, ref: "PaymentTransaction" },
    note: { type: String, trim: true, maxlength: 500 },
    placedAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });

const Order =
  mongoose.models.Order || model<IOrderDocument>("Order", orderSchema);
export default Order;
