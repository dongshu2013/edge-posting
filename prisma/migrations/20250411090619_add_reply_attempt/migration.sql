-- CreateTable
CREATE TABLE "ReplyAttempt" (
    "id" TEXT NOT NULL,
    "buzzId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReplyAttempt_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReplyAttempt" ADD CONSTRAINT "ReplyAttempt_buzzId_fkey" FOREIGN KEY ("buzzId") REFERENCES "Buzz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
