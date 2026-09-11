import mongoose from "mongoose";
import { z } from "zod";

const objectIdSchema = z
  .string()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "شناسه ارسال‌شده معتبر نیست",
  });

export const createVariantSchema = z.object({
  sku: z.string().trim().min(2, "کد SKU باید حداقل ۲ کاراکتر باشد"),

  color: z.string().trim().optional(),

  size: z.string().trim().optional(),

  material: z.string().trim().optional(),

  stock: z
    .number()
    .int("موجودی باید عدد صحیح باشد")
    .min(0, "موجودی نمی‌تواند منفی باشد"),

  priceOverride: z
    .number()
    .min(0, "قیمت اختصاصی نمی‌تواند منفی باشد")
    .optional(),

  image: z.string().url("آدرس تصویر معتبر نیست").optional(),

  attributes: z.record(z.string(), z.unknown()).optional(),
});

export const updateVariantSchema = createVariantSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "حداقل یک فیلد برای ویرایش ارسال کنید",
  });

export const createProductSchema = z.object({
  title: z.string().trim().min(2, "عنوان محصول باید حداقل ۲ کاراکتر باشد"),

  slug: z.string().trim().min(2, "نامک محصول باید حداقل ۲ کاراکتر باشد"),

  description: z.string().optional(),

  categoryId: objectIdSchema,

  brand: z.string().trim().optional(),

  basePrice: z.number().min(0, "قیمت پایه نمی‌تواند منفی باشد"),

  tags: z.array(z.string().trim()).optional(),

  isActive: z.boolean().optional(),

  variants: z.array(createVariantSchema).optional().default([]),
});

export const updateProductSchema = createProductSchema
  .omit({
    variants: true,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "حداقل یک فیلد برای ویرایش ارسال کنید",
  });
