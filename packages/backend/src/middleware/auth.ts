import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

export interface AuthRequest extends Request {
  user?: { id: string; role: string; email: string };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Nicht authentifiziert" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
      email: string;
    };
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, role: true, email: true, isActive: true },
    });
    if (!user || !user.isActive)
      return res.status(401).json({ error: "Benutzer nicht gefunden" });
    req.user = { id: user.id, role: user.role, email: user.email };
    next();
  } catch {
    return res.status(401).json({ error: "Ungültiges Token" });
  }
}
