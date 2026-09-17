import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { Types } from "mongoose";
import Controller from "@/controller";
import Cart, { type ICartDocument } from "@/models/Cart";

export const GUEST_COOKIE_NAME = "guestId";
const GUEST_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

const cartController = new (class extends Controller {
  private getClientIdentity(
    req: Request,
    res: Response,
    autoCreateGuest: boolean = false,
  ): { userId?: string; guestId?: string } {
    const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
    if (userId) {
      return { userId };
    }

    let guestId = req.cookies?.[GUEST_COOKIE_NAME];

    if (!guestId && autoCreateGuest) {
      guestId = randomUUID();
      res.cookie(GUEST_COOKIE_NAME, guestId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: GUEST_COOKIE_MAX_AGE,
        path: "/",
      });
    }

    return { guestId };
  }

  private formatCart(cart: ICartDocument | null) {
    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        _id: null,
        items: [],
        totalItems: 0,
        totalQuantity: 0,
      };
    }

    const totalQuantity = cart.items.reduce(
      (acc, item) => acc + (item.quantity || 0),
      0,
    );

    return {
      _id: cart._id,
      items: cart.items,
      totalItems: cart.items.length,
      totalQuantity,
      updatedAt: cart.updatedAt,
    };
  }

  async getCart(req: Request, res: Response) {
    try {
      const { userId, guestId } = this.getClientIdentity(req, res, false);

      if (!userId && !guestId) {
        return this.sendResponse(
          res,
          this.formatCart(null),
          200,
          "سبد خرید خالی است",
        );
      }

      const query = userId ? { userId } : { guestId };
      const cart = await Cart.findOne(query).populate({
        path: "items.variantId",
      });

      return this.sendResponse(
        res,
        this.formatCart(cart),
        200,
        "سبد خرید با موفقیت دریافت شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async addToCart(req: Request, res: Response) {
    try {
      const { variantId, quantity = 1 } = req.body;
      const { userId, guestId } = this.getClientIdentity(req, res, true);

      const query = userId ? { userId } : { guestId };
      let cart = await Cart.findOne(query);

      if (!cart) {
        cart = new Cart({
          ...(userId ? { userId: new Types.ObjectId(userId) } : { guestId }),
          items: [],
        });
      }

      const existingItem = cart.items.find(
        (item) => item.variantId.toString() === variantId,
      );

      if (existingItem) {
        const newQty = existingItem.quantity + quantity;
        if (newQty > 99) {
          return this.sendError(
            res,
            "حداکثر تعداد مجاز برای هر کالا ۹۹ عدد است",
            400,
          );
        }
        existingItem.quantity = newQty;
      } else {
        if (cart.items.length >= 50) {
          return this.sendError(
            res,
            "سقف تنوع سبد خرید تکمیل است (حداکثر ۵۰ قلم کالای مختلف)",
            400,
          );
        }

        cart.items.push({
          variantId: new Types.ObjectId(variantId),
          quantity,
        });
      }

      await cart.save();
      await cart.populate({ path: "items.variantId" });

      return this.sendResponse(
        res,
        this.formatCart(cart),
        200,
        "کالا با موفقیت به سبد خرید اضافه شد",
      );
    } catch (error: any) {
      if (error.name === "ValidationError") {
        return this.sendError(res, error.message, 400);
      }
      return this.sendServerError(res);
    }
  }

  async updateQuantity(req: Request, res: Response) {
    try {
      const { variantId } = req.params;
      const { quantity } = req.body;
      const { userId, guestId } = this.getClientIdentity(req, res, false);

      if (!userId && !guestId) {
        return this.sendError(res, "سبد خریدی یافت نشد", 404);
      }

      const query = userId ? { userId } : { guestId };
      const cart = await Cart.findOne(query);

      if (!cart) {
        return this.sendError(res, "سبد خرید یافت نشد", 404);
      }

      const targetItem = cart.items.find(
        (item) => item.variantId.toString() === variantId,
      );

      if (!targetItem) {
        return this.sendError(res, "کالای مورد نظر در سبد خرید یافت نشد", 404);
      }

      targetItem.quantity = quantity;

      await cart.save();
      await cart.populate({ path: "items.variantId" });

      return this.sendResponse(
        res,
        this.formatCart(cart),
        200,
        "تعداد کالا به‌روزرسانی شد",
      );
    } catch (error: any) {
      if (error.name === "ValidationError") {
        return this.sendError(res, error.message, 400);
      }
      return this.sendServerError(res);
    }
  }

  async removeItem(req: Request, res: Response) {
    try {
      const { variantId } = req.params;
      const { userId, guestId } = this.getClientIdentity(req, res, false);

      if (!userId && !guestId) {
        return this.sendError(res, "سبد خریدی یافت نشد", 404);
      }

      const query = userId ? { userId } : { guestId };
      const cart = await Cart.findOne(query);

      if (!cart) {
        return this.sendError(res, "سبد خرید یافت نشد", 404);
      }

      const initialCount = cart.items.length;
      cart.items = cart.items.filter(
        (item) => item.variantId.toString() !== variantId,
      );

      if (cart.items.length === initialCount) {
        return this.sendError(res, "کالای مورد نظر در سبد خرید یافت نشد", 404);
      }

      await cart.save();
      await cart.populate({ path: "items.variantId" });

      return this.sendResponse(
        res,
        this.formatCart(cart),
        200,
        "کالا با موفقیت از سبد حذف شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async clearCart(req: Request, res: Response) {
    try {
      const { userId, guestId } = this.getClientIdentity(req, res, false);

      if (!userId && !guestId) {
        return this.sendResponse(
          res,
          this.formatCart(null),
          200,
          "سبد خرید از قبل خالی است",
        );
      }

      const query = userId ? { userId } : { guestId };
      await Cart.findOneAndDelete(query);

      return this.sendResponse(
        res,
        this.formatCart(null),
        200,
        "سبد خرید با موفقیت خالی شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async syncCart(req: Request, res: Response) {
    try {
      const { items } = req.body as {
        items: { variantId: string; quantity: number }[];
      };
      const { userId, guestId } = this.getClientIdentity(req, res, true);

      const query = userId ? { userId } : { guestId };
      let cart = await Cart.findOne(query);

      if (!cart) {
        cart = new Cart({
          ...(userId ? { userId: new Types.ObjectId(userId) } : { guestId }),
          items: [],
        });
      }

      cart.items = items.map((item) => ({
        variantId: new Types.ObjectId(item.variantId),
        quantity: item.quantity,
      }));

      await cart.save();
      await cart.populate({ path: "items.variantId" });

      return this.sendResponse(
        res,
        this.formatCart(cart),
        200,
        "سبد خرید با موفقیت همگام‌سازی شد",
      );
    } catch (error: any) {
      if (error.name === "ValidationError") {
        return this.sendError(res, error.message, 400);
      }
      return this.sendServerError(res);
    }
  }
})();

export default cartController;
