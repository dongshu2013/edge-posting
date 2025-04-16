-- AlterTable
ALTER TABLE "Buzz" ADD COLUMN     "tokenInfoId" TEXT;

-- AddForeignKey
ALTER TABLE "Buzz" ADD CONSTRAINT "Buzz_tokenInfoId_fkey" FOREIGN KEY ("tokenInfoId") REFERENCES "TokenInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
