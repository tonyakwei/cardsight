-- CreateTable: MissionConsequence
CREATE TABLE "mission_consequences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_mission_id" UUID NOT NULL,
    "target_mission_id" UUID,
    "trigger_on_failure" BOOLEAN NOT NULL DEFAULT true,
    "trigger_on_success" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mission_consequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TriggeredConsequence
CREATE TABLE "triggered_consequences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "game_id" UUID NOT NULL,
    "consequence_id" UUID NOT NULL,
    "house_id" UUID NOT NULL,
    "triggered_at_act" INTEGER NOT NULL,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "triggered_consequences_pkey" PRIMARY KEY ("id")
);

-- AddForeignKeys
ALTER TABLE "mission_consequences" ADD CONSTRAINT "mission_consequences_source_mission_id_fkey" FOREIGN KEY ("source_mission_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mission_consequences" ADD CONSTRAINT "mission_consequences_target_mission_id_fkey" FOREIGN KEY ("target_mission_id") REFERENCES "missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "triggered_consequences" ADD CONSTRAINT "triggered_consequences_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "triggered_consequences" ADD CONSTRAINT "triggered_consequences_consequence_id_fkey" FOREIGN KEY ("consequence_id") REFERENCES "mission_consequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "triggered_consequences" ADD CONSTRAINT "triggered_consequences_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
