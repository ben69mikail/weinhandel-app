// Netlify Scheduled Function — 1. des Monats um 07:00 UTC.
// Monatlicher DATEV-Export des Vormonats per Mail.
import { runDatevExport } from "../../packages/backend/dist/services/scheduler-jobs.js";

export default async () => {
  const result = await runDatevExport();
  console.log("[cron-monthly] DATEV-Export:", JSON.stringify(result));
  return new Response("ok");
};

export const config = {
  schedule: "0 7 1 * *",
};
