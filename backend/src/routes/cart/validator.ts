import { z } from "zod";

export const objectIdSchema = z
  .string({
    required_error: "شناسه الزامی است",
    invalid_type_error: "شناسه باید رشته متنی باشد",
  })
  .trim()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "فرمت شناسه معتبر نیست (باید ObjectId معتبر باشد)",
  );

export const addToCartSchema = z.object({
  body: z.object({
    variantId: objectIdSchema,
    quantity: z
      .number({
        required_error: "تعداد الزامی است",
        invalid_type_error: "تعداد باید عدد باشد",
      })
      .int("تعداد باید یک عدد صحیح باشد")
      .min(1, "حداقل تعداد مجاز ۱ عدد است")
      .max(99, "حداکثر تعداد مجاز برای هر آیتم ۹۹ عدد است")
      .default(1),
  }),
});

export const updateCartItemSchema = z.object({
  params: z.object({
    variantId: objectIdSchema,
  }),
  body: z.object({
    quantity: z
      .number({
        required_error: "تعداد الزامی است",
        invalid_type_error: "تعداد باید عدد باشد",
      })
      .int("تعداد باید یک عدد صحیح باشد")
      .min(1, "حداقل تعداد مجاز ۱ عدد است")
      .max(99, "حداکثر تعداد مجاز برای هر آیتم ۹۹ عدد است"),
  }),
});

export const removeCartItemSchema = z.object({
  params: z.object({
    variantId: objectIdSchema,
  }),
});

export const syncCartSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          variantId: objectIdSchema,
          quantity: z
            .number()
            .int("تعداد باید عدد صحیح باشد")
            .min(1, "حداقل تعداد ۱ عدد است")
            .max(99, "حداکثر تعداد ۹۹ عدد است"),
        }),
      )
      .max(50, "سبد خرید نمی‌تواند بیش از ۵۰ قلم کالای مختلف داشته باشد")
      .refine(
        (items) => {
          const ids = items.map((item) => item.variantId);
          return new Set(ids).size === ids.length;
        },
        {
          message: "شناسه واریانت‌ها در لیست ارسالی نباید تکراری باشند",
        },
      ),
  }),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>["body"];
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type SyncCartInput = z.infer<typeof syncCartSchema>["body"];
