-- Row Level Security Baseline (Supabase Security-Warnungen schließen).
--
-- Kontext: Das Backend verbindet als Rolle `postgres` (Table-Owner). Ein
-- Owner umgeht RLS solange NICHT FORCE gesetzt ist — die App behält damit
-- vollen Zugriff. RLS zu aktivieren blockt ausschließlich die Supabase
-- PostgREST-Rollen (anon/authenticated), die die App ohnehin nie nutzt
-- (Frontend spricht nur das Express-Backend über /api an).
--
-- Ergebnis: deny-by-default für anon/authenticated, Backend unverändert.
-- Idempotent — beliebig oft ausführbar (ENABLE auf bereits aktiviert = No-Op).
--
-- Anwenden (manuell, gegen die Direktverbindung, wie die Migrationen):
--   cd packages/backend && node scripts/apply-rls.mjs
-- oder im Supabase SQL-Editor einfügen.

ALTER TABLE "public"."Availability"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Document"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Event"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."HygieneConfirmation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Notification"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Settings"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Shift"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ShiftAssignment"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ShiftSwapRequest"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Task"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."TaskCompletion"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."TimeEntry"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."TipCalculation"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."TipEntry"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."User"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."VacationRequest"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."_prisma_migrations"  ENABLE ROW LEVEL SECURITY;
