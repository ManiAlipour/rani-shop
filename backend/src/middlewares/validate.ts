import type { Request, Response, NextFunction } from "express";
import type { z } from "zod";

type ValSource = "body" | "query" | "params";

export const validate =
  <T extends z.ZodTypeAny>(schema: T, source: ValSource = "body") =>
  (
    req: Request<Record<string, never>, unknown, z.infer<T>>,
    res: Response,
    next: NextFunction,
  ) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "داده‌های ورودی نامعتبر است",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    req.body = result.data;

    next();
  };
