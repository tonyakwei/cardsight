-- AlterTable: Add player-facing fields to missions
ALTER TABLE "missions" ADD COLUMN "puzzle_description" TEXT;
ALTER TABLE "missions" ADD COLUMN "design_id" UUID;
ALTER TABLE "missions" ADD COLUMN "locked_out" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "missions" ADD COLUMN "locked_out_reason" TEXT;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "designs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: MissionScanEvent
CREATE TABLE "mission_scan_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mission_id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "house_id" UUID,
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_scan_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MissionAnswerAttempt
CREATE TABLE "mission_answer_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mission_id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "house_id" UUID,
    "attempt_number" INTEGER NOT NULL,
    "answer_given" JSONB NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_answer_attempts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKeys for analytics tables
ALTER TABLE "mission_scan_events" ADD CONSTRAINT "mission_scan_events_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mission_scan_events" ADD CONSTRAINT "mission_scan_events_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mission_answer_attempts" ADD CONSTRAINT "mission_answer_attempts_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mission_answer_attempts" ADD CONSTRAINT "mission_answer_attempts_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
