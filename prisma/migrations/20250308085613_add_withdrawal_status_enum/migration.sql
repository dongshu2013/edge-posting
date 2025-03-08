/*
  Warnings:

  - The `status` column on the `Withdrawal` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Withdrawal" DROP COLUMN "status",
ADD COLUMN     "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Withdrawal_userId_idx" ON "Withdrawal"("userId");

-- CreateIndex
CREATE INDEX "Withdrawal_status_idx" ON "Withdrawal"("status");
