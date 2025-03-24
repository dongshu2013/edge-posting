/*
  Warnings:

  - You are about to drop the column `twitter_text` on the `Buzz` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Buzz" DROP COLUMN "twitter_text",
ADD COLUMN     "tweetText" TEXT;
