-- Act-based card reuse: allow same physical card in different acts within a game

-- 1. Backfill null acts to 1
UPDATE cards SET act = 1 WHERE act IS NULL;

-- 2. Make act non-nullable with default 1
ALTER TABLE cards ALTER COLUMN act SET NOT NULL;
ALTER TABLE cards ALTER COLUMN act SET DEFAULT 1;

-- 3. Drop old unique constraint (one physical card per game)
DROP INDEX IF EXISTS "cards_game_id_physical_card_id_key";

-- 4. Create new unique constraint (one physical card per game per act)
CREATE UNIQUE INDEX "cards_game_id_physical_card_id_act_key" ON "cards"("game_id", "physical_card_id", "act");

-- 5. Add currentAct to games
ALTER TABLE games ADD COLUMN "current_act" INTEGER NOT NULL DEFAULT 1;
