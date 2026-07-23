import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

export interface AuthRequest extends Request {
  user?: { id: string; role: string; email: string };
}

export interface JwtPayload {
  id: string;
  role: string;
  email: string;
  tokenVersion: number;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // Token aus Authorization-Header ODER (Fallback) aus ?token= — Letzteres für
  // native Browser-Navigation wie <iframe src> / <img>, die keinen Header setzen kann.
  const token = req.headers.authorization?.split(" ")[1] || (req.query.token as string | undefined);
  if (!token) return res.status(401).json({ code: "UNAUTHORIZED", message: "Nicht authentifiziert" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, role: true, email: true, isActive: true, tokenVersion: true },
    });
    if (!user || !user.isActive)
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Benutzer nicht gefunden" });
    // Token-Widerruf: Version im Token muss aktuell sein
    if ((payload.tokenVersion ?? 0) !== user.tokenVersion)
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Sitzung abgelaufen" });
    req.user = { id: user.id, role: user.role, email: user.email };
    next();
  } catch {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Ungültiges Token" });
  }
}
