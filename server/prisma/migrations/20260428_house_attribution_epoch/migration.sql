-- Per-game epoch baked into the cs_house cookie value. Bumping this
-- invalidates every existing house-claim cookie without touching phones.
ALTER TABLE "games"
  ADD COLUMN "house_attribution_epoch" INTEGER NOT NULL DEFAULT 0;
