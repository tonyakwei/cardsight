CREATE TYPE "CardSubtype" AS ENUM ('standard', 'history');

ALTER TABLE "games"
ADD COLUMN "history_timeline_armed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "history_timeline_attempt_index" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "history_timeline_solved_at" TIMESTAMP(3);

ALTER TABLE "cards"
ADD COLUMN "subtype" "CardSubtype" NOT NULL DEFAULT 'standard',
ADD COLUMN "history_timeline_order" INTEGER;
