import { describe, it, expect } from "vitest";
import { vacationHours, vacationDaysInRange, reportDiffMinutes } from "./reporting-logic.js";

describe("reportDiffMinutes — Differenz inkl. Urlaub", () => {
  it("Urlaub zählt als erfüllte Zeit: Netto + Urlaubsstunden − Soll", () => {
    // Soll 100h, gearbeitet 80h netto, 20h Urlaub → genau erfüllt → 0
    expect(reportDiffMinutes(80 * 60, 20, 100 * 60)).toBe(0);
  });

  it("negativ, wenn Netto + Urlaub unter Soll", () => {
    // Soll 100h, 70h netto, 10h Urlaub → 80h → −20h (−1200 min)
    expect(reportDiffMinutes(70 * 60, 10, 100 * 60)).toBe(-20 * 60);
  });
});

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
