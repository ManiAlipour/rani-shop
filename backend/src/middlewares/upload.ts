import multer from "multer";
import sharp from "sharp";
import type { Request, Response, NextFunction } from "express";

// ذخیره موقت در RAM به جای هارد برای سرعت حداکثری
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("تنها فرمت‌های تصویری JPEG، PNG و WebP مجاز می‌باشند"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
});

export const optimizeImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.file) {
      req.file.buffer = await sharp(req.file.buffer)
        .rotate()
        .resize({
          width: 1920,
          height: 1920,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
      req.file.mimetype = "image/webp";
    }

    if (req.files && Array.isArray(req.files)) {
      await Promise.all(
        req.files.map(async (file) => {
          file.buffer = await sharp(file.buffer)
            .rotate()
            .resize({
              width: 1920,
              height: 1920,
              fit: "inside",
              withoutEnlargement: true,
            })
            .webp({ quality: 82, effort: 4 })
            .toBuffer();
          file.mimetype = "image/webp";
        }),
      );
    }

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "خطا در پردازش و بهینه‌سازی تصویر",
    });
  }
};
