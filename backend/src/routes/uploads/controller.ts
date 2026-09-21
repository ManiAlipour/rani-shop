import Controller from "@/controller";
import storageService from "@/services/storage.service";
import type { Request, Response } from "express";

const uploadController = new (class extends Controller {
  async uploadSingle(req: Request, res: Response) {
    try {
      if (!req.file) {
        return this.sendError(res, "هیچ فایلی برای آپلود انتخاب نشده است", 400);
      }

      const folder = (req.body.folder as string) || "general";
      const result = await storageService.uploadFile(
        req.file.buffer,
        folder,
        req.file.originalname,
      );

      return this.sendResponse(
        res,
        result,
        201,
        "تصویر با موفقیت بهینه‌سازی و آپلود شد",
      );
    } catch (error) {
      console.error("Upload error:", error);
      return this.sendServerError(res);
    }
  }

  async uploadMultiple(req: Request, res: Response) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return this.sendError(
          res,
          "هیچ تصویری برای آپلود انتخاب نشده است",
          400,
        );
      }

      const folder = (req.body.folder as string) || "general";

      const uploadPromises = files.map((file) =>
        storageService.uploadFile(file.buffer, folder, file.originalname),
      );

      const results = await Promise.all(uploadPromises);

      return this.sendResponse(
        res,
        results,
        201,
        `${results.length} تصویر با موفقیت آپلود شدند`,
      );
    } catch (error) {
      console.error("Multiple upload error:", error);
      return this.sendServerError(res);
    }
  }

  async deleteFile(req: Request, res: Response) {
    try {
      const { key } = req.body;
      if (!key || typeof key !== "string") {
        return this.sendError(res, "شناسه تصویر (key) الزامی است", 400);
      }

      const deleted = await storageService.deleteFile(key);
      if (!deleted) {
        return this.sendError(res, "خطا در حذف فایل از استوریج ابری", 500);
      }

      return this.sendResponse(
        res,
        { key },
        200,
        "تصویر با موفقیت از فضای ابری حذف شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }
})();

export default uploadController;
