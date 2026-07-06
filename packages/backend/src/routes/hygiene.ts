import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";
const router = Router();
router.use(authenticate);
const CURRENT_VERSION = "2025-01";
router.get("/status", async (req, res) => {
  try {
    const c = await prisma.hygieneConfirmation.findFirst({ where: { userId: (req as any).user.id, version: CURRENT_VERSION } });
    res.json({ confirmed: !!c, version: CURRENT_VERSION, confirmedAt: c?.confirmedAt ?? null });
  } catch { res.status(500).json({ error:"Server error" }); }
});
router.post("/confirm", async (req, res) => {
  try {
    const uid = (req as any).user.id;
    const ex = await prisma.hygieneConfirmation.findFirst({ where: { userId: uid, version: CURRENT_VERSION } });
    if (ex) return res.json({ ok:true, confirmedAt: ex.confirmedAt });
    const c = await prisma.hygieneConfirmation.create({ data: { userId: uid, version: CURRENT_VERSION } });
    res.status(201).json({ ok:true, confirmedAt: c.confirmedAt });
  } catch { res.status(500).json({ error:"Server error" }); }
});
router.get("/all", adminOnly, async (_req, res) => {
  try {
    const list = await prisma.hygieneConfirmation.findMany({ where: { version: CURRENT_VERSION }, include: { user: { select: { id:true, firstName:true, lastName:true } } } });
    res.json(list);
  } catch { res.status(500).json({ error:"Server error" }); }
});
export default router;