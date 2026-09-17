import { z } from "zod";

// الگوی استاندارد کد کوپون: فقط حروف انگلیسی، اعداد، خط تیره (-) و آندرلاین (_)
const couponCodeRegex = /^[A-Za-z0-9_-]+$/;

/**
 * اسکیمای پایه کد کوپون
 * - حروف به‌صورت خودکار Uppercase می‌شوند تا با دیتابیس همخوانی کامل داشته باشند.
 */
export const couponCodeSchema = z
  .string({ message: "کد کوپون باید به صورت متنی باشد" })
  .trim()
  .min(3, "کد کوپون باید حداقل ۳ کاراکتر باشد")
  .max(30, "کد کوپون نمی‌تواند بیشتر از ۳۰ کاراکتر باشد")
  .regex(
    couponCodeRegex,
    "کد تخفیف فقط می‌تواند شامل حروف انگلیسی، اعداد، خط تیره (-) و (_) باشد",
  )
  .transform((val) => val.toUpperCase());

/**
 * اسکیمای اعتبارسنجی ObjectId مانگوس برای پارامترهای آدرس (Route Params)
 * ---
 * !!! اصلاح شده: نام فیلد به 'id' تغییر یافت تا با روتر مطابقت داشته باشد !!!
 */
export const couponIdParamSchema = z.object({
  id: z // <-- تغییر از couponId به id
    .string({ message: "شناسه کوپن الزامی است" })
    .regex(/^[0-9a-fA-F]{24}$/, "شناسه کوپن معتبر نیست"),
});

/**
 * اسکیمای ساخت کوپون جدید (توسط ادمین)
 */
export const createCouponSchema = z
  .object({
    code: couponCodeSchema,
    type: z.enum(["PERCENT", "FIXED"], {
      message: "نوع تخفیف باید درصدی (PERCENT) یا مبلغ ثابت (FIXED) باشد",
    }),
    value: z
      .number({ message: "مقدار تخفیف باید عدد باشد" })
      .positive("مقدار تخفیف باید بزرگ‌تر از صفر باشد"),
    minPurchase: z
      .number({ message: "حداقل مبلغ خرید باید عدد باشد" })
      .min(0, "حداقل مبلغ خرید نمی‌تواند منفی باشد")
      .optional(),
    maxDiscount: z
      .number({ message: "حداکثر سقف تخفیف باید عدد باشد" })
      .min(0, "سقف تخفیف نمی‌تواند منفی باشد")
      .optional(),
    usageLimit: z
      .number({ message: "سقف استفاده باید عدد باشد" })
      .int("سقف استفاده باید عدد صحیح باشد")
      .min(1, "سقف استفاده باید حداقل ۱ بار باشد")
      .optional(),
    expiresAt: z.coerce
      .date({ message: "فرمت تاریخ انقضا نامعتبر است" })
      .refine(
        (date) => date.getTime() > Date.now(),
        "تاریخ انقضا باید حتماً در آینده باشد",
      ),
    isActive: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    // قانون ۱: درصد تخفیف نباید بالای ۱۰۰ باشد
    if (data.type === "PERCENT" && data.value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ درصد باشد",
      });
    }

    // قانون ۲: برای تخفیف ثابت (FIXED)، سقف تخفیف (maxDiscount) بی‌معنی است
    if (data.type === "FIXED" && data.maxDiscount !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxDiscount"],
        message:
          "تعریف سقف تخفیف (maxDiscount) فقط برای تخفیف‌های درصدی مجاز است",
      });
    }
  });

/**
 * اسکیمای ویرایش کوپون (توسط ادمین)
 */
export const updateCouponSchema = z
  .object({
    code: couponCodeSchema.optional(),
    type: z.enum(["PERCENT", "FIXED"]).optional(),
    value: z
      .number({ message: "مقدار تخفیف باید عدد باشد" })
      .positive("مقدار تخفیف باید بزرگ‌تر از صفر باشد")
      .optional(),
    minPurchase: z
      .number({ message: "حداقل مبلغ خرید باید عدد باشد" })
      .min(0, "حداقل مبلغ خرید نمی‌تواند منفی باشد")
      .optional(),
    maxDiscount: z
      .number({ message: "حداکثر سقف تخفیف باید عدد باشد" })
      .min(0, "سقف تخفیف نمی‌تواند منفی باشد")
      .optional(),
    usageLimit: z
      .number({ message: "سقف استفاده باید عدد باشد" })
      .int("سقف استفاده باید عدد صحیح باشد")
      .min(1, "سقف استفاده باید حداقل ۱ بار باشد")
      .optional(),
    expiresAt: z.coerce
      .date({ message: "فرمت تاریخ انقضا نامعتبر است" })
      .refine(
        (date) => date.getTime() > Date.now(),
        "تاریخ انقضا باید حتماً در آینده باشد",
      )
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "حداقل یک فیلد برای به‌روزرسانی باید ارسال شود",
  )
  .superRefine((data, ctx) => {
    if (
      data.type === "PERCENT" &&
      data.value !== undefined &&
      data.value > 100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ درصد باشد",
      });
    }

    if (data.type === "FIXED" && data.maxDiscount !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxDiscount"],
        message: "تعریف سقف تخفیف فقط برای تخفیف‌های درصدی امکان‌پذیر است",
      });
    }
  });

/**
 * اسکیمای اعمال / حذف کوپون در سبد خرید (توسط کاربر)
 */
export const applyCouponSchema = z.object({
  code: couponCodeSchema,
});

// Type Definitions جهت استفاده در Controller و Service
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
