import { describe, it, expect } from "vitest";
import {
  computeAutoBreaks,
  buildDatevCsv,
  findBirthdays,
  isTempAdminExpired,
} from "./scheduler-logic.js";

describe("computeAutoBreaks", () => {
  it("löst eine Pause aus, wenn die Arbeitszeit die Schwelle überschreitet", () => {
    const now = new Date("2026-07-23T14:00:00Z");
    const clockIn = new Date("2026-07-23T07:00:00Z"); // 7h vor now
    const decisions = computeAutoBreaks(
      [{ id: "e1", userId: "u1", clockIn }],
      { breakAfterHours: 6, breakMinutes: 15 },
      now,
    );
    expect(decisions).toEqual([
      {
        entryId: "e1",
        userId: "u1",
        breakStart: now,
        breakEnd: new Date("2026-07-23T14:15:00Z"),
        breakMinutes: 15,
      },
    ]);
  });

  it("ignoriert Einträge unter der Schwelle und liefert nur die fälligen", () => {
    const now = new Date("2026-07-23T14:00:00Z");
    const decisions = computeAutoBreaks(
      [
        { id: "voll", userId: "u1", clockIn: new Date("2026-07-23T07:30:00Z") }, // 6.5h → fällig
        { id: "kurz", userId: "u2", clockIn: new Date("2026-07-23T12:00:00Z") }, // 2h → nein
      ],
      { breakAfterHours: 6, breakMinutes: 15 },
      now,
    );
    expect(decisions.map((d) => d.entryId)).toEqual(["voll"]);
  });
});

describe("buildDatevCsv", () => {
  const entry = {
    user: { personnelNumber: "42", lastName: "Volmer", firstName: "Martin" },
    clockIn: new Date("2026-06-15T09:00:00"), // Mittags-nah, tz-sicher
    breakMinutes: 30,
    totalMinutes: 480, // 8,00 h brutto
    netMinutes: 450, // 7,50 h netto
  };

  it("baut BOM + Kopfzeile + eine formatierte Datenzeile", () => {
    const csv = buildDatevCsv([entry]);
    const lines = csv.split("\r\n");
    expect(csv.charCodeAt(0)).toBe(0xfeff); // BOM
    expect(lines[0].replace("﻿", "")).toBe(
      "Personalnummer;Nachname;Vorname;Datum;Stunden Brutto;Pausen Min;Stunden Netto;Schichtart",
    );
    expect(lines[1]).toBe("42;Volmer;Martin;15.06.2026;8,00;30;7,50;Regulär");
  });

  it("liefert bei keinen Einträgen nur BOM + Kopfzeile", () => {
    const csv = buildDatevCsv([]);
    expect(csv).toBe(
      "﻿Personalnummer;Nachname;Vorname;Datum;Stunden Brutto;Pausen Min;Stunden Netto;Schichtart",
    );
  });

  it("ersetzt fehlende Personalnummer/Zeiten durch leere bzw. 0,00-Werte", () => {
    const csv = buildDatevCsv([
      {
        user: { personnelNumber: null, lastName: "Ohne", firstName: "Nummer" },
        clockIn: new Date("2026-06-01T09:00:00"),
        breakMinutes: 0,
        totalMinutes: null,
        netMinutes: null,
      },
    ]);
    expect(csv.split("\r\n")[1]).toBe(";Ohne;Nummer;01.06.2026;0,00;0;0,00;Regulär");
  });
});

describe("findBirthdays", () => {
  it("liefert nur User, deren Tag+Monat auf heute fällt (Jahr egal)", () => {
    const today = new Date("2026-06-15T00:00:00");
    const ids = findBirthdays(
      [
        { id: "heute", birthday: new Date("1990-06-15T00:00:00") },
        { id: "morgen", birthday: new Date("1985-06-16T00:00:00") },
        { id: "ohne", birthday: null },
      ],
      today,
    );
    expect(ids).toEqual(["heute"]);
  });
});

describe("isTempAdminExpired", () => {
  const now = new Date("2026-07-23T12:00:00Z");
  it("true wenn tempAdminUntil in der Vergangenheit liegt", () => {
    expect(isTempAdminExpired({ tempAdminUntil: new Date("2026-07-23T11:00:00Z") }, now)).toBe(true);
  });
  it("false wenn tempAdminUntil in der Zukunft liegt oder fehlt", () => {
    expect(isTempAdminExpired({ tempAdminUntil: new Date("2026-07-23T13:00:00Z") }, now)).toBe(false);
    expect(isTempAdminExpired({ tempAdminUntil: null }, now)).toBe(false);
  });
});
