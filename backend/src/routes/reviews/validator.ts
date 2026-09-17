import { z } from "zod";

const objectIdSchema = (fieldName: string = "شناسه") =>
  z
    .string({ message: `${fieldName} الزامی است` })
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, `${fieldName} وارد شده معتبر نیست`);

export const reviewIdParamSchema = z.object({
  id: objectIdSchema("شناسه نظر"),
});

export const productIdParamSchema = z.object({
  productId: objectIdSchema("شناسه محصول"),
});

export const createReviewSchema = z.object({
  productId: objectIdSchema("شناسه محصول"),
  variantId: objectIdSchema("شناسه تنوع محصول").optional(),
  rating: z
    .number({ message: "امتیاز الزامی است و باید عدد باشد" })
    .int("امتیاز باید یک عدد صحیح باشد")
    .min(1, "حداقل امتیاز ۱ است")
    .max(5, "حداکثر امتیاز ۵ است"),
  title: z
    .string({ message: "عنوان نظر باید متنی باشد" })
    .trim()
    .min(3, "عنوان نظر باید حداقل ۳ کاراکتر باشد")
    .max(100, "عنوان نظر نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
    .optional(),
  body: z
    .string({ message: "متن نظر باید متنی باشد" })
    .trim()
    .min(5, "متن نظر باید حداقل ۵ کاراکتر باشد")
    .max(1000, "متن نظر نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد")
    .optional(),
});

export const updateReviewSchema = z
  .object({
    rating: z
      .number({ message: "امتیاز باید عدد باشد" })
      .int("امتیاز باید عدد صحیح باشد")
      .min(1, "حداقل امتیاز ۱ است")
      .max(5, "حداکثر امتیاز ۵ است")
      .optional(),
    title: z
      .string({ message: "عنوان نظر باید متنی باشد" })
      .trim()
      .min(3, "عنوان نظر باید حداقل ۳ کاراکتر باشد")
      .max(100, "عنوان نظر نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
      .optional(),
    body: z
      .string({ message: "متن نظر باید متنی باشد" })
      .trim()
      .min(5, "متن نظر باید حداقل ۵ کاراکتر باشد")
      .max(1000, "متن نظر نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد")
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "حداقل یک فیلد برای ویرایش نظر باید ارسال شود",
  );

export const updateReviewStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"], {
    message: "وضعیت باید یکی از مقادیر PENDING، APPROVED یا REJECTED باشد",
  }),
});

export const getProductReviewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  sortBy: z
    .enum(["newest", "oldest", "rating_desc", "rating_asc"])
    .default("newest"),
  hasImage: z.coerce.boolean().optional(), // در صورتی که بعداً تصویر اضافه شد
  verifiedOnly: z.coerce.boolean().optional(),
});

export const getAdminReviewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  productId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "شناسه محصول نامعتبر است")
    .optional(),
  userId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "شناسه کاربر نامعتبر است")
    .optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(["createdAt", "rating", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type UpdateReviewStatusInput = z.infer<typeof updateReviewStatusSchema>;
export type GetProductReviewsQuery = z.infer<
  typeof getProductReviewsQuerySchema
>;
export type GetAdminReviewsQuery = z.infer<typeof getAdminReviewsQuerySchema>;
export type ReviewIdParam = z.infer<typeof reviewIdParamSchema>;
export type ProductIdParam = z.infer<typeof productIdParamSchema>;
