import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";

const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const { date } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (date) {
      const d = new Date(date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.dueDate = { gte: d, lt: next };
    }
    const tasks = await prisma.task.findMany({
      where,
      include: {
        completions: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
    });
    res.json(tasks);
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

router.post("/", authenticate, adminOnly, async (req, res) => {
  try {
    const { title, description, dueDate, priority, category } = req.body;
    if (!title) return res.status(400).json({ error: "Titel fehlt" });
    const task = await prisma.task.create({
      data: {
        title,
        description: description ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority ? Number(priority) : 1,
        category: category ?? "Allgemein",
      },
    });
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

router.put("/:id", authenticate, adminOnly, async (req, res) => {
  try {
    const { title, description, dueDate, priority, category } = req.body;
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        title, description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority ? Number(priority) : undefined,
        category,
      },
    });
    res.json(task);
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

router.post("/:id/complete", authenticate, async (req, res) => {
  try {
    const { note, status } = req.body;
    // Check if completion exists
    const existing = await prisma.taskCompletion.findFirst({
      where: { taskId: req.params.id, userId: (req as any).user.id },
    });
    let completion;
    if (existing) {
      completion = await prisma.taskCompletion.update({
        where: { id: existing.id },
        data: { note: note ?? null, status: status ?? "DONE", completedAt: new Date() },
      });
    } else {
      completion = await prisma.taskCompletion.create({
        data: {
          taskId: req.params.id,
          userId: (req as any).user.id,
          note: note ?? null,
          status: status ?? "DONE",
        },
      });
    }
    res.json(completion);
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

router.delete("/:id", authenticate, adminOnly, async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

export default router;