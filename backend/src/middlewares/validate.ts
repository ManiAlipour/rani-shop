import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { z } from "zod";

type ValSource = "body" | "query" | "params";

export const validate =
  <T extends z.ZodTypeAny>(schema: T, source: ValSource = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "داده‌های ورودی نامعتبر است",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    (req as unknown as Record<ValSource, unknown>)[source] = result.data;

    next();
  };
