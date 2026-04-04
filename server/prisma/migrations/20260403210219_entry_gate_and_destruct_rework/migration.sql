-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "answer_visible_after_destruct" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "entry_gate_text" TEXT,
ADD COLUMN     "has_entry_gate" BOOLEAN NOT NULL DEFAULT true;
