-- AlterTable: rename Card.title to Card.header and make nullable
ALTER TABLE "cards" RENAME COLUMN "title" TO "header";
ALTER TABLE "cards" ALTER COLUMN "header" DROP NOT NULL;
