import mongoose, { Schema, model, type Document, Types } from "mongoose";

export interface IAddressDocument extends Document {
  userId: Types.ObjectId;
  recipientName: string;
  recipientPhone: string;
  province: string;
  city: string;
  postalCode: string;
  fullAddress: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddressDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "آدرس باید متعلق به یک کاربر باشد"],
      index: true,
    },
    recipientName: {
      type: String,
      required: [true, "نام گیرنده الزامی است"],
      trim: true,
      maxlength: 60,
    },
    recipientPhone: {
      type: String,
      required: [true, "شماره موبایل گیرنده الزامی است"],
      trim: true,
      match: [/^(\+98|0)?9\d{9}$/, "فرمت شماره موبایل نامعتبر است"],
    },
    province: {
      type: String,
      required: [true, "استان الزامی است"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "شهر الزامی است"],
      trim: true,
    },
    postalCode: {
      type: String,
      required: [true, "کد پستی الزامی است"],
      match: [/^\d{10}$/, "کد پستی باید ۱۰ رقم باشد"],
      trim: true,
    },
    fullAddress: {
      type: String,
      required: [true, "آدرس دقیق الزامی است"],
      trim: true,
      maxlength: 500,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

addressSchema.index({ userId: 1, isDefault: 1 });

const Address =
  mongoose.models.Address || model<IAddressDocument>("Address", addressSchema);

export default Address;
