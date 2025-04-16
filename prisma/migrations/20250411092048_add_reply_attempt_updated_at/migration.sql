/*
  Warnings:

  - Added the required column `updatedAt` to the `ReplyAttempt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ReplyAttempt" ADD COLUMN     "updatedAt" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "ReplyAttempt_updatedAt_idx" ON "ReplyAttempt"("updatedAt");
