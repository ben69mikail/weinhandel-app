import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";
import { isAllowedDocumentType, MAX_DOCUMENT_SIZE } from "../services/fileValidation.js";

const router = Router();
router.use(authenticate);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENT_SIZE },
  fileFilter: (_req, file, cb) => {
    if (isAllowedDocumentType(file.mimetype)) cb(null, true);
    else cb(new Error("UNSUPPORTED_TYPE"));
  },
});

// POST /api/documents/upload — Datei (PDF/Word/Excel) hochladen (Admin)
router.post("/upload", adminOnly, (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      const code = err.message === "UNSUPPORTED_TYPE" ? "UNSUPPORTED_TYPE" : "FILE_TOO_LARGE";
      const message = code === "UNSUPPORTED_TYPE"
        ? "Nur PDF-, Word- und Excel-Dateien erlaubt"
        : "Datei zu groß (max. 10 MB)";
      return res.status(400).json({ code, message });
    }
    const file = (req as any).file as Express.Multer.File | undefined;
    const { title, category } = req.body as Record<string, string>;
    if (!file) return res.status(400).json({ code: "VALIDATION_ERROR", message: "Keine Datei" });
    if (!title || !category) return res.status(400).json({ code: "VALIDATION_ERROR", message: "Titel/Kategorie fehlt" });
    try {
      // multer/busboy dekodiert den Dateinamen als latin1 → UTF-8-Namen
      // ("Getränkekarte" → "GetrÃ¤nkekarte") reparieren.
      const fileName = Buffer.from(file.originalname, "latin1").toString("utf8");
      const doc = await prisma.document.create({
        data: {
          title, category: category as any,
          fileName, mimeType: file.mimetype,
          fileData: file.buffer, fileSize: file.size,
          isPublished: true,
        },
        select: { id: true, title: true, category: true, fileName: true, mimeType: true, fileSize: true, isPublished: true, sortOrder: true, createdAt: true, updatedAt: true },
      });
      return res.status(201).json(doc);
    } catch (e) { console.error(e); return res.status(500).json({ code: "INTERNAL_ERROR", message: "Serverfehler" }); }
  });
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