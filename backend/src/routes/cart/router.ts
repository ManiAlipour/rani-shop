import { Router } from "express";
import cartController from "./controller";
import { authenticate } from "@/middlewares/authenticate";
import { validate } from "@/middlewares/validate";
import {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
  syncCartSchema,
} from "./validator";

const router = Router();

router.get("/", authenticate({ optional: true }), cartController.getCart);

router.post(
  "/items",
  authenticate({ optional: true }),
  validate(addToCartSchema),
  cartController.addToCart,
);

router.patch(
  "/items/:variantId",
  authenticate({ optional: true }),
  validate(updateCartItemSchema),
  cartController.updateQuantity,
);

router.delete(
  "/items/:variantId",
  authenticate({ optional: true }),
  validate(removeCartItemSchema),
  cartController.removeItem,
);

router.delete("/", authenticate({ optional: true }), cartController.clearCart);

router.put(
  "/sync",
  authenticate({ optional: true }),
  validate(syncCartSchema),
  cartController.syncCart,
);

export default router;
