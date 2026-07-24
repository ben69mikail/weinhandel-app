import { prisma } from "../lib/prisma.js";
import type { NotificationType } from "@prisma/client";
import { sendPushToUser } from "./push.js";

// Erzeugt eine In-App-Notification UND schickt (falls abonniert) eine Push.
// Zentrale Stelle, damit beide Kanäle immer zusammen bespielt werden.
export async function notify(
  userId: string,
  data: { type: NotificationType; title: string; message: string; url?: string },
): Promise<void> {
  await prisma.notification.create({
    data: { userId, type: data.type, title: data.title, message: data.message },
  });
  await sendPushToUser(userId, { title: data.title, body: data.message, url: data.url });
}
