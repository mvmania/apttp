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

export const securityConfig = {
  jwt: {
    accessSecret: requiredEnv("JWT_ACCESS_SECRET"),
    refreshSecret: requiredEnv("JWT_REFRESH_SECRET"),

    // Explicitly typed to match JWT expectations
    accessExpiry: (process.env.JWT_ACCESS_EXPIRY || "15m") as SignOptions["expiresIn"],
    refreshExpiry: (process.env.JWT_REFRESH_EXPIRY || "7d") as SignOptions["expiresIn"],
  },

  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
};
