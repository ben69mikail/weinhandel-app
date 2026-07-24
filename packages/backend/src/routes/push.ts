import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { vapidPublicKey, sendPushToUser, pushConfigured } from "../services/push.js";

const router = Router();

// Öffentlicher VAPID-Key (kein Auth nötig — wird zum Abonnieren gebraucht).
router.get("/public-key", (_req, res: Response) => {
  res.json({ publicKey: vapidPublicKey() });
});

router.use(authenticate);

// Abo speichern (oder mit subscription:null entfernen).
router.post("/subscribe", async (req: AuthRequest, res: Response) => {
  const { subscription } = req.body as { subscription: unknown };
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { pushSubscription: subscription ? JSON.stringify(subscription) : null },
  });
  res.json({ ok: true });
});

// Test-Push an sich selbst.
router.post("/test", async (req: AuthRequest, res: Response) => {
  if (!pushConfigured) return res.status(400).json({ code: "PUSH_NOT_CONFIGURED", message: "Push ist serverseitig nicht konfiguriert" });
  await sendPushToUser(req.user!.id, { title: "Weinhandel", body: "Test-Benachrichtigung ✓", url: "/" });
  res.json({ ok: true });
});

export default router;
