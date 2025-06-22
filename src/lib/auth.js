import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sign } from "hono/jwt";

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

export async function comparePasswords(password, hash) {
  return await bcrypt.compare(password, hash);
}

export function generateRefreshToken() {
  return randomBytes(32).toString("hex");
}

export async function generateAccessToken(userId) {
  return await sign(
    {
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + 60 * 15, // 15 minutes
    },
    process.env.ACCESS_TOKEN_SECRET
  );
}
