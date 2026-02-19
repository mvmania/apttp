import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "jsonwebtoken";
import { verifyAccessToken } from "../utils/jwt.js";

interface AuthPayload extends JwtPayload {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token required" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = verifyAccessToken(token);

    if (typeof decoded === "string") {
      return res.status(403).json({ error: "Invalid token format" });
    }

    req.user = decoded as AuthPayload;
    return next();
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};
