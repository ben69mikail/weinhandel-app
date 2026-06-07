import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";

const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const isAdmin = (req as any).user.role === "ADMIN";
    const where = isAdmin ? {} : {
      OR: [{ requesterId: (req as any).user.id }, { targetUserId: (req as any).user.id }],
    };
    const swaps = await prisma.shiftSwapRequest.findMany({
      where,
      include: {
        requester: { select: { id: true, firstName: true, lastName: true } },
        targetUser: { select: { id: true, firstName: true, lastName: true } },
        fromShift: { select: { id: true, startTime: true, endTime: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(swaps);
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const { targetUserId, fromShiftId, toShiftId, note } = req.body;
    if (!fromShiftId) return res.status(400).json({ error: "Schicht fehlt" });
    const swap = await prisma.shiftSwapRequest.create({
      data: {
        requesterId: (req as any).user.id,
        targetUserId: targetUserId ?? null,
        fromShiftId,
        toShiftId: toShiftId ?? null,
        note: note ?? null,
        status: "PENDING",
      },
    });
    res.status(201).json(swap);
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

router.put("/:id", authenticate, async (req, res) => {
  try {
    const req2 = req as any;
    const swap = await prisma.shiftSwapRequest.findUnique({ where: { id: req.params.id } });
    if (!swap) return res.status(404).json({ error: "Not found" });
    const { status } = req.body;
    if (req2.user.id === swap.targetUserId || req2.user.id === swap.requesterId || req2.user.role === "ADMIN") {
      const updated = await prisma.shiftSwapRequest.update({ where: { id: req.params.id }, data: { status } });
      return res.json(updated);
    }
    return res.status(403).json({ error: "Forbidden" });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

export default router;