/*
  Warnings:

  - The `tokenDecimals` column on the `UserWithdrawRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "UserWithdrawRequest" DROP COLUMN "tokenDecimals",
ADD COLUMN     "tokenDecimals" INTEGER[];
