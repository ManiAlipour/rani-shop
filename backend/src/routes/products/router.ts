import { Router } from "express";
import productController from "./controller";
import { authenticate } from "@/middlewares/authenticate";
import { authorize, UserRole } from "@/middlewares/authorize";
import { validate } from "@/middlewares/validate";
import { createProductSchema, updateProductSchema } from "./validate";

const router = Router();

router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);
router.get("/slug/:slug", productController.getProductBySlug);

router.use(authenticate());
router.use(authorize([UserRole.admin]));

router.post(
  "/",
  validate(createProductSchema, "body"),
  productController.createProduct,
);
router.put(
  "/:id",
  validate(updateProductSchema, "body"),
  productController.updateProduct,
);
router.delete("/:id", productController.deleteProduct);

export default router;
