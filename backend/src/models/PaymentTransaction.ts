import mongoose, { Schema, model, type Document, Types } from "mongoose";

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "EXPIRED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type PaymentProvider = "ZARINPAL" | "IDPAY";

export interface IPaymentTransactionDocument extends Document {
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  provider: PaymentProvider;
  providerTransactionId?: string;
  authority?: string;
  amount: number;
  status: PaymentStatus;
  signature?: string;
  paidAt?: Date;
  refundAmount?: number;
  refundedAt?: Date;
  failureReason?: string;
  rawRequest?: unknown;
  rawCallback?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const paymentTransactionSchema = new Schema<IPaymentTransactionDocument>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["ZARINPAL", "IDPAY"],
      required: true,
    },
    providerTransactionId: { type: String, trim: true },
    authority: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        "PENDING",
        "PROCESSING",
        "SUCCEEDED",
        "FAILED",
        "EXPIRED",
        "REFUNDED",
        "PARTIALLY_REFUNDED",
      ],
      default: "PENDING",
      index: true,
    },
    signature: { type: String },
    paidAt: { type: Date },
    refundAmount: { type: Number, default: 0, min: 0 },
    refundedAt: { type: Date },
    failureReason: { type: String, trim: true },
    rawRequest: { type: Schema.Types.Mixed },
    rawCallback: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

// ایندکس برای جستجوی تراکنش‌های سفارش
paymentTransactionSchema.index({ orderId: 1, status: 1, createdAt: -1 });

const PaymentTransaction =
  mongoose.models.PaymentTransaction ||
  model<IPaymentTransactionDocument>(
    "PaymentTransaction",
    paymentTransactionSchema,
  );

export default PaymentTransaction;
