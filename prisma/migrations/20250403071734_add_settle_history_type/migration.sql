/*
  Warnings:

  - Added the required column `type` to the `SettleHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SettleHistory" ADD COLUMN     "type" TEXT NOT NULL;
