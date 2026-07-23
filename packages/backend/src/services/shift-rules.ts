// Reine Regeln der Schichtvergabe (ohne Prisma/IO) — testbar ohne DB.

export type DayAction = "AVAILABILITY" | "APPLICATION";

// Tag-Exklusivität: An einem Tag darf ein Mitarbeiter entweder Verfügbarkeit
// abgeben ODER sich für eine Schicht bewerben — nicht beides.
export function dayActionAllowed(
  action: DayAction,
  existing: { availabilities: number; applications: number },
): boolean {
  if (action === "APPLICATION") return existing.availabilities === 0;
  return existing.applications === 0;
}

export type AssignConflict =
  | "NO_AVAILABILITY"
  | "UNAVAILABLE"
  | "OUTSIDE_TIMES"
  | "DOUBLE_BOOKING";

export interface AvailabilityRecord {
  type: "AVAILABLE" | "UNAVAILABLE" | "PREFERRED" | "PARTIAL";
  startTime: string | null;
  endTime: string | null;
}

export interface AssignConflictInput {
  shift: { startTime: string; endTime: string };
  availability: AvailabilityRecord | null;
  otherAssignmentsSameDay: number;
}

// Ermittelt, weshalb ein Admin-Einteilen eine Warnung auslösen sollte.
// Leeres Array = keine Warnung. Der Admin kann jede Warnung überschreiben.
export function detectAssignConflicts(input: AssignConflictInput): AssignConflict[] {
  const conflicts: AssignConflict[] = [];
  const { availability } = input;
  if (availability === null) {
    conflicts.push("NO_AVAILABILITY");
  } else if (availability.type === "UNAVAILABLE") {
    conflicts.push("UNAVAILABLE");
  } else if (availability.startTime && availability.endTime) {
    // Teilverfügbarkeit: Schicht muss komplett im Fenster liegen ("HH:MM" ist
    // lexikografisch vergleichbar, da nullgepolstert 24h).
    const outside =
      input.shift.startTime < availability.startTime ||
      input.shift.endTime > availability.endTime;
    if (outside) conflicts.push("OUTSIDE_TIMES");
  }
  if (input.otherAssignmentsSameDay > 0) {
    conflicts.push("DOUBLE_BOOKING");
  }
  return conflicts;
}
