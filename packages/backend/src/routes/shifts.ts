import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";
import { ShiftService } from "../services/ShiftService.js";
import { generateRecurringDates } from "../services/recurrence.js";
import { reconcileAssignments, collectAssignConflicts, AssignConflict } from "../services/shift-rules.js";

// Kalendertag-Grenzen [start, end) für Datums-Range-Queries.
function dayBounds(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return { start, end: new Date(start.getTime() + 86400000) };
}

// Prüft zuzuteilende Mitarbeiter auf ALLE Konflikte gegen ihren Zustand am
// Tag der Schicht: fehlende/abweichende Verfügbarkeit UND Zeitkollision mit
// anderen ASSIGNED-Schichten. Liefert je Mitarbeiter mit Konflikt Name + Liste.
async function collectAssignClashes(
  shift: { date: Date; startTime: string; endTime: string },
  userIds: string[],
  excludeShiftId?: string,
): Promise<{ userId: string; userName: string; conflicts: AssignConflict[] }[]> {
  if (userIds.length === 0) return [];
  const { start, end } = dayBounds(shift.date);
  const [assignments, avails, users] = await Promise.all([
    prisma.shiftAssignment.findMany({
      where: {
        userId: { in: userIds },
        status: "ASSIGNED",
        ...(excludeShiftId ? { shiftId: { not: excludeShiftId } } : {}),
        shift: { date: { gte: start, lt: end } },
      },
      include: { shift: { select: { startTime: true, endTime: true } } },
    }),
    prisma.availability.findMany({ where: { userId: { in: userIds }, date: { gte: start, lt: end } } }),
    prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, firstName: true, lastName: true } }),
  ]);
  const nameById = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));
  const availById = new Map(avails.map((a) => [a.userId, a]));
  const shiftsByUser = new Map<string, { startTime: string; endTime: string }[]>();
  for (const uid of userIds) shiftsByUser.set(uid, []);
  for (const a of assignments) {
    shiftsByUser.get(a.userId)?.push({ startTime: a.shift.startTime, endTime: a.shift.endTime });
  }
  const candidates = userIds.map((uid) => {
    const av = availById.get(uid);
    return {
      userId: uid,
      availability: av ? { type: av.type, startTime: av.startTime, endTime: av.endTime } : null,
      otherShiftsSameDay: shiftsByUser.get(uid) ?? [],
    };
  });
  const conflicts = collectAssignConflicts(
    { startTime: shift.startTime, endTime: shift.endTime },
    candidates,
  );
  return conflicts.map((c) => ({ userId: c.userId, userName: nameById.get(c.userId) ?? "", conflicts: c.conflicts }));
}
import { ERRORS } from "../lib/errors.js";

const router = Router();
router.use(authenticate);

const shiftSchema = z.object({
  title: z.string().min(1),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().default("Weinhandel"),
  type: z.enum(["REGULAR","EVENT","TASTING","CONCERT","HOLIDAY_COVERAGE"]).default("REGULAR"),
  area: z.string().default("Arbeitsbereich 1"),
  maxWorkers: z.number().default(2),
  minWorkers: z.number().default(1),
  notes: z.string().nullish(),
  isPublished: z.boolean().default(false),
  isOpenShift: z.boolean().default(false),
  requiredSkills: z.array(z.string()).default([]),
  color: z.string().default("#8B1A1A"),
  assignUserIds: z.array(z.string()).optional(),
  // Wiederholung: wenn recurring=true, an recurWeekdays (0=So..6=Sa) wöchentlich bis recurUntil
  recurring: z.boolean().default(false),
  recurWeekdays: z.array(z.number().int().min(0).max(6)).optional(),
  recurUntil: z.string().optional(),
});

