-- CreateTable
CREATE TABLE "KolBalance" (
    "id" TEXT NOT NULL,
    "kolId" TEXT NOT NULL,
    "tokenAmountOnChain" BIGINT NOT NULL,
    "tokenName" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "tokenDecimals" INTEGER NOT NULL,

    CONSTRAINT "KolBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KolBalance_kolId_tokenAddress_key" ON "KolBalance"("kolId", "tokenAddress");

-- AddForeignKey
ALTER TABLE "KolBalance" ADD CONSTRAINT "KolBalance_kolId_fkey" FOREIGN KEY ("kolId") REFERENCES "Kol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
