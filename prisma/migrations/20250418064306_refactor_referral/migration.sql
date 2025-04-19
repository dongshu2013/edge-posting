/*
  Warnings:

  - You are about to drop the column `invitorUserId` on the `Referral` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[referralCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Referral_invitorUserId_idx";

-- AlterTable
ALTER TABLE "Referral" DROP COLUMN "invitorUserId",
ADD COLUMN     "referralCode" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "referralCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_referralCode_idx" ON "User"("referralCode");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referralCode_fkey" FOREIGN KEY ("referralCode") REFERENCES "User"("referralCode") ON DELETE SET NULL ON UPDATE CASCADE;
