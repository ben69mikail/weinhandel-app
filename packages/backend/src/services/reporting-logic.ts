// Reine Reporting-Rechenlogik (ohne Prisma/IO), damit sie ohne DB testbar ist.

// Urlaub in Stunden: Tage × Stunden-pro-Tag (pro Mitarbeiter konfiguriert).
export function vacationHours(days: number, hoursPerDay: number): number {
  return days * hoursPerDay;
}

// Differenz zum Soll: Urlaub zählt als erfüllte Arbeitszeit mit.
// (Netto-Arbeitsminuten + Urlaubsstunden×60) − Soll-Minuten.
export function reportDiffMinutes(
  netMinutes: number,
  vacationHoursValue: number,
  sollMinutes: number,
): number {
  return netMinutes + vacationHoursValue * 60 - sollMinutes;
}

const DAY_MS = 86400000;

// Zählt die Urlaubstage eines Antrags [start, end] (inklusive), beschnitten auf
// den Berichtszeitraum [rangeStart, rangeEnd]. Kalendertage, ohne Wochenend-Logik.
export function vacationDaysInRange(
  start: Date,
  end: Date,
  rangeStart: Date,
  rangeEnd: Date,
): number {
  const from = Math.max(start.getTime(), rangeStart.getTime());
  const to = Math.min(end.getTime(), rangeEnd.getTime());
  if (to < from) return 0;
  // +1, weil Start- und Endtag inklusive zählen.
  return Math.floor((to - from) / DAY_MS) + 1;
}
