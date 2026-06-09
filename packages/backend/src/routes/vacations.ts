import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";
import { VacationService } from "../services/VacationService.js";
import { ERRORS } from "../lib/errors.js";

const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const where = user.role === "ADMIN" ? {} : { userId: user.id };
    const requests = await prisma.vacationRequest.findMany({
      where,
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { startDate: "desc" },
    });
    res.json(requests);
  } catch (err) { res.status(500).json(ERRORS.INTERNAL); }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const { startDate, endDate, type, note } = req.body;
    const request = await VacationService.create((req as any).user.id, startDate, endDate, type, note);
    res.status(201).json(request);
  } catch (err: any) {
    if (err?.code) return res.status(err.code === "VACATION_OVERLAP" ? 409 : 400).json(err);
    res.status(500).json(ERRORS.INTERNAL);
  }
});

router.put("/:id", authenticate, adminOnly, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!["APPROVED", "REJECTED"].includes(status))
      return res.status(400).json({ code: "VALIDATION_ERROR", message: "Ungültiger Status" });
    const request = await VacationService.approve(req.params.id, status, adminNote);
    res.json(request);
  } catch (err) { res.status(500).json(ERRORS.INTERNAL); }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    await VacationService.canDelete(req.params.id, user.id, user.role);
    await prisma.vacationRequest.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err: any) {
    if (err?.code === "NOT_FOUND") return res.status(404).json(err);
    if (err?.code === "FORBIDDEN") return res.status(403).json(err);
    res.status(500).json(ERRORS.INTERNAL);
  }
});

export default router;
