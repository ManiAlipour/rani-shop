import { Router } from "express";
import uploadController from "./controller";
import { upload, optimizeImage } from "@/middlewares/upload";
import { authorize, UserRole } from "@/middlewares/authorize";
import { authenticate } from "@/middlewares/authenticate";

const router = Router();

router.use(authenticate());
router.use(authorize([UserRole.admin]));

router.post(
  "/single",
  upload.single("file"),
  optimizeImage,
  uploadController.uploadSingle,
);

router.post(
  "/multiple",
  upload.array("files", 10),
  optimizeImage,
  uploadController.uploadMultiple,
);

router.delete("/", uploadController.deleteFile);

export default router;
