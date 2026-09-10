import crypto from "crypto";

export function generateOtpCode(): string {
  const code = crypto.randomInt(0, 1_000_000);

  return code.toString().padStart(6, "0");
}

export function generateOtpSecure(): string {
  const digits = Array.from({ length: 6 }, () =>
    crypto.randomInt(0, 10).toString(),
  );
  return digits.join("");
}

export function generateOtpLegacy(): string {
  const bytes = crypto.randomBytes(4); // 32 bit → عدد بین 0 تا 4_294_967_295
  const code = (bytes.readUInt32BE(0) % 1_000_000).toString();
  return code.padStart(6, "0");
}

import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export async function hashOtp(otp: string): Promise<string> {
  return await bcrypt.hash(otp, SALT_ROUNDS);
}

export async function verifyOtpCode(
  otp: string,
  hashedOtp: string,
): Promise<boolean> {
  return await bcrypt.compare(otp, hashedOtp);
}
