import { prisma } from "../lib/prisma.js";
import { ERRORS } from "../lib/errors.js";

export class TimeService {
  static async clockIn(userId: string, shiftId?: string) {
    const active = await prisma.timeEntry.findFirst({
      where: { userId, clockOut: null },
    });
    if (active) throw ERRORS.CLOCK_ALREADY_IN;

    return prisma.timeEntry.create({
      data: { userId, shiftId: shiftId ?? null, clockIn: new Date() },
    });
  }

  static async clockOut(userId: string) {
    const entry = await prisma.timeEntry.findFirst({
      where: { userId, clockOut: null },
    });
    if (!entry) throw ERRORS.CLOCK_NOT_IN;

    const clockOut = new Date();
    const totalMinutes = (clockOut.getTime() - entry.clockIn.getTime()) / 60000;
    const breakMinutes = entry.breakMinutes ?? 0;
    const netMinutes = totalMinutes - breakMinutes;

    return prisma.timeEntry.update({
      where: { id: entry.id },
      data: { clockOut, totalMinutes, netMinutes },
    });
  }

  static async breakStart(userId: string) {
    const entry = await prisma.timeEntry.findFirst({
      where: { userId, clockOut: null },
    });
    if (!entry) throw ERRORS.CLOCK_NOT_IN;

    return prisma.timeEntry.update({
      where: { id: entry.id },
      data: { breakStart: new Date() },
    });
  }

  static async breakEnd(userId: string) {
    const entry = await prisma.timeEntry.findFirst({
      where: { userId, clockOut: null },
    });
    if (!entry) throw ERRORS.CLOCK_NOT_IN;
    if (!entry.breakStart) throw { code: "VALIDATION_ERROR", message: "Keine aktive Pause" };

    const breakMs = new Date().getTime() - (entry.breakStart as Date).getTime();
    const addedMinutes = Math.round(breakMs / 60000);
    const breakMinutes = (entry.breakMinutes ?? 0) + addedMinutes;

    return prisma.timeEntry.update({
      where: { id: entry.id },
      data: { breakEnd: new Date(), breakMinutes },
    });
  }

  static async getCurrent(userId: string) {
    return prisma.timeEntry.findFirst({
      where: { userId, clockOut: null },
    });
  }
}
