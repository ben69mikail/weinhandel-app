// Netlify Function: hostet den Express-Server serverless.
// Der kompilierte Backend-Code liegt in packages/backend/dist.
import serverless from "serverless-http";
import { app } from "../../packages/backend/dist/app.js";

// basePath entfernt den Function-Pfad, sodass Express wieder /api/... sieht
export const handler = serverless(app, {
  basePath: "/.netlify/functions/api",
});
