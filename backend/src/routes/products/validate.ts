import { z } from "zod";
import mongoose from "mongoose";

const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "شناسه ارسالی معتبر نیست (Invalid ObjectId)",
  });

const slugRegex = /^[a-z0-9\u0600-\u06FF]+(?:-[a-z0-9\u0600-\u06FF]+)*$/;

export const createProductSchema = z.object({
  body: z.object({
    title: z
      .string({ message: "عنوان محصول الزامی است" })
      .trim()
      .min(3, "عنوان محصول باید حداقل ۳ کاراکتر باشد")
      .max(200, "عنوان محصول نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد"),

    slug: z
      .string({ message: "اسلاگ محصول الزامی است" })
      .trim()
      .toLowerCase()
      .min(3, "اسلاگ باید حداقل ۳ کاراکتر باشد")
      .max(250, "اسلاگ نمی‌تواند بیشتر از ۲۵۰ کاراکتر باشد")
      .regex(
        slugRegex,
        "فرمت اسلاگ نامعتبر است (تنها حروف، اعداد و خط تیره مجاز است)",
      ),

    categoryId: objectIdSchema,

    brand: z
      .string()
      .trim()
      .max(100, "نام برند نمی‌تواند بیش از ۱۰۰ کاراکتر باشد")
      .optional(),

    description: z
      .string()
      .trim()
      .max(5000, "توضیحات نمی‌تواند بیش از ۵۰۰۰ کاراکتر باشد")
      .optional(),

    basePrice: z
      .number({ message: "قیمت پایه الزامی است" })
      .nonnegative("قیمت پایه نمی‌تواند عدد منفی باشد"),

    currency: z.enum(["IRR", "IRT"]).default("IRR").optional(),

    images: z
      .array(z.string().url("آدرس تصویر معتبر نیست"))
      .max(10, "حداکثر می‌توانید ۱۰ تصویر برای محصول انتخاب کنید")
      .optional()
      .default([]),

    tags: z
      .array(z.string().trim().min(2, "تگ باید حداقل ۲ کاراکتر باشد"))
      .max(20, "حداکثر ۲۰ تگ مجاز است")
      .optional()
      .default([]),

    isActive: z.boolean().default(true).optional(),

    attributes: z.record(z.string(), z.any()).optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: createProductSchema.shape.body.partial(),
});

export const productIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const productSlugParamSchema = z.object({
  params: z.object({
    slug: z.string().trim().min(1, "اسلاگ نمی‌تواند خالی باشد"),
  }),
});

export const getProductsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().optional(),
    categoryId: objectIdSchema.optional(),
    brand: z.string().trim().optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
    isActive: z
      .enum(["true", "false"])
      .transform((val) => val === "true")
      .optional(),
    sortBy: z
      .enum(["createdAt", "basePrice", "title", "updatedAt"])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>["body"];
export type UpdateProductInput = z.infer<typeof updateProductSchema>["body"];
export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>["query"];
