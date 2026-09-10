import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { Types } from "mongoose";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "default_access_secret";
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "default_refresh_secret";

export interface TokenPayload {
  sub: string;
  role: string;
  type: "access" | "refresh";
  familyId?: string;
  sessionId?: string;
}

export const generateAccessToken = (
  userId: Types.ObjectId | string,
  role: string,
) => {
  return jwt.sign(
    { sub: String(userId), role, type: "access" },
    ACCESS_SECRET,
    { expiresIn: "15m" },
  );
};

export const generateRefreshToken = (
  userId: Types.ObjectId | string,
  familyId: string,
  sessionId: string,
) => {
  return jwt.sign(
    { sub: String(userId), familyId, sessionId, type: "refresh" },
    REFRESH_SECRET,
    { expiresIn: "30d" },
  );
};

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const verifyToken = (
  token: string,
  type: "access" | "refresh",
): TokenPayload => {
  const secret = type === "access" ? ACCESS_SECRET : REFRESH_SECRET;
  return jwt.verify(token, secret) as TokenPayload;
};
