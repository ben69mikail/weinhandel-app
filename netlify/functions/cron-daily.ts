// Netlify Scheduled Function — täglich um 08:00 UTC.
// Geburtstags-Benachrichtigungen.
import { runBirthdays } from "../../packages/backend/dist/services/scheduler-jobs.js";

export default async () => {
  const count = await runBirthdays();
  console.log(`[cron-daily] ${count} Geburtstags-Benachrichtigungen`);
  return new Response("ok");
};

export const config = {
  schedule: "0 8 * * *",
};
