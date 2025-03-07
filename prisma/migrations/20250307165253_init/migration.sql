-- CreateTable
CREATE TABLE "Buzz" (
    "id" TEXT NOT NULL,
    "tweetLink" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "credit" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "totalReplies" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Buzz_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Buzz_createdBy_idx" ON "Buzz"("createdBy");

-- CreateIndex
CREATE INDEX "Buzz_createdAt_idx" ON "Buzz"("createdAt");
