-- AlterTable: Add complexity and clueContent to cards
ALTER TABLE "cards" ADD COLUMN "complexity" TEXT NOT NULL DEFAULT 'simple';
ALTER TABLE "cards" ADD COLUMN "clue_content" TEXT;
