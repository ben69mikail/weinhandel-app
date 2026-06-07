import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { sendVacationDecision } from "../services/mailer.js";
import { adminOnly } from "../middleware/adminOnly.js";

const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const isAdmin = (req as any).user.role === "ADMIN";
    const where = isAdmin ? {} : { userId: (req as any).user.id };
    const requests = await prisma.vacationRequest.findMany({
      where,
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { startDate: "desc" },
    });
    res.json(requests);
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const { startDate, endDate, type, note } = req.body;
    if (!startDate || !endDate) return res.status(400).json({ error: "Datum fehlt" });
    const request = await prisma.vacationRequest.create({
      data: {
        userId: (req as any).user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type: type ?? "VACATION",
        note: note ?? null,
        status: "PENDING",
      },
    });
    res.status(201).json(request);
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

router.put("/:id", authenticate, adminOnly, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!["APPROVED", "REJECTED"].includes(status)) return res.status(400).json({ error: "Invalid status" });
    const request = await prisma.vacationRequest.update({
      where: { id: req.params.id },
      data: { status, adminNote: adminNote ?? null },
    });
    res.json(request);
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const req2 = req as any;
    const vr = await prisma.vacationRequest.findUnique({ where: { id: req.params.id } });
    if (!vr) return res.status(404).json({ error: "Not found" });
    if (vr.userId !== req2.user.id && req2.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
    await prisma.vacationRequest.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

export default router;