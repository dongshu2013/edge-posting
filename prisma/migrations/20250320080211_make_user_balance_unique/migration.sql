/*
  Warnings:

  - A unique constraint covering the columns `[userId,tokenAddress]` on the table `UserBalance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserBalance_userId_tokenAddress_key" ON "UserBalance"("userId", "tokenAddress");
