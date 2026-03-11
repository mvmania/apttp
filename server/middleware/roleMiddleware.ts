// apttp/server/middleware/roleMiddleware.ts
import type { Request, Response, NextFunction } from "express";

export const isAdminLikeRole = (role: string | undefined): boolean => {
  return role === "master_admin" || role === "admin" || role === "co_admin";
};

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

  if (req.user.role !== "admin" && req.user.role !== "master_admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  return next();
};

export const requireMasterAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== "master_admin") {
    return res.status(403).json({ error: "Master admin access required" });
  }

  return next();
};

export const requireCoAdminOrAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!isAdminLikeRole(req.user.role)) {
    return res.status(403).json({ error: "Insufficient permissions" });
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

  if (req.user.is_email_verified !== true) {
    return res.status(403).json({ error: "Email verification required" });
  }

  return next();
};
