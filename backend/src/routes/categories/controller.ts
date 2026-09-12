import Controller from "@/controller";
import Category from "@/models/Category";
import type { Request, Response } from "express";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryQueryInput,
} from "./validator";

const categoryController = new (class extends Controller {
  async getCategories(req: Request, res: Response) {
    try {
      const {
        page = "1",
        limit = "20",
        search,
        type,
        parent,
      } = req.query as unknown as CategoryQueryInput;

      const pageNumber = Math.max(1, parseInt(page, 10) || 1);
      const limitNumber = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
      const skip = (pageNumber - 1) * limitNumber;

      const filter: Record<string, any> = {};

      if (type) {
        filter.type = type;
      }

      if (parent) {
        filter.parent = parent;
      }

      if (search && search.trim()) {
        filter.$or = [
          { name: { $regex: search.trim(), $options: "i" } },
          { slug: { $regex: search.trim(), $options: "i" } },
        ];
      }

      const [categories, total] = await Promise.all([
        Category.find(filter)
          .populate("parent", "name slug type")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber)
          .lean(),
        Category.countDocuments(filter),
      ]);

      return this.sendResponse(
        res,
        {
          categories,
          pagination: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
            hasNextPage: pageNumber * limitNumber < total,
            hasPrevPage: pageNumber > 1,
          },
        },
        200,
        "لیست دسته‌بندی‌ها با موفقیت دریافت شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async getCategoryTree(_req: Request, res: Response) {
    try {
      const mainCategories = await Category.find({ type: "MAIN" }).lean();
      const subCategories = await Category.find({ type: "SUB" }).lean();

      const tree = mainCategories.map((mainCat) => ({
        ...mainCat,
        children: subCategories.filter(
          (sub) =>
            sub.parent && sub.parent.toString() === mainCat._id.toString(),
        ),
      }));

      return this.sendResponse(
        res,
        tree,
        200,
        "ساختار درختی دسته‌بندی‌ها با موفقیت دریافت شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async getCategoryById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const category = await Category.findById(id)
        .populate("parent", "name slug type")
        .lean();

      if (!category) {
        return this.sendError(res, "دسته‌بندی مورد نظر یافت نشد", 404);
      }

      return this.sendResponse(
        res,
        category,
        200,
        "اطلاعات دسته‌بندی با موفقیت دریافت شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async getCategoryBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;

      const category = await Category.findOne({ slug })
        .populate("parent", "name slug type")
        .lean();

      if (!category) {
        return this.sendError(res, "دسته‌بندی مورد نظر یافت نشد", 404);
      }

      return this.sendResponse(
        res,
        category,
        200,
        "اطلاعات دسته‌بندی با موفقیت دریافت شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async createCategory(req: Request, res: Response) {
    try {
      const body = req.body as CreateCategoryInput;

      const slugExists = await Category.findOne({ slug: body.slug });
      if (slugExists) {
        return this.sendError(
          res,
          "این نامک (slug) از قبل وجود دارد و باید یکتا باشد",
          409,
        );
      }

      if (body.type === "SUB" && body.parent) {
        const parentExists = await Category.findById(body.parent);
        if (!parentExists) {
          return this.sendError(res, "دسته‌بندی والد مشخص‌شده وجود ندارد", 404);
        }
      }

      const category = await Category.create({
        name: body.name,
        slug: body.slug,
        type: body.type,
        ...(body.type === "SUB" && body.parent ? { parent: body.parent } : {}),
        description: body.description,
        meta: body.meta,
      });

      return this.sendResponse(
        res,
        category,
        201,
        "دسته‌بندی جدید با موفقیت ایجاد شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const body = req.body as UpdateCategoryInput;

      const category = await Category.findById(id);
      if (!category) {
        return this.sendError(
          res,
          "دسته‌بندی مورد نظر برای ویرایش یافت نشد",
          404,
        );
      }

      if (body.slug && body.slug !== category.slug) {
        const slugExists = await Category.findOne({
          slug: body.slug,
          _id: { $ne: id },
        });

        if (slugExists) {
          return this.sendError(
            res,
            "این نامک (slug) توسط دسته‌بندی دیگری استفاده شده است",
            409,
          );
        }
      }

      if (body.parent && body.parent.toString() === id) {
        return this.sendError(
          res,
          "یک دسته‌بندی نمی‌تواند والد خودش باشد",
          400,
        );
      }

      if (body.parent) {
        const parentExists = await Category.findById(body.parent);
        if (!parentExists) {
          return this.sendError(res, "دسته‌بندی والد مشخص‌شده وجود ندارد", 404);
        }
      }

      if (body.name !== undefined) category.name = body.name;
      if (body.slug !== undefined) category.slug = body.slug;
      if (body.type !== undefined) category.type = body.type;
      if (body.description !== undefined)
        category.description = body.description;
      if (body.meta !== undefined) category.meta = body.meta;

      if (category.type === "MAIN") {
        category.parent = null as any;
      } else if (body.parent !== undefined) {
        category.parent = body.parent as any;
      }

      await category.save();

      return this.sendResponse(
        res,
        category,
        200,
        "دسته‌بندی با موفقیت به‌روزرسانی شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }

  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const category = await Category.findById(id);
      if (!category) {
        return this.sendError(res, "دسته‌بندی مورد نظر برای حذف یافت نشد", 404);
      }

      const hasChildren = await Category.exists({ parent: id });
      if (hasChildren) {
        return this.sendError(
          res,
          "این دسته‌بندی دارای زیردسته است؛ ابتدا زیردسته‌های آن را حذف یا منتقل کنید",
          400,
        );
      }

      await Category.findByIdAndDelete(id);

      return this.sendResponse(res, { id }, 200, "دسته‌بندی با موفقیت حذف شد");
    } catch (error) {
      return this.sendServerError(res);
    }
  }
})();

export default categoryController;
