-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "is_finished" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "set_reviews" (
    "id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "clue_set" TEXT NOT NULL,
    "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "set_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "set_reviews_game_id_clue_set_key" ON "set_reviews"("game_id", "clue_set");

-- AddForeignKey
ALTER TABLE "set_reviews" ADD CONSTRAINT "set_reviews_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
