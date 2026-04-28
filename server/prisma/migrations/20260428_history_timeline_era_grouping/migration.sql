-- Era-grouped history timeline verification: track which cards have been
-- scanned during the current attempt, so the verification can accept any
-- ordering within an era while still rejecting duplicates.
ALTER TABLE "games"
  ADD COLUMN "history_timeline_attempted_card_ids" UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];
