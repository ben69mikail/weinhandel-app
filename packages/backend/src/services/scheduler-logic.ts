// Reine Entscheidungslogik der Scheduler-Jobs (ohne Prisma/IO/Mail).
// Serverless-Trigger und lokaler Cron rufen diese Funktionen mit bereits
// geladenen Daten auf, damit die Logik ohne DB testbar bleibt.

export interface ActiveEntry {
  id: string;
  userId: string;
  clockIn: Date;
}

export interface AutoBreakOptions {
  breakAfterHours: number;
  breakMinutes: number;
}

export interface AutoBreakDecision {
  entryId: string;
  userId: string;
  breakStart: Date;
  breakEnd: Date;
  breakMinutes: number;
}

// Entscheidet, für welche laufenden Zeiteinträge eine automatische Pause fällig
// ist. Erwartet Einträge ohne clockOut und ohne bereits gesetzte breakStart.
export function computeAutoBreaks(
  entries: ActiveEntry[],
  opts: AutoBreakOptions,
  now: Date,
): AutoBreakDecision[] {
  const breakAfterMs = opts.breakAfterHours * 3600000;
  const decisions: AutoBreakDecision[] = [];
  for (const entry of entries) {
    const elapsed = now.getTime() - entry.clockIn.getTime();
    if (elapsed >= breakAfterMs) {
      decisions.push({
        entryId: entry.id,
        userId: entry.userId,
        breakStart: now,
        breakEnd: new Date(now.getTime() + opts.breakMinutes * 60000),
        breakMinutes: opts.breakMinutes,
      });
    }
  }
  return decisions;
}

export interface DatevEntry {
  user: { personnelNumber: string | null; lastName: string; firstName: string };
  clockIn: Date;
  breakMinutes: number;
  totalMinutes: number | null;
  netMinutes: number | null;
}

const DATEV_HEADER =
  "Personalnummer;Nachname;Vorname;Datum;Stunden Brutto;Pausen Min;Stunden Netto;Schichtart";
const BOM = "﻿";

function formatDeDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${d.getFullYear()}`;
}

function formatHours(minutes: number | null): string {
  return ((minutes ?? 0) / 60).toFixed(2).replace(".", ",");
}

// Baut den DATEV-CSV-Export (BOM + Kopfzeile + Datenzeilen, CRLF-getrennt).
// Einzige Quelle der Wahrheit für Route und Monats-Cron.
export function buildDatevCsv(entries: DatevEntry[]): string {
  const rows = entries.map((e) =>
    [
      e.user.personnelNumber ?? "",
      e.user.lastName,
      e.user.firstName,
      formatDeDate(e.clockIn),
      formatHours(e.totalMinutes),
      e.breakMinutes,
      formatHours(e.netMinutes),
      "Regulär",
    ].join(";"),
  );
  return BOM + [DATEV_HEADER, ...rows].join("\r\n");
}

export interface BirthdayUser {
  id: string;
  birthday: Date | null;
}

// Liefert die IDs der User, deren Geburtstag (Tag+Monat) auf `today` fällt.
export function findBirthdays(users: BirthdayUser[], today: Date): string[] {
  const m = today.getMonth();
  const d = today.getDate();
  return users
    .filter((u) => u.birthday !== null && u.birthday.getMonth() === m && u.birthday.getDate() === d)
    .map((u) => u.id);
}

// Prüft, ob temporäre Admin-Rechte abgelaufen sind.
export function isTempAdminExpired(user: { tempAdminUntil: Date | null }, now: Date): boolean {
  return user.tempAdminUntil !== null && user.tempAdminUntil.getTime() <= now.getTime();
}
