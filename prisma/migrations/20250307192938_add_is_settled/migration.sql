-- CreateEnum
CREATE TYPE "ReplyStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('REWARD', 'BURN');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Buzz" ADD COLUMN     "isSettled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Reply" (
    "id" TEXT NOT NULL,
    "replyLink" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "status" "ReplyStatus" NOT NULL DEFAULT 'PENDING',
    "buzzId" TEXT NOT NULL,

    CONSTRAINT "Reply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "buzzId" TEXT NOT NULL,
    "replyId" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reply_buzzId_idx" ON "Reply"("buzzId");

-- CreateIndex
CREATE INDEX "Reply_createdBy_idx" ON "Reply"("createdBy");

-- CreateIndex
CREATE INDEX "Reply_status_idx" ON "Reply"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_replyId_key" ON "Transaction"("replyId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_buzzId_idx" ON "Transaction"("buzzId");

-- CreateIndex
CREATE INDEX "Transaction_fromAddress_idx" ON "Transaction"("fromAddress");

-- CreateIndex
CREATE INDEX "Transaction_toAddress_idx" ON "Transaction"("toAddress");

-- CreateIndex
CREATE INDEX "Buzz_isSettled_idx" ON "Buzz"("isSettled");

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_buzzId_fkey" FOREIGN KEY ("buzzId") REFERENCES "Buzz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_buzzId_fkey" FOREIGN KEY ("buzzId") REFERENCES "Buzz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "Reply"("id") ON DELETE SET NULL ON UPDATE CASCADE;
