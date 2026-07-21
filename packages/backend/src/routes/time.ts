import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";
import { io } from "../lib/realtime.js";
import { TimeService } from "../services/TimeService.js";
import { ERRORS } from "../lib/errors.js";

const router = Router();
router.use(authenticate);

// POST /api/time/clock-in
router.post("/clock-in", async (req: AuthRequest, res: Response) => {
  try {
    const entry = await TimeService.clockIn(req.user!.id, req.body.shiftId);
    io.emit("clockIn", { userId: req.user!.id, entryId: entry.id });
    return res.status(201).json(entry);
  } catch (err: any) {
    if (err?.code === "CLOCK_ALREADY_IN") return res.status(409).json(err);
    console.error(err); return res.status(500).json(ERRORS.INTERNAL);
  }
});

// POST /api/time/clock-out
router.post("/clock-out", async (req: AuthRequest, res: Response) => {
  try {
    const updated = await TimeService.clockOut(req.user!.id);
    io.emit("clockOut", { userId: req.user!.id });
    return res.json(updated);
  } catch (err: any) {
    if (err?.code === "CLOCK_NOT_IN") return res.status(404).json(err);
    console.error(err); return res.status(500).json(ERRORS.INTERNAL);
  }
});

// POST /api/time/break-start
router.post("/break-start", async (req: AuthRequest, res: Response) => {
  try {
    const updated = await TimeService.breakStart(req.user!.id);
    return res.json(updated);
  } catch (err: any) {
    if (err?.code) return res.status(err.code === "CLOCK_NOT_IN" ? 404 : 409).json(err);
    console.error(err); return res.status(500).json(ERRORS.INTERNAL);
  }
});

// POST /api/time/break-end
router.post("/break-end", async (req: AuthRequest, res: Response) => {
  try {
    const updated = await TimeService.breakEnd(req.user!.id);
    return res.json(updated);
  } catch (err: any) {
    if (err?.code) return res.status(404).json(err);
    console.error(err); return res.status(500).json(ERRORS.INTERNAL);
  }
});

// GET /api/time/current
router.get("/current", async (req: AuthRequest, res: Response) => {
  try {
    const entry = await TimeService.getCurrent(req.user!.id);
    return res.json(entry ?? null);
  } catch (err) { console.error(err); return res.status(500).json(ERRORS.INTERNAL); }
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
  } catch (err) { console.error(err); return res.status(500).json(ERRORS.INTERNAL); }
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
  } catch (err) { console.error(err); return res.status(500).json(ERRORS.INTERNAL); }
});

export default router;
