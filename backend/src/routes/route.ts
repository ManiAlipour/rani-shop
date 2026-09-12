import { Router } from "express";
import authRouter from "./auth/router";
import productRouter from "./products/router";
import categoriesRouter from "./categories/router";
import uploadRouter from "./uploads/router";

const router = Router();

router.use("/auth", authRouter);
router.use("/products", productRouter);
router.use("/categories", categoriesRouter);
router.use("/uploads", uploadRouter);

export default router;
