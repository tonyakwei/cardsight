-- AlterTable
ALTER TABLE "multiple_answers" ADD COLUMN     "hint_enabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "single_answers" ADD COLUMN     "hint_enabled" BOOLEAN NOT NULL DEFAULT false;
