// Netlify Function: hostet den Express-Server serverless.
// Der kompilierte Backend-Code liegt in packages/backend/dist.
import serverless from "serverless-http";
import { app } from "../../packages/backend/dist/app.js";

// basePath entfernt den Function-Pfad, sodass Express wieder /api/... sieht.
// binary: Antworten mit diesen Content-Types werden Base64-kodiert an Netlify
// übergeben (isBase64Encoded), sonst behandelt Netlify sie als UTF-8-Text und
// zerstört die Binärdaten (Datei-Downloads /view & /download wurden korrupt).
export const handler = serverless(app, {
  basePath: "/.netlify/functions/api",
  binary: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.ms-excel",
    "application/octet-stream",
  ],
});
