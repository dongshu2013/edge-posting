/*
  Warnings:

  - A unique constraint covering the columns `[transactionHash]` on the table `Buzz` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Buzz_transactionHash_key" ON "Buzz"("transactionHash");
