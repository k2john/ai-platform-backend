import { Response, NextFunction } from "express";
import { verifyToken } from "../config/security";
import { AuthRequest } from "../types";

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ detail: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ detail: "Invalid or expired token" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  authenticate(req, res, () => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ detail: "Admin access required" });
      return;
    }
    next();
  });
}

export function requireStudent(req: AuthRequest, res: Response, next: NextFunction): void {
  authenticate(req, res, () => {
    if (!req.user) {
      res.status(401).json({ detail: "Unauthorized" });
      return;
    }
    next();
  });
}
