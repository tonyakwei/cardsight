-- Add `memory` value to CardSubtype enum
ALTER TYPE "CardSubtype" ADD VALUE 'memory';

-- Add memory_house_id and lockout_message columns to cards
ALTER TABLE "cards"
  ADD COLUMN "memory_house_id" UUID,
  ADD COLUMN "lockout_message" TEXT;

ALTER TABLE "cards"
  ADD CONSTRAINT "cards_memory_house_id_fkey"
  FOREIGN KEY ("memory_house_id") REFERENCES "houses"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "cards_memory_house_id_idx" ON "cards"("memory_house_id");
