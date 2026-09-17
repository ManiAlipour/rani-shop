import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ICartItem {
  variantId: Types.ObjectId;
  quantity: number;
}

export interface ICart {
  userId?: Types.ObjectId;
  guestId?: string;
  items: ICartItem[];
  couponId?: Types.ObjectId | null; // <-- اینجاست (کل سبد)
}

export interface ICartDocument extends ICart, Document {
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    variantId: {
      type: Schema.Types.ObjectId,
      ref: "Variant",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 99,
      default: 1,
    },
  },
  {
    _id: false,
  },
);

const CartSchema = new Schema<ICartDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

    guestId: {
      type: String,
      required: false,
      index: true,
      trim: true,
    },

    items: {
      type: [CartItemSchema],
      default: [],
    },

    couponId: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

CartSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      userId: { $exists: true },
    },
  },
);

CartSchema.index(
  { guestId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      guestId: { $exists: true },
    },
  },
);

CartSchema.index(
  { updatedAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 7,
  },
);

const Cart: Model<ICartDocument> =
  mongoose.models.Cart || mongoose.model<ICartDocument>("Cart", CartSchema);

export default Cart;
