import { prisma } from "../lib/prisma.js";
import { ERRORS } from "../lib/errors.js";
import { requiredBreakMinutes } from "./scheduler-logic.js";

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
    const manualBreak = entry.breakMinutes ?? 0;

    // Gestaffelte Pflicht-Pause aus den Einstellungen (z.B. 6h→30min, 8h→60min).
    // Es zählt das Maximum aus manuell genommener und gesetzlich fälliger Pause.
    const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
    const tiers = [
      { afterHours: settings?.autoBreakAfterHours ?? 6, breakMinutes: settings?.autoBreakMinutes ?? 30 },
      { afterHours: settings?.autoBreak2AfterHours ?? 8, breakMinutes: settings?.autoBreak2Minutes ?? 60 },
    ];
    const required = requiredBreakMinutes(totalMinutes, tiers);
    const breakMinutes = Math.max(manualBreak, required);
    const netMinutes = totalMinutes - breakMinutes;

    return prisma.timeEntry.update({
      where: { id: entry.id },
      data: { clockOut, totalMinutes, netMinutes, breakMinutes, autoBreak: required > manualBreak },
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
