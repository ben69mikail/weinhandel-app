-- Store uploaded document bytes directly in the database
ALTER TABLE "Document" ADD COLUMN "fileData" BYTEA;
ALTER TABLE "Document" ADD COLUMN "fileSize" INTEGER;
