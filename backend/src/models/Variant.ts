import mongoose, { Schema, model, type Document, Types } from "mongoose";

export interface IVariantDocument extends Document {
  productId: Types.ObjectId;
  sku: string;
  color?: string;
  size?: string;
  material?: string;
  stock: number;
  price?: number;
  priceOverride?: number;
  image?: string;
  attributes?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const VariantSchema = new Schema<IVariantDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    sku: { type: String, required: true, unique: true, trim: true },
    color: { type: String, trim: true },
    size: { type: String, trim: true },
    material: { type: String, trim: true },
    stock: { type: Number, required: true, min: 0 },
    priceOverride: { type: Number },
    image: { type: String },
    attributes: { type: Schema.Types.Mixed },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

const Variant =
  mongoose.models.Variant || model<IVariantDocument>("Variant", VariantSchema);
export default Variant;
