-- CreateTable: StorySheet
CREATE TABLE "story_sheets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "game_id" UUID NOT NULL,
    "house_id" UUID NOT NULL,
    "act" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Story Sheet',
    "content" TEXT NOT NULL DEFAULT '',
    "notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "story_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "story_sheets_game_id_house_id_act_key" ON "story_sheets"("game_id", "house_id", "act");

-- AddForeignKeys
ALTER TABLE "story_sheets" ADD CONSTRAINT "story_sheets_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "story_sheets" ADD CONSTRAINT "story_sheets_house_id_fkey" FOREIGN KEY ("house_id") REFERENCES "houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
