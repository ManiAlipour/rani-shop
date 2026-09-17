import Controller from "@/controller";
import Review, { type IReviewDocument } from "@/models/Review";
import Product from "@/models/Product";
import User from "@/models/User";
import Variant from "@/models/Variant";
import Order from "@/models/Order";
import type { Request, Response } from "express";
import { Types } from "mongoose";
import type {
  CreateReviewInput,
  UpdateReviewInput,
  UpdateReviewStatusInput,
  GetProductReviewsQuery,
  GetAdminReviewsQuery,
} from "./validator";

type ReviewFilter = {
  product?: Types.ObjectId;
  user?: Types.ObjectId;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  rating?: number;
  isVerifiedPurchase?: boolean;
  deletedAt: null;
};

class ReviewController extends Controller {
  private async recalculateProductRating(
    productId: Types.ObjectId | string,
  ): Promise<void> {
    const prodId =
      typeof productId === "string" ? new Types.ObjectId(productId) : productId;

    const stats = await Review.aggregate([
      {
        $match: {
          product: prodId,
          status: "APPROVED",
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: "$product",
          averageRating: { $avg: "$rating" },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(prodId, {
        rating: Math.round(stats[0].averageRating * 10) / 10,
        ratingCount: stats[0].ratingCount,
      });
    } else {
      await Product.findByIdAndUpdate(prodId, {
        rating: 0,
        ratingCount: 0,
      });
    }
  }

  sendReview = async (req: Request, res: Response) => {
    try {
      const { productId, variantId, rating, title, body } =
        req.body as CreateReviewInput;
      const userId = req.auth?.userId;

      if (!userId) {
        return this.sendError(res, "ابتدا وارد حساب کاربری خود شوید", 401);
      }

      const user = await User.findById(userId);
      if (!user) return this.sendError(res, "کاربر یافت نشد", 404);

      const product = await Product.findOne({
        _id: productId,
        deletedAt: null,
      });
      if (!product) return this.sendError(res, "محصول مورد نظر یافت نشد", 404);

      if (variantId) {
        const variant = await Variant.findOne({
          _id: variantId,
          product: productId,
        });
        if (!variant) {
          return this.sendError(
            res,
            "تنوع انتخاب‌شده برای این محصول نامعتبر است",
            400,
          );
        }
      }

      const existingReview = await Review.findOne({
        product: productId,
        user: userId,
        deletedAt: null,
      });

      if (existingReview) {
        return this.sendError(
          res,
          "شما قبلاً برای این محصول نظر ثبت کرده‌اید",
          409,
        );
      }

      const hasPurchased = await Order.exists({
        user: userId,
        "items.product": productId,
        status: { $in: ["PAID", "DELIVERED", "SHIPPED"] },
      });

      const newReview = await Review.create({
        user: userId,
        product: productId,
        variantId: variantId || undefined,
        rating,
        title: title || undefined,
        body: body || undefined,
        isVerifiedPurchase: Boolean(hasPurchased),
        status: "PENDING",
      });

      return this.sendResponse(
        res,
        newReview.toObject(),
        201,
        "نظر شما با موفقیت ثبت شد و پس از بررسی منتشر خواهد شد",
      );
    } catch (error: any) {
      if (error?.code === 11000) {
        return this.sendError(
          res,
          "شما قبلاً برای این محصول نظر ثبت کرده‌اید",
          409,
        );
      }
      return this.sendServerError(res);
    }
  };

  getProductReviews = async (req: Request, res: Response) => {
    try {
      const productId = String(req.params.productId);
      const { page, limit, rating, sortBy, verifiedOnly } =
        req.query as unknown as GetProductReviewsQuery;

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      const query: ReviewFilter = {
        product: new Types.ObjectId(productId),
        status: "APPROVED",
        deletedAt: null,
      };

      if (rating) query.rating = Number(rating);
      if (verifiedOnly) query.isVerifiedPurchase = true;

      const sortMap: Record<string, Record<string, 1 | -1>> = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        rating_desc: { rating: -1, createdAt: -1 },
        rating_asc: { rating: 1, createdAt: -1 },
      };
      const sortOptions = sortMap[sortBy] || sortMap.newest;

      const [reviews, total] = await Promise.all([
        Review.find(query)
          .populate("user", "firstName lastName avatar")
          .populate("variantId", "color size title")
          .sort(sortOptions)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Review.countDocuments(query),
      ]);

      return this.sendResponse(res, {
        reviews,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch {
      return this.sendServerError(res);
    }
  };

  updateUserReview = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const userId = req.auth?.userId;
      const updateData = req.body as UpdateReviewInput;

      const review = await Review.findOne({
        _id: id,
        user: userId,
        deletedAt: null,
      });

      if (!review) {
        return this.sendError(
          res,
          "نظر مورد نظر یافت نشد یا دسترسی ویرایش ندارید",
          404,
        );
      }

      const prevStatus = review.status;

      if (updateData.rating !== undefined) review.rating = updateData.rating;
      if (updateData.title !== undefined) review.title = updateData.title;
      if (updateData.body !== undefined) review.body = updateData.body;
      review.status = "PENDING";

      await review.save();

      if (prevStatus === "APPROVED") {
        await this.recalculateProductRating(review.product);
      }

      return this.sendResponse(
        res,
        review.toObject(),
        200,
        "نظر شما ویرایش شد و پس از بازبینی تایید می‌شود",
      );
    } catch {
      return this.sendServerError(res);
    }
  };

  deleteUserReview = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const userId = req.auth?.userId;

      const review = await Review.findOne({
        _id: id,
        user: userId,
        deletedAt: null,
      });

      if (!review) {
        return this.sendError(
          res,
          "نظر یافت نشد یا شما مجاز به حذف آن نیستید",
          404,
        );
      }

      review.deletedAt = new Date();
      await review.save();

      if (review.status === "APPROVED") {
        await this.recalculateProductRating(review.product);
      }

      return this.sendResponse(res, null, 200, "نظر با موفقیت حذف شد");
    } catch {
      return this.sendServerError(res);
    }
  };

  changeReviewStatus = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const { status } = req.body as UpdateReviewStatusInput;

      const review = await Review.findOne({ _id: id, deletedAt: null });
      if (!review) {
        return this.sendError(res, "نظر یافت نشد", 404);
      }

      review.status = status;
      await review.save();

      await this.recalculateProductRating(review.product);

      return this.sendResponse(
        res,
        review.toObject(),
        200,
        `وضعیت نظر با موفقیت به ${status} تغییر یافت`,
      );
    } catch {
      return this.sendServerError(res);
    }
  };

  getAllReviewsAdmin = async (req: Request, res: Response) => {
    try {
      const {
        page,
        limit,
        status,
        productId,
        userId,
        rating,
        sortBy,
        sortOrder,
      } = req.query as unknown as GetAdminReviewsQuery;

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 20;
      const skip = (pageNum - 1) * limitNum;

      const query: ReviewFilter = { deletedAt: null };

      if (status) query.status = status;
      if (productId) query.product = new Types.ObjectId(String(productId));
      if (userId) query.user = new Types.ObjectId(String(userId));
      if (rating) query.rating = Number(rating);

      const sortOptions: Record<string, 1 | -1> = {
        [sortBy || "createdAt"]: sortOrder === "asc" ? 1 : -1,
      };

      const [reviews, total] = await Promise.all([
        Review.find(query)
          .populate("user", "firstName lastName email phone avatar")
          .populate("product", "title slug images")
          .populate("variantId", "color size sku")
          .sort(sortOptions)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Review.countDocuments(query),
      ]);

      return this.sendResponse(res, {
        reviews,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch {
      return this.sendServerError(res);
    }
  };

  adminDeleteReview = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);

      const review = await Review.findById(id);
      if (!review) return this.sendError(res, "نظر یافت نشد", 404);

      review.deletedAt = new Date();
      await review.save();

      await this.recalculateProductRating(review.product);

      return this.sendResponse(res, null, 200, "نظر توسط مدیر حذف شد");
    } catch {
      return this.sendServerError(res);
    }
  };
}

export default new ReviewController();
