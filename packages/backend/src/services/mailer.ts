import nodemailer from "nodemailer";
import { prisma } from "../lib/prisma.js";

async function getTransporter() {
  const s = await prisma.settings.findUnique({ where: { id:"singleton" } });
  if (!s?.smtpHost || !s?.smtpUser) return null;
  return nodemailer.createTransport({
    host: s.smtpHost,
    port: s.smtpPort ?? 587,
    secure: (s.smtpPort ?? 587) === 465,
    auth: { user: s.smtpUser, pass: s.smtpPassword ?? "" },
  });
}

export async function sendMail(to: string, subject: string, html: string) {
  try {
    const t = await getTransporter();
    if (!t) { console.log("[Mailer] No SMTP config — skipping:", subject); return; }
    const s = await prisma.settings.findUnique({ where: { id:"singleton" } });
    await t.sendMail({ from: s?.emailFrom ?? "noreply@weinhandel.de", to, subject, html });
    console.log("[Mailer] Sent:", subject, "→", to);
  } catch (err) { console.error("[Mailer] Error:", err); }
}

export async function sendVacationDecision(userId: string, status: "APPROVED"|"REJECTED", startDate: Date, endDate: Date, adminNote?: string | null) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) return;
  const label = status === "APPROVED" ? "genehmigt ✅" : "abgelehnt ❌";
  const from = startDate.toLocaleDateString("de-DE");
  const to = endDate.toLocaleDateString("de-DE");
  const noteHtml = adminNote ? `<p><strong>Notiz:</strong> ${adminNote}</p>` : "";
  await sendMail(user.email, `Urlaubsantrag ${label}`,
    `<p>Hallo ${user.firstName},</p>
     <p>dein Urlaubsantrag vom <strong>${from}</strong> bis <strong>${to}</strong> wurde <strong>${label}</strong>.</p>
     ${noteHtml}
     <p>Mit freundlichen Grüßen,<br/>Weinhandel Martin Volmer e.K.</p>`
  );
  // Also create in-app notification
  await prisma.notification.create({
    data: {
      userId,
      type: status === "APPROVED" ? "VACATION_APPROVED" : "VACATION_REJECTED",
      title: `Urlaubsantrag ${label}`,
      message: `Dein Antrag ${from}–${to} wurde ${label}.`,
    },
  });
}