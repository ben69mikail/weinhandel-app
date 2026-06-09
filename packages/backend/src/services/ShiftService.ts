import { prisma } from "../lib/prisma.js";
import { ERRORS } from "../lib/errors.js";

const SHIFT_INCLUDE = {
  assignments: {
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  },
} as const;

export class ShiftService {
  /** Admin: direktes Einteilen eines Mitarbeiters */
  static async assign(shiftId: string, userId: string) {
    const shift = await prisma.shift.findUnique({ where: { id: shiftId }, include: { assignments: true } });
    if (!shift) throw ERRORS.NOT_FOUND;

    const alreadyAssigned = shift.assignments.some(
      (a) => a.userId === userId && a.status === "ASSIGNED"
    );
    if (alreadyAssigned) throw ERRORS.SHIFT_ALREADY_ASSIGNED;

    if (shift.assignments.filter((a) => a.status === "ASSIGNED").length >= shift.maxWorkers) {
      throw ERRORS.SHIFT_FULL;
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
