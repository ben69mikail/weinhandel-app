import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";
import { buildDatevCsv } from "../services/scheduler-logic.js";
import { vacationDaysInRange, vacationHours, reportDiffMinutes } from "../services/reporting-logic.js";

const router = Router();
router.use(authenticate, adminOnly);

// GET /api/reporting/monthly?month=YYYY-MM
router.get("/monthly", async (req: AuthRequest, res: Response) => {
  const { month } = req.query as Record<string, string>;
  if (!month) return res.status(400).json({ error: "month fehlt" });
  const [y, m] = month.split("-").map(Number);
  try {
    const monthStart = new Date(y, m - 1, 1);
    const monthEnd = new Date(y, m, 0); // letzter Tag des Monats
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true, employeeType: true, monthlyHours: true, vacationHoursPerDay: true, personnelNumber: true },
    });
    const entries = await prisma.timeEntry.findMany({
      where: { clockIn: { gte: monthStart, lt: new Date(y, m, 1) }, clockOut: { not: null } },
    });
    // Genehmigte Urlaubsanträge, die den Monat berühren
    const vacations = await prisma.vacationRequest.findMany({
      where: { type: "VACATION", status: "APPROVED", startDate: { lte: monthEnd }, endDate: { gte: monthStart } },
    });

    const report = users.map((u) => {
      const userEntries = entries.filter((e) => e.userId === u.id);
      const netMinutes = userEntries.reduce((s, e) => s + (e.netMinutes ?? 0), 0);
      const grossMinutes = userEntries.reduce((s, e) => s + (e.totalMinutes ?? 0), 0);
      const breakMinutes = userEntries.reduce((s, e) => s + (e.breakMinutes ?? 0), 0);
      const sollMinutes = (u.monthlyHours ?? 0) * 60;
      // Urlaub in Stunden = Urlaubstage im Monat × Stunden-pro-Tag (pro Mitarbeiter)
      const vacationDays = vacations
        .filter((v) => v.userId === u.id)
        .reduce((s, v) => s + vacationDaysInRange(v.startDate, v.endDate, monthStart, monthEnd), 0);
      const vacHours = vacationHours(vacationDays, u.vacationHoursPerDay ?? 8);
      return {
        user: u, entries: userEntries, netMinutes, grossMinutes, breakMinutes,
        sollMinutes, diff: reportDiffMinutes(netMinutes, vacHours, sollMinutes),
        days: userEntries.length, vacationDays, vacationHours: vacHours,
      };
    });
    return res.json(report);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// GET /api/reporting/export-datev?month=YYYY-MM
router.get("/export-datev", async (req: AuthRequest, res: Response) => {
  const { month } = req.query as Record<string, string>;
  if (!month) return res.status(400).json({ error: "month fehlt" });
  const [y, m] = month.split("-").map(Number);
  try {
    const entries = await prisma.timeEntry.findMany({
      where: { clockIn: { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) }, clockOut: { not: null } },
      include: { user: { select: { firstName: true, lastName: true, personnelNumber: true } } },
      orderBy: [{ user: { lastName: "asc" } }, { clockIn: "asc" }],
    });

    const csv = buildDatevCsv(entries);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="DATEV_${month}.csv"`);
    return res.send(csv);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// PUT /api/reporting/time/:id — Admin Korrektur
router.put("/time/:id", async (req: AuthRequest, res: Response) => {
  const { clockIn, clockOut, breakMinutes, note } = req.body;
  try {
    const entry = await prisma.timeEntry.findUnique({ where: { id: req.params.id } });
    if (!entry) return res.status(404).json({ error: "Nicht gefunden" });

    const newIn = clockIn ? new Date(clockIn) : entry.clockIn;
    const newOut = clockOut ? new Date(clockOut) : entry.clockOut;
    const newBreak = breakMinutes !== undefined ? Number(breakMinutes) : entry.breakMinutes;
    const totalMinutes = newOut ? (newOut.getTime() - newIn.getTime()) / 60000 : null;
    const netMinutes = totalMinutes !== null ? totalMinutes - newBreak : null;

    const updated = await prisma.timeEntry.update({
      where: { id: req.params.id },
      data: { clockIn: newIn, clockOut: newOut ?? undefined, breakMinutes: newBreak, totalMinutes: totalMinutes ?? undefined, netMinutes: netMinutes ?? undefined, correctedBy: req.user!.id, note },
    });
    return res.json(updated);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

export default router;