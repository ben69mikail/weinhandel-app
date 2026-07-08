import { describe, it, expect } from "vitest";
import { isAllowedDocumentType } from "./fileValidation.js";

describe("isAllowedDocumentType", () => {
  it("akzeptiert PDF", () => {
    expect(isAllowedDocumentType("application/pdf")).toBe(true);
  });

  it("akzeptiert Word (.doc und .docx)", () => {
    expect(isAllowedDocumentType("application/msword")).toBe(true);
    expect(isAllowedDocumentType("application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe(true);
  });

  it("akzeptiert Excel (.xls und .xlsx)", () => {
    expect(isAllowedDocumentType("application/vnd.ms-excel")).toBe(true);
    expect(isAllowedDocumentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")).toBe(true);
  });

  it("weist ausführbare und unbekannte Typen ab", () => {
    expect(isAllowedDocumentType("application/x-msdownload")).toBe(false);
    expect(isAllowedDocumentType("text/html")).toBe(false);
    expect(isAllowedDocumentType("image/svg+xml")).toBe(false);
    expect(isAllowedDocumentType("")).toBe(false);
  });
});
