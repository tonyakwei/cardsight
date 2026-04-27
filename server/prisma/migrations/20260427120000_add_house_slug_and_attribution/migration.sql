-- AlterTable
ALTER TABLE "houses" ADD COLUMN "slug" TEXT;

-- AlterTable
ALTER TABLE "scan_events" ADD COLUMN "house_id" UUID;

-- AlterTable
ALTER TABLE "answer_attempts" ADD COLUMN "house_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "houses_game_id_slug_key" ON "houses"("game_id", "slug");

-- AddForeignKey
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_attempts" ADD CONSTRAINT "answer_attempts_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
