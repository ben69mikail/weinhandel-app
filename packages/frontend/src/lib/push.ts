// Web-Push-Abo im Browser: Permission holen, via Service-Worker PushManager
// abonnieren und das Abo ans Backend schicken.
import { api } from "@/lib/api";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function pushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

// Meldet den aktuellen Zustand: nicht unterstützt / verweigert / abonniert / bereit.
export async function pushStatus(): Promise<"unsupported" | "denied" | "subscribed" | "ready"> {
  if (!pushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return sub ? "subscribed" : "ready";
}

// Abonniert Push und speichert das Abo im Backend. Wirft bei Fehler/Ablehnung.
export async function subscribePush(): Promise<void> {
  if (!pushSupported()) throw new Error("Push wird von diesem Browser nicht unterstützt");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Benachrichtigungen wurden nicht erlaubt");

  const { data } = await api.get<{ publicKey: string }>("/push/public-key");
  if (!data.publicKey) throw new Error("Push ist serverseitig nicht konfiguriert");

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(data.publicKey) as BufferSource,
  });
  await api.post("/push/subscribe", { subscription: sub.toJSON() });
}

export async function unsubscribePush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) await sub.unsubscribe();
  await api.post("/push/subscribe", { subscription: null });
}

export async function sendTestPush(): Promise<void> {
  await api.post("/push/test", {});
}
