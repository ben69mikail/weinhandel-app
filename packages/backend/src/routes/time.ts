import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";
import { io } from "../index.js";

const router = Router();
router.use(authenticate);

// POST /api/time/clock-in
router.post("/clock-in", async (req: AuthRequest, res: Response) => {
  try {
    const active = await prisma.timeEntry.findFirst({
      where: { userId: req.user!.id, clockOut: null },
    });
    if (active) return res.status(409).json({ error: "Bereits eingestempelt" });

    const entry = await prisma.timeEntry.create({
      data: { userId: req.user!.id, shiftId: req.body.shiftId ?? null, clockIn: new Date() },
    });
    io.emit("clockIn", { userId: req.user!.id, entryId: entry.id });
    return res.status(201).json(entry);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// POST /api/time/clock-out
router.post("/clock-out", async (req: AuthRequest, res: Response) => {
  try {
    const entry = await prisma.timeEntry.findFirst({
      where: { userId: req.user!.id, clockOut: null },
    });
    if (!entry) return res.status(404).json({ error: "Nicht eingestempelt" });

    const clockOut = new Date();
    const totalMs = clockOut.getTime() - entry.clockIn.getTime();
    const totalMinutes = totalMs / 60000;
    const breakMinutes = entry.breakMinutes ?? 0;
    const netMinutes = totalMinutes - breakMinutes;

    const updated = await prisma.timeEntry.update({
      where: { id: entry.id },
      data: { clockOut, totalMinutes, netMinutes },
    });
    io.emit("clockOut", { userId: req.user!.id });
    return res.json(updated);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// POST /api/time/break-start
router.post("/break-start", async (req: AuthRequest, res: Response) => {
  try {
    const entry = await prisma.timeEntry.findFirst({
      where: { userId: req.user!.id, clockOut: null },
    });
    if (!entry) return res.status(404).json({ error: "Nicht eingestempelt" });
    if (entry.breakStart && !entry.breakEnd) return res.status(409).json({ error: "Pause läuft bereits" });

    const updated = await prisma.timeEntry.update({
      where: { id: entry.id },
      data: { breakStart: new Date(), breakEnd: null },
    });
    return res.json(updated);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// POST /api/time/break-end
router.post("/break-end", async (req: AuthRequest, res: Response) => {
  try {
    const entry = await prisma.timeEntry.findFirst({
      where: { userId: req.user!.id, clockOut: null, breakStart: { not: null } },
    });
    if (!entry || !entry.breakStart) return res.status(404).json({ error: "Keine aktive Pause" });

    const breakEnd = new Date();
    const addedBreak = (breakEnd.getTime() - entry.breakStart.getTime()) / 60000;
    const updated = await prisma.timeEntry.update({
      where: { id: entry.id },
      data: { breakEnd, breakMinutes: (entry.breakMinutes ?? 0) + Math.round(addedBreak) },
    });
    return res.json(updated);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// GET /api/time/current
router.get("/current", async (req: AuthRequest, res: Response) => {
  try {
    const entry = await prisma.timeEntry.findFirst({
      where: { userId: req.user!.id, clockOut: null },
      orderBy: { clockIn: "desc" },
    });
    return res.json(entry ?? null);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// GET /api/time/active (Admin — wer ist eingestempelt?)
router.get("/active", adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const entries = await prisma.timeEntry.findMany({
      where: { clockOut: null },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      orderBy: { clockIn: "asc" },
    });
    return res.json(entries);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// GET /api/time/entries
router.get("/entries", async (req: AuthRequest, res: Response) => {
  const { userId, month } = req.query as Record<string, string>;
  const targetId = req.user!.role === "ADMIN" && userId ? userId : req.user!.id;
  try {
    const where: Record<string, unknown> = { userId: targetId };
    if (month) {
      const [y, m] = month.split("-").map(Number);
      where.clockIn = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
    }
    const entries = await prisma.timeEntry.findMany({ where, orderBy: { clockIn: "desc" } });
    return res.json(entries);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

export default router;