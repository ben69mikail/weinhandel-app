// Erlaubte MIME-Typen für Mitarbeiter-Dokumente: PDF, Word, Excel.

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
] as const;

// 5 MB: Netlify-Functions haben ~6 MB Payload-Limit; als Base64 im JSON-Body
// (nötig gegen Binär-Korruption) kommt noch ~33% Overhead dazu.
export const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5 MB

export function isAllowedDocumentType(mimeType: string): boolean {
  return (ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(mimeType);
}
