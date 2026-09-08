import mongoose, { Schema, model, type Document, Types } from "mongoose";

export type UserStatus = "ACTIVE" | "INACTIVE" | "BANNED";

export const UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BANNED: "BANNED",
} as const;

export interface IUserDocument extends Document {
  firstName: string;
  lastName?: string;
  phoneNumber: string;
  status: UserStatus;
  isPhoneVerified: boolean;
  otp?: {
    codeHash: string;
    expiresAt: Date;
    attempts: number;
  };
  password?: string;
  notifications: boolean;
  role: "user" | "admin";
  addresses?: Types.ObjectId[];
  lastLoginAt?: Date;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    firstName: {
      type: String,
      required: [true, "نام الزامی است"],
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    phoneNumber: {
      type: String,
      required: [true, "شماره موبایل الزامی است"],
      unique: true,
      trim: true,
      index: true,
      match: [/^(\+98|0)?9\d{9}$/, "فرمت شماره موبایل نامعتبر است"],
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.INACTIVE,
      index: true,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      codeHash: { type: String, select: false },
      expiresAt: { type: Date, select: false },
      attempts: { type: Number, default: 0, select: false },
    },
    password: {
      type: String,
      select: false,
    },
    notifications: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
    addresses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Address",
      },
    ],
    lastLoginAt: {
      type: Date,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  },
);

userSchema.index({ phoneNumber: 1, deletedAt: 1 });

const User = mongoose.models.User || model<IUserDocument>("User", userSchema);

export default User;
