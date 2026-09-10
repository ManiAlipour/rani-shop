import Controller from "@/controller";
import { smsService, TEMPLATE_CODE } from "@/services/sms";
import type { Request, Response } from "express";
import crypto from "node:crypto";
import User from "@/models/User";
import Session from "@/models/Session";
import { generateOtpCode, hashOtp, verifyOtpCode } from "@/utils/otp";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyToken,
} from "@/utils/token";
import { setAuthCookies, clearAuthCookies } from "@/utils/authCookies";

const OTP_EXPIRE_MINUTES = 2;
const RESEND_COOLDOWN_SECONDS = 60;
const SESSION_EXPIRE_DAYS = 30;

const authController = new (class extends Controller {
  async register(req: Request, res: Response) {
    try {
      const { phoneNumber, firstName } = req.body;

      let user = await User.findOne({ phoneNumber }).select("+otp.expiresAt");

      if (user?.otp?.expiresAt) {
        const remainingTimeMs = user.otp.expiresAt.getTime() - Date.now();
        const elapsedTimeSec =
          OTP_EXPIRE_MINUTES * 60 - Math.floor(remainingTimeMs / 1000);

        if (elapsedTimeSec < RESEND_COOLDOWN_SECONDS) {
          const waitTime = RESEND_COOLDOWN_SECONDS - elapsedTimeSec;
          return this.sendError(
            res,
            `لطفاً ${waitTime} ثانیه دیگر جهت درخواست مجدد کد صبر کنید`,
            429,
          );
        }
      }

      const otp = generateOtpCode();
      const hashedOtp = await hashOtp(otp);
      const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);

      if (user) {
        user.otp = {
          codeHash: hashedOtp,
          expiresAt,
          attempts: 0,
        };
        await user.save();
      } else {
        user = await User.create({
          phoneNumber,
          firstName,
          otp: {
            codeHash: hashedOtp,
            attempts: 0,
            expiresAt,
          },
        });
      }

      await smsService.sendVerification(phoneNumber, TEMPLATE_CODE.AUTH, [
        { name: "CODE", value: otp },
        { name: "TIME", value: OTP_EXPIRE_MINUTES.toString() },
      ]);

      const responseData: Record<string, any> = {
        phoneNumber: user.phoneNumber,
        expiresAt,
      };

      if (process.env.NODE_ENV === "development") {
        responseData.devCode = otp;
      }

      return this.sendResponse(
        res,
        responseData,
        200,
        "کد تایید با موفقیت ارسال شد",
      );
    } catch (error) {
      console.error("Register Error:", error);
      return this.sendServerError(res);
    }
  }

  async verify(req: Request, res: Response) {
    try {
      const { code, phoneNumber } = req.body;

      if (!code || !phoneNumber) {
        return this.sendError(res, "شماره موبایل و کد تایید الزامی است", 400);
      }

      const user = await User.findOne({ phoneNumber }).select(
        "+otp.codeHash +otp.expiresAt +otp.attempts",
      );

      if (!user || !user.otp?.codeHash) {
        return this.sendError(
          res,
          "درخواست نامعتبر است. لطفاً مجدداً کد دریافت کنید",
          400,
        );
      }

      const now = new Date();
      if (now > user.otp.expiresAt) {
        return this.sendError(
          res,
          "کد تایید منقضی شده است. لطفاً کد جدید دریافت کنید",
          400,
        );
      }

      if (user.otp.attempts >= 5) {
        return this.sendError(
          res,
          "تعداد دفعات تلاش مجاز به پایان رسیده است. لطفاً مجدداً درخواست کد دهید",
          429,
        );
      }

      const isOtpValid = await verifyOtpCode(String(code), user.otp.codeHash);

      if (!isOtpValid) {
        user.otp.attempts += 1;
        await user.save();
        return this.sendError(res, "کد وارد شده اشتباه است", 400);
      }

      user.otp = undefined;
      user.isPhoneVerified = true;
      user.status = "ACTIVE";
      await user.save();

      const familyId = crypto.randomUUID();
      const sessionExpiresAt = new Date(
        Date.now() + SESSION_EXPIRE_DAYS * 24 * 60 * 60 * 1000,
      );

      const session = await Session.create({
        userId: user._id,
        tokenHash: "temp_init_hash",
        familyId,
        userAgent: req.get("user-agent"),
        ip: req.ip,
        expiresAt: sessionExpiresAt,
      });

      // ۳. صدور Access Token و Refresh Token
      const accessToken = generateAccessToken(user._id, user.role);
      const refreshToken = generateRefreshToken(
        user._id,
        familyId,
        String(session._id),
      );

      session.tokenHash = hashToken(refreshToken);
      await session.save();

      setAuthCookies(res, accessToken, refreshToken);

      return this.sendResponse(
        res,
        {
          userId: user._id,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName,
          role: user.role,
        },
        200,
        "احراز هویت با موفقیت انجام شد",
      );
    } catch (error) {
      console.error("Verify Error:", error);
      return this.sendServerError(res);
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const sessionId = req.auth?.sessionId;

      if (sessionId) {
        await Session.findByIdAndUpdate(sessionId, {
          $set: { revokedAt: new Date() },
        });
      }

      clearAuthCookies(res);
      return this.sendResponse(res, null, 200, "خروج با موفقیت انجام شد");
    } catch (error) {
      console.error("Logout Error:", error);
      return this.sendServerError(res);
    }
  }

  async getMe(req: Request, res: Response) {
    try {
      const userId = req.auth?.userId;

      if (!userId) return this.sendError(res, "دسترسی نامعتبر است", 401);

      const user = await User.findById(userId);

      if (!user) return this.sendError(res, "توکن نامعتبر.", 404);

      return this.sendResponse(
        res,
        user.toObject(),
        200,
        "کاربر با موفقیت دریافت شد",
      );
    } catch (error) {
      return this.sendServerError(res);
    }
  }
})();

export default authController;
