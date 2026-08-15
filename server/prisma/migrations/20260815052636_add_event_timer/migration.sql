-- CreateEnum
CREATE TYPE "EventTimerStatus" AS ENUM ('running', 'paused');

-- CreateTable
CREATE TABLE "event_timers" (
    "id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "day" INTEGER NOT NULL DEFAULT 1,
    "status" "EventTimerStatus" NOT NULL DEFAULT 'running',
    "remaining_ms" INTEGER NOT NULL,
    "status_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "override_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_timers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_timers_game_id_key" ON "event_timers"("game_id");

-- AddForeignKey
ALTER TABLE "event_timers" ADD CONSTRAINT "event_timers_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
