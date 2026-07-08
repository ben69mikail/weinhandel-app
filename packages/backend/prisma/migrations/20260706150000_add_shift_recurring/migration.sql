-- Mark shifts that were created as part of a recurring series
ALTER TABLE "Shift" ADD COLUMN "isRecurring" BOOLEAN NOT NULL DEFAULT false;
