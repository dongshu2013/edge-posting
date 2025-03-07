/*
  Warnings:

  - Added the required column `text` to the `Reply` table without a default value. This is not possible if the table is not empty.

*/
-- First add the column as nullable
ALTER TABLE "Reply" ADD COLUMN "text" TEXT;

-- Update existing records with a default value
UPDATE "Reply" SET "text" = 'Legacy reply - no text content available';

-- Make the column required
ALTER TABLE "Reply" ALTER COLUMN "text" SET NOT NULL;
