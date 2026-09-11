import Controller from "@/controller";
import Product from "@/models/Product";
import type { Request, Response } from "express";

const productController = new (class extends Controller {
  async getProducts(req: Request, res: Response) {
    try {
      const {
        page = "1",
        limit = "10",
        search = "",
        category,
        brand,
        minPrice,
        maxPrice,
        inStock,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query as Record<string, string | undefined>;

      const queryFilter: Record<string, any> = { deletedAt: null };

      if (search && search.trim() !== "") {
        const searchRegex = new RegExp(search.trim(), "i");
        queryFilter.$or = [
          { title: searchRegex },
          { description: searchRegex },
          { tags: { $in: [searchRegex] } },
        ];
      }

      if (category) {
        queryFilter.category = category;
      }

      if (brand) {
        queryFilter.brand = new RegExp(brand.trim(), "i");
      }

      if (minPrice || maxPrice) {
        queryFilter.basePrice = {};
        if (minPrice) queryFilter.basePrice.$gte = Number(minPrice);
        if (maxPrice) queryFilter.basePrice.$lte = Number(maxPrice);
      }

      if (inStock === "true") {
        queryFilter.stock = { $gt: 0 };
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
      const skip = (pageNum - 1) * limitNum;

      const sortOptions: Record<string, 1 | -1> = {
        [sortBy]: sortOrder === "asc" ? 1 : -1,
      };

      const [products, total] = await Promise.all([
        Product.find(queryFilter)
          .populate("category", "name slug")
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
      }).populate("category", "name slug");

      if (!product) {
        return this.sendError(res, "محصول مورد نظر یافت نشد", 404);
      }

      return this.sendResponse(
        res,
        product,
        200,
        "اطلاعات محصول با موفقیت دریافت شد",
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
      }).populate("category", "name slug");

      if (!product) {
        return this.sendError(res, "محصولی با این اسلاگ پیدا نشد", 404);
      }

      return this.sendResponse(
        res,
        product,
        200,
        "اطلاعات محصول با موفقیت دریافت شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async createProduct(req: Request, res: Response) {
    try {
      const payload = req.body;

      if (payload.slug) {
        const existingProduct = await Product.findOne({
          slug: payload.slug,
          deletedAt: null,
        });

        if (existingProduct) {
          return this.sendError(res, "این اسلاگ (slug) قبلاً ثبت شده است", 409);
        }
      }

      const product = await Product.create(payload);

      return this.sendResponse(
        res,
        product,
        201,
        "محصول جدید با موفقیت ایجاد شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // بررسی تکراری نبودن اسلاگ جدید
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
    try {
      const { id } = req.params;

      const product = await Product.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date(), isActive: false } },
        { new: true },
      );

      if (!product) {
        return this.sendError(
          res,
          "محصول مورد نظر یافت نشد یا قبلاً حذف شده است",
          404,
        );
      }

      return this.sendResponse(res, null, 200, "محصول با موفقیت حذف شد");
    } catch (error) {
      return this.sendServerError(res);
    }
  }
})();

export default productController;
