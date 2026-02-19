// apttp/server/middleware/roleMiddleware.ts
import type { Request, Response, NextFunction } from "express";

export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    return next();
  };
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  return next();
};

export const requireVerifiedUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if ((req.user as any).is_email_verified !== true) {
    return res.status(403).json({ error: "Email verification required" });
  }

  return next();
};
