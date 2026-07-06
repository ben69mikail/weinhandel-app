import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";

const router = Router();
router.use(authenticate);

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
  birthday: z.string().optional(),
  role: z.enum(["ADMIN", "EMPLOYEE"]).default("EMPLOYEE"),
  employeeType: z.enum(["PARTTIME", "MINIJOB"]).default("PARTTIME"),
  monthlyHours: z.number().optional(),
  skills: z.array(z.string()).default([]),
  personnelNumber: z.string().optional(),
});

const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/users — Admin: alle Felder; Mitarbeiter: nur Basisdaten (Datenschutz)
router.get("/", async (req: AuthRequest, res: Response) => {
  const isAdmin = req.user?.role === "ADMIN";
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: isAdmin
        ? {
            id: true, email: true, firstName: true, lastName: true,
            phone: true, role: true, employeeType: true, monthlyHours: true,
            skills: true, avatarUrl: true, personnelNumber: true,
            isActive: true, birthday: true, createdAt: true,
          }
        : {
            id: true, firstName: true, lastName: true,
            role: true, skills: true, avatarUrl: true, isActive: true,
          },
      orderBy: { firstName: "asc" },
    });
    return res.json(users);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// GET /api/users/birthdays
router.get("/birthdays", async (req: AuthRequest, res: Response) => {
  const days = Number(req.query.days ?? 30);
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true, birthday: { not: null } },
      select: { id: true, firstName: true, lastName: true, birthday: true, avatarUrl: true },
    });
    const now = new Date();
    const upcoming = users.filter((u) => {
      if (!u.birthday) return false;
      const bd = new Date(u.birthday);
      const next = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
      if (next < now) next.setFullYear(now.getFullYear() + 1);
      return (next.getTime() - now.getTime()) / 86400000 <= days;
    });
    return res.json(upcoming);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// GET /api/users/:id — nur eigenes Profil oder Admin (enthält Adresse etc.)
router.get("/:id", async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== "ADMIN" && req.user?.id !== req.params.id)
    return res.status(403).json({ code: "FORBIDDEN", message: "Kein Zugriff" });
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, address: true, birthday: true, role: true,
        employeeType: true, monthlyHours: true, skills: true,
        avatarUrl: true, personnelNumber: true, isActive: true, createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: "Nicht gefunden" });
    return res.json(user);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// POST /api/users (Admin)
router.post("/", adminOnly, async (req: AuthRequest, res: Response) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { password, birthday, ...data } = parsed.data;
  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(409).json({ error: "E-Mail bereits vergeben" });
    const user = await prisma.user.create({
      data: {
        ...data,
        passwordHash: await bcrypt.hash(password, 10),
        birthday: birthday ? new Date(birthday) : undefined,
      },
    });
    const { passwordHash: _, ...safe } = user;
    return res.status(201).json(safe);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// PUT /api/users/:id
router.put("/:id", async (req: AuthRequest, res: Response) => {
  const isAdmin = req.user?.role === "ADMIN";
  if (!isAdmin && req.user?.id !== req.params.id)
    return res.status(403).json({ error: "Keine Berechtigung" });

  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { password, birthday, ...data } = parsed.data;

  try {
    const updateData: Record<string, unknown> = { ...data };
    if (birthday) updateData.birthday = new Date(birthday);
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
      updateData.tokenVersion = { increment: 1 }; // alte Tokens widerrufen
    }
    if (!isAdmin) { delete updateData.role; delete updateData.employeeType; delete updateData.isActive; }

    const user = await prisma.user.update({ where: { id: req.params.id }, data: updateData });
    const { passwordHash: _, ...safe } = user;
    return res.json(safe);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// DELETE /api/users/:id (Admin — soft delete)
router.delete("/:id", adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false, tokenVersion: { increment: 1 } },
    });
    return res.json({ message: "Deaktiviert" });
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// POST /api/users/:id/grant-admin — grant temporary admin
router.post("/:id/grant-admin", adminOnly, async (req, res) => {
  try {
    const { until } = req.body; // ISO date string
    if (!until) return res.status(400).json({ error: "until fehlt" });
    const expiry = new Date(until);
    if (expiry <= new Date()) return res.status(400).json({ error: "Datum muss in der Zukunft liegen" });
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: "ADMIN", tempAdminUntil: expiry },
    });
    res.json(user);
  } catch { res.status(500).json({ error: "Server error" }); }
});

// POST /api/users/:id/revoke-admin — revoke admin immediately
router.post("/:id/revoke-admin", adminOnly, async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: "EMPLOYEE", tempAdminUntil: null },
    });
    res.json(user);
  } catch { res.status(500).json({ error: "Server error" }); }
});

export default router;