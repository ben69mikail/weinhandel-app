// Effektbehaftete Job-Runner: laden Daten, treffen Entscheidungen über die
// getestete reine Logik in scheduler-logic.ts und schreiben die Effekte.
// Aufgerufen sowohl vom lokalen Cron (scheduler.ts) als auch von den
// Netlify Scheduled Functions (netlify/functions/cron-*.ts).

import { prisma } from "../lib/prisma.js";
import { io } from "../lib/realtime.js";
import { sendMail } from "./mailer.js";
import {
  computeAutoBreaks,
  buildDatevCsv,
  findBirthdays,
  isTempAdminExpired,
} from "./scheduler-logic.js";

// Automatische Pause nach Überschreiten der Höchstarbeitszeit setzen.
export async function runAutoBreaks(now: Date = new Date()): Promise<number> {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const opts = {
    breakAfterHours: settings?.autoBreakAfterHours ?? 6,
    breakMinutes: settings?.autoBreakMinutes ?? 15,
  };
  const active = await prisma.timeEntry.findMany({
    where: { clockOut: null, breakStart: null },
  });
  const decisions = computeAutoBreaks(
    active.map((e) => ({ id: e.id, userId: e.userId, clockIn: e.clockIn })),
    opts,
    now,
  );
  for (const d of decisions) {
    await prisma.timeEntry.update({
      where: { id: d.entryId },
      data: {
        breakStart: d.breakStart,
        breakEnd: d.breakEnd,
        breakMinutes: d.breakMinutes,
        autoBreak: true,
      },
    });
    io.emit("autoBreak", { userId: d.userId, breakMinutes: d.breakMinutes });
  }
  return decisions.length;
}

// Monatlicher DATEV-Export des Vormonats per Mail.
export async function runDatevExport(
  now: Date = new Date(),
): Promise<{ skipped: true } | { month: string; count: number }> {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (!settings?.emailFrom) {
    console.log("[DATEV] Keine E-Mail konfiguriert, übersprungen");
    return { skipped: true };
  }
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const month = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
  const from = new Date(prev.getFullYear(), prev.getMonth(), 1);
  const to = new Date(prev.getFullYear(), prev.getMonth() + 1, 0, 23, 59, 59);
  const entries = await prisma.timeEntry.findMany({
    where: { clockIn: { gte: from, lte: to }, clockOut: { not: null } },
    include: {
      user: { select: { firstName: true, lastName: true, personnelNumber: true } },
    },
    orderBy: [{ user: { lastName: "asc" } }, { clockIn: "asc" }],
  });
  // CSV über die geteilte Funktion erzeugen (identisch zum Route-Download).
  const csv = buildDatevCsv(entries);
  await sendMail(
    settings.emailFrom,
    `DATEV-Export ${month} — Weinhandel Martin Volmer e.K.`,
    `<p>Anbei der DATEV-Export für ${month}.</p><p>Einträge: ${entries.length}</p><pre>${csv.length} Zeichen CSV</pre>`,
  );
  console.log(`[DATEV] ${month} — ${entries.length} Einträge an ${settings.emailFrom}`);
  return { month, count: entries.length };
}

// Abgelaufene temporäre Admin-Rechte zurücksetzen.
export async function runTempAdminExpiry(now: Date = new Date()): Promise<number> {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", tempAdminUntil: { not: null } },
  });
  const expired = admins.filter((u) => isTempAdminExpired(u, now));
  for (const u of expired) {
    await prisma.user.update({
      where: { id: u.id },
      data: { role: "EMPLOYEE", tempAdminUntil: null },
    });
    await prisma.notification.create({
      data: {
        userId: u.id,
        type: "GENERAL",
        title: "Admin-Zugang abgelaufen",
        message: "Deine temporären Administratorrechte sind abgelaufen.",
      },
    });
    console.log(`[TempAdmin] Rechte abgelaufen für ${u.firstName} ${u.lastName}`);
  }
  return expired.length;
}

// Geburtstags-Benachrichtigungen für heute erstellen.
export async function runBirthdays(now: Date = new Date()): Promise<number> {
  const users = await prisma.user.findMany({
    where: { isActive: true, birthday: { not: null } },
  });
  const ids = findBirthdays(
    users.map((u) => ({ id: u.id, birthday: u.birthday })),
    now,
  );
  for (const id of ids) {
    const u = users.find((x) => x.id === id)!;
    await prisma.notification.create({
      data: {
        userId: id,
        type: "BIRTHDAY",
        title: "Alles Gute! 🎂",
        message: `Herzlichen Glückwunsch zum Geburtstag, ${u.firstName}!`,
      },
    });
  }
  return ids.length;
}
