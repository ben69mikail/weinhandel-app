// Kandidat 4: Strukturierte Error-Responses
// Gibt immer { code, message } zurück — kein rohes { error: "string" } mehr

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "SHIFT_FULL"
  | "SHIFT_ALREADY_ASSIGNED"
  | "SHIFT_NOT_OPEN"
  | "DAY_LOCKED"
  | "ASSIGN_CONFLICT"
  | "CLOCK_ALREADY_IN"
  | "CLOCK_NOT_IN"
  | "VACATION_OVERLAP"
  | "SWAP_INVALID"
  | "INTERNAL_ERROR";

export interface ApiError {
  code: ErrorCode;
  message: string;
}

export function apiError(code: ErrorCode, message: string): ApiError {
  return { code, message };
}

// Convenience-Konstanten
export const ERRORS = {
  UNAUTHORIZED: apiError("UNAUTHORIZED", "Nicht authentifiziert"),
  FORBIDDEN: apiError("FORBIDDEN", "Kein Zugriff"),
  NOT_FOUND: apiError("NOT_FOUND", "Nicht gefunden"),
  INTERNAL: apiError("INTERNAL_ERROR", "Interner Serverfehler"),
  SHIFT_FULL: apiError("SHIFT_FULL", "Schicht ist bereits voll"),
  SHIFT_ALREADY_ASSIGNED: apiError("SHIFT_ALREADY_ASSIGNED", "Bereits eingeteilt"),
  SHIFT_NOT_OPEN: apiError("SHIFT_NOT_OPEN", "Schicht ist nicht als offene Schicht verfügbar"),
  DAY_LOCKED: apiError(
    "DAY_LOCKED",
    "An diesem Tag hast du dich bereits festgelegt — entweder Verfügbarkeit oder Bewerbung, nicht beides.",
  ),
  CLOCK_ALREADY_IN: apiError("CLOCK_ALREADY_IN", "Bereits eingestempelt"),
  CLOCK_NOT_IN: apiError("CLOCK_NOT_IN", "Nicht eingestempelt"),
  VACATION_OVERLAP: apiError("VACATION_OVERLAP", "Urlaub überschneidet sich mit bestehendem Antrag"),
} as const;
