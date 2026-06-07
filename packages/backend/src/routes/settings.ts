import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";

const router = Router();
router.use(authenticate);

router.get("/", adminOnly, async (_req, res) => {
  try {
    const s = await prisma.settings.upsert({
      where: { id:"singleton" },
      create: { id:"singleton" },
      update: {},
    });
    // Never expose raw SMTP password
    res.json({ ...s, smtpPassword: s.smtpPassword ? "***" : null });
  } catch { res.status(500).json({ error:"Server error" }); }
});

router.put("/", adminOnly, async (req, res) => {
  try {
    const { smtpPassword, ...rest } = req.body;
    const data: Record<string,unknown> = { ...rest };
    // Only update password if a real value provided (not masked)
    if (smtpPassword && smtpPassword !== "***") data.smtpPassword = smtpPassword;
    const s = await prisma.settings.upsert({
      where: { id:"singleton" },
      create: { id:"singleton", ...data },
      update: data,
    });
    res.json({ ...s, smtpPassword: s.smtpPassword ? "***" : null });
  } catch (err) { console.error(err); res.status(500).json({ error:"Server error" }); }
});

export default router;