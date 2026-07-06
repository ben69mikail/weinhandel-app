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
    // Tauschantrag nur für eigene Schicht
    const assignment = await prisma.shiftAssignment.findFirst({
      where: { shiftId: fromShiftId, userId: (req as any).user.id },
    });
    if (!assignment && (req as any).user.role !== "ADMIN")
      return res.status(403).json({ code: "FORBIDDEN", message: "Nicht deine Schicht" });
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
    if (!["APPROVED", "REJECTED"].includes(status))
      return res.status(400).json({ code: "VALIDATION_ERROR", message: "Ungültiger Status" });
    const isAdmin = req2.user.role === "ADMIN";
    const isTarget = req2.user.id === swap.targetUserId;
    const isRequester = req2.user.id === swap.requesterId;
    // Genehmigen darf nur Ziel-Mitarbeiter oder Admin; Antragsteller darf nur zurückziehen
    const allowed = isAdmin || (isTarget && ["APPROVED", "REJECTED"].includes(status)) || (isRequester && status === "REJECTED");
    if (!allowed) return res.status(403).json({ code: "FORBIDDEN", message: "Kein Zugriff" });
    const updated = await prisma.shiftSwapRequest.update({
      where: { id: req.params.id },
      data: { status: status as "APPROVED" | "REJECTED" },
    });
    return res.json(updated);
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

export default router;