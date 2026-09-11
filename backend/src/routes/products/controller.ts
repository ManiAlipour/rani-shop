import Controller from "@/controller";
import Product from "@/models/Product";
import Variant from "@/models/Variant";
import mongoose from "mongoose";
import type { Request, Response } from "express";

const productController = new (class extends Controller {
  async getProducts(req: Request, res: Response) {
    try {
      const {
        page = "1",
        limit = "10",
        search = "",
        categoryId,
        brand,
        minPrice,
        maxPrice,
        inStock,
        isActive,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query as Record<string, string | undefined>;

      const queryFilter: Record<string, any> = { deletedAt: null };

      if (isActive !== undefined) {
        queryFilter.isActive = isActive === "true";
      }

      if (categoryId) {
        queryFilter.categoryId = categoryId;
      }

      if (brand) {
        queryFilter.brand = new RegExp(brand.trim(), "i");
      }

      if (minPrice || maxPrice) {
        queryFilter.basePrice = {};
        if (minPrice) queryFilter.basePrice.$gte = Number(minPrice);
        if (maxPrice) queryFilter.basePrice.$lte = Number(maxPrice);
      }

      if (search && search.trim() !== "") {
        const searchRegex = new RegExp(search.trim(), "i");
        queryFilter.$or = [
          { title: searchRegex },
          { description: searchRegex },
          { tags: { $in: [searchRegex] } },
        ];
      }

      if (inStock !== undefined) {
        const isInStock = inStock === "true";
        if (isInStock) {
          const inStockProductIds = await Variant.distinct("productId", {
            deletedAt: null,
            stock: { $gt: 0 },
          });
          queryFilter._id = { $in: inStockProductIds };
        } else {
          const inStockProductIds = await Variant.distinct("productId", {
            deletedAt: null,
            stock: { $gt: 0 },
          });
          queryFilter._id = { $nin: inStockProductIds };
        }
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
      const skip = (pageNum - 1) * limitNum;

      const sortOptions: Record<string, 1 | -1> = {
        [sortBy]: sortOrder === "asc" ? 1 : -1,
      };

      const [products, total] = await Promise.all([
        Product.find(queryFilter)
          .populate("categoryId", "name slug")
          .sort(sortOptions)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Product.countDocuments(queryFilter),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      return this.sendResponse(
        res,
        {
          items: products,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
          },
        },
        200,
        "لیست محصولات با موفقیت دریافت شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const product = await Product.findOne({
        _id: id,
        deletedAt: null,
      }).populate("categoryId", "name slug");

      if (!product) {
        return this.sendError(res, "محصول مورد نظر یافت نشد", 404);
      }

      const variants = await Variant.find({
        productId: product._id,
        deletedAt: null,
      }).lean();

      return this.sendResponse(
        res,
        { ...product.toObject(), variants },
        200,
        "اطلاعات محصول به همراه واریانت‌ها دریافت شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async getProductBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;

      const product = await Product.findOne({
        slug,
        deletedAt: null,
      }).populate("categoryId", "name slug");

      if (!product) {
        return this.sendError(res, "محصولی با این اسلاگ پیدا نشد", 404);
      }

      const variants = await Variant.find({
        productId: product._id,
        deletedAt: null,
      }).lean();

      return this.sendResponse(
        res,
        { ...product.toObject(), variants },
        200,
        "اطلاعات محصول به همراه واریانت‌ها دریافت شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async createProduct(req: Request, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { variants, ...productPayload } = req.body;

      if (productPayload.slug) {
        const existingProduct = await Product.findOne({
          slug: productPayload.slug,
          deletedAt: null,
        }).session(session);

        if (existingProduct) {
          await session.abortTransaction();
          return this.sendError(res, "این اسلاگ (slug) قبلاً ثبت شده است", 409);
        }
      }

      const newProduct = new Product(productPayload);
      await newProduct.save({ session });

      let createdVariants: any[] = [];
      if (variants && Array.isArray(variants) && variants.length > 0) {
        const variantsToInsert = variants.map((v) => ({
          ...v,
          productId: newProduct._id,
        }));
        createdVariants = await Variant.insertMany(variantsToInsert, {
          session,
        });
      }

      await session.commitTransaction();

      return this.sendResponse(
        res,
        { ...newProduct.toObject(), variants: createdVariants },
        201,
        "محصول جدید با موفقیت ایجاد شد",
      );
    } catch (error: any) {
      await session.abortTransaction();
      if (error.code === 11000 && error.keyPattern?.sku) {
        return this.sendError(res, "کد SKU واریانت تکراری است", 409);
      }
      return this.sendServerError(res);
    } finally {
      session.endSession();
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (updates.slug) {
        const duplicateSlug = await Product.findOne({
          slug: updates.slug,
          _id: { $ne: id },
          deletedAt: null,
        });

        if (duplicateSlug) {
          return this.sendError(
            res,
            "این نامک (slug) قبلاً برای محصول دیگری ثبت شده است",
            409,
          );
        }
      }

      const updatedProduct = await Product.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: updates },
        { new: true, runValidators: true },
      );

      if (!updatedProduct) {
        return this.sendError(res, "محصولی برای ویرایش یافت نشد", 404);
      }

      return this.sendResponse(
        res,
        updatedProduct,
        200,
        "محصول با موفقیت ویرایش شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async deleteProduct(req: Request, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params;
      const now = new Date();

      const product = await Product.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: now, isActive: false } },
        { new: true, session },
      );

      if (!product) {
        await session.abortTransaction();
        return this.sendError(
          res,
          "محصول مورد نظر یافت نشد یا قبلاً حذف شده است",
          404,
        );
      }

      await Variant.updateMany(
        { productId: id, deletedAt: null },
        { $set: { deletedAt: now } },
        { session },
      );

      await session.commitTransaction();

      return this.sendResponse(
        res,
        null,
        200,
        "محصول و تمام واریانت‌های آن با موفقیت حذف شدند",
      );
    } catch (error) {
      await session.abortTransaction();
      return this.sendServerError(res);
    } finally {
      session.endSession();
    }
  }

  async addVariant(req: Request, res: Response) {
    try {
      const { id: productId } = req.params;
      const variantData = req.body;

      const product = await Product.findOne({
        _id: productId,
        deletedAt: null,
      });
      if (!product) {
        return this.sendError(
          res,
          "محصول مورد نظر برای افزودن واریانت یافت نشد",
          404,
        );
      }

      const existingSku = await Variant.findOne({
        sku: variantData.sku,
        deletedAt: null,
      });
      if (existingSku) {
        return this.sendError(res, "این کد SKU قبلاً ثبت شده است", 409);
      }

      const newVariant = await Variant.create({
        ...variantData,
        productId,
      });

      return this.sendResponse(
        res,
        newVariant,
        201,
        "واریانت جدید با موفقیت اضافه شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async updateVariant(req: Request, res: Response) {
    try {
      const { variantId } = req.params;
      const updates = req.body;

      if (updates.sku) {
        const duplicateSku = await Variant.findOne({
          sku: updates.sku,
          _id: { $ne: variantId },
          deletedAt: null,
        });
        if (duplicateSku) {
          return this.sendError(res, "کد SKU مورد نظر تکراری است", 409);
        }
      }

      const updatedVariant = await Variant.findOneAndUpdate(
        { _id: variantId, deletedAt: null },
        { $set: updates },
        { new: true, runValidators: true },
      );

      if (!updatedVariant) {
        return this.sendError(res, "واریانت یافت نشد", 404);
      }

      return this.sendResponse(
        res,
        updatedVariant,
        200,
        "واریانت با موفقیت بروزرسانی شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async deleteVariant(req: Request, res: Response) {
    try {
      const { variantId } = req.params;

      const variant = await Variant.findOneAndUpdate(
        { _id: variantId, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true },
      );

      if (!variant) {
        return this.sendError(
          res,
          "واریانت یافت نشد یا قبلاً حذف شده است",
          404,
        );
      }

      return this.sendResponse(res, null, 200, "واریانت با موفقیت حذف شد");
    } catch (error) {
      return this.sendServerError(res);
    }
  }
})();

export default productController;
