import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";
import { isAllowedDocumentType, MAX_DOCUMENT_SIZE } from "../services/fileValidation.js";

const router = Router();
router.use(authenticate);

// POST /api/documents/upload — Datei (PDF/Word/Excel) als Base64 im JSON-Body.
// Kein Multipart: die Netlify-Function behandelt Multipart-Bodies als UTF-8 und
// zerstört dabei Binärdaten (jedes hohe Byte → U+FFFD). Base64 ist ASCII und
// übersteht das unversehrt.
router.post("/upload", adminOnly, async (req, res) => {
  const { title, category, fileName, mimeType, dataBase64 } = req.body as Record<string, string>;
  if (!title || !category || !fileName || !mimeType || !dataBase64)
    return res.status(400).json({ code: "VALIDATION_ERROR", message: "Felder fehlen" });
  if (!isAllowedDocumentType(mimeType))
    return res.status(400).json({ code: "UNSUPPORTED_TYPE", message: "Nur PDF-, Word- und Excel-Dateien erlaubt" });
  try {
    const fileData = Buffer.from(dataBase64, "base64");
    if (fileData.length === 0)
      return res.status(400).json({ code: "VALIDATION_ERROR", message: "Leere Datei" });
    if (fileData.length > MAX_DOCUMENT_SIZE)
      return res.status(400).json({ code: "FILE_TOO_LARGE", message: "Datei zu groß (max. 5 MB)" });
    const doc = await prisma.document.create({
      data: {
        title, category: category as any,
        fileName, mimeType,
        fileData, fileSize: fileData.length,
        isPublished: true,
      },
      select: { id: true, title: true, category: true, fileName: true, mimeType: true, fileSize: true, isPublished: true, sortOrder: true, createdAt: true, updatedAt: true },
    });
    return res.status(201).json(doc);
  } catch (e) { console.error(e); return res.status(500).json({ code: "INTERNAL_ERROR", message: "Serverfehler" }); }
});

// GET /api/documents/:id/view — Datei-Bytes INLINE (für <iframe>/Browser-Viewer).
// Auth via ?token= (Header nicht möglich bei iframe-Navigation).
router.get("/:id/view", async (req, res) => {
  const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!doc || !doc.fileData) return res.status(404).json({ code: "NOT_FOUND", message: "Nicht gefunden" });
  // helmets globale CSP (object-src 'none') blockt sonst den nativen PDF-Viewer
  // des Browsers im <iframe> → weiße Seite. Für diese Datei-Antwort entfernen.
  res.removeHeader("Content-Security-Policy");
  res.setHeader("Content-Type", doc.mimeType ?? "application/octet-stream");
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(doc.fileName ?? "dokument")}"`);
  return res.send(Buffer.from(doc.fileData));
});

// GET /api/documents/:id/download — Datei-Bytes streamen
router.get("/:id/download", async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc || !doc.fileData) return res.status(404).json({ code: "NOT_FOUND", message: "Datei nicht gefunden" });
    res.setHeader("Content-Type", doc.mimeType ?? "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(doc.fileName ?? "dokument")}"`);
    return res.send(Buffer.from(doc.fileData));
  } catch (e) { console.error(e); return res.status(500).json({ code: "INTERNAL_ERROR", message: "Serverfehler" }); }
});
router.get("/", async (req, res) => {
  try {
    const { category } = req.query as Record<string,string>;
    const where = category ? { category: category as any, isPublished: true } : { isPublished: true };
    // fileData (Bytes) NICHT mitladen — nur Metadaten
    const docs = await prisma.document.findMany({
      where,
      select: { id: true, title: true, category: true, content: true, fileName: true, mimeType: true, fileSize: true, isPublished: true, sortOrder: true, createdAt: true, updatedAt: true },
      orderBy: [{ sortOrder:"asc" },{ createdAt:"desc" }],
    });
    res.json(docs);
  } catch { res.status(500).json({ error:"Server error" }); }
});
router.post("/", adminOnly, async (req, res) => {
  try {
    const { title, category, content, sortOrder } = req.body;
    if (!title || !category) return res.status(400).json({ error:"Felder fehlen" });
    const doc = await prisma.document.create({ data: { title, category, content: content ?? null, sortOrder: sortOrder ?? 0, isPublished: true } });
    res.status(201).json(doc);
  } catch { res.status(500).json({ error:"Server error" }); }
});
router.put("/:id", adminOnly, async (req, res) => {
  try {
    const { title, category, content, isPublished, sortOrder } = req.body;
    const doc = await prisma.document.update({ where: { id: req.params.id }, data: { title, category, content, isPublished, sortOrder } });
    res.json(doc);
  } catch { res.status(500).json({ error:"Server error" }); }
});
router.delete("/:id", adminOnly, async (req, res) => {
  try { await prisma.document.delete({ where: { id: req.params.id } }); res.json({ ok:true }); }
  catch { res.status(500).json({ error:"Server error" }); }
});
export default router;