import { Schema } from "mongoose";

const AttributeSchema = new Schema({
  key: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  type: { type: String, enum: ["TEXT", "SELECT", "MULTI_SELECT", "BOOLEAN"] },
  isFilterable: { type: Boolean, default: true },
  isVariantLevel: { type: Boolean, default: false },
});

const AttributeValueSchema = new Schema({
  attribute: { type: Schema.Types.ObjectId, ref: "Attribute", required: true },
  value: { type: String, required: true },
  slug: { type: String, required: true },
});
