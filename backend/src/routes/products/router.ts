import { Router } from "express";
import productController from "./controller";
import { authenticate } from "@/middlewares/authenticate";
import { authorize, UserRole } from "@/middlewares/authorize";
import { validate } from "@/middlewares/validate";
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
} from "./validate";

const router = Router();

router.get("/", productController.getProducts.bind(productController));
router.get(
  "/slug/:slug",
  productController.getProductBySlug.bind(productController),
);
router.get("/:id", productController.getProductById.bind(productController));

router.use(authenticate());
router.use(authorize([UserRole.admin]));

router.post(
  "/",
  validate(createProductSchema, "body"),
  productController.createProduct.bind(productController),
);

router.put(
  "/:id",
  validate(updateProductSchema, "body"),
  productController.updateProduct.bind(productController),
);

router.delete("/:id", productController.deleteProduct.bind(productController));

router.post(
  "/:id/variants",
  validate(createVariantSchema, "body"),
  productController.addVariant.bind(productController),
);

router.put(
  "/variants/:variantId",
  validate(updateVariantSchema, "body"),
  productController.updateVariant.bind(productController),
);

router.delete(
  "/variants/:variantId",
  productController.deleteVariant.bind(productController),
);

export default router;
