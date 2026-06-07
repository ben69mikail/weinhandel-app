import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";
const router = Router();
router.use(authenticate);
router.get("/", async (req, res) => {
  try {
    const { from, to } = req.query as Record<string,string>;
    const where: Record<string,unknown> = {};
    if (from || to) { where.date = {}; if (from) (where.date as any).gte = new Date(from); if (to) (where.date as any).lte = new Date(to); }
    const ev = await prisma.event.findMany({ where, orderBy: { date:"asc" } });
    res.json(ev);
  } catch { res.status(500).json({ error:"Server error" }); }
});
router.post("/", adminOnly, async (req, res) => {
  try {
    const { title, description, date, endDate, type, color, isPublic } = req.body;
    if (!title || !date) return res.status(400).json({ error:"Felder fehlen" });
    const ev = await prisma.event.create({ data: { title, description: description ?? null, date: new Date(date), endDate: endDate ? new Date(endDate) : null, type: type ?? "GENERAL", color: color ?? "#6366F1", isPublic: isPublic ?? true } });
    res.status(201).json(ev);
  } catch { res.status(500).json({ error:"Server error" }); }
});
router.put("/:id", adminOnly, async (req, res) => {
  try {
    const { title, description, date, endDate, type, color, isPublic } = req.body;
    const ev = await prisma.event.update({ where: { id: req.params.id }, data: { title, description, date: new Date(date), endDate: endDate ? new Date(endDate) : null, type, color, isPublic } });
    res.json(ev);
  } catch { res.status(500).json({ error:"Server error" }); }
});
router.delete("/:id", adminOnly, async (req, res) => {
  try { await prisma.event.delete({ where: { id: req.params.id } }); res.json({ ok:true }); }
  catch { res.status(500).json({ error:"Server error" }); }
});
export default router;