import { describe, it, expect } from "vitest";
import { vacationHours, vacationDaysInRange } from "./reporting-logic.js";

describe("vacationHours — Urlaub in Stunden statt Tagen", () => {
  it("rechnet Tage × Stunden-pro-Tag (Beispiel Jena: 5 × 4 = 20)", () => {
    expect(vacationHours(5, 4)).toBe(20);
  });

  it("0 Stunden bei 0 Tagen oder fehlendem Satz", () => {
    expect(vacationHours(0, 4)).toBe(0);
    expect(vacationHours(5, 0)).toBe(0);
  });
});

describe("vacationDaysInRange — Urlaubstage eines Antrags im Zeitraum", () => {
  it("zählt Start- und Endtag inklusive", () => {
    // Mo 6.7. bis Fr 10.7. = 5 Tage
    expect(
      vacationDaysInRange(new Date("2026-07-06"), new Date("2026-07-10"), new Date("2026-07-01"), new Date("2026-07-31")),
    ).toBe(5);
  });

  it("beschneidet auf den Monatsbereich", () => {
    // Antrag 28.6.–3.7., aber Monat = Juli → nur 1.–3.7. = 3 Tage
    expect(
      vacationDaysInRange(new Date("2026-06-28"), new Date("2026-07-03"), new Date("2026-07-01"), new Date("2026-07-31")),
    ).toBe(3);
  });
});
