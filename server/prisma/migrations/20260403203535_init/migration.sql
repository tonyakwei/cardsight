-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('draft', 'active', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "AnswerTemplateType" AS ENUM ('single_answer', 'multiple_choice', 'multiple_text', 'photo_select');

-- CreateTable
CREATE TABLE "games" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "GameStatus" NOT NULL DEFAULT 'draft',
    "duplicated_from_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "human_card_id" TEXT NOT NULL,
    "act" INTEGER,
    "house" TEXT,
    "clue_set" TEXT,
    "clue_visible_category" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "answer_template_type" "AnswerTemplateType",
    "answer_id" UUID,
    "is_answerable" BOOLEAN NOT NULL DEFAULT false,
    "locked_out" BOOLEAN NOT NULL DEFAULT false,
    "locked_out_reason" TEXT,
    "self_destruct_timer" INTEGER,
    "self_destructed_at" TIMESTAMP(3),
    "self_destruct_text" TEXT,
    "design_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "is_solved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designs" (
    "id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "bg_color" TEXT NOT NULL DEFAULT '#0a0a0a',
    "bg_gradient" TEXT,
    "bg_image_url" TEXT,
    "text_color" TEXT NOT NULL DEFAULT '#e0e0e0',
    "accent_color" TEXT NOT NULL DEFAULT '#4fc3f7',
    "secondary_color" TEXT,
    "font_family" TEXT NOT NULL DEFAULT 'system-ui',
    "card_style" TEXT NOT NULL DEFAULT 'standard',
    "animation_in" TEXT,
    "border_style" TEXT,
    "overlay_effect" TEXT,
    "custom_css" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "designs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "single_answers" (
    "id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "correct_answer" TEXT NOT NULL,
    "case_sensitive" BOOLEAN NOT NULL DEFAULT false,
    "trim_whitespace" BOOLEAN NOT NULL DEFAULT true,
    "accept_alternatives" TEXT[],
    "hint" TEXT,
    "hint_after_attempts" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "single_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_events" (
    "id" UUID NOT NULL,
    "card_id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_hash" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer_attempts" (
    "id" UUID NOT NULL,
    "card_id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "answer_given" JSONB NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "time_since_scan_ms" INTEGER,
    "session_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answer_attempts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_duplicated_from_id_fkey" FOREIGN KEY ("duplicated_from_id") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "designs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designs" ADD CONSTRAINT "designs_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "single_answers" ADD CONSTRAINT "single_answers_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_attempts" ADD CONSTRAINT "answer_attempts_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_attempts" ADD CONSTRAINT "answer_attempts_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
