import { prisma } from "../lib/prisma.js";
import { ERRORS, apiError } from "../lib/errors.js";
import { dayActionAllowed, detectAssignConflicts } from "./shift-rules.js";

// Kalendertag-Grenzen [start, end) für Datums-Range-Queries.
function dayRange(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const end = new Date(start.getTime() + 86400000);
  return { start, end };
}

const SHIFT_INCLUDE = {
  assignments: {
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  },
} as const;

export class ShiftService {
  /**
   * Admin: direktes Einteilen eines Mitarbeiters.
   * Ohne `force` werden Verfügbarkeits-/Doppelschicht-Konflikte als
   * ASSIGN_CONFLICT (409, mit conflicts-Liste) gemeldet, damit die UI ein
   * Bestätigungs-Popup zeigen kann. Mit `force` überschreibt der Admin.
   */
  static async assign(shiftId: string, userId: string, opts?: { force?: boolean }) {
    const shift = await prisma.shift.findUnique({ where: { id: shiftId }, include: { assignments: true } });
    if (!shift) throw ERRORS.NOT_FOUND;

    const alreadyAssigned = shift.assignments.some(
      (a) => a.userId === userId && a.status === "ASSIGNED"
    );
    if (alreadyAssigned) throw ERRORS.SHIFT_ALREADY_ASSIGNED;

    if (shift.assignments.filter((a) => a.status === "ASSIGNED").length >= shift.maxWorkers) {
      throw ERRORS.SHIFT_FULL;
    }

    if (!opts?.force) {
      const { start, end } = dayRange(shift.date);
      const availability = await prisma.availability.findFirst({
        where: { userId, date: { gte: start, lt: end } },
      });
      const otherAssignments = await prisma.shiftAssignment.findMany({
        where: {
          userId,
          status: "ASSIGNED",
          shiftId: { not: shiftId },
          shift: { date: { gte: start, lt: end } },
        },
        include: { shift: { select: { startTime: true, endTime: true } } },
      });
      const conflicts = detectAssignConflicts({
        shift: { startTime: shift.startTime, endTime: shift.endTime },
        availability: availability
          ? { type: availability.type, startTime: availability.startTime, endTime: availability.endTime }
          : null,
        otherShiftsSameDay: otherAssignments.map((a) => ({
          startTime: a.shift.startTime,
          endTime: a.shift.endTime,
        })),
      });
      if (conflicts.length > 0) {
        throw { ...apiError("ASSIGN_CONFLICT", "Konflikt beim Einteilen"), conflicts };
      }
    }

    return prisma.shiftAssignment.upsert({
      where: { shiftId_userId: { shiftId, userId } },
      update: { status: "ASSIGNED" },
      create: { shiftId, userId, status: "ASSIGNED" },
    });
  }

  /** Employee: Bewerbung auf offene Schicht */
  static async apply(shiftId: string, userId: string) {
    const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift) throw ERRORS.NOT_FOUND;
    if (!shift.isOpenShift || !shift.isPublished) throw ERRORS.SHIFT_NOT_OPEN;

    // Tag-Exklusivität: keine Bewerbung, wenn an dem Tag Verfügbarkeit abgegeben wurde.
    const { start, end } = dayRange(shift.date);
    const availabilities = await prisma.availability.count({
      where: { userId, date: { gte: start, lt: end } },
    });
    if (!dayActionAllowed("APPLICATION", { availabilities, applications: 0 })) {
      throw ERRORS.DAY_LOCKED;
    }

    return prisma.shiftAssignment.upsert({
      where: { shiftId_userId: { shiftId, userId } },
      update: { status: "APPLIED" },
      create: { shiftId, userId, status: "APPLIED" },
    });
  }

  /** Admin: Bewerbung genehmigen oder ablehnen */
  static async updateAssignmentStatus(
    assignmentId: string,
    status: "APPROVED" | "REJECTED"
  ) {
    return prisma.shiftAssignment.update({
      where: { id: assignmentId },
      data: { status },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });
  }

  /** Schicht mit Assignments laden */
  static async findWithAssignments(id: string) {
    return prisma.shift.findUnique({ where: { id }, include: SHIFT_INCLUDE });
  }
}
