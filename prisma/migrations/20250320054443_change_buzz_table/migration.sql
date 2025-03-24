/*
  Warnings:

  - You are about to drop the column `price` on the `Buzz` table. All the data in the column will be lost.
  - You are about to drop the column `totalReplies` on the `Buzz` table. All the data in the column will be lost.
  - Added the required column `paymentToken` to the `Buzz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenAmount` to the `Buzz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionHash` to the `Buzz` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Buzz" DROP COLUMN "price",
DROP COLUMN "totalReplies",
ADD COLUMN     "customTokenAddress" TEXT,
ADD COLUMN     "paymentToken" TEXT NOT NULL,
ADD COLUMN     "tokenAmount" TEXT NOT NULL,
ADD COLUMN     "transactionHash" TEXT NOT NULL;
