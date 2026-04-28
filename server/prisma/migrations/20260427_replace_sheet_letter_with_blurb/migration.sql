-- Replace sheet_letter with story_sheet_blurb on missions
ALTER TABLE "missions" DROP COLUMN "sheet_letter";
ALTER TABLE "missions" ADD COLUMN "story_sheet_blurb" TEXT;
