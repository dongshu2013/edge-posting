-- CreateTable
CREATE TABLE "UserWithdrawRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nonceOnChain" TEXT NOT NULL,
    "tokenAddresses" TEXT[],
    "tokenAmountsOnChain" BIGINT[],

    CONSTRAINT "UserWithdrawRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserWithdrawRequest_userId_nonceOnChain_key" ON "UserWithdrawRequest"("userId", "nonceOnChain");

-- AddForeignKey
ALTER TABLE "UserWithdrawRequest" ADD CONSTRAINT "UserWithdrawRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;
