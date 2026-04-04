-- DropIndex
DROP INDEX "set_reviews_game_id_clue_set_key";

-- AlterTable
ALTER TABLE "cards" DROP COLUMN "clue_set",
DROP COLUMN "house",
ADD COLUMN     "card_set_id" UUID;

-- AlterTable
ALTER TABLE "set_reviews" DROP COLUMN "clue_set",
ADD COLUMN     "card_set_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "card_sets" (
    "id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#8b5cf6',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "houses" (
    "id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "houses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_houses" (
    "id" UUID NOT NULL,
    "card_id" UUID NOT NULL,
    "house_id" UUID NOT NULL,

    CONSTRAINT "card_houses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "card_sets_game_id_name_key" ON "card_sets"("game_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "houses_game_id_name_key" ON "houses"("game_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "card_houses_card_id_house_id_key" ON "card_houses"("card_id", "house_id");

-- CreateIndex
CREATE UNIQUE INDEX "set_reviews_game_id_card_set_id_key" ON "set_reviews"("game_id", "card_set_id");

-- AddForeignKey
ALTER TABLE "card_sets" ADD CONSTRAINT "card_sets_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "houses" ADD CONSTRAINT "houses_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_houses" ADD CONSTRAINT "card_houses_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_houses" ADD CONSTRAINT "card_houses_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_card_set_id_fkey" FOREIGN KEY ("card_set_id") REFERENCES "card_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "set_reviews" ADD CONSTRAINT "set_reviews_card_set_id_fkey" FOREIGN KEY ("card_set_id") REFERENCES "card_sets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
