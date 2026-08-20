ALTER TABLE "event_timers"
ADD COLUMN "display_mode" TEXT NOT NULL DEFAULT 'timer',
ADD COLUMN "display_payload" JSONB NOT NULL DEFAULT '{}';
