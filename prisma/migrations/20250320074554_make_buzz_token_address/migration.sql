/*
  Warnings:

  - Made the column `customTokenAddress` on table `Buzz` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Buzz" ALTER COLUMN "customTokenAddress" SET NOT NULL;
