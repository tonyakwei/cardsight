-- CreateTable
CREATE TABLE "multiple_answers" (
    "id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "hint" TEXT,
    "hint_after_attempts" INTEGER NOT NULL DEFAULT 3,
    "max_attempts" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "multiple_answers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "multiple_answers" ADD CONSTRAINT "multiple_answers_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
