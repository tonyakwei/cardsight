-- CreateTable
CREATE TABLE "missions" (
    "id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "act" INTEGER NOT NULL,
    "mission_card_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "required_clue_sets" JSONB NOT NULL DEFAULT '[]',
    "answer_template_type" "AnswerTemplateType",
    "answer_id" UUID,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "consequence_completed" TEXT,
    "consequence_not_completed" TEXT,
    "consequence_image_completed" TEXT,
    "consequence_image_not_completed" TEXT,
    "mechanical_effect_completed" JSONB,
    "mechanical_effect_not_completed" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_houses" (
    "id" UUID NOT NULL,
    "mission_id" UUID NOT NULL,
    "house_id" UUID NOT NULL,

    CONSTRAINT "mission_houses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mission_houses_mission_id_house_id_key" ON "mission_houses"("mission_id", "house_id");

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_mission_card_id_fkey" FOREIGN KEY ("mission_card_id") REFERENCES "cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_houses" ADD CONSTRAINT "mission_houses_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_houses" ADD CONSTRAINT "mission_houses_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
