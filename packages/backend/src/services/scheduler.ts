import cron from "node-cron";
import { runAutoBreaks, runDatevExport, runTempAdminExpiry, runBirthdays } from "./scheduler-jobs.js";

// Lokaler Dev-Cron. In Produktion (Netlify Serverless) übernehmen die
// Scheduled Functions unter netlify/functions/cron-*.ts dieselben Runner —
// ein Dauerprozess existiert dort nicht.
export function startScheduler() {
  // Auto-Pause (6h-Regel) — alle 15 Minuten (Minutengenauigkeit unnötig).
  cron.schedule("*/15 * * * *", () => {
    runAutoBreaks().catch((err) => console.error("[AutoBreak cron]", err));
  });

  // Abgelaufene Temp-Admin-Rechte — alle 15 Minuten.
  cron.schedule("*/15 * * * *", () => {
    runTempAdminExpiry().catch((err) => console.error("[TempAdmin cron]", err));
  });

  // Monatlicher DATEV-Export — 1. des Monats um 07:00.
  cron.schedule("0 7 1 * *", () => {
    runDatevExport().catch((err) => console.error("[DATEV cron]", err));
  });

  // Geburtstags-Benachrichtigungen — täglich um 08:00.
  cron.schedule("0 8 * * *", () => {
    runBirthdays().catch((err) => console.error("[Birthday cron]", err));
  });

  console.log("⏰ Scheduler started (auto-break + temp-admin + DATEV + Geburtstag)");
}
