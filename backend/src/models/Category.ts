import mongoose, { Schema, model, type Document, Types } from "mongoose";

export type CategoryType = "MAIN" | "SUB";

export interface ICategoryDocument extends Document {
  name: string;
  slug: string;
  parent?: Types.ObjectId;
  type: CategoryType;
  description?: string;
  meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const CategorySchema = new Schema<ICategoryDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    type: { type: String, enum: ["MAIN", "SUB"], default: "MAIN" },
    description: { type: String, trim: true },
    meta: {
      title: { type: String },
      description: { type: String },
      keywords: [{ type: String }],
    },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

const Category =
  mongoose.models.Category ||
  model<ICategoryDocument>("Category", CategorySchema);
export default Category;
