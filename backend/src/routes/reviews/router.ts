import { Router } from "express";
import reviewController from "./controller";

import {
  createReviewSchema,
  getAdminReviewsQuerySchema,
  getProductReviewsQuerySchema,
  productIdParamSchema,
  reviewIdParamSchema,
  updateReviewSchema,
  updateReviewStatusSchema,
} from "./validator";

import { validate } from "@/middlewares/validate";
import { authenticate } from "@/middlewares/authenticate";
import { authorize, UserRole } from "@/middlewares/authorize";

const router = Router();

router.get(
  "/product/:productId",
  validate(productIdParamSchema, "params"),
  validate(getProductReviewsQuerySchema, "query"),
  reviewController.getProductReviews,
);

router.post(
  "/",
  authenticate(),
  validate(createReviewSchema, "body"),
  reviewController.sendReview,
);

router.patch(
  "/:id",
  authenticate(),
  validate(reviewIdParamSchema, "params"),
  validate(updateReviewSchema, "body"),
  reviewController.updateUserReview,
);

router.delete(
  "/:id",
  authenticate(),
  validate(reviewIdParamSchema, "params"),
  reviewController.deleteUserReview,
);

router.get(
  "/admin",
  authenticate(),
  authorize([UserRole.admin]),
  validate(getAdminReviewsQuerySchema, "query"),
  reviewController.getAllReviewsAdmin,
);

router.patch(
  "/admin/:id/status",
  authenticate(),
  authorize([UserRole.admin]),
  validate(reviewIdParamSchema, "params"),
  validate(updateReviewStatusSchema, "body"),
  reviewController.changeReviewStatus,
);

router.delete(
  "/admin/:id",
  authenticate(),
  authorize([UserRole.admin]),
  validate(reviewIdParamSchema, "params"),
  reviewController.adminDeleteReview,
);

export default router;
