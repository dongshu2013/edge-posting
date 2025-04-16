/*
  Warnings:

  - Added the required column `url` to the `TokenInfo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TokenInfo" ADD COLUMN     "url" TEXT NOT NULL;
