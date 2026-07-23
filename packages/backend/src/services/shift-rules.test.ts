import { describe, it, expect } from "vitest";
import { dayActionAllowed, detectAssignConflicts, reconcileAssignments } from "./shift-rules.js";

describe("reconcileAssignments — Zuteilungen beim Bearbeiten abgleichen", () => {
  it("liefert hinzuzufügende und zu entfernende User", () => {
    expect(reconcileAssignments(["a", "b"], ["b", "c"])).toEqual({ toAdd: ["c"], toRemove: ["a"] });
  });

  it("keine Änderung bei identischen Listen (Reihenfolge egal)", () => {
    expect(reconcileAssignments(["a", "b"], ["b", "a"])).toEqual({ toAdd: [], toRemove: [] });
  });
});

describe("dayActionAllowed — Tag-Exklusivität Verfügbarkeit XOR Bewerbung", () => {
  it("erlaubt Bewerbung, wenn an dem Tag keine Verfügbarkeit abgegeben wurde", () => {
    expect(dayActionAllowed("APPLICATION", { availabilities: 0, applications: 0 })).toBe(true);
  });

  it("sperrt Bewerbung, wenn an dem Tag bereits eine Verfügbarkeit existiert", () => {
    expect(dayActionAllowed("APPLICATION", { availabilities: 1, applications: 0 })).toBe(false);
  });

  it("erlaubt Verfügbarkeit, wenn an dem Tag keine Bewerbung existiert", () => {
    expect(dayActionAllowed("AVAILABILITY", { availabilities: 0, applications: 0 })).toBe(true);
  });

  it("sperrt Verfügbarkeit, wenn an dem Tag bereits eine Bewerbung existiert", () => {
    expect(dayActionAllowed("AVAILABILITY", { availabilities: 0, applications: 1 })).toBe(false);
  });
});

describe("detectAssignConflicts — Warnungen beim Admin-Einteilen", () => {
  const shift = { startTime: "10:00", endTime: "18:00" };

  it("meldet NO_AVAILABILITY, wenn der Mitarbeiter keine Verfügbarkeit am Tag hat", () => {
    expect(
      detectAssignConflicts({ shift, availability: null, otherShiftsSameDay: [] }),
    ).toEqual(["NO_AVAILABILITY"]);
  });

  it("meldet UNAVAILABLE, wenn der Mitarbeiter sich als nicht verfügbar markiert hat", () => {
    expect(
      detectAssignConflicts({
        shift,
        availability: { type: "UNAVAILABLE", startTime: null, endTime: null },
        otherShiftsSameDay: [],
      }),
    ).toEqual(["UNAVAILABLE"]);
  });

  it("keine Warnung bei ganztägiger Verfügbarkeit ohne andere Schicht", () => {
    expect(
      detectAssignConflicts({
        shift,
        availability: { type: "AVAILABLE", startTime: null, endTime: null },
        otherShiftsSameDay: [],
      }),
    ).toEqual([]);
  });

  it("meldet OUTSIDE_TIMES, wenn die Schicht außerhalb der Teilverfügbarkeit liegt", () => {
    expect(
      detectAssignConflicts({
        shift, // 10:00–18:00
        availability: { type: "PARTIAL", startTime: "08:00", endTime: "14:00" },
        otherShiftsSameDay: [],
      }),
    ).toEqual(["OUTSIDE_TIMES"]);
  });

  it("keine Warnung, wenn die Schicht innerhalb der Teilverfügbarkeit liegt", () => {
    expect(
      detectAssignConflicts({
        shift, // 10:00–18:00
        availability: { type: "PARTIAL", startTime: "09:00", endTime: "20:00" },
        otherShiftsSameDay: [],
      }),
    ).toEqual([]);
  });

  it("meldet TIME_OVERLAP, wenn sich die Zeiten mit einer anderen Schicht überschneiden", () => {
    expect(
      detectAssignConflicts({
        shift, // 10:00–18:00
        availability: { type: "AVAILABLE", startTime: null, endTime: null },
        otherShiftsSameDay: [{ startTime: "16:00", endTime: "20:00" }], // überlappt 16–18
      }),
    ).toEqual(["TIME_OVERLAP"]);
  });

  it("meldet DOUBLE_BOOKING (kein TIME_OVERLAP), wenn am selben Tag aber ohne Zeitkollision", () => {
    expect(
      detectAssignConflicts({
        shift, // 10:00–18:00
        availability: { type: "AVAILABLE", startTime: null, endTime: null },
        otherShiftsSameDay: [{ startTime: "18:00", endTime: "22:00" }], // grenzt an, keine Überlappung
      }),
    ).toEqual(["DOUBLE_BOOKING"]);
  });

  it("kombiniert Warnungen (keine Verfügbarkeit + Zeitkollision)", () => {
    expect(
      detectAssignConflicts({
        shift, // 10:00–18:00
        availability: null,
        otherShiftsSameDay: [{ startTime: "12:00", endTime: "15:00" }],
      }),
    ).toEqual(["NO_AVAILABILITY", "TIME_OVERLAP"]);
  });
});
