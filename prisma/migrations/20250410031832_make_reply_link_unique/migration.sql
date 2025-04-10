/*
  Warnings:

  - A unique constraint covering the columns `[replyLink]` on the table `Reply` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Reply_replyLink_key" ON "Reply"("replyLink");
