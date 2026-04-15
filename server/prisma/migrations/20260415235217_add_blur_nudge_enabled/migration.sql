-- AlterTable
ALTER TABLE "games" ADD COLUMN     "blur_nudge_enabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "mission_answer_attempts" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "mission_consequences" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "mission_scan_events" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "story_sheets" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "triggered_consequences" ALTER COLUMN "id" DROP DEFAULT;
