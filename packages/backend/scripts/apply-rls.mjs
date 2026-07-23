// Wendet prisma/rls.sql gegen die Direktverbindung (DIRECT_URL) an.
// Direktverbindung statt Pooler: DDL soll nicht über PgBouncer laufen.
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import "dotenv/config";

const here = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(here, "..", "prisma", "rls.sql"), "utf8");

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const prisma = new PrismaClient({ datasources: { db: { url } } });

const statements = sql
  .split("\n")
  .filter((line) => !line.trim().startsWith("--")) // Kommentarzeilen raus
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

let applied = 0;
for (const stmt of statements) {
  await prisma.$executeRawUnsafe(stmt);
  applied++;
}
console.log(`RLS angewendet: ${applied} Statements.`);

const rows = await prisma.$queryRawUnsafe(
  `select tablename, rowsecurity from pg_tables where schemaname='public' order by tablename`,
);
const off = rows.filter((r) => !r.rowsecurity).map((r) => r.tablename);
console.log(off.length === 0 ? "Alle public-Tabellen: RLS aktiv." : `RLS noch aus: ${off.join(", ")}`);

await prisma.$disconnect();
