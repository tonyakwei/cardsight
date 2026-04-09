-- AlterTable: add physicalCardId to cards
ALTER TABLE "cards" ADD COLUMN "physical_card_id" UUID NOT NULL;

-- CreateIndex: unique constraint on (game_id, physical_card_id)
CREATE UNIQUE INDEX "cards_game_id_physical_card_id_key" ON "cards"("game_id", "physical_card_id");
