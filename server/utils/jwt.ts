// apttp/server/utils/jwt.ts
import { sign, verify, type SignOptions } from "jsonwebtoken";
import { securityConfig } from "../config/security.js";

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  is_email_verified: boolean;
  is_admin: boolean;
}

export interface RefreshPayload {
  id: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: securityConfig.jwt.accessExpiry ?? "15m",
  };

  return sign(payload, securityConfig.jwt.accessSecret, options);
};

export const generateRefreshToken = (userId: string): string => {
  return sign(
    { id: userId },
    securityConfig.jwt.refreshSecret,
    {
      expiresIn: securityConfig.jwt.refreshExpiry ?? "7d",
    }
  );
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const decoded = verify(token, securityConfig.jwt.accessSecret);

  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }

  return decoded as TokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshPayload => {
  const decoded = verify(token, securityConfig.jwt.refreshSecret);

  if (typeof decoded === "string") {
    throw new Error("Invalid refresh token");
  }

  return decoded as RefreshPayload;
};

