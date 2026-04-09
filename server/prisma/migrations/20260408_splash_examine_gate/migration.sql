-- AlterTable: Replace hasEntryGate/entryGateText with examinedAt + examineText
ALTER TABLE "cards" ADD COLUMN "examined_at" TIMESTAMP(3);
ALTER TABLE "cards" ADD COLUMN "examine_text" TEXT;

-- Drop old entry gate columns
ALTER TABLE "cards" DROP COLUMN "has_entry_gate";
ALTER TABLE "cards" DROP COLUMN "entry_gate_text";
