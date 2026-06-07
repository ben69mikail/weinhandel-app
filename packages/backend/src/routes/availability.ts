import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

const availSchema = z.object({
  date: z.string(),
  type: z.enum(["AVAILABLE","UNAVAILABLE","PREFERRED","PARTIAL"]),
  note: z.string().optional(),
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
  const { date, ...rest } = parsed.data;
  try {
    const avail = await prisma.availability.upsert({
      where: { userId_date: { userId: req.user!.id, date: new Date(date) } },
      update: rest,
      create: { userId: req.user!.id, date: new Date(date), ...rest },
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
    await prisma.availability.delete({ where: { id: req.params.id } });
    return res.json({ message: "Gelöscht" });
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

export default router;