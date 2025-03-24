/*
  Warnings:

  - Added the required column `tokenDecimals` to the `Buzz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenDecimals` to the `UserBalance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenDecimals` to the `UserWithdrawRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Buzz" ADD COLUMN     "tokenDecimals" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "UserBalance" ADD COLUMN     "tokenDecimals" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "UserWithdrawRequest" ADD COLUMN     "tokenDecimals" INTEGER NOT NULL;
