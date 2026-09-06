ALTER TABLE "event_timers"
ADD COLUMN "ending_selections" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
