import mongoose, { Schema, model, type Document, Types, Model } from "mongoose";

export interface IProductDocument extends Document {
  title: string;
  slug: string;
  categoryId: Types.ObjectId;
  brand?: string;
  description?: string;
  basePrice: number;
  currency?: string;
  images?: string[];
  tags?: string[];
  isActive: boolean;
  attributes?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const ProductSchema = new Schema<IProductDocument>(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    brand: { type: String, trim: true },
    description: { type: String, trim: true },
    basePrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "IRR" },
    images: [{ type: String }],
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
    attributes: { type: Schema.Types.Mixed },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

const Product: Model<IProductDocument> =
  (mongoose.models.Product as Model<IProductDocument>) ||
  model<IProductDocument>("Product", ProductSchema);

export default Product;
