import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";
const router = Router();
router.use(authenticate);
router.get("/", async (_req, res) => {
  try {
    const calcs = await prisma.tipCalculation.findMany({ include: { entries: { include: { user: { select: { id:true, firstName:true, lastName:true } } } } }, orderBy: { calculatedAt:"desc" }, take: 20 });
    res.json(calcs);
  } catch { res.status(500).json({ error:"Server error" }); }
});
router.post("/calculate", adminOnly, async (req, res) => {
  try {
    const { shiftDate, totalTip, workers } = req.body;
    if (!totalTip || !workers?.length) return res.status(400).json({ error:"Felder fehlen" });
    const totalHours: number = workers.reduce((s: number, w: any) => s + w.hoursWorked, 0);
    if (totalHours === 0) return res.status(400).json({ error:"Keine Stunden" });
    const calc = await prisma.tipCalculation.create({
      data: { shiftDate: shiftDate ? new Date(shiftDate) : new Date(), shiftId:"manual", totalTip: Number(totalTip),
        entries: { create: workers.map((w: any) => ({ userId: w.userId, hoursWorked: w.hoursWorked, tipAmount: Math.round((w.hoursWorked / totalHours) * Number(totalTip) * 100) / 100 })) } },
      include: { entries: { include: { user: { select: { id:true, firstName:true, lastName:true } } } } },
    });
    res.status(201).json(calc);
  } catch (err) { console.error(err); res.status(500).json({ error:"Server error" }); }
});
export default router;