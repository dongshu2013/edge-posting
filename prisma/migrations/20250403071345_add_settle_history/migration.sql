-- CreateTable
CREATE TABLE "SettleHistory" (
    "id" TEXT NOT NULL,
    "buzzId" TEXT NOT NULL,
    "settleAmount" TEXT NOT NULL,
    "kolId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettleHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SettleHistory" ADD CONSTRAINT "SettleHistory_buzzId_fkey" FOREIGN KEY ("buzzId") REFERENCES "Buzz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettleHistory" ADD CONSTRAINT "SettleHistory_kolId_fkey" FOREIGN KEY ("kolId") REFERENCES "Kol"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettleHistory" ADD CONSTRAINT "SettleHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("uid") ON DELETE SET NULL ON UPDATE CASCADE;
