// Lokaler Entwicklungs-Server (mit Socket.io + Scheduler).
// In Produktion läuft die App als Netlify Function — siehe netlify/functions/api.ts
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { app, corsOptions } from "./app.js";
import { setRealtime } from "./lib/realtime.js";
import { startScheduler } from "./services/scheduler.js";

const httpServer = createServer(app);
const socketServer = new Server(httpServer, { cors: corsOptions });

// Socket.io-Authentifizierung: nur mit gültigem JWT verbinden
socketServer.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error("Nicht authentifiziert"));
  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    next();
  } catch {
    next(new Error("Ungültiges Token"));
  }
});

socketServer.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("disconnect", () => console.log("Socket disconnected:", socket.id));
});

setRealtime(socketServer);

const PORT = Number(process.env.PORT ?? 4000);
httpServer.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  startScheduler();
});
