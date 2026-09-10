import { z } from "zod";

export const USER_ROLES = ["user", "admin"] as const;
export const USER_STATUSES = ["ACTIVE", "INACTIVE", "BANNED"] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];

const RoleEnum = z.enum(USER_ROLES, { error: "نقش کاربر نامعتبر است" });
const UserStatusEnum = z.enum(USER_STATUSES, {
  error: "وضعیت کاربر نامعتبر است",
});

const persianMobileRegex = /^(\+98|0)?9\d{9}$/;
const objectIdRegex = /^[a-f\d]{24}$/i;

const UserCoreSchema = z.object({
  firstName: z
    .string()
    .min(1, "نام الزامی است")
    .max(50, "نام نباید بیش از ۵۰ کاراکتر باشد")
    .trim(),
  lastName: z
    .string()
    .max(50, "نام خانوادگی نباید بیش از ۵۰ کاراکتر باشد")
    .trim()
    .optional(),
  phoneNumber: z
    .string()
    .trim()
    .regex(persianMobileRegex, "فرمت شماره موبایل نامعتبر است"),
});

export const RegisterUserSchema = UserCoreSchema.extend({
  password: z
    .string()
    .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
    .max(72, "رمز عبور نمیتواند بیشتر از ۷۲ کاراکتر باشد")
    .regex(/[A-Za-z]/, "رمز عبور باید حداقل یک حرف لاتین داشته باشد")
    .regex(/\d/, "رمز عبور باید حداقل یک عدد داشته باشد")
    .optional(),
}).strict();

export const UpdateUserSchema = z
  .object({
    firstName: UserCoreSchema.shape.firstName.optional(),
    lastName: UserCoreSchema.shape.lastName.optional(),
    notifications: z.boolean().optional(),
    addresses: z
      .array(z.string().regex(objectIdRegex, "شناسه آدرس نامعتبر است"))
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "هیچ فیلدی برای بهروزرسانی ارسال نشده است",
  });

export const LoginWithOtpSchema = z
  .object({
    phoneNumber: UserCoreSchema.shape.phoneNumber,
  })
  .strict();

export const VerifyOtpSchema = z
  .object({
    phoneNumber: UserCoreSchema.shape.phoneNumber,
    code: z.string().regex(/^\d{4,6}$/, "کد تأیید باید ۴ تا ۶ رقم باشد"),
  })
  .strict();

export const UpdateRoleSchema = z
  .object({
    userId: z.string().regex(objectIdRegex, "شناسه کاربر نامعتبر است"),
    role: RoleEnum,
  })
  .strict();

export const UpdateUserStatusSchema = z
  .object({
    userId: z.string().regex(objectIdRegex, "شناسه کاربر نامعتبر است"),
    status: UserStatusEnum,
  })
  .strict();

export const CreateOtpSchema = z
  .object({
    codeHash: z.string().min(60).max(128),
    expiresAt: z
      .date()
      .refine((d) => d > new Date(), "تاریخ انقضا باید در آینده باشد"),
    attempts: z
      .number()
      .int()
      .nonnegative()
      .max(5, "حداکثر ۵ بار تلاش مجاز است"),
  })
  .strict();

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

export const extractZodErrors = (error: z.ZodError) =>
  error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
