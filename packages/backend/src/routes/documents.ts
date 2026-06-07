import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";
const router = Router();
router.use(authenticate);
router.get("/", async (req, res) => {
  try {
    const { category } = req.query as Record<string,string>;
    const where = category ? { category: category as any, isPublished: true } : { isPublished: true };
    const docs = await prisma.document.findMany({ where, orderBy: [{ sortOrder:"asc" },{ createdAt:"desc" }] });
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