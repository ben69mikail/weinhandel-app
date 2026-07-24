import webpush from "web-push";
import { prisma } from "../lib/prisma.js";

const PUB = process.env.VAPID_PUBLIC_KEY;
const PRIV = process.env.VAPID_PRIVATE_KEY;
// web-push verlangt eine mailto:- oder https-URL. Nackte E-Mail → mailto: davor.
const rawSubject = process.env.VAPID_SUBJECT ?? "mailto:admin@weinhandel.de";
const SUBJECT = /^(mailto:|https?:)/i.test(rawSubject) ? rawSubject : `mailto:${rawSubject}`;

// let, weil eine fehlerhafte VAPID-Config Push abschaltet (statt die ganze
// Function beim Import zu crashen).
export let pushConfigured = Boolean(PUB && PRIV);
if (pushConfigured) {
  try {
    webpush.setVapidDetails(SUBJECT, PUB!, PRIV!);
  } catch (err) {
    console.error("[push] VAPID-Init fehlgeschlagen — Push deaktiviert:", (err as Error).message);
    pushConfigured = false;
  }
} else {
  console.warn("[push] VAPID keys fehlen — Push-Benachrichtigungen deaktiviert");
}

export function vapidPublicKey(): string | null {
  return PUB ?? null;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

// Sendet eine Push-Nachricht an einen Nutzer (falls konfiguriert + abonniert).
// Fehlt das Abo oder ist es abgelaufen → still ignorieren / aufräumen.
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!pushConfigured) return;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { pushSubscription: true } });
  if (!user?.pushSubscription) return;
  try {
    const sub = JSON.parse(user.pushSubscription);
    await webpush.sendNotification(sub, JSON.stringify(payload));
  } catch (err) {
    const code = (err as { statusCode?: number }).statusCode;
    if (code === 404 || code === 410) {
      // Abo ungültig/abgelaufen → entfernen
      await prisma.user.update({ where: { id: userId }, data: { pushSubscription: null } });
    } else {
      console.error("[push] send failed", code);
    }
  }
}
