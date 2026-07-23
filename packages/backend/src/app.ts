import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import shiftsRouter from "./routes/shifts.js";
import timeRouter from "./routes/time.js";
import availabilityRouter from "./routes/availability.js";
import reportingRouter from "./routes/reporting.js";
import vacationsRouter from "./routes/vacations.js";
import swapsRouter from "./routes/swaps.js";
import tasksRouter from "./routes/tasks.js";
import documentsRouter from "./routes/documents.js";
import eventsRouter from "./routes/events.js";
import hygieneRouter from "./routes/hygiene.js";
import tipsRouter from "./routes/tips.js";
import notificationsRouter from "./routes/notifications.js";
import settingsRouter from "./routes/settings.js";

const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean) as string[];

function isLocalhost(origin: string): boolean {
  try {
    const host = new URL(origin).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch { return false; }
}

export const corsOptions = {
  origin: (origin: string | undefined, cb: (e: Error | null, ok?: boolean) => void) => {
    if (!origin) return cb(null, true); // same-origin / curl
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (isLocalhost(origin)) return cb(null, true); // Dev — exakter Hostname, kein startsWith
    cb(new Error("CORS blocked: " + origin));
  },
  credentials: true,
};

export const app = express();

// Hinter Proxy (Netlify/Railway) — nötig für korrekte Client-IPs im Rate-Limiter
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors(corsOptions));
// 8mb: Datei-Uploads kommen als Base64 im JSON-Body (Multipart wird von der
// Netlify-Function als UTF-8 behandelt und korrumpiert Binärdaten).
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Globales Rate-Limit: 300 Requests pro Minute pro IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: "RATE_LIMITED", message: "Zu viele Anfragen" },
}));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/shifts", shiftsRouter);
app.use("/api/time", timeRouter);
app.use("/api/availability", availabilityRouter);
app.use("/api/reporting", reportingRouter);
app.use("/api/vacations", vacationsRouter);
app.use("/api/swaps", swapsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/hygiene", hygieneRouter);
app.use("/api/tips", tipsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/settings", settingsRouter);

export default app;
