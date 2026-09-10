import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import {
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "@/utils/token";
import { setAuthCookies, clearAuthCookies } from "@/utils/authCookies";
import Session from "@/models/Session";

interface AuthenticateOptions {
  optional?: boolean;
}

export const authenticate = (
  options: AuthenticateOptions = { optional: false },
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const accessToken = req.cookies?.accessToken as string | undefined;
    const refreshToken = req.cookies?.refreshToken as string | undefined;

    if (accessToken) {
      try {
        const payload = verifyToken(accessToken, "access");

        req.auth = {
          userId: payload.sub,
          role: payload.role as any,
          sessionId: payload.sessionId,
          refreshed: false,
        };

        return next();
      } catch (err: any) {
        if (err?.name !== "TokenExpiredError") {
          clearAuthCookies(res);
          if (options.optional) return next();

          res.status(401).json({
            success: false,
            message: "توکن دسترسی نامعتبر است.",
            code: "INVALID_ACCESS_TOKEN",
          });
          return;
        }
      }
    }

    if (refreshToken) {
      try {
        const refreshPayload = verifyToken(refreshToken, "refresh");
        const hashedIncomingToken = hashToken(refreshToken);

        const session = await Session.findById(refreshPayload.sessionId)
          .select("+tokenHash")
          .populate<{
            userId: { _id: mongoose.Types.ObjectId; role: string };
          }>("userId", "role");

        const isSessionInvalid =
          !session ||
          session.revokedAt !== null ||
          session.tokenHash !== hashedIncomingToken;

        if (isSessionInvalid) {
          const targetFamilyId = session?.familyId || refreshPayload.familyId;

          if (targetFamilyId) {
            await Session.updateMany(
              { familyId: targetFamilyId, revokedAt: null },
              { $set: { revokedAt: new Date() } },
            );
          }

          clearAuthCookies(res);
          if (options.optional) return next();

          res.status(401).json({
            success: false,
            message:
              "نشست کاربری نامعتبر یا منقضی شده است. لطفاً مجدداً وارد شوید.",
            code: "SESSION_COMPROMISED",
          });
          return;
        }

        const userRole = session.userId.role || "CUSTOMER";
        const userIdStr = session.userId._id.toString();
        const sessionIdStr = session._id.toString();

        const newAccessToken = generateAccessToken(userIdStr, userRole);
        const newRefreshToken = generateRefreshToken(
          userIdStr,
          session.familyId,
          sessionIdStr,
        );

        session.tokenHash = hashToken(newRefreshToken);
        await session.save();

        setAuthCookies(res, newAccessToken, newRefreshToken);

        req.auth = {
          userId: userIdStr,
          role: userRole as any,
          sessionId: sessionIdStr,
          familyId: session.familyId,
          refreshed: true,
        };

        return next();
      } catch (err) {
        clearAuthCookies(res);
        if (options.optional) return next();

        res.status(401).json({
          success: false,
          message: "رفرش‌توکن نامعتبر است یا منقضی شده است.",
          code: "INVALID_REFRESH_TOKEN",
        });
        return;
      }
    }

    if (options.optional) {
      return next();
    }

    res.status(401).json({
      success: false,
      message: "لطفاً ابتدا وارد حساب کاربری خود شوید.",
      code: "UNAUTHORIZED",
    });
  };
};
