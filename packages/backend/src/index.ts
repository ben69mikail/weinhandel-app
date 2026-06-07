import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
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
import { startScheduler } from "./services/scheduler.js";

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:4321",
].filter(Boolean) as string[];

const corsOptions = {
  origin: (origin: string | undefined, cb: (e: Error | null, ok?: boolean) => void) => {
    if (!origin) return cb(null, true); // same-origin / curl
    if (origin.startsWith("http://localhost")) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("CORS blocked: " + origin));
  },
  credentials: true,
};

export const io = new Server(httpServer, { cors: corsOptions });
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("disconnect", () => console.log("Socket disconnected:", socket.id));
});

const PORT = Number(process.env.PORT ?? 4000);
httpServer.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  startScheduler();
});