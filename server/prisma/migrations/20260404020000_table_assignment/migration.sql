-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "table_house_id" UUID;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_table_house_id_fkey" FOREIGN KEY ("table_house_id") REFERENCES "houses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
