import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  try {
    const n = await prisma.notification.findMany({
      where: { userId: (req as any).user.id },
      orderBy: { createdAt:"desc" },
      take: 50,
    });
    res.json(n);
  } catch { res.status(500).json({ error:"Server error" }); }
});

router.put("/read-all", async (req, res) => {
  try {
    await prisma.notification.updateMany({ where: { userId: (req as any).user.id, isRead: false }, data: { isRead: true } });
    res.json({ ok:true });
  } catch { res.status(500).json({ error:"Server error" }); }
});

router.put("/:id/read", async (req, res) => {
  try {
    // updateMany mit userId-Filter: nur eigene Benachrichtigungen
    const r = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: (req as any).user.id },
      data: { isRead: true },
    });
    if (r.count === 0) return res.status(404).json({ code: "NOT_FOUND", message: "Nicht gefunden" });
    res.json({ ok:true });
  } catch { res.status(500).json({ error:"Server error" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const r = await prisma.notification.deleteMany({
      where: { id: req.params.id, userId: (req as any).user.id },
    });
    if (r.count === 0) return res.status(404).json({ code: "NOT_FOUND", message: "Nicht gefunden" });
    res.json({ ok:true });
  } catch { res.status(500).json({ error:"Server error" }); }
});

export default router;