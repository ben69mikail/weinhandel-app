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
    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json({ ok:true });
  } catch { res.status(500).json({ error:"Server error" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ ok:true });
  } catch { res.status(500).json({ error:"Server error" }); }
});

export default router;