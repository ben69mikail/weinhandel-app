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
  | "TIME_OVERLAP"
  | "DOUBLE_BOOKING";

export interface AvailabilityRecord {
  type: "AVAILABLE" | "UNAVAILABLE" | "PREFERRED" | "PARTIAL";
  startTime: string | null;
  endTime: string | null;
}

export interface TimeRange {
  startTime: string;
  endTime: string;
}

export interface AssignConflictInput {
  shift: { startTime: string; endTime: string };
  availability: AvailabilityRecord | null;
  // Zeiten der anderen Schichten, für die der Mitarbeiter am selben Tag ASSIGNED ist.
  otherShiftsSameDay: TimeRange[];
}

// Zwei "HH:MM"-Intervalle überlappen sich (Berührung an den Rändern zählt nicht).
function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return a.startTime < b.endTime && b.startTime < a.endTime;
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
  const others = input.otherShiftsSameDay;
  if (others.some((o) => rangesOverlap(input.shift, o))) {
    conflicts.push("TIME_OVERLAP");
  } else if (others.length > 0) {
    conflicts.push("DOUBLE_BOOKING");
  }
  return conflicts;
}

// Gleicht die gewünschte Zuteilungsliste gegen den Ist-Zustand ab.
// toAdd = neu zuzuteilen, toRemove = zu entfernen.
export function reconcileAssignments(
  current: string[],
  desired: string[],
): { toAdd: string[]; toRemove: string[] } {
  const currentSet = new Set(current);
  const desiredSet = new Set(desired);
  return {
    toAdd: desired.filter((id) => !currentSet.has(id)),
    toRemove: current.filter((id) => !desiredSet.has(id)),
  };
}
