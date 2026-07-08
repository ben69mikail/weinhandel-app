// Erzeugt die Termine einer wöchentlich wiederkehrenden Schicht.
// weekdays: Zahlen 0=So .. 6=Sa (wie Date.getDay()).
// start / until: "YYYY-MM-DD". Rückgabe: sortierte Liste "YYYY-MM-DD" (inkl. until).

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function generateRecurringDates(
  start: string,
  weekdays: number[],
  until: string
): string[] {
  const startDate = new Date(start + "T00:00:00");
  const untilDate = new Date(until + "T00:00:00");
  const days = new Set(weekdays);
  const result: string[] = [];

  for (let d = new Date(startDate); d <= untilDate; d.setDate(d.getDate() + 1)) {
    if (days.has(d.getDay())) result.push(fmt(d));
  }
  return result;
}
