import { z } from "zod";
import mongoose from "mongoose";

const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "شناسه دسته‌بندی نامعتبر است (شناسه ObjectId نیست)",
  });

const categoryMetaSchema = z
  .object({
    title: z
      .string()
      .trim()
      .max(70, "عنوان سئو نباید بیشتر از ۷۰ کاراکتر باشد")
      .optional(),
    description: z
      .string()
      .trim()
      .max(160, "توضیحات سئو نباید بیشتر از ۱۶۰ کاراکتر باشد")
      .optional(),
    keywords: z
      .array(z.string().trim().min(2, "کلمه کلیدی بسیار کوتاه است"))
      .max(15, "تعداد کلمات کلیدی نمی‌تواند بیشتر از ۱۵ عدد باشد")
      .optional(),
  })
  .optional();

export const createCategorySchema = z
  .object({
    name: z
      .string({ message: "نام دسته‌بندی الزامی است" })
      .trim()
      .min(2, "نام دسته‌بندی باید حداقل ۲ کاراکتر باشد")
      .max(100, "نام دسته‌بندی نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد"),

    slug: z
      .string({ message: "نامک (slug) الزامی است" })
      .trim()
      .toLowerCase()
      .min(2, "اسلاگ باید حداقل ۲ کاراکتر باشد")
      .max(120, "اسلاگ نمی‌تواند بیشتر از ۱۲۰ کاراکتر باشد")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "اسلاگ باید فقط شامل حروف کوچک انگلیسی، اعداد و خط فاصله (-) باشد",
      ),

    type: z
      .enum(["MAIN", "SUB"], {
        message: "نوع دسته‌بندی باید MAIN یا SUB باشد",
      })
      .default("MAIN"),

    parent: objectIdSchema.nullable().optional(),

    description: z
      .string()
      .trim()
      .max(500, "توضیحات دسته‌بندی نباید بیشتر از ۵۰۰ کاراکتر باشد")
      .optional(),

    meta: categoryMetaSchema,
  })
  .refine(
    (data) => {
      // اگر زیردسته بود، والد الزامی است
      if (data.type === "SUB") {
        return !!data.parent;
      }
      return true;
    },
    {
      message:
        "برای دسته‌بندی‌های فرعی (SUB)، انتخاب دسته‌بندی والد (parent) الزامی است",
      path: ["parent"],
    },
  )
  .refine(
    (data) => {
      // اگر دسته اصلی بود، والد نباید مقدار داشته باشد
      if (data.type === "MAIN") {
        return !data.parent;
      }
      return true;
    },
    {
      message: "دسته‌بندی اصلی (MAIN) نمی‌تواند دسته‌بندی والد داشته باشد",
      path: ["parent"],
    },
  );

export const updateCategorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "نام دسته‌بندی باید حداقل ۲ کاراکتر باشد")
      .max(100, "نام دسته‌بندی نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
      .optional(),

    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2, "اسلاگ باید حداقل ۲ کاراکتر باشد")
      .max(120, "اسلاگ نمی‌تواند بیشتر از ۱۲۰ کاراکتر باشد")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "اسلاگ باید فقط شامل حروف کوچک انگلیسی، اعداد و خط فاصله (-) باشد",
      )
      .optional(),

    type: z.enum(["MAIN", "SUB"]).optional(),

    parent: objectIdSchema.nullable().optional(),

    description: z
      .string()
      .trim()
      .max(500, "توضیحات دسته‌بندی نباید بیشتر از ۵۰۰ کاراکتر باشد")
      .optional(),

    meta: categoryMetaSchema,
  })
  .refine(
    (data) => {
      if (data.type === "MAIN" && data.parent) {
        return false;
      }
      return true;
    },
    {
      message: "دسته‌بندی اصلی نمی‌تواند والد داشته باشد",
      path: ["parent"],
    },
  );

export const categoryIdParamSchema = z.object({
  id: objectIdSchema,
});

export const categorySlugParamSchema = z.object({
  slug: z.string().trim().toLowerCase().min(1, "اسلاگ الزامی است"),
});

export const categoryQuerySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
  search: z.string().optional(),
  type: z.enum(["MAIN", "SUB"]).optional(),
  parent: objectIdSchema.optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>;
