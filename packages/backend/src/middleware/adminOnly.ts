import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.js";

export function adminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Nur für Administratoren" });
  }
  next();
}
