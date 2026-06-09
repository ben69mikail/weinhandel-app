import { prisma } from "../lib/prisma.js";
import { ERRORS } from "../lib/errors.js";

export class VacationService {
  static async create(userId: string, startDate: string, endDate: string, type: string, note?: string) {
    if (!startDate || !endDate) {
      throw { code: "VALIDATION_ERROR", message: "Datum fehlt" };
    }

    // Überlappungsprüfung
    const start = new Date(startDate);
    const end = new Date(endDate);
    const overlap = await prisma.vacationRequest.findFirst({
      where: {
        userId,
        status: { not: "REJECTED" },
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });
    if (overlap) throw ERRORS.VACATION_OVERLAP;

    return prisma.vacationRequest.create({
      data: {
        userId,
        startDate: start,
        endDate: end,
        type: (type ?? "VACATION") as "VACATION" | "SICK" | "SPECIAL",
        note: note ?? null,
        status: "PENDING",
      },
    });
  }

  static async approve(id: string, status: "APPROVED" | "REJECTED", adminNote?: string) {
    return prisma.vacationRequest.update({
      where: { id },
      data: { status, adminNote: adminNote ?? null },
    });
  }

  static async canDelete(id: string, userId: string, role: string) {
    const vr = await prisma.vacationRequest.findUnique({ where: { id } });
    if (!vr) throw ERRORS.NOT_FOUND;
    if (vr.userId !== userId && role !== "ADMIN") throw ERRORS.FORBIDDEN;
    return vr;
  }
}
