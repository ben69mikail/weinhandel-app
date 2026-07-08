import { describe, it, expect } from "vitest";
import { generateRecurringDates } from "./recurrence.js";

// Wochentage: 0=So, 1=Mo, 2=Di, 3=Mi, 4=Do, 5=Fr, 6=Sa (wie Date.getDay())

describe("generateRecurringDates", () => {
  it("gibt nur den Starttag zurück, wenn dieser der einzige gewählte Wochentag ist und until = start", () => {
    // 2026-07-06 ist ein Montag
    const dates = generateRecurringDates("2026-07-06", [1], "2026-07-06");
    expect(dates).toEqual(["2026-07-06"]);
  });

  it("wiederholt Mo+Mi wöchentlich bis zum Enddatum (inklusive)", () => {
    // Start Mo 2026-07-06, Wochentage Mo(1)+Mi(3), bis Mi 2026-07-15
    const dates = generateRecurringDates("2026-07-06", [1, 3], "2026-07-15");
    expect(dates).toEqual([
      "2026-07-06", // Mo
      "2026-07-08", // Mi
      "2026-07-13", // Mo
      "2026-07-15", // Mi
    ]);
  });

  it("nimmt in der Startwoche keinen Wochentag vor dem Starttag auf", () => {
    // Start Mi 2026-07-08, Wochentag Mo(1) — erster Mo erst NÄCHSTE Woche (13.)
    const dates = generateRecurringDates("2026-07-08", [1], "2026-07-20");
    expect(dates).toEqual(["2026-07-13", "2026-07-20"]);
  });

  it("liefert leere Liste, wenn until vor start liegt", () => {
    expect(generateRecurringDates("2026-07-10", [1, 3, 5], "2026-07-05")).toEqual([]);
  });

  it("ignoriert leere Wochentagsauswahl", () => {
    expect(generateRecurringDates("2026-07-06", [], "2026-07-31")).toEqual([]);
  });
});
