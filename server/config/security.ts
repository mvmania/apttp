import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import type { SignOptions } from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// security.ts is in /config, .env is in /server
dotenv.config({ path: path.join(__dirname, "../.env") });
const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
};

export const securityConfig = {
  jwt: {
    accessSecret: requiredEnv("JWT_ACCESS_SECRET"),
    refreshSecret: requiredEnv("JWT_REFRESH_SECRET"),

    // Explicitly typed to match JWT expectations
    accessExpiry: (process.env.JWT_ACCESS_EXPIRY || "15m") as SignOptions["expiresIn"],
    refreshExpiry: (process.env.JWT_REFRESH_EXPIRY || "7d") as SignOptions["expiresIn"],
  },

  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),

  cookies: {
    refreshTokenName: process.env.REFRESH_COOKIE_NAME || "apttp_refresh_token",
    secure: parseBoolean(process.env.COOKIE_SECURE, process.env.NODE_ENV === "production"),
    sameSite: (process.env.COOKIE_SAMESITE || "lax").toLowerCase() as "lax" | "strict" | "none",
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: process.env.COOKIE_PATH || "/api",
  },

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || 250),
    authWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000),
    loginMax: Number(process.env.LOGIN_RATE_LIMIT_MAX || 10),
    registerMax: Number(process.env.REGISTER_RATE_LIMIT_MAX || 8),
    refreshMax: Number(process.env.REFRESH_RATE_LIMIT_MAX || 30),
  },
};
