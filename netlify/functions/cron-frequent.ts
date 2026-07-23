// Netlify Scheduled Function — alle 15 Minuten.
// Ersetzt den toten Dauer-Cron: Auto-Pause (6h-Regel) + Temp-Admin-Ablauf.
import { runAutoBreaks, runTempAdminExpiry } from "../../packages/backend/dist/services/scheduler-jobs.js";

export default async () => {
  const breaks = await runAutoBreaks();
  const demoted = await runTempAdminExpiry();
  console.log(`[cron-frequent] ${breaks} Auto-Pausen, ${demoted} Admin-Rechte zurückgesetzt`);
  return new Response("ok");
};

export const config = {
  schedule: "*/15 * * * *",
};
