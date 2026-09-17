import { Router } from "express";
import couponController from "./controller";
import {
  applyCouponSchema,
  couponIdParamSchema,
  createCouponSchema,
  updateCouponSchema,
} from "./validator";
import { validate } from "@/middlewares/validate";
import { authenticate } from "@/middlewares/authenticate";
import { UserRole, authorize } from "@/middlewares/authorize";

const router = Router();

router.use(authenticate({ optional: true }));

router.post("/apply", validate(applyCouponSchema), couponController.addCoupon);

router.delete("/remove", couponController.removeCoupon);

router.get("/current", couponController.getAppliedCoupon);

router.use(authenticate({ optional: false }));
router.use(authorize([UserRole.admin]));

router.get("/", couponController.getAllCoupons);

router.post("/", validate(createCouponSchema), couponController.createCoupon);

router.get(
  "/:id",
  validate(couponIdParamSchema, "params"), // اعتبارسنجی params در صورت تفکیک در میدل‌ویر
  couponController.getCouponById,
);

router.put(
  "/:id",
  validate(couponIdParamSchema, "params"),
  validate(updateCouponSchema),
  couponController.updateCoupon,
);

router.patch(
  "/:id/toggle",
  validate(couponIdParamSchema, "params"),
  couponController.toggleCouponStatus,
);

router.delete(
  "/:id",
  validate(couponIdParamSchema, "params"),
  couponController.deleteCoupon,
);

export default router;
