import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import { io } from "../index.js";
import { sendMail } from "./mailer.js";

// Every minute: check for auto-break (6h rule)
export function startScheduler() {
  cron.schedule("* * * * *", async () => {
    try {
      const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
      const breakAfterHours = settings?.autoBreakAfterHours ?? 6;
      const breakMinutes = settings?.autoBreakMinutes ?? 15;
      const breakAfterMs = breakAfterHours * 3600000;

      const activeEntries = await prisma.timeEntry.findMany({
        where: { clockOut: null, breakStart: null },
      });

      for (const entry of activeEntries) {
        const elapsed = Date.now() - entry.clockIn.getTime();
        if (elapsed >= breakAfterMs) {
          const breakStart = new Date();
          const breakEnd = new Date(breakStart.getTime() + breakMinutes * 60000);
          await prisma.timeEntry.update({
            where: { id: entry.id },
            data: { breakStart, breakEnd, breakMinutes, autoBreak: true },
          });
          io.emit("autoBreak", { userId: entry.userId, breakMinutes });
          console.log(`Auto-break triggered for user ${entry.userId}`);
        }
      }
    } catch (err) {
      console.error("Scheduler error:", err);
    }
  });

  // Monthly DATEV export — 1st of each month at 07:00
  cron.schedule("0 7 1 * *", async () => {
    try {
      const settings = await prisma.settings.findUnique({ where: { id:"singleton" } });
      if (!settings?.emailFrom) { console.log("[DATEV cron] No email configured, skip"); return; }
      const now = new Date();
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const month = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2,"0")}`;
      const from = new Date(prev.getFullYear(), prev.getMonth(), 1);
      const to = new Date(prev.getFullYear(), prev.getMonth() + 1, 0, 23, 59, 59);
      const entries = await prisma.timeEntry.findMany({
        where: { clockIn: { gte: from, lte: to }, clockOut: { not: null } },
        include: { user: { select: { firstName:true, lastName:true, personnelNumber:true } } },
        orderBy: { clockIn:"asc" },
      });
      const bom = "﻿";
      const header = "Personalnummer;Name;Datum;Einstempel;Ausstempel;Pause (Min);Netto (Min)\r\n";
      const rows = entries.map((e) => {
        const net = e.netMinutes ?? ((e.totalMinutes ?? 0) - e.breakMinutes);
        return [
          e.user.personnelNumber ?? "",
          `${e.user.lastName} ${e.user.firstName}`,
          e.clockIn.toLocaleDateString("de-DE"),
          e.clockIn.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"}),
          e.clockOut ? new Date(e.clockOut).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"}) : "",
          String(e.breakMinutes),
          String(Math.round(net)),
        ].join(";");
      }).join("\r\n");
      const csv = bom + header + rows;
      await sendMail(
        settings.emailFrom,
        `DATEV-Export ${month} — Weinhandel Martin Volmer e.K.`,
        `<p>Anbei der DATEV-Export für ${month}.</p><p>Einträge: ${entries.length}</p>`,
      );
      console.log(`[DATEV cron] ${month} — ${entries.length} Einträge, Export an ${settings.emailFrom}`);
    } catch (err) { console.error("[DATEV cron] Error:", err); }
  });

  // Temp admin expiry — every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    try {
      const expired = await prisma.user.findMany({
        where: { role: "ADMIN", tempAdminUntil: { not: null, lte: new Date() } },
      });
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
    } catch (err) { console.error("[TempAdmin cron] Error:", err); }
  });

  // Birthday notifications — daily at 08:00
  cron.schedule("0 8 * * *", async () => {
    try {
      const today = new Date();
      const m = today.getMonth() + 1;
      const d = today.getDate();
      const users = await prisma.user.findMany({ where: { isActive:true, birthday:{ not:null } } });
      for (const u of users) {
        if (!u.birthday) continue;
        const bd = new Date(u.birthday);
        if (bd.getMonth() + 1 === m && bd.getDate() === d) {
          await prisma.notification.create({
            data: {
              userId: u.id,
              type: "BIRTHDAY",
              title: "Alles Gute! 🎂",
              message: `Herzlichen Glückwunsch zum Geburtstag, ${u.firstName}!`,
            },
          });
        }
      }
    } catch (err) { console.error("[Birthday cron] Error:", err); }
  });

  console.log("⏰ Scheduler started (auto-break + DATEV-cron + Geburtstag)");
}