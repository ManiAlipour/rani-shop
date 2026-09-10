import { Router } from "express";
import authController from "./controller";
import { validate } from "@/middlewares/validate";
import { RegisterUserSchema } from "./validator";
import { authenticate } from "@/middlewares/authenticate";

const router = Router();

router.post(
  "/register",
  validate(RegisterUserSchema, "body"),
  authController.register,
);

router.post("/verify", authController.verify);

router.post("/logout", authController.logout);
router.get("/me", authenticate(), authController.getMe);

export default router;
