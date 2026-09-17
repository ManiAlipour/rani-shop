import Controller from "@/controller";
import Cart, { type ICartDocument } from "@/models/Cart";
import Coupon, { type ICouponDocument } from "@/models/Coupon";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import { GUEST_COOKIE_NAME } from "../cart/controller";

interface IVariantPopulated {
  _id: string;
  price: number;
  stock?: number;
}

const couponController = new (class extends Controller {
  private async findTargetCart(req: Request) {
    const userId = req.auth?.userId;
    const guestId = req.cookies?.[GUEST_COOKIE_NAME];

    if (!userId && !guestId) return null;

    const filter = userId ? { userId } : { guestId };
    return await Cart.findOne(filter);
  }

  async addCoupon(req: Request, res: Response) {
    try {
      const { code } = req.body;

      if (!code || typeof code !== "string") {
        return this.sendError(res, "کد تخفیف معتبر نیست", 400);
      }

      const normalizedCode = code.trim().toUpperCase();

      const coupon = await Coupon.findOne({
        code: normalizedCode,
        deletedAt: null,
      });

      if (!coupon) {
        return this.sendError(res, "کد تخفیف نامعتبر است", 404);
      }

      if (!coupon.isActive) {
        return this.sendError(res, "کد تخفیف غیرفعال یا باطل شده است", 400);
      }

      const now = new Date();
      if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
        return this.sendError(
          res,
          "مهلت استفاده از این کد تخفیف به پایان رسیده است",
          400,
        );
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return this.sendError(
          res,
          "سقف استفاده از این کد تخفیف به پایان رسیده است",
          400,
        );
      }

      const userId = req.auth?.userId;
      const guestId = req.cookies?.[GUEST_COOKIE_NAME];

      if (!userId && !guestId) {
        return this.sendError(res, "شناسه کاربر یا مهمان نامعتبر است", 400);
      }

      const cartFilter = userId ? { userId } : { guestId };

      const cart = await Cart.findOne(cartFilter).populate<{
        items: { variantId: IVariantPopulated; quantity: number }[];
      }>("items.variantId", "price stock");

      if (!cart) {
        return this.sendError(res, "سبد خریدی یافت نشد", 404);
      }

      if (!cart.items || cart.items.length === 0) {
        return this.sendError(res, "سبد خرید شما خالی است", 400);
      }

      const subtotal = cart.items.reduce((sum, item) => {
        const itemPrice = item.variantId?.price ?? 0;
        return sum + itemPrice * item.quantity;
      }, 0);

      if (coupon.minPurchase && subtotal < coupon.minPurchase) {
        return this.sendError(
          res,
          `حداقل مبلغ خرید برای اعمال این کد ${coupon.minPurchase.toLocaleString("fa-IR")} تومان است`,
          400,
        );
      }

      let discountAmount = 0;
      if (coupon.type === "PERCENT") {
        discountAmount = Math.round((subtotal * coupon.value) / 100);
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      } else if (coupon.type === "FIXED") {
        discountAmount = coupon.value;
      }

      discountAmount = Math.min(discountAmount, subtotal);
      const payableAmount = Math.max(0, subtotal - discountAmount);

      (cart as unknown as ICartDocument).couponId = coupon._id;
      await cart.save();

      return this.sendResponse(
        res,
        {
          coupon: {
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
          },
          subtotal,
          discountAmount,
          payableAmount,
        },
        200,
        "کد تخفیف با موفقیت روی سبد خرید اعمال شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async removeCoupon(req: Request, res: Response) {
    try {
      const cart = await this.findTargetCart(req);

      if (!cart) {
        return this.sendError(res, "سبد خریدی یافت نشد", 404);
      }

      if (!(cart as unknown as ICartDocument).couponId) {
        return this.sendError(res, "کد تخفیفی روی این سبد اعمال نشده است", 400);
      }

      (cart as unknown as ICartDocument).couponId = null;
      await cart.save();

      return this.sendResponse(
        res,
        null,
        200,
        "کد تخفیف با موفقیت از سبد خرید حذف شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async getAppliedCoupon(req: Request, res: Response) {
    try {
      const cart = await this.findTargetCart(req);

      if (!cart || !(cart as unknown as ICartDocument).couponId) {
        return this.sendResponse(res, { coupon: null }, 200);
      }

      const coupon = await Coupon.findOne({
        _id: (cart as unknown as ICartDocument).couponId,
        deletedAt: null,
      }).select("code type value minPurchase maxDiscount expiresAt isActive");

      if (!coupon || !coupon.isActive) {
        (cart as unknown as ICartDocument).couponId = null;
        await cart.save();
        return this.sendResponse(
          res,
          { coupon: null },
          200,
          "کوپن قبلی دیگر معتبر نیست",
        );
      }

      return this.sendResponse(res, { coupon }, 200);
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async createCoupon(req: Request, res: Response) {
    try {
      const {
        code,
        type,
        value,
        minPurchase,
        maxDiscount,
        usageLimit,
        expiresAt,
      } = req.body;

      if (!code || !type || value === undefined || !expiresAt) {
        return this.sendError(
          res,
          "فیلدهای اجباری (کد، نوع، مقدار و تاریخ انقضا) را ارسال کنید",
          400,
        );
      }

      const normalizedCode = String(code).trim().toUpperCase();

      const existingCoupon = await Coupon.findOne({
        code: normalizedCode,
        deletedAt: null,
      });

      if (existingCoupon) {
        return this.sendError(
          res,
          "کد تخفیفی با این نام قبلاً ایجاد شده است",
          409,
        );
      }

      if (type === "PERCENT" && (value <= 0 || value > 100)) {
        return this.sendError(res, "درصد تخفیف باید بین ۱ تا ۱۰۰ باشد", 400);
      }

      if (new Date(expiresAt) <= new Date()) {
        return this.sendError(res, "تاریخ انقضا باید در آینده باشد", 400);
      }

      const newCoupon = await Coupon.create({
        code: normalizedCode,
        type,
        value,
        minPurchase: minPurchase || undefined,
        maxDiscount: maxDiscount || undefined,
        usageLimit: usageLimit || undefined,
        expiresAt: new Date(expiresAt),
      });

      return this.sendResponse(
        res,
        newCoupon,
        201,
        "کد تخفیف با موفقیت ایجاد شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async getAllCoupons(req: Request, res: Response) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
      const skip = (page - 1) * limit;

      const { search, isActive } = req.query;

      const query: Record<string, any> = { deletedAt: null };

      if (search) {
        query.code = { $regex: String(search).trim(), $options: "i" };
      }

      if (isActive !== undefined) {
        query.isActive = isActive === "true";
      }

      const [coupons, total] = await Promise.all([
        Coupon.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Coupon.countDocuments(query),
      ]);

      return this.sendResponse(
        res,
        {
          items: coupons,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
        200,
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async getCouponById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!this.isValidObjectId(id)) {
        return this.sendError(res, "شناسه کوپن نامعتبر است", 400);
      }

      const coupon = await Coupon.findOne({ _id: id, deletedAt: null });

      if (!coupon) {
        return this.sendError(res, "کد تخفیف یافت نشد", 404);
      }

      return this.sendResponse(res, coupon, 200);
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async updateCoupon(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        code,
        type,
        value,
        minPurchase,
        maxDiscount,
        usageLimit,
        expiresAt,
        isActive,
      } = req.body;

      if (!this.isValidObjectId(id)) {
        return this.sendError(res, "شناسه کوپن نامعتبر است", 400);
      }

      const coupon = await Coupon.findOne({ _id: id, deletedAt: null });
      if (!coupon) {
        return this.sendError(res, "کد تخفیف یافت نشد", 404);
      }

      if (code) {
        const normalizedCode = String(code).trim().toUpperCase();
        if (normalizedCode !== coupon.code) {
          const duplicate = await Coupon.findOne({
            code: normalizedCode,
            _id: { $ne: id },
            deletedAt: null,
          });
          if (duplicate) {
            return this.sendError(
              res,
              "کد تخفیف دیگری با این نام وجود دارد",
              409,
            );
          }
          coupon.code = normalizedCode;
        }
      }

      if (type) coupon.type = type;
      if (value !== undefined) {
        if (coupon.type === "PERCENT" && (value <= 0 || value > 100)) {
          return this.sendError(res, "درصد تخفیف باید بین ۱ تا ۱۰۰ باشد", 400);
        }
        coupon.value = value;
      }

      if (minPurchase !== undefined) coupon.minPurchase = minPurchase;
      if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount;
      if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
      if (expiresAt) coupon.expiresAt = new Date(expiresAt);
      if (isActive !== undefined) coupon.isActive = Boolean(isActive);

      await coupon.save();

      return this.sendResponse(
        res,
        coupon,
        200,
        "کد تخفیف با موفقیت به‌روزرسانی شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async toggleCouponStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!this.isValidObjectId(id)) {
        return this.sendError(res, "شناسه کوپن نامعتبر است", 400);
      }

      const coupon = await Coupon.findOne({ _id: id, deletedAt: null });
      if (!coupon) {
        return this.sendError(res, "کد تخفیف یافت نشد", 404);
      }

      coupon.isActive = !coupon.isActive;
      await coupon.save();

      return this.sendResponse(
        res,
        { isActive: coupon.isActive },
        200,
        `کد تخفیف با موفقیت ${coupon.isActive ? "فعال" : "غیرفعال"} شد`,
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async deleteCoupon(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!this.isValidObjectId(id)) {
        return this.sendError(res, "شناسه کوپن نامعتبر است", 400);
      }

      const coupon = await Coupon.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date(), isActive: false } },
        { new: true },
      );

      if (!coupon) {
        return this.sendError(
          res,
          "کد تخفیف یافت نشد یا قبلاً حذف شده است",
          404,
        );
      }

      return this.sendResponse(res, null, 200, "کد تخفیف با موفقیت حذف شد");
    } catch (error) {
      return this.sendServerError(res);
    }
  }
})();

export default couponController;
