-- CreateEnum
CREATE TYPE "ShowtimePhase" AS ENUM ('filling', 'syncing', 'revealed');

-- CreateTable
CREATE TABLE "showtimes" (
    "id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "act" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "reveal_title" TEXT NOT NULL,
    "reveal_description" TEXT,
    "design_id" UUID,
    "phase" "ShowtimePhase" NOT NULL DEFAULT 'filling',
    "sync_window_ms" INTEGER NOT NULL DEFAULT 3000,
    "revealed_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "showtimes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "showtime_slots" (
    "id" UUID NOT NULL,
    "showtime_id" UUID NOT NULL,
    "house_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "answer_template_type" "AnswerTemplateType",
    "answer_id" UUID,
    "input_value" TEXT,
    "filled_at" TIMESTAMP(3),
    "is_correct" BOOLEAN,
    "sync_pressed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "showtime_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "showtime_slots_showtime_id_house_id_key" ON "showtime_slots"("showtime_id", "house_id");

-- AddForeignKey
ALTER TABLE "showtimes" ADD CONSTRAINT "showtimes_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showtimes" ADD CONSTRAINT "showtimes_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "designs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showtime_slots" ADD CONSTRAINT "showtime_slots_showtime_id_fkey" FOREIGN KEY ("showtime_id") REFERENCES "showtimes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showtime_slots" ADD CONSTRAINT "showtime_slots_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
