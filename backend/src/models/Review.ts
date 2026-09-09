import mongoose, { Schema, model, type Document, Types } from "mongoose";

export interface IReviewDocument extends Document {
  user: Types.ObjectId;
  product: Types.ObjectId;
  variantId?: Types.ObjectId;
  rating: number; // 1 تا 5
  title?: string;
  body?: string;
  isVerifiedPurchase: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED"; 
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const reviewSchema = new Schema<IReviewDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    variantId: { type: Schema.Types.ObjectId, ref: "Variant" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 100 },
    body: { type: String, trim: true, maxlength: 1000 },
    isVerifiedPurchase: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

reviewSchema.index({ user: 1, product: 1 }, { unique: true });

const Review =
  mongoose.models.Review || model<IReviewDocument>("Review", reviewSchema);
export default Review;