// GET /api/shifts
router.get("/", async (req: AuthRequest, res: Response) => {
  const { week, month, userId } = req.query as Record<string, string>;
  try {
    const where: Record<string, unknown> = {};
    if (month) {
      const [y, m] = month.split("-").map(Number);
      where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
    }
    if (week) {
      // week = YYYY-WXX
      const [y, w] = week.split("-W").map(Number);
      const jan4 = new Date(y, 0, 4);
      const startOfWeek = new Date(jan4.getTime() - ((jan4.getDay() || 7) - 1) * 86400000 + (w - 1) * 7 * 86400000);
      const endOfWeek = new Date(startOfWeek.getTime() + 7 * 86400000);
      where.date = { gte: startOfWeek, lt: endOfWeek };
    }
    const shifts = await prisma.shift.findMany({
      where,
      include: {
        assignments: {
          where: userId ? { userId } : undefined,
          include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
    return res.json(shifts);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// GET /api/shifts/open
router.get("/open", async (_req: AuthRequest, res: Response) => {
  try {
    const shifts = await prisma.shift.findMany({
      where: { isOpenShift: true, isPublished: true, date: { gte: new Date() } },
      include: { assignments: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
      orderBy: { date: "asc" },
    });
    return res.json(shifts);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// GET /api/shifts/:id
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const shift = await prisma.shift.findUnique({
      where: { id: req.params.id },
      include: { assignments: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } }, tasks: true },
    });
    if (!shift) return res.status(404).json({ error: "Nicht gefunden" });
    return res.json(shift);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// POST /api/shifts (Admin)
router.post("/", adminOnly, async (req: AuthRequest, res: Response) => {
  const parsed = shiftSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { assignUserIds, date, recurring, recurWeekdays, recurUntil, ...data } = parsed.data;
  const assignmentCreate = assignUserIds?.length
    ? { create: assignUserIds.map((uid) => ({ userId: uid, status: "ASSIGNED" as const })) }
    : undefined;
  try {
    // Wiederkehrend: für jeden erzeugten Termin eine eigenständige Schicht anlegen
    if (recurring && recurWeekdays?.length && recurUntil) {
      const dates = generateRecurringDates(date, recurWeekdays, recurUntil);
      if (dates.length === 0)
        return res.status(400).json({ code: "VALIDATION_ERROR", message: "Keine Termine im gewählten Zeitraum" });
      const created = await prisma.$transaction(
        dates.map((d) =>
          prisma.shift.create({
            data: { ...data, isRecurring: true, date: new Date(d + "T00:00:00"), assignments: assignmentCreate },
          })
        )
      );
      return res.status(201).json({ count: created.length, shifts: created });
    }

    // Kollisionsprüfung für direkt zugeteilte Mitarbeiter (Create-Modal).
    if (assignUserIds?.length && req.body.force !== true) {
      const clashes = await collectAssignClashes(
        { date: new Date(date), startTime: data.startTime, endTime: data.endTime },
        assignUserIds,
      );
      if (clashes.length > 0) {
        return res.status(409).json({ code: "ASSIGN_CONFLICT", message: "Zeitkonflikt bei Zuteilung", clashes });
      }
    }

    const shift = await prisma.shift.create({
      data: { ...data, date: new Date(date), assignments: assignmentCreate },
      include: { assignments: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
    });
    return res.status(201).json(shift);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// PUT /api/shifts/:id (Admin)
router.put("/:id", adminOnly, async (req: AuthRequest, res: Response) => {
  const parsed = shiftSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  // Wiederholung gilt nur beim Anlegen — beim Bearbeiten verwerfen (keine Shift-Spalten)
  const { assignUserIds, date, recurring, recurWeekdays, recurUntil, ...data } = parsed.data;
  try {
    const shiftId = req.params.id;
    const existing = await prisma.shift.findUnique({ where: { id: shiftId } });
    if (!existing) return res.status(404).json(ERRORS.NOT_FOUND);

    // Zuteilungs-Delta vorab bestimmen, um neu hinzukommende auf Kollision zu prüfen.
    let toAdd: string[] = [];
    let toRemove: string[] = [];
    if (assignUserIds !== undefined) {
      const currentAssigned = (
        await prisma.shiftAssignment.findMany({ where: { shiftId, status: "ASSIGNED" } })
      ).map((a) => a.userId);
      ({ toAdd, toRemove } = reconcileAssignments(currentAssigned, assignUserIds));

      if (toAdd.length && req.body.force !== true) {
        const clashes = await collectAssignClashes(
          {
            date: date ? new Date(date) : existing.date,
            startTime: data.startTime ?? existing.startTime,
            endTime: data.endTime ?? existing.endTime,
          },
          toAdd,
          shiftId,
        );
        if (clashes.length > 0) {
          return res.status(409).json({ code: "ASSIGN_CONFLICT", message: "Zeitkonflikt bei Zuteilung", clashes });
        }
      }
    }

    await prisma.shift.update({
      where: { id: shiftId },
      data: { ...data, ...(date ? { date: new Date(date) } : {}) },
    });

    if (assignUserIds !== undefined) {
      await prisma.$transaction([
        ...toRemove.map((userId) =>
          prisma.shiftAssignment.delete({ where: { shiftId_userId: { shiftId, userId } } }),
        ),
        ...toAdd.map((userId) =>
          prisma.shiftAssignment.upsert({
            where: { shiftId_userId: { shiftId, userId } },
            update: { status: "ASSIGNED" },
            create: { shiftId, userId, status: "ASSIGNED" },
          }),
        ),
      ]);
    }

    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: { assignments: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
    });
    return res.json(shift);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// DELETE /api/shifts/:id (Admin)  — ?scope=series löscht die ganze Wiederholungsserie
router.delete("/:id", adminOnly, async (req: AuthRequest, res: Response) => {
  const scope = (req.query.scope as string) ?? "single";
  try {
    const shift = await prisma.shift.findUnique({ where: { id: req.params.id } });
    if (!shift) return res.status(404).json(ERRORS.NOT_FOUND);

    if (scope === "series" && shift.isRecurring) {
      // Serie ohne seriesId-Spalte über die gemeinsamen Merkmale identifizieren.
      const result = await prisma.shift.deleteMany({
        where: {
          isRecurring: true,
          title: shift.title,
          startTime: shift.startTime,
          endTime: shift.endTime,
          area: shift.area,
        },
      });
      return res.json({ message: "Serie gelöscht", count: result.count });
    }

    await prisma.shift.delete({ where: { id: req.params.id } });
    return res.json({ message: "Gelöscht", count: 1 });
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// PUT /api/shifts/:id/publish (Admin)
router.put("/:id/publish", adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const shift = await prisma.shift.update({ where: { id: req.params.id }, data: { isPublished: true } });
    return res.json(shift);
  } catch (err) { console.error(err); return res.status(500).json({ error: "Serverfehler" }); }
});

// POST /api/shifts/:id/assign (Admin)
router.post("/:id/assign", adminOnly, async (req: AuthRequest, res: Response) => {
  const { userId, force } = req.body;
  if (!userId) return res.status(400).json(ERRORS.NOT_FOUND);
  try {
    const assignment = await ShiftService.assign(req.params.id, userId, { force: force === true });
    return res.json(assignment);
  } catch (err: any) {
    if (err?.code) return res.status(err.code === "NOT_FOUND" ? 404 : 409).json(err);
    console.error(err); return res.status(500).json(ERRORS.INTERNAL);
  }
});

// POST /api/shifts/:id/apply (Employee)
router.post("/:id/apply", async (req: AuthRequest, res: Response) => {
  try {
    const assignment = await ShiftService.apply(req.params.id, req.user!.id);
    return res.json(assignment);
  } catch (err: any) {
    if (err?.code) return res.status(err.code === "NOT_FOUND" ? 404 : 409).json(err);
    console.error(err); return res.status(500).json(ERRORS.INTERNAL);
  }
});

// PUT /api/shifts/:id/assignments/:assignmentId (Admin — approve/reject applicant)
router.put("/:id/assignments/:assignmentId", adminOnly, async (req: AuthRequest, res: Response) => {
  const { status } = req.body as { status: string };
  if (!["APPROVED", "REJECTED"].includes(status))
    return res.status(400).json({ code: "VALIDATION_ERROR", message: "Ungültiger Status" });
  try {
    const assignment = await ShiftService.updateAssignmentStatus(
      req.params.assignmentId, status as "APPROVED" | "REJECTED"
    );
    return res.json(assignment);
  } catch (err) { console.error(err); return res.status(500).json(ERRORS.INTERNAL); }
});

export default router;