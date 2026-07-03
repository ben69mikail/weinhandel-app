import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Brute-Force-Schutz: max. 10 Login-Versuche pro IP in 15 Minuten
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: "RATE_LIMITED", message: "Zu viele Login-Versuche. Bitte in 15 Minuten erneut versuchen." },
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

router.post("/login", loginLimiter, async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Ungültige Eingabe" });

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive)
      return res.status(401).json({ error: "E-Mail oder Passwort falsch" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
      return res.status(401).json({ error: "E-Mail oder Passwort falsch" });

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, tokenVersion: user.tokenVersion },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? "24h" } as jwt.SignOptions
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        employeeType: user.employeeType,
        avatarUrl: user.avatarUrl,
        skills: user.skills,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Serverfehler" });
  }
});

router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        birthday: true,
        role: true,
        employeeType: true,
        monthlyHours: true,
        skills: true,
        avatarUrl: true,
        personnelNumber: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: "Benutzer nicht gefunden" });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Serverfehler" });
  }
});

router.post(
  "/change-password",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "Ungültige Eingabe" });

    const { currentPassword, newPassword } = parsed.data;

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });
      if (!user)
        return res.status(404).json({ error: "Benutzer nicht gefunden" });

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid)
        return res.status(401).json({ error: "Aktuelles Passwort falsch" });

      const hash = await bcrypt.hash(newPassword, 10);
      // tokenVersion hochzählen → alle bestehenden Tokens sofort ungültig
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hash, tokenVersion: { increment: 1 } },
      });

      // Neues Token ausstellen, damit der Nutzer eingeloggt bleibt
      const token = jwt.sign(
        { id: updated.id, role: updated.role, email: updated.email, tokenVersion: updated.tokenVersion },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN ?? "24h" } as jwt.SignOptions
      );

      return res.json({ message: "Passwort geändert", token });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Serverfehler" });
    }
  }
);

router.post("/logout", authenticate, (_req, res) => {
  return res.json({ message: "Abgemeldet" });
});

export default router;
