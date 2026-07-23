import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { ERRORS } from "../lib/errors.js";
import { dayActionAllowed } from "../services/shift-rules.js";

const router = Router();
router.use(authenticate);

const availSchema = z.object({
  date: z.string(),
  type: z.enum(["AVAILABLE","UNAVAILABLE","PREFERRED","PARTIAL"]),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  note: z.string().optional(),
});

// GET /api/availability/all (Admin — alle Mitarbeiter)
router.get("/all", async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== "ADMIN") return res.status(403).json({ error: "Kein Zugriff" });
  const { month } = req.query as Record<string, string>;
  try {
    const where: Record<string, unknown> = {};
    if (month) {
      const [y, m] = month.split("-").map(Number);
      where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
    }
    const avails = await prisma.availability.findMany({
      where,
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: [{ date: "asc" }, { userId: "asc" }],
    });
    return res.json(avails);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// GET /api/availability
router.get("/", async (req: AuthRequest, res: Response) => {
  const { userId, month } = req.query as Record<string, string>;
  const targetId = req.user!.role === "ADMIN" && userId ? userId : req.user!.id;
  try {
    const where: Record<string, unknown> = { userId: targetId };
    if (month) {
      const [y, m] = month.split("-").map(Number);
      where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
    }
    const avails = await prisma.availability.findMany({ where, orderBy: { date: "asc" } });
    return res.json(avails);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// POST /api/availability
router.post("/", async (req: AuthRequest, res: Response) => {
  const parsed = availSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { date, type, startTime, endTime, note } = parsed.data;
  try {
    // Tag-Exklusivität: keine Verfügbarkeit, wenn an dem Tag bereits eine
    // Bewerbung auf eine Schicht vorliegt.
    const day = new Date(date);
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const end = new Date(start.getTime() + 86400000);
    const applications = await prisma.shiftAssignment.count({
      where: { userId: req.user!.id, status: "APPLIED", shift: { date: { gte: start, lt: end } } },
    });
    if (!dayActionAllowed("AVAILABILITY", { availabilities: 0, applications })) {
      return res.status(409).json(ERRORS.DAY_LOCKED);
    }

    const avail = await prisma.availability.upsert({
      where: { userId_date: { userId: req.user!.id, date: new Date(date) } },
      update: { type, startTime: startTime ?? null, endTime: endTime ?? null, note: note ?? null },
      create: { userId: req.user!.id, date: new Date(date), type, startTime, endTime, note },
    });
    return res.json(avail);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// POST /api/availability/bulk
router.post("/bulk", async (req: AuthRequest, res: Response) => {
  const { entries } = req.body as { entries: Array<{ date: string; type: string; note?: string }> };
  if (!entries?.length) return res.status(400).json({ error: "Keine Einträge" });
  try {
    await prisma.$transaction(
      entries.map((e) =>
        prisma.availability.upsert({
          where: { userId_date: { userId: req.user!.id, date: new Date(e.date) } },
          update: { type: e.type as "AVAILABLE", note: e.note },
          create: { userId: req.user!.id, date: new Date(e.date), type: e.type as "AVAILABLE", note: e.note },
        })
      )
    );
    return res.json({ message: "Gespeichert" });
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// DELETE /api/availability/:id
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const avail = await prisma.availability.findUnique({ where: { id: req.params.id } });
    if (!avail) return res.status(404).json({ code: "NOT_FOUND", message: "Nicht gefunden" });
    // Nur Besitzer oder Admin darf löschen
    if (avail.userId !== req.user!.id && req.user!.role !== "ADMIN")
      return res.status(403).json({ code: "FORBIDDEN", message: "Kein Zugriff" });
    await prisma.availability.delete({ where: { id: req.params.id } });
    return res.json({ message: "Gelöscht" });
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

export default router;