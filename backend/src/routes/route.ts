import { Router } from "express";
import authRouter from "./auth/router";
import ProductRouter from "./products/router";

const router = Router();

router.use("/auth", authRouter);
router.use("/products", ProductRouter);

export default router;
