import { Router } from "express";
import categoryController from "./controller";
import { validate } from "@/middlewares/validate"; // یا میدلور ولیدیشن اختصاصی پروژه‌ت
import { authenticate } from "@/middlewares/authenticate";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
} from "./validator";
import { authorize, UserRole } from "@/middlewares/authorize";

const router = Router();

router.get("/tree", categoryController.getCategoryTree);

router.get(
  "/",
  validate(categoryQuerySchema, "query"),
  categoryController.getCategories,
);

router.get("/slug/:slug", categoryController.getCategoryBySlug);

router.get("/:id", categoryController.getCategoryById);

router.use(authenticate());
router.use(authorize([UserRole.admin]));
router.post(
  "/",
  validate(createCategorySchema, "body"),
  categoryController.createCategory,
);

router.put(
  "/:id",
  validate(updateCategorySchema, "body"),
  categoryController.updateCategory,
);

router.delete("/:id", categoryController.deleteCategory);

export default router;
