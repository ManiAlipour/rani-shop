import type { Request, Response, NextFunction } from "express";

export enum UserRole {
  user = "user",
  admin = "admin",
}

export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // چون authenticate قبلاً اجرا شده، req.auth حتماً پر شده است
    const role = req.auth?.role as UserRole;

    if (!role)
      return res.status(403).json({
        message: "Forbidden: You do not have the required permissions.",
      });

    if (allowedRoles.includes(role)) {
      next();
    } else {
      return res.status(403).json({
        message: "Forbidden: You do not have the required permissions.",
      });
    }
  };
};
